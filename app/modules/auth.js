var express = require('express'),
  User = require('../models/user'),
  auth = {};

auth['isAuthenticated'] = function (req, res, next) {
  // if the user is not authenticated then redirect him to the login page
  if ( !req.isAuthenticated() ) { 
    return res.status(401).json( { 'code':401, 'error':'Unauthorized' } );
  }
  // if user is authenticated in the session, call the next() to call the next request handler 
  // Passport adds this method to request object. A middleware is allowed to add properties to
  // request and response objects
  return next();
  };

auth['isAdministrator'] = function(req, res, next) {
  auth['isAuthenticated'](req, res, function(){
    if ( req.user.is_admin !== true ) { 
      return res.status(400).json( { 'code':400, 'error':'Bad request' } );
    }
    return next();
  });
  };

auth['canEditUser'] = function(req, res, next) {
  auth['isAuthenticated'](req, res, function(){
    var uname = req.params.uname;
    if ( req.user.is_admin === true || req.user.username === uname ) {
      return next();
    } else { 
      return res.status(400).json( { 'code':400, 'error':'Bad request' } ); 
    }
  });
  };

module.exports = auth;