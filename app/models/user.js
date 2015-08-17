// grab the things we need
var mongoose = require('mongoose'),
    validate = require('mongoose-validator'),
    Schema = mongoose.Schema,
    bcrypt = require('bcrypt'),
    SALT_WORK_FACTOR = 10,
    // these values can be whatever you want - we're defaulting to a
    // max of 5 attempts, resulting in a 2 hour lock
    MAX_LOGIN_ATTEMPTS = 2,
    LOCK_TIME = 10 * 1000; // set 10 seconds

var nameValidator = [
  validate({
    'validator': 'isLength',
    'arguments': [3, 50],
    'message': 'User Name should be between 3 and 50 characters'
  }),
  /*validate({
    'validator': 'isAlphanumeric',
    'passIfEmpty': false,
    'message': 'User Name should contain alpha-numeric characters only'
  }),*/
  validate({
    'validator': 'matches',
    'arguments': /^[a-zA-Z0-9\-\_]+$/i,
    'message': 'User Name shouldn\'t contain special characters'
  })
];

// create a schema
var userSchema = new Schema({
  name: String,
  username: { type: String, required: true, unique: true, validate: nameValidator, index: true},
  password: { type: String, required: true },
  auth_key: String,
  is_admin: {type: Boolean, 'default': 0},
  has_picture: {type: Boolean, 'default': 0},
  location: String,
  meta: {
    age: Number,
    website: String
  },
  created_at: Date,
  updated_at: Date,
  login_attempts: { type: Number, required: true, 'default': 0 },
  lock_until: { type: Number },
  contacts: [Schema.Types.ObjectId]
});

// custom method to add string to end of name
// you can create more important methods like name validations or formatting
// you can also do queries and find similar users 
userSchema.methods.dudify = function() {
  // add some stuff to the users name
  this.name = this.name + '-dude'; 

  return this.name;
};

userSchema.virtual('isLocked').get(function() {
    // check for a future lockUntil timestamp
    return !!(this.lock_until && this.lock_until > Date.now());
});

// on every save, add the date
userSchema.pre('save', function(next) {
  // get the current date
  var currentDate = new Date(),
    user = this,
    authKey = null;
  
  // change the updated_at field to current date
  this.updated_at = currentDate;

  // if created_at doesn't exist, add to that field
  if (!this.created_at)
    this.created_at = currentDate;

  /* generate auth key to be used in api calls for authorization */
  authKey = this.username + '.' + Math.floor((Math.random() * 9999) + 1);
  this.auth_key = authKey;
  
  //only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) { return next(); }
  
  //generate a salt
  bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
    if (err) return next(err);
    
    console.log([salt, user.password]);
    // hash the password using our new salt
    bcrypt.hash(user.password, salt, function(err, hash) {
      if (err) return next(err);
   
      // override the cleartext password with the hashed one
      user.password = hash;
      next();
    });
  });
  
});

userSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
      if (err) return cb(err);
      cb(null, isMatch);
    });
};

userSchema.methods.incLoginAttempts = function(cb) {
    // if we have a previous lock that has expired, restart at 1
    if (this.lock_until && this.lock_until < Date.now()) {
        return this.update({
            $set: { login_attempts: 1 },
            $unset: { lock_until: 1 }
        }, cb);
    }
    // otherwise we're incrementing
    var updates = { $inc: { login_attempts: 1 } };
    // lock the account if we've reached max attempts and it's not locked already
    if (this.login_attempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
        updates.$set = { lock_until: Date.now() + LOCK_TIME };
    }
    return this.update(updates, cb);
};

// expose enum on the model, and provide an internal convenience reference 
userSchema.statics.failedLogin = {
    NOT_FOUND: 0,
    PASSWORD_INCORRECT: 1,
    MAX_ATTEMPTS: 2
};

userSchema.statics.getAuthenticated = function(username, password, cb) {
    
};

// the schema is useless so far
// we need to create a model using it
var User = mongoose.model('User', userSchema);

// make this available to our users in our Node applications
module.exports = User;