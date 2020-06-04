require('dotenv').config(); // read .env files
const express = require('express');

const app = express();
const port = process.env.PORT || 8000;

// Set public folder as root
app.use(express.static('public'));

// Allow front-end access to node_modules folder
app.use('/scripts', express.static(`${__dirname}/node_modules/`));

// Redirect all traffic to index.html
app.use((req, res) => res.sendFile(`${__dirname}/public/index.html`));

// handles 404
app.use(function (req, res, next) {
    res.status(404);
    // respond with html page
    if (req.accepts('html')) {
        res.render('404', { url: req.url });
        return;
    }
    // respond with json
    if (req.accepts('json')) {
        res.send({ error: 'Not found' });
        return;
    }
    // default to plain-text. send()
    res.type('txt').send('Not found');
});

// Listen for HTTP requests on port
app.listen(port, () => {
    console.log('listening on %d', port);
});

const { getLyrics, getLyrics1, getLyrics2 } = require('./lib/guaqb-service');
const fs = require('fs');
const test = () => {
    // var data = await getLyrics1('洋蔥');
    // console.log(data);
    // console.log('>>>>>>>>>>>>>>>>>>>');
    // var data2 = await getLyrics2();
    // console.log(data2);
    // console.log('>>>>>>>>>>>>>>>>>>>');
    getLyrics('有一種悲傷', 'A-Lin')
    .then(d => {
        console.log(typeof(d));
        console.log(d);
    })
    .catch(err => {
        console.error(err);        
    });
    
};

test();
