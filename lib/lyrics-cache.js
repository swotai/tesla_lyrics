// caching with levelup
require("dotenv-safe").config();
const lyricsTTL = 365; // lyrics cache time in days

// LOCAL CACHE with Levelup
var levelup = require("levelup");
var leveldown = require("leveldown");
var ttl = require("level-ttl");

if (process.env.RUNENV == "local") {
  var db = levelup(leveldown("./lyrics_cache"));
  db = ttl(db, { defaultTTL: 1000 * 60 * 60 * 24 * lyricsTTL });
}

/**
 * MidWare that uses levelup to store lyrics response as cache
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const cacheLocal = (req, res, next) => {
  const key = req.url;
  console.log(`Processing ${req.url}`);
  db.get(key, (err, value) => {
    if (err == null && value != null) {
      console.log("Respond from cache local");
      res.send(value);
    } else {
      console.log("Store to cache local");
      res.sendResponse = res.send;
      res.send = (body) => {
        db.put(key, body, (err) => {
          if (err == null) {
            res.sendResponse(body);
          } else {
            console.error(err);
          }
        });
      };
      next();
    }
  });
};

//FIRESTORE CACHE
const Firestore = require("@google-cloud/firestore");

/**
 * Query for expired cache doc and delete
 */
const pruneCache = async () => {
  const fsdb = new Firestore();
  try {
    let cacheRef = fsdb.collection("lrcCache");
    let expiredCache = await cacheRef.where("exp", "<", new Date()).get();
    if (expiredCache.empty) {
      console.log("All cache current");
      return;
    } else {
      expiredCache.forEach((doc) => {
        console.log(doc.id, "expired, goodbye!");
        doc.ref.delete();
      });
    }
  } catch (error) {
    console.error(error);
  }
};

/**
 * MidWare that uses google firestore to store lyrics response as cache
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const cacheFirestore = async (req, res, next) => {
  const fsdb = new Firestore();
  const key = req.url;
  console.log(`Processing ${req.url}`);
  let expDate = new Date();
  expDate.setDate(expDate.getDate() + lyricsTTL);
  try {
    let lrcRef = fsdb.collection("lrcCache").doc(key);
    let lrc = await lrcRef.get();
    if (lrc.exists) {
      console.log("Respond from cache firestore");
      let value = await lrc.data();
      res.send(value);
      await lrcRef.set({ exp: expDate }, { merge: true });
    } else {
      console.log("store to cache firestore");
      res.sendResponse = res.send;
      res.send = async (body) => {
        res.sendResponse(body);
        // There's gonna be error msg about "data" not valid
        // I think it's simply saying the data obj in response is []
        await lrcRef.set(body);
        await lrcRef.set({ exp: expDate }, { merge: true });
      };
      next();
    }
    pruneCache();
  } catch (error) {
    console.log("Something wrong");
    console.error(error);
  }
};

if (process.env.RUNENV == "local") {
  exports.cacheMiddleWare = cacheLocal;
} else {
  exports.cacheMiddleWare = cacheFirestore;
}
