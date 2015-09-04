var express = require('express'),
  router = express.Router(),
  formidable = require('formidable'),
  util = require('util')
  fs   = require('fs-extra'),
  qt   = require('quickthumb'),
  auth = require('../modules/auth');

/* List users */
router.get('/', auth.isAuthenticated, function(req, res, next) {
  var User = require('../models/user');
  
  var page = 1;
  if ( typeof (req.query.page)!='undefined' ) {
    page = parseInt(req.query.page, 10);
  }
  var limit = 10;
  if ( typeof (req.query.limit)!='undefined' ) {
    limit = parseInt(req.query.limit, 10);
  }
  var offset = (page-1) * limit;
  
  var where = {username: {$ne: req.user.username} };
  if ( typeof (req.query.Search)!='undefined' ) {
    var search = req.query.Search;
    if ( typeof (search.fullname)!='undefined' ) { where['name'] =new RegExp(search.fullname, 'i'); }
    if ( typeof (search.uname)!='undefined' ) { where['username'] =new RegExp(search.uname, 'i'); }
    if ( typeof (search.location)!='undefined' ) { where['location'] =new RegExp(search.location, 'i'); }
    if ( typeof (search.is_admin)!='undefined' ) { where['is_admin'] = parseInt(search.is_admin); }
  }
  console.log(where);
  
  User.find(where).select('username name location meta has_picture').skip(offset).limit(limit).sort('-username').exec(function(err, users) {
  if (err) { next(err); return; }
    User.count(where, function(err, count){
        if (err) { next(err); return; }
        
        /* send count in headers */
        res.set('X-Total-Count', count);
        
        var currpage = app.locals.baseUrl + 'users?page='+page+'&limit='+limit;
        /* find next page */
        var nextpage = app.locals.baseUrl + 'users?page='+page+'&limit='+limit;
        if ( (offset+limit) < count ) {
          nextpage = app.locals.baseUrl + 'users?page='+(page+1)+'&limit='+limit;
        }
        var lastpage = app.locals.baseUrl + 'users?page='+Math.ceil(count/limit)+'&limit='+limit;
        var prevpage = app.locals.baseUrl + 'users?page='+page+'&limit='+limit;
        if ( page>1 ) {
            prevpage = app.locals.baseUrl + 'users?page='+(page-1)+'&limit='+limit;
        }
        res.links({
            'curr': currpage,
            'prev': prevpage,
            'next': nextpage,
            'last': lastpage,
            'first': app.locals.baseUrl + 'users?page=1',
        });
        res.status(200).json({'code': 0, 'error': null, 'data':users, 'count':count});
    })
  });
  
});

/* Create a user */
router.post('/', function(req, res, next) {
  var User = require('../models/user')
    , isAdmin=0;
    
  if ( typeof(req.body.user_group)!='undefined' && req.body.user_group=='administrator' ) {
      isAdmin=1;
  }
  var fullname = typeof(req.body.fullname)!='undefined' ? req.body.fullname : null;
  var uname = typeof(req.body.uname)!='undefined' ? req.body.uname : null;
  var passwd = typeof(req.body.passwd)!='undefined' ? req.body.passwd : null;
  var location = typeof(req.body.location)!='undefined' ? req.body.location : null;
  var age = typeof(req.body.age)!='undefined' ? req.body.age : null;
  var website = typeof(req.body.website)!='undefined' ? req.body.website : null;
  var user1 = new User({
    is_admin: isAdmin,
    name: fullname,
    username: uname,
    password: passwd,
    location: location,
    meta: { 'age': age, 'website': website }
  });
  
  // call the built-in save method to save to the database
  user1.save(function(err) {
    if (err) { next(err); return; }
    res.status(200).json({'code': 0, 'error': null});
  });
});

/* Bulk update Users */
router.put('/', auth.isAdministrator, function(req, res, next) {
  
  var i, len = 0, User = require('../models/user'), users = null;
  eval("users = (" + req.body.users + ")");
    console.log("is Array req.body.users");
    console.log(Array.isArray(users));
    console.log("PUT: (users)");
    console.log(users);
    if (Array.isArray(users)) { len = users.length; }
    else { res.status(400).json({'code': 400, 'error': 'Bad request.'}); return; }
    for (i = 0; i < len; i++) {
        console.log("UPDATE user by name: " + users[i]['uname']);
        User.update({ 'username': users[i]['uname'] }, { 
            $set: {
                'name':users[i]['fullname'],
                'location':users[i]['location'], 
                'meta': { 'age':users[i]['age'], 'website':users[i]['website'] } }
            }, { multi: false }, function (err, numAffected) {
            if (err) {
                console.log("Error on update");
                console.log(err);
            } else {
                console.log("updated num: " + numAffected);
            }
        });
    }
    res.status(200).json({'code': 0, 'error': null});
});

/* Delete all Users */
router.delete('/', function(req, res, next) {
res.status(501).json({'code': 501, 'error': 'This method isn\'t supported via api.'});
})

/* Find a User */
router.get('/:uname([a-zA-Z0-9\-\_]+)', function(req, res, next) {
  var User = require('../models/user'),
    uname = req.params.uname;
  
  User.findOne({'username':uname}, 'username name location meta has_picture', function(err, user) {
  if (err) { next(err); return; }
  else if ( user==null ) { res.status(404).json({'code': 404, 'error': 'No records found.'}); return; }
  /*user.password = '123';
  user.save();*/
  res.status(200).json(user);
  })
  
});

/* Method not allowed */
router.post('/:uname([a-zA-Z0-9\-\_]+)', function(req, res, next) {
  res.status(405).json({'code': 405, 'error': 'Method not allowed.'});
});

/* Update a User */
router.put('/:uname([a-zA-Z0-9\-\_]+)', auth.canEditUser, function(req, res, next) {
  var User = require('../models/user'),
    uname = req.params.uname;
  
  User.findOne({'username':uname}, function(err, user) {
  if (err) { next(err); return; }
  else if ( user==null ) { res.status(404).json({'code': 404, 'error': 'No records found.'}); return; }
  user.name = req.body.fullname;
  user.location = req.body.location;
  user.meta.age = req.body.age;
  user.meta.website = req.body.website;
  user.save(function(err){
      if ( err ) { next(err); return; }
      res.status(200).json({'code': 0, 'error': null});
  })
  })
});

/* Update password of a User */
router.put('/:uname([a-zA-Z0-9\-\_]+)/password', auth.canEditUser, function(req, res, next) {
  var User = require('../models/user'),
    uname = req.params.uname,
    oldPassword = req.body.old_passwd,
    newPassword = req.body.new_passwd;
  
  User.findOne({'username':uname}, function(err, user) {
  if (err) { next(err); return; }
  else if ( user==null ) { res.status(404).json({'code': 404, 'error': 'No records found.'}); return; }
  
  user.comparePassword(oldPassword, function(error, isMatch) {
    if ( error ) { next(error); return; }
    else if ( isMatch ) {
      user.password = newPassword;
      user.save(function(error) {
        if ( error ) { return next(error); }
        else { return res.status(200).json({'code': 0, 'error': null}); }
      })
    }
    else { res.status(401).json( { 'code':401, 'error':'Unauthorized' } ); return; }
  });
  })
});

/* Upload picture for a user */
router.put('/:uname([a-zA-Z0-9\-\_]+)/picture', auth.canEditUser, function(req, res, next) {
  var User = require('../models/user'),
    uname = req.params.uname;
  
  User.findOne({'username':uname}, function(err, user) {
  if (err) { next(err); return; }
  else if ( user==null ) { res.status(404).json({'code': 404, 'error': 'No records found.'}); return; }
  
  var form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, files) {
    if ( err ) { next(err); return; }
    /*res.writeHead(200, {'content-type': 'text/plain'});
    res.write('received upload:\n\n');
    res.end(util.inspect({fields: fields, files: files}));*/
  });

  form.on('end', function(fields, files) {
    /* Temporary location of our uploaded file */
    var tempPath = this.openedFiles[0].path;
    /* The file name of the uploaded file */
    /*var fileName = this.openedFiles[0].name;
    fileName = fileName.replace(/[^a-z0-9\-]+/ig, '-').toLowerCase() + '.' + Math.floor((Math.random() * 9999) + 1);*/
    /* Location where we want to copy the uploaded file */
    var destination = __dirname + '/../../uploads/' + user.username + '/';
    var fileName = 'mypicture';

    fs.ensureDir(destination, function(err){
      if ( err ) { next(err); return; }
    });
    /*fs.copy(tempPath, destination + fileName, function(err) {  
      if ( err ) { return next(err); }
    });*/
    qt.convert({'src': tempPath, 'dst': destination + fileName, 'height': 250},  function(err, path){
      if ( err ) { next(err); return; }
      user.has_picture = 1;
      user.save(function(err){
          if ( err ) { next(err); return; }
          res.status(200).json({'code': 0, 'error': null});
      })
    })
  });
  });
  
});

/* Delete picture for a user */
router.delete('/:uname([a-zA-Z0-9\-\_]+)/picture', auth.canEditUser, function(req, res, next) {
  var User = require('../models/user'),
    uname = req.params.uname;
  
  User.findOne({'username':uname}, function(err, user) {
    if (err) { next(err); return; }
    else if ( user==null ) { res.status(404).json({'code': 404, 'error': 'No records found.'}); return; }
  
    var destination = __dirname + '/../../uploads/' + user.username + '/';
    var fileName = 'mypicture';

    fs.remove(destination + fileName, function(err){
      if ( err ) { next(err); return; }
      user.has_picture = 0;
      user.save(function(err){
        if ( err ) { next(err); return; }
        res.status(200).json({'code': 0, 'error': null});
      })
    });
    
  });
});

/* find all contacts */
router.get('/:uname([a-zA-Z0-9\-\_]+)/contacts', auth.canEditUser, function(req, res, next) {
    var User = require('../models/user'),
    mongoose = require('mongoose'),
    uname = req.params.uname;
    
    User.findOne({'username':uname}, function(err, user) {
      if (err) { next(err); return; }
      else if ( user==null ) { res.status(404).json({'code': 404, 'error': 'No records found.'}); return; }
    
      User.find({}).select('username name location meta has_picture').in('username', user.contacts).exec(function(err, contacts){
          if (err) { return next(err); }
          return res.status(200).json({'code': 0, 'error': null, 'data':contacts});
      })
    });
});

/* Save contacts */
router.post('/:uname([a-zA-Z0-9\-\_]+)/contacts', auth.canEditUser, function(req, res, next) {
  var User = require('../models/user'),
    mongoose = require('mongoose'),
    uname = req.params.uname,
    i, len = 0,
    ulist = typeof req.body.ulist !=='object' ? JSON.parse(req.body.ulist) : req.body.ulist;
    
  if (Array.isArray(ulist)) { len = ulist.length; } 
  else { res.status(400).json({'code': 400, 'error': 'Bad request.'}); return; }
  
  User.findOneAndUpdate({'username':uname},
    {'$addToSet': {'contacts': {'$each': ulist} } },
    function(err) {
    if (err) { next(err); return; }
    
    res.status(200).json({'code': 0, 'error': null});
  })
});

/* Remove a contact */
router.delete('/:uname([a-zA-Z0-9\-\_]+)/contacts/:id([a-zA-Z0-9\-\_]+)', auth.canEditUser, function(req, res, next) {
  var User = require('../models/user'),
  mongoose = require('mongoose'),
  uname = req.params.uname,
  id = req.params.id,
  i, len = 0;
  
  console.log('Remove conact: ' + id + ' for "'+uname+'"');
  User.findOne({'username':uname}, function(err, user) {
    if (err) { next(err); return; }
    else if ( user==null ) { res.status(404).json({'code': 404, 'error': 'No records found.'}); return; }
  
    var ulist = user.contacts;
    if (Array.isArray(ulist)) { len = ulist.length; } 
    else { res.status(404).json({'code': 404, 'error': 'No records found.'}); return; }
    for (i = 0; i < len; i++) {
      if ( ulist[i]===id ) {
        console.log('Deleting "'+ulist[i]+'"');
        ulist.splice(i, 1);
      }
    }
    user.contacts = ulist;
    user.save(function(err){
      if ( err ) { next(err); return; }
      res.status(200).json({'code': 0, 'error': null});
    })
  })
});

/* Delete a User by name */
router.delete('/:uname([a-zA-Z\-\_]+)', auth.isAdministrator, function(req, res, next) {
  var User = require('../models/user'),
    uname = req.params.uname;
  
  console.log('Delete user by name: ' + uname);
  User.findOne({'username':uname}, function(err, user) {
  if (err) { next(err); return; }
  else if ( user==null ) { res.status(404).json({'code': 404, 'error': 'No records found.'}); return; }
  user.remove(function(err){
      if ( err ) { next(err); return; }
      res.status(200).json({'code': 0, 'error': null});
  })
  })
});

/* Delete a User by Id */
router.delete('/:id([a-z0-9]+)', auth.isAdministrator, function(req, res, next) {
  var User = require('../models/user')
    mongoose = require('mongoose'),
    id = mongoose.Types.ObjectId(req.params.id);
  
  console.log('Delete user by id: ' + id);
  User.findById(id, function(err, user) {
  if (err) { next(err); return; }
  else if ( user==null ) { res.status(404).json({'code': 404, 'error': 'No records found.'}); return; }
  user.remove(function(err){
      if ( err ) { next(err); return; }
      res.status(200).json({'code': 0, 'error': null});
  })
  })
});

module.exports = router;