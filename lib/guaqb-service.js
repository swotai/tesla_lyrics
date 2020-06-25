"use strict";
require("dotenv-safe").config();
const axios = require("axios");
const converter = require("zh_cn_zh_tw");
const router = require("express").Router();
const zh_cn = converter.convertToSimplifiedChinese;
const zh_tw = converter.convertToTraditionalChinese;
const isDebug = false;
const musicServiceType = "qq";
const maxResult = 15;
let cacheMiddleWare;
if (process.env.RUNENV == "locxal") {
  cacheMiddleWare = require("./lyics-cache").cacheLocal;
} else {
  cacheMiddleWare = require("./lyics-cache").cacheFirestore;
}

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
