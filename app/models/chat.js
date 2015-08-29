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
    chat_id: {type: Number, required: true},
    creator_id: {type: String, required: true, validate: nameValidator, index: true},
    message: {type: String, required: true},
    created_at: {type: Date, default: Date.now}
});
var chatSchema = new Schema({
  chat_id: {type: Number, required: true, unique: true},
  chat_name: {type: String, required: true},
  chat_icon: {type: String, required: false},
  recipients: [{type: String, required: true, validate: nameValidator}],
  //messages: [chatMesgSchema],
  last_mesg: {
    creator_id: {type: String, required: true, validate: nameValidator},
    message: {type: String, required: true},
    created_at: {type: Date, default: Date.now}
  },
  created_at: {type: Date, default: Date.now}
});
/*chatSchema.index({ creator_id: 1, recipient_id: 1}, { unique: true });*/

chatSchema.post('save', function(doc){
    var chatMesg = new ChatMesgModel({
        'chat_id': doc.chat_id,
        'creator_id': doc.last_mesg.creator_id,
        'message': doc.last_mesg.message,
        'created_at': doc.last_mesg.created_at
    });
    chatMesg.save();
});

chatSchema.methods.addToHistory = function(messageObject, next){
  
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