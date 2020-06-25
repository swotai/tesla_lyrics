// caching with levelup
require("dotenv-safe").config();
const lyricsTTL = 14; // lyrics cache time in days

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
      console.log("Respond from cache");
      res.send(value);
    } else {
      console.log("Store to cache");
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
    if (doc.exists) {
      console.log("Respond from cache");
      res.send(lrc.data());
      await lrcRef.set({ exp: new Date().getDate() }, { merge: true });
    } else {
      console.log("store to cache");
      res.sendResponse = res.send;
      res.send = async (body) => {
        await lrcRef.set(body);
        await lrcRef.set({ exp: new Date().getDate() }, { merge: true });
        res.sendResponse(body);
      };
      next();
    }
  } catch (error) {
    console.error(error);
  }
};

module.exports = {
  cacheLocal,
  cacheFirestore,
};
