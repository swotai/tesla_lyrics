"use strict";
require("dotenv-safe").config();
const axios = require("axios");
const router = require("express").Router();
const isDebug = false;
const musicServiceType = "163";
const maxResult = 15;
let cacheMiddleWare;
if (process.env.RUNENV == "local") {
  cacheMiddleWare = require("./lyics-cache").cacheLocal;
} else {
  cacheMiddleWare = require("./lyics-cache").cacheFirestore;
}

// Chinese converters
// const converter = require("zh_cn_zh_tw");
// const trad_to_simp = converter.convertToSimplifiedChinese;
// const simp_to_trad = converter.convertToTraditionalChinese;
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

// get lyrics might stop working.
// Can change to 2 step request
// step 1: get list with song id from 163 using /music/music
// step 2: get lyrics of selected song id from 163 directly


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
