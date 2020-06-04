require('dotenv').config()
const axios = require('axios');
const SPOTIFY_SCOPE = 'user-read-playback-state user-read-currently-playing';
const SPOTIFY_STATE = '830218';

/**
 * Calls the login window, do the auth,
 * and then in the main page extract tokin to do stuff.
 */
function login() {
    var CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    var REDIRECT_URI = window.location.href; // always come back to the same page
    console.log("Redirect URL: " + REDIRECT_URI)

    var url = 'https://accounts.spotify.com/authorize';
    url += '?response_type=token';
    url += '&client_id=' + encodeURIComponent(CLIENT_ID);
    url += '&scope=' + encodeURIComponent(SPOTIFY_SCOPE);
    url += '&redirect_uri=' + encodeURIComponent(REDIRECT_URI);
    url += '&state=' + encodeURIComponent(SPOTIFY_STATE);

    window.location.href = url;
}

/**
 * Obtains parameters from the hash of the URL
 * use to receive and parse access token and clear out the url
 * @return Object
 */
function getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while (e = r.exec(q)) {
        hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    history.pushState(null, null, ' ');
    return hashParams;
}

// Spotify api basic
// 204, no content, no player playing
// otherwise JSON
const api = axios.create({
    baseURL: 'https://api.spotify.com',
    timeout: 1000,
    headers: {
        'Authorization': 'Bearer ' + accessToken
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
    login: () => login(),
    getPlayer: () => get('v1/me/player?market=US'),
    getHashParams: () => getHashParams(),
};