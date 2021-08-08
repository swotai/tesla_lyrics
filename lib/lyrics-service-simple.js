"use strict";
require("dotenv-safe").config();
const axios = require("axios");
const router = require("express").Router();
const isDebug = false;
const { cacheMiddleWare } = require('./lyrics-cache')
// Chinese converters
const trad_to_simp = require("./opencc_wrapper").trad_to_simp
const simp_to_trad = require("./opencc_wrapper").simp_to_trad
const { errorHandler } = require("./utils")

// axios http request instance
const api = axios.create({
    baseURL: "http://api.guaqb.cn",
    params: {
        key: process.env.GUAQB_KEY,
        secret: process.env.GUAQB_SECRET,
    },
    transformResponse: [
        (data) => {
            // return JSON.parse(trad_to_simp(data).trim());
            return data;
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

router.get("/lyrics_simple", async (req, res) => {
    try {
        const { song, artist, album } = req.query;
        const data = await get({
            url: "gc.php",
            config: {
                params: {
                    yy: trad_to_simp(`${song} ${artist} ${album}`),
                    time: "yes",
                },
            },
        });
        let result = {
            data: simp_to_trad(data)
        }
        res.setHeader("Content-Type", "application/json");
        res.send(result);
    } catch (err) {
        errorHandler(err, req, res);
    }
});

exports.lyrics_router = router;