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

// Spotify api basic
// 204, no content, no player playing
// otherwise JSON
const api = axios.create({
    baseURL: 'https://api.spotify.com',
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
};