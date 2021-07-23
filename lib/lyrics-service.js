"use strict";
require("dotenv-safe").config();
const axios = require("axios");
const router = require("express").Router();
const isDebug = true;
const musicServiceType = "163";
const maxResult = 15;
const { search, lyric } = require('NeteaseCloudMusicApi')
let cacheMiddleWare;
if (process.env.RUNENV == "local") {
  cacheMiddleWare = require("./lyrics-cache").cacheLocal;
} else {
  cacheMiddleWare = require("./lyrics-cache").cacheFirestore;
}
// Chinese converters
const trad_to_simp = require("./opencc_wrapper").trad_to_simp
const simp_to_trad = require("./opencc_wrapper").simp_to_trad

// axios http request instance
const api = axios.create({
  baseURL: "http://api.guaqb.cn",
  params: {
    key: process.env.GUAQB_KEY,
    secret: process.env.GUAQB_SECRET,
  },
  transformResponse: [
    (data) => {
      return JSON.parse(trad_to_simp(data).trim());
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
          input: trad_to_simp(songName),
          filter: "name",
          type: musicServiceType,
          time: "yes",
          limit: maxResult,
        },
      },
    });
    let data = response.data;
    if (isDebug) {
      console.log(data);
    }
    let match = null;
    data.forEach((song) => {
      song.lrc = simp_to_trad(song.lrc);
      song.name = simp_to_trad(song.name);
      song.author = simp_to_trad(song.author);
    });

    if (artist == undefined) {
      artist = "";
    }
    if (response.data.length > 1 && artist !== "") {
      let selected = response.data.filter((it) =>
        it.author.includes(simp_to_trad(artist))
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

router.get("/search_song", cacheMiddleWare, async (req, res) => {
  try {
    const { song, artist } = req.query;
    let result = await search({
      keywords: song,
      limit: maxResult
    });
    res.setHeader("Content-Type", "application/json");
    res.send(result);
  } catch (err) {
    errorHandler(err, req, res);
  }
});

router.get("/get_lyrics_from_id", cacheMiddleWare, async (req, res) => {
  try {
    const { id } = req.query;
    let result = await lyric({
      id: id
    });
    res.setHeader("Content-Type", "application/json");
    res.send(result);
  } catch (err) {
    errorHandler(err, req, res);
  }
});

// Exposing functions for testing
// also lyrics_router for submitting the service to main server
module.exports = {
  lyrics_router: router,
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
};

/**
 * alternatively fetch also works
 * a = fetch('http://api.guaqb.cn/v1/music/?input=洋蔥&filter=name&type=163&time=yes')
 * .then(resp => {
 *     return resp.json();
 * });
 * b=await a
 */
