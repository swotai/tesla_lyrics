"use strict";

require("dotenv").config(); // read .env files
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
passport.use(
  new SpotifyStrategy(
    {
      clientID: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      callbackURL: `http://localhost:${process.env.PORT}/spotify/callback`,
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
    // user: user,
  });
});

// Used to decode the received cookie and persist session
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Middleware to check if the user is authenticated
function isUserAuthenticated(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.status(200).send({
      title: "Not logged in",
      message: "You must login spotify to access this!",
      isSpotifyAuth: false,
    });
  }
}

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

// refresh access token
router.get("/auth/refresh", isUserAuthenticated, async (req, res) => {
  try {
    let authBasic = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString("base64");
    const response = await axios({
      method: "post",
      url: "https://accounts.spotify.com/api/token",
      params: {
        grant_type: "refresh_token",
        refresh_token: req.user.rToken,
      },
      headers: { Authorization: `Basic ${authBasic}` },
    });
    // console.log(response.data);
    // res.send(response.data);
    // update cookie:
    req.user.aToken = response.data.access_token;
    res.send({
      success: true,
      // fromSpotify: response.data,
      // updatedLocal: req.user,
    });
  } catch (error) {
    console.error(error);
    res.send({ success: false });
  }
});

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
  res.redirect("/");
});

// player status
// 204 no player
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
    // console.log(response.data);
    let { item } = response.data;
    let result = {
      album: item.album.name,
      artist: item.artists[0].name,
      name: item.name,
      duration: item.duration_ms,
      progress_ms: response.data.progress_ms,
    };
    // res.send(response.data);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.send(error);
  }
});

module.exports = {
  passport,
  isUserAuthenticated,
  spotify_router: router,
};
