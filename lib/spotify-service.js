require("dotenv").config(); // read .env files
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
    res.status(403).send({
      title: "Not logged in",
      message: "You must login spotify to access this!",
    });
  }
}

// Auth routes
router.get("/auth", passport.authenticate("spotify"), function (req, res) {
  // The request will be redirected to spotify for authentication, so this
  // function will not be called.
});

router.get(
  "/callback",
  passport.authenticate("spotify", {
    failureRedirect: "/login",
    scope: SPOTIFY_SCOPE,
    // showDialog: true
  }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/");
  }
);

// Secret route
router.get("/auth/status", isUserAuthenticated, (req, res) => {
  res.send({
    message: "You are logged into spotify",
  });
//   console.log(req.user);
});

// Logout 
router.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

module.exports = {
  passport,
  isUserAuthenticated,
  spotify_router: router,
};
