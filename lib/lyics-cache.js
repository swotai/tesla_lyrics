// caching with levelup
require("dotenv-safe").config();
const lyricsTTL = 1000 * 60 * 60 * 24 * 7; // lyrics cache time
var levelup = require("levelup");
var leveldown = require("leveldown");
var ttl = require("level-ttl");

console.log(process.env.RUNENV);
console.log(process.env);
if ((process.env.RUNENV = "local")) {
  var db = levelup(leveldown("./lyrics_cache"));
} else {
  var db = levelup(leveldown("/tmp/lyrics_cache"));
}
db = ttl(db, { defaultTTL: lyricsTTL });

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

module.exports = {
  cacheLocal,
};
