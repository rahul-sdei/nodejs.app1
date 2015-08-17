var express = require('express'),
    LocalStrategy  = require('passport-local').Strategy,
    bcrypt = require('bcrypt'),
    User = require('../app/models/user');
      
module.exports = function(passport){
  passport.use('signup', new LocalStrategy({'passReqToCallback': true, 'usernameField': 'uname', 'passwordField': 'passwd'}, 
    function(req, username, password, done) { 
      findOrCreateUser = function(){
          /*username = req.body.uname;
          password = req.body.passwd;*/
          console.log('Signup: ', [username, password]);
          
          // find a user in Mongo with provided username
          User.findOne({ 'username' :  username }, function(err, user) {
              // In case of any error, return using the done method
              if (err){
                  console.log('Error in SignUp: '+err);
                  return done(err);
              }
              // already exists
              if (user) {
                  console.log('User already exists with username: '+username);
                  return done(null, false, req.flash('message','User Already Exists'));
              } else {
                  // if there is no user with that email
                  // create the user
                  var newUser = new User();

                  // set the user's local credentials
                  newUser.username = req.body.uname;
                  newUser.password = req.body.passwd;
                  newUser.name = req.body.fullname;
                  newUser.location = req.body.location;

                  // save the user
                  newUser.save(function(err) {
                      if (err){
                          console.log('Error in Saving user: '+err);  
                          throw err;  
                      }
                      console.log('User Registration succesful');    
                      return done(null, newUser);
                  });
              }
          });
      };
      // Delay the execution of findOrCreateUser and execute the method
      // in the next tick of the event loop
      process.nextTick(findOrCreateUser);
    
  }) );
}