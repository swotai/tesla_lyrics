# README

Simple app to read the spotify status and show some lyrics on the tesla screen

## How to deploy

### Locally testing

1. `npm install` for dependencies
2. Setup API credentials with the various services
3. Update the service credential in `.env` file. Refer to `.env.example` for what's needed
4. `npm start`, then access `localhost:8000`

### Docker

Suggest to mount the `.env` as a bind mount

### Google App Engine

If deploying to AE, need some special arrangement for the env file [env file in GAE](https://medium.com/@brian.young.pro/how-to-add-environmental-variables-to-google-app-engine-node-js-using-cloud-build-5ce31ee63d7)

1. Store env vars in Google Cloud’s Build Trigger
2. Read in env vars from the Build Trigger in one of its build steps
3. Write env vars to a local .env file
4. Import env vars from .env to your Node.js app using dotenv package

Don't forget to enable the [AE admin API](https://console.developers.google.com/apis/library/appengine.googleapis.com?project=swot-tesla-lyrics)!

### Other necessary preparation

[How to get a node/express app production ready](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/deployment)

## notes

Inspired from [小明Player](http://music.guaqb.cn/2/)

### Structure of guaqb api

API has the following params. Refer to [API documentation](http://wiki.guaqb.cn/web/#/2?page_id=35)

- input: name
- filter: "name" for name search, only name/id/url works
- type: source, 163 in this case, kugou is slow
- key/secret: api auth from `guaqb.cn`
- time: get timestamp on lrc

[Sample API call](http://api.guaqb.cn/v1/music/?input=暧昧&filter=name&type=163&key={{GUAQB_KEY}}&secret={{GUAQB_SECRET}}&time=yes)

### Convert to Traditional Chinese

zh_cn_zh_tw package provides straightforward, mapping based translation.

### Node.js

Ugh ok... let's learn node.js real quick... ... Done ish!
[Here](https://www.w3schools.com/nodejs/nodejs_modules.asp)

### Other notes

Finding the right lyrics
[JS filtering response](https://www.freecodecamp.org/news/15-useful-javascript-examples-of-map-reduce-and-filter-74cbbb5e0a1f/)

```javascript
let res = users.filter(it => it.name.includes('oli'));
```

Notes: _Simple filter works just fine it appears_

Looks like need to learn node.js somehow and have this hosted in home server...
Why? coz how else can i secure my keys and secrets...
[Keeping secrets in node.js](https://medium.com/codait/environment-variables-or-keeping-your-secrets-secret-in-a-node-js-app-99019dfff716)

### Session and Auth

[Tutorial(or see passportJS doc??)](https://blog.usejournal.com/sessionless-authentication-withe-jwts-with-node-express-passport-js-69b059e4b22c#:~:text=The%20difference%20between%20the%20two,encoded%20in%20the%20JWT%20payload.)
[PassportJS](http://www.passportjs.org/docs/downloads/html/)
[SQLite](https://healeycodes.com/javascript/webdev/beginners/tutorial/2019/06/03/saving-data-in-javascript-without-a-database.html)
nodejs return redirect
> 302 redirect
resp.write
