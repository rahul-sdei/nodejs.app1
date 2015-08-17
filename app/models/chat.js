// grab the things we need
var mongoose = require('mongoose'),
    validate = require('mongoose-validator'),
    Schema = mongoose.Schema;

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
var chatMesgSchema = new Schema({
    creator_id: {type: String, required: true, validate: nameValidator, index: true},
    message: {type: String, required: true},
    created_at: {type: Date, default: Date.now}
});
var chatSchema = new Schema({
  creator_id: {type: String, required: true, validate: nameValidator},
  recipient_id: {type: String, required: true, validate: nameValidator},
  messages: [chatMesgSchema],
  last_mesg: {
    creator_id: {type: String, required: true, validate: nameValidator},
    message: {type: String, required: true},
    created_at: {type: Date, default: Date.now}
  }
});
chatSchema.index({ creator_id: 1, recipient_id: 1}, { unique: true });

chatSchema.post('save', function(doc){
});

chatSchema.statics.sendChat = function(creator_id, sender_id, recipient_id, text, next) {
  var Chat = this,
    message = {'creator_id': creator_id, 'message': text, 'created_at': Date.now()};
  Chat.findOne({'creator_id': sender_id, 'recipient_id': recipient_id}, function(err, chat1) {
    if (err) { return next(err); }
    else if ( chat1==null ) {
      var chat1 = new Chat({
        'creator_id': sender_id,
        'recipient_id': recipient_id,
        'messages': [message]
      });
    } else {
      chat1.messages.push(message);
    }
    chat1.last_mesg = message;
    chat1.save(function(err) {
      if (err) { return next(err); }
    });
  });
}

// the schema is useless so far
// we need to create a model using it
var ChatModel = mongoose.model('Chat', chatSchema);
var ChatMesgModel = mongoose.model('ChatMesg', chatMesgSchema);

var Chat = {
    'Model': ChatModel,
    'MesgModel': ChatMesgModel
}

// make this available to our users in our Node applications
module.exports = Chat;