var express = require('express'),
      LocalStrategy  = require('passport-local').Strategy,
      bcrypt = require('bcrypt'),
      User = require('../app/models/user');
      
module.exports = function(passport){
    passport.use('login', new LocalStrategy({'passReqToCallback': true, 'usernameField': 'uname', 'passwordField': 'passwd'}, 
        function(req, username, password, cb) { 
        console.log([username, password]);
        // check in mongo if a user with username exists or not
        User.findOne({ username: username }, function(err, user) {
            if (err) return cb(err);

            var reasons = User.failedLogin;
            // make sure the user exists
            if (!user) {
                req.flash('code', reasons.NOT_FOUND);
                return cb(null, null, req.flash('message', 'User Not found.'));
            }

            // check if the account is currently locked
            if (user.isLocked) {
                // just increment login attempts if account is already locked
                return user.incLoginAttempts(function(err) {
                    if (err) return cb(err);
                    req.flash('code', reasons.MAX_ATTEMPTS);
                    return cb(null, null, req.flash('message', 'Login attempts count has been exceeded.'));
                });
            }

            // test for a matching password
            user.comparePassword(password, function(err, isMatch) {
                if (err) return cb(err);

                // check if the password was a match
                if (isMatch) {
                    // if there's no lock or failed attempts, just return the user
                    if (!user.login_attempts && !user.lock_until) return cb(null, user);
                    // reset attempts and lock info
                    var updates = {
                        $set: { login_attempts: 0 },
                        $unset: { lock_until: 1 }
                    };
                    return user.update(updates, function(err) {
                        if (err) return cb(err);
                        return cb(null, user);
                    });
                }

                // password is incorrect, so increment login attempts before responding
                user.incLoginAttempts(function(err) {
                    if (err) return cb(err);
                    req.flash('code', reasons.PASSWORD_INCORRECT);
                    return cb(null, null, req.flash('message', 'Invalid Password'));
                });
            });
        });

      }) );
}