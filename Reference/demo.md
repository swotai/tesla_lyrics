# Demo breaking routes into separate files

app.js

```javascript
var express = require('express');
var app = express();

app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'))

app.listen('3000');
```

routes/index.js

```javascript
var router = require('express').Router();

router.get('/', function(req, res) {
    res.send('Index Page');
});

router.get('/about', function(req, res) {
    res.send('About Page');
});

module.exports = router;
```

routes/users.js

```javascript
var router = require('express').Router();

router.get('/', function(req, res) {
    res.send('Users Index Page');
});

router.get('/list', function(req, res) {
    res.send('Users List Page');
});

module.exports = router;
```

# Putting passport file separately

[Stack Overflow](https://stackoverflow.com/questions/31594949/where-to-put-passportjs-local-strategy-in-an-express-application)