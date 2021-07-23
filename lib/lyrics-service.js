"use strict";
require("dotenv-safe").config();
const axios = require("axios");
const router = require("express").Router();
const isDebug = false;
const musicServiceType = "163";
const maxResult = 10;
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

// Express Error handler
const errorHandler = (err, req, res) => {
  if (err.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    res
      .status(403)
      .send({ title: "Server responded with an error", message: err.message });
  } else if (err.request) {
    // The request was made but no response was received
    res.status(503).send({
      title: "Unable to communicate with server",
      message: err.message,
    });
  } else {
    // Something happened in setting up the request that triggered an Error
    res
      .status(500)
      .send({ title: "An unexpected error occurred", message: err.message });
  }
};

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


// Use netease package instead of relying on online service
/**
 * Takes the nested payload, format output into four fields:
 * - songid
 * - song name
 * - artist
 * - album name
 * @param {list} songList 
 * @returns {list}
 */
const songListFormatter = (songList) => {
  let result = []
  songList.forEach(song => {
    let artist_str = "";
    song.artists.forEach(artist => {
      artist_str += `${artist.name}, `
    });
    let b = {
      songid: song.id,
      name: simp_to_trad(song.name),
      artist: simp_to_trad(artist_str.substring(0, artist_str.length - 2)),
      album: simp_to_trad(song.album.name)
    };
    result = result.concat(b);
  });
  return result;
};

/**
 * String match counter
 * Counts how many matching characters in two strings
 * @param {string} str1 
 * @param {string} str2 
 * @returns {number}
 */
const strMatcher = (str1, str2) => {
  let count = 0;
  const obj = str2.split("");
  for (var i = 0; i < str1.length; i++) {
    let idx = obj.findIndex(s => s === str1[i]); if (idx >= 0) {
      count++;
      obj.splice(idx, 1);
    }
  }
  return count;
}

router.get("/search_song", cacheMiddleWare, async (req, res) => {
  try {
    console.log("request on:", req.originalUrl);
    const { song, artist } = req.query;
    const result = await search({
      keywords: song,
      limit: maxResult
    });
    // extract and format data
    const data0 = songListFormatter(result.body.result.songs)
    // find a match
    const matchString = simp_to_trad(song + artist);
    var match = data0.reduce((prev, current) => {
      if (strMatcher(matchString, current.name + current.artist) > strMatcher(matchString, prev.name + prev.artist)) {
        return current;
      } else {
        return prev;
      }
    });
    let results = {
      match: match.songid,
      data: data0
    };
    res.setHeader("Content-Type", "application/json");
    res.send(results);
  } catch (err) {
    console.log(err);
    errorHandler(err, req, res);
  }
});

/**
 * Search song for the song ID
 * Format output to contain:
 * - song name
 * - artist
 * - album name
 * Figure out which one is a match using artist input
 * @param {string} songName
 * @param {string} artist
 */
const searchSong163 = async (songName, artist) => {
  try {
    let data = await search({
      keywords: song,
      limit: maxResult
    });
  } catch (err) {
    console.error(err);
  }
};

router.get("/search_song_raw", cacheMiddleWare, async (req, res) => {
  try {
    console.log("request on:", req.originalUrl);
    const { song, artist } = req.query;
    const data = await searchSong163(song, artist);
    res.setHeader("Content-Type", "application/json");
    res.send(data);
  } catch (err) {
    errorHandler(err, req, res);
  }
});

router.get("/get_lyrics_from_id", async (req, res) => {
  try {
    const { id } = req.query;
    let data = await lyric({
      id: id
    });
    if (data.body.lrc) {
      var lrcText = simp_to_trad(data.body.lrc.lyric);
    } else {
      var lrcText = `No lyrics found on 163. 找不到歌詞。 (id: ${id})`;
    }
    var result = {
      lrc: lrcText
    };
    res.setHeader("Content-Type", "application/json");
    res.send(result);
  } catch (err) {
    console.log(err);
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
