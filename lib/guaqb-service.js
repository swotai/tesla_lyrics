"use strict";
require("dotenv").config();
const axios = require("axios");
const converter = require("zh_cn_zh_tw");
const router = require("express").Router();
const zh_cn = converter.convertToSimplifiedChinese;
const zh_tw = converter.convertToTraditionalChinese;
const isDebug = false;
const musicServiceType = "qq";
const maxResult = 15;
const lyricsTTL = 1000*60*60*24*30; // lyrics cache time 30 days

// caching with levelup
var levelup = require("levelup");
var leveldown = require("leveldown");
var ttl = require("level-ttl");
var db = levelup(leveldown("./lyrics_cache"));
db = ttl(db, { defaultTTL: lyricsTTL });

// axios http request instance
const api = axios.create({
  baseURL: "http://api.guaqb.cn",
  params: {
    key: process.env.GUAQB_KEY,
    secret: process.env.GUAQB_SECRET,
  },
  transformResponse: [
    (data) => {
      return JSON.parse(zh_cn(data).trim());
    },
  ],
});

/**
 * execute axios.get and return response
 * @param {object} request
 */
const get = async (request) => {
  try {
    let response = await api.get(request.url, request.config);
    if (isDebug) {
      console.log(response);
    }
    const { data } = response;
    if (data.code > 299) {
      throw new Error(data.error);
    }
    return data;
  } catch (err) {
    console.error(err);
  }
};

/**
 * calls v1/music api, then try filter for artist
 * @param {string} songName
 * @param {string} artist
 */
const getLyricsFromApi = async (songName, artist) => {
  try {
    const response = await get({
      url: "/v1/music/",
      config: {
        params: {
          input: songName,
          filter: "name",
          type: musicServiceType,
          time: "yes",
          limit: maxResult,
        },
      },
    });
    let data = response.data;
    let match = null;
    data.forEach((song) => {
      song.lrc = zh_tw(song.lrc);
    });

    if (artist == undefined) {
      artist = "";
    }
    if (response.data.length > 1 && artist !== "") {
      let selected = response.data.filter((it) =>
        it.author.includes(zh_cn(artist))
      );
      if (selected.length > 0) {
        match = selected[0].songid;
      }
    }
    return { match: match, data: data };
  } catch (err) {
    console.error(err);
  }
};

/**
 * MidWare that uses levelup to store lyrics response as cache
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const cacheMiddleWare = (req, res, next) => {
  const key = req.url;
  console.log(`Processing ${req.url}`);
  db.get(key, (err, value) => {
    if (err == null && value != null) {
      console.log("Respond from cache")
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

// fetch lyrics
router.get("/lyrics", cacheMiddleWare, async (req, res) => {
  try {
    const { song, artist } = req.query;
    const data = await getLyricsFromApi(song, artist);
    res.setHeader("Content-Type", "application/json");
    res.send(data);
  } catch (err) {
    errorHandler(err, req, res);
  }
});

// debugging axios
if (isDebug) {
  api.interceptors.request.use(
    (request) => {
      console.log(">> Starting Request", request);
      console.log(">>>>>>>>>>>>>>>>>>>");
      return request;
    },
    function (error) {
      // Do something with request error
      return Promise.reject(error);
    }
  );
}

module.exports = {
  getLyrics1: (songName) =>
    get({
      url: "/v1/music/",
      config: {
        params: {
          input: songName,
          filter: "name",
          type: musicServiceType,
          time: "yes",
        },
      },
    }),
  getLyrics2: () =>
    get({
      url:
        "http://api.guaqb.cn/v1/music/?input=%E6%B4%8B%E8%94%A5&filter=name&type=163&key=" +
        process.env.GUAQB_KEY +
        "&secret=" +
        process.env.GUAQB_SECRET +
        "&time=yes",
      config: { params: { time: "no" } },
    }),
  getLyrics: (song, artist) => getLyricsFromApi(song, artist),
  lyrics_router: router,
};

/**
 * alternatively fetch also works
 * a = fetch('http://api.guaqb.cn/v1/music/?input=洋蔥&filter=name&type=163&time=yes')
 * .then(resp => {
 *     return resp.json();
 * });
 * b=await a
 */

/**
 * Redis caching in the back as middleware
 * https://blog.bitsrc.io/server-side-caching-in-expressjs-24038daec102
 * Use expire to do TTL on cache
 * https://redis.io/commands/expire
 */
