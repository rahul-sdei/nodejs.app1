var application_root = __dirname,
  express = require("express"),
  path = require("path"),
  mongoose = require('mongoose')
  validate = require('mongoose-validator'),
  bodyParser = require('body-parser'),
  cookieParser = require('cookie-parser'),
  app = express(),
  formidable = require('formidable'),
  util = require('util')
  fs   = require('fs-extra'),
  qt   = require('quickthumb'),
  passport = require('passport'),
  expressSession = require('express-session'),
  flash = require('connect-flash'),
  basicAuth = require('basic-auth-connect'),
  socket = require('./app/modules/socket'),
  EventEmitter = require('events').EventEmitter,
  emitter = new EventEmitter(),
  port = 4242;

/* Connect to db */
mongoose.connect('mongodb://localhost:27017/exampleDb');
/* Set assets directory */
app.use('/assets', express.static('assets'));
/* Set html directory */
app.use('/html', express.static('html'));
/* Use quickthumb */
app.use('/uploads', qt.static(application_root + '/uploads'));

/* instruct the app to use the `bodyParser()` middleware for all routes */
app.use( bodyParser.urlencoded( {  'extended': false } ) );
app.use(bodyParser.json());

/* need cookieParser middleware before we can do anything with cookies */
app.use(cookieParser());

/* configure passport */
app.use( expressSession( { 'secret': 'mySecretKey', 'saveUninitialized': true, 'resave': true } ) );
app.use(passport.initialize());
app.use(passport.session());

// Using the flash middleware provided by connect-flash to store messages in session
// and displaying in templates
app.use(flash());

/* Initialize Passport */
var initPassport = require('./passport/init');
initPassport(passport);

/* populate params */
app.locals.baseUrl = 'http://localhost:4242/';

app.get('/', function (req, res) {
  res.send('Hello World!')
});

// middleware to router
app.use(/*basicAuth(function(user, pass) { return 'testUser'===user && 'testPass'===pass; }),*/
  function timeLog(req, res, next) {
  console.log('Time: ', Date.now());
  console.log('Request URL:', req.originalUrl);
  console.log('Request Type:', req.method);
  /*if ( typeof (req.body) != 'undefined' ) { console.log(req.body); }
  if ( typeof (req.files) != 'undefined' ) { console.log(req.files); }*/
  next();
})

/* Launch server */
var server = app.listen(port, function () {
  var host = server.address().address
  var port = server.address().port

  console.log('Example app listening at http://%s:%s', host, port);
  console.log(['rahul', 'sethi'].sort().hashCode());
});

/* setup socket io */
socket.connect(server);

/* users router */
var users = require('./app/routers/users');
app.use('/users', users);
/* chats router */
var chats = require('./app/routers/chats') (emitter);
app.use('/chats', chats);
/* chat events */
require('./app/events/chat.js') (emitter, socket);
/* index routers */
var index = require('./app/routers/index') (passport);
app.use('/', index);

app.use(function(err, req, res, next) {
  /*console.error(err.stack);*/
  if ( typeof (err.err) != 'undefined' ) {
  res.status(500).json({'error': err.err, 'code': err.code});
  } else if ( typeof (err.message) != 'undefined' ) {
      var message = err.message;
      if ( typeof (err.errors) != 'undefined' ) {
      for(key in err.errors) {
          message += "\n" + err.errors[key].message;
      }
      }
      res.status(500).json({'error': message, 'code': 500});
  }
});

/* set error handler */
process.on('uncaughtException', function(err) {
  console.log('Uncaught exception: ' + err);
});
