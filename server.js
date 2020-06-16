// Router logic
require('dotenv').config(); // read .env files
const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require("cookie-session");
const passport = require("./lib/spotify-service").passport;

const app = express();
const port = process.env.PORT || 8000;
const isDebug = false;

// cookieSession config
app.use(
  cookieSession({
    maxAge: 24 * 60 * 60 * 1000, // One day in milliseconds
    name: "tesla_lyrics",
    keys: ["02181983"],
  })
);

app.use(passport.initialize()); // Used to initialize passport
app.use(passport.session()); // Used to persist login sessions

// Set public folder as root
app.use(express.static('public'));

// Allow front-end access to node_modules folder
app.use('/scripts', express.static(`${__dirname}/node_modules/`));

// Parse POST data as URL encoded data
app.use(bodyParser.urlencoded({ extended: true, }));

// Parse POST data as JSON
app.use(bodyParser.json());

// Express Error handler
const errorHandler = (err, req, res) => {
    if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        res.status(403).send({ title: 'Server responded with an error', message: err.message });
    } else if (err.request) {
        // The request was made but no response was received
        res.status(503).send({ title: 'Unable to communicate with server', message: err.message });
    } else {
        // Something happened in setting up the request that triggered an Error
        res.status(500).send({ title: 'An unexpected error occurred', message: err.message });
    }
};

// service routes
app.use("/lyrics_svc", require("./lib/guaqb-service").lyrics_router);
app.use("/spotify", require("./lib/spotify-service").spotify_router)

// Redirect all traffic to index.html
app.use((req, res) => res.sendFile(`${__dirname}/public/index.html`));

// Listen for HTTP requests on port
app.listen(port, () => {
    console.log('listening on %d', port);
});


if (isDebug) {
  const fs = require("fs");
  const testLyrics = () => {
    const {
      getLyrics,
      getLyrics1,
      getLyrics2,
    } = require("./lib/guaqb-service");

    // var data = await getLyrics1('洋蔥');
    // console.log(data);
    // console.log('>>>>>>>>>>>>>>>>>>>');
    // var data2 = await getLyrics2();
    // console.log(data2);s
    // console.log('>>>>>>>>>>>>>>>>>>>');
    getLyrics("有一種悲傷", "A-Lin")
      .then((d) => {
        console.log(typeof d);
        console.log(d);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  testLyrics();
}
