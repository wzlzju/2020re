const express = require('express');
const app = express();
const expressWs = require('express-ws')(app);
const http = require('http');
const timeout = require('connect-timeout')
const bodyParser = require('body-parser');
const cors = require('cors')
const wsRouter = require('./router');

app.use(cors());

// 静态资源
app.use(express.static('./public'));

app.use(timeout('1200s'))
app.use(require('body-parser').urlencoded({limit: '1000mb', extended: true}));

//跨域nors
app.all('*', function(req, res, next) {  
    res.header("Access-Control-Allow-Origin", "*");  
    res.header("Access-Control-Allow-Headers", "X-Requested-With");  
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");  
    res.header("X-Powered-By",' 3.2.1')  
    res.header("Content-Type", "application/json;charset=utf-8");  
    next();  
});

app.use('/ws', wsRouter);

let server = app.listen(3001, function () {
  let host = server.address().address;
  let port = server.address().port;

  console.log('My web is listening at http://%s:%s', host, port);
});
