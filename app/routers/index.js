var express = require('express'),
  router = express.Router(),
  auth = require('../modules/auth');

module.exports = function(passport){
    /* Handle Login POST */
    /*router.post('/login', passport.authenticate('login', {
        successRedirect: '/home',
        failureRedirect: '/loginFailed',
        failureFlash : true
    }));*/
    router.post('/login', function (req, res, next) {
        passport.authenticate('login', function (err, user, info) {
          if (err) { return next(err); }
          if (!user) { return res.status(401).json( { 'code':401, 'error':'Unauthorized' } ); }

          req.logIn(user, { session: true }, function (err) {

            // Should not cause any errors

            if (err) { return next(err); }
            
            req.url = '/home';
            req.method = 'get';
            return next();
            
            /* return res.status(200).json({ 'code':0, 'error':null }); */
          });
        })(req, res, next);
      });
    
    /* GET Failed login error */
    router.get('/loginFailed', function(req, res, next){
        res.status(403).json({ 'code': 403, 'error': req.flash('message') });
    });
    
    /* Handle Registration POST */
    router.post('/signup', function (req, res, next) {
        passport.authenticate('signup', function (err, user, info) {
          if (err) { return next(err); }
          if (!user) { return res.status(500).json( { 'code':500, 'error':'Internal Server Error' } ); }

          req.logIn(user, { session: true }, function (err) {

            // Should not cause any errors

            if (err) { return next(err); }
            return res.status(200).json({ 'code':0, 'error':null });
          });
        })(req, res, next);
      });
    
    /* GET Home Page */
    router.get('/home', auth.isAuthenticated, function(req, res){
      var user = {
      '_id': req.user['_id'],
      'uname': req.user['username'],
      'fullname': req.user['name'],
      'location': req.user['location'],
      'is_admin': req.user['is_admin'],
      'has_picture': req.user['has_picture'],
      'contacts': req.user['contacts']
      };
      if ( typeof (req.user['meta']) !== 'undefined' ) {
        user['age'] = req.user['meta'] ['age'];
        user['website'] = req.user['meta'] ['website'];
      }
      
      res.status(200).json({ 'user': user });
    });

    /* Handle Logout */
    router.get('/signout', function(req, res) {
      req.logout();
      /*res.redirect('/');*/
      res.status(200).json({ 'code':0, 'error':null });
    });
    
    return router;
}