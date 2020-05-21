# README

Simple app to read the spotify status and show some lyrics on the tesla screen

## notes

Inspired from [小明Player](http://music.guaqb.cn/2/)

## Structure

API has the following params. Refer to [API documentation](http://wiki.guaqb.cn/web/#/2?page_id=35)

- input: name
- filter: "name" for name search, only name/id/url works
- type: source, 163 in this case, kugou is slow
- key/secret: api auth from `guaqb.cn`
- time: get timestamp on lrc

[Sample API call](http://api.guaqb.cn/v1/music/?input=暧昧&filter=name&type=163&key={{GUAQB_KEY}}&secret={{GUAQB_SECRET}}&time=yes)

## Convert to Traditional Chinese

_Unfortunately, can't get opencc to install w/o VS. So either keep using the hosted script ver or give it up_

[opencc-js](https://developer.aliyun.com/mirror/npm/package/opencc-js/v/0.0.2)
[opencc-nodejs](https://www.npmjs.com/package/opencc)

```javascript
(async () => {
    const cc = await OpenCC.PresetConverter({ fromVariant: 'cn', toVariant: 'hk' });
    console.log(cc.convert('政府初步倾向试验为绿色专线小巴设充电装置'));
})();
// output: 政府初步傾向試驗為綠色專線小巴設充電裝置
```

## Node.js

Ugh ok... let's learn node.js real quick
[Here](https://www.w3schools.com/nodejs/nodejs_modules.asp)

## Other notes

Finding the right lyrics
[JS filtering response](https://www.freecodecamp.org/news/15-useful-javascript-examples-of-map-reduce-and-filter-74cbbb5e0a1f/)

```javascript
let res = users.filter(it => it.name.includes('oli'));
```

Notes: _Simple filter works just fine it appears_

Looks like need to learn node.js somehow and have this hosted in home server...
Why? coz how else can i secure my keys and secrets...
[Keeping secrets in node.js](https://medium.com/codait/environment-variables-or-keeping-your-secrets-secret-in-a-node-js-app-99019dfff716)
