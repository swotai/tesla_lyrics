"use strict";

require("dotenv-safe").config(); // read .env files
const assert = require("assert").strict;
const axios = require("axios");
const passport = require("passport");
const SpotifyStrategy = require("passport-spotify").Strategy;
const SPOTIFY_SCOPE = [
  "user-read-playback-state",
  "user-read-currently-playing",
  "user-read-private",
];
const router = require("express").Router();

// Strategy config
console.log({
  clientID: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  callbackURL: process.env.SPOTIFY_CALLBACK,
});
passport.use(
  new SpotifyStrategy(
    {
      clientID: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      callbackURL: process.env.SPOTIFY_CALLBACK,
    },
    function (accessToken, refreshToken, expires_in, profile, done) {
      // if verify users
      // User.findOrCreate({ spotifyId: profile.id }, function (err, user) {
      //   return done(err, user);
      // });
      // add token into profile
      profile.aToken = accessToken;
      profile.rToken = refreshToken;
      profile.expires_in = expires_in;
      done(null, profile);
    }
  )
);

// Used to stuff a piece of information into a cookie
passport.serializeUser((user, done) => {
  done(null, {
    id: user.id,
    name: user.displayName,
    aToken: user.aToken,
    rToken: user.rToken,
    createDate: new Date(),
    // user: user,
  });
});

// Used to decode the received cookie and persist session
passport.deserializeUser((user, done) => {
  done(null, user);
});

const refreshAccessToken = async (rToken) => {
  try {
    let authBasic = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString("base64");
    const response = await axios({
      method: "post",
      url: "https://accounts.spotify.com/api/token",
      params: {
        grant_type: "refresh_token",
        refresh_token: rToken,
      },
      headers: { Authorization: `Basic ${authBasic}` },
    });
    let result = {
      action: "Refresh token",
      success: true,
      aToken: response.data.access_token,
      createDate: new Date(),
    };
    return result;
  } catch (error) {
    throw "error";
  }
};

// Middleware to check if the user is authenticated
const isUserAuthenticated = async (req, res, next) => {
  if (req.user) {
    console.log(`access by user: ${req.user.id}`);
    let now = new Date().getTime();
    let cookieDate = new Date(req.user.createDate).getTime();
    // try to refresh the access token
    if (now - cookieDate > 45 * 60 * 1000) {
      try {
        let response = await refreshAccessToken(req.user.rToken);
        assert.deepStrictEqual(response.success, true);
        req.user.aToken = response.aToken;
        req.user.createDate = response.createDate;
      } catch (error) {
        res.status(200).send({
          title: "Token error",
          message: "Cannot refresh access token!",
          isSpotifyAuth: false,
        });
        return null;
      }
    }
    next();
  } else {
    res.status(403).send({
      title: "Not logged in",
      message: "You must login spotify to access this!",
      isSpotifyAuth: false,
    });
  }
};

// Auth routes
router.get(
  "/auth",
  passport.authenticate("spotify", { scope: SPOTIFY_SCOPE }),
  function (req, res) {
    // The request will be redirected to spotify for authentication, so this
    // function will not be called.
  }
);

router.get(
  "/callback",
  passport.authenticate("spotify", {
    failureRedirect: "/login",
    // showDialog: true
  }),
  function (req, res) {
    // Successful authentication, redirect home.
    // console.log(req.user);
    res.redirect("/login");
  }
);

// Secret route
router.get("/auth/status", isUserAuthenticated, (req, res) => {
  res.send({
    title: "Logged In",
    message: "You are logged into spotify",
    isSpotifyAuth: true,
    userName: req.user.name,
    userData: req.user,
  });
  //   console.log(req);
});

// Logout
router.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/login");
});

// player status
router.get("/player", isUserAuthenticated, async (req, res) => {
  try {
    const response = await axios({
      method: "get",
      url: "https://api.spotify.com/v1/me/player",
      params: {
        market: "US",
        access_token: req.user.aToken,
      },
    });
    if (response.data.is_playing !== undefined) {
      let { item } = response.data;
      let result = {
        album: item.album.name,
        artist: item.artists[0].name,
        name: item.name,
        duration: item.duration_ms,
        progress_ms: response.data.progress_ms,
        is_playing: response.data.is_playing,
      };
      res.send(result);
    } else {
      res.send({ is_playing: null });
    }
  } catch (error) {
    console.error(error);
    res.send({
      error: "Something wrong",
      message: error.message,
    });
  }
});

module.exports = {
  passport,
  isUserAuthenticated,
  spotify_router: router,
};
