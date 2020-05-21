require('dotenv').config()
const axios = require('axios');
const musicServiceType = '163';

const api = axios.create({
    baseURL: 'http://api.guaqb.cn',
    params: {
        key: process.env.GUAQB_KEY,
        secret: process.env.GUAQB_SECRET,
    }
});

const get = async (url) => {
    const response = await api.get(url);
    const { data } = response;
    if (data.success) {
        return data;
    }
    throw new Error(data.error.type);
};

module.exports = {
    getLyrics: (songName) => get({
        url: 'v1/music/',
        params: {
            input: songName,
            filter: 'name',
            type: musicServiceType,
            time: 'yes',
        }
    }),
};
