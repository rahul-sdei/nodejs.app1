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
});

chatSchema.statics.saveChat = function(chatId, chatTitle, creatorId, recipients, text, next) {
  var Chat = this,
    message = {'creator_id': creatorId, 'message': text, 'created_at': Date.now()};
  console.log('Chat.saveChat() called');
  Chat.findOne({'chat_id': chatId}, function(err, chat1) {
    if (err) { next(err); return; }
    else if ( chat1==null ) {
      console.log('Chat.saveChat() new chatId:', chatId);
      var chat1 = new Chat({
        'chat_id': chatId,
        'chat_name': chatTitle,
        'recipients': recipients,
        'created_at': Date.now()
      });
    } else {
      /* update recipients list to add removed user again */
      chat1.recipients = recipients;
      chat1.chat_name = recipients.sort().toString();
      console.log('Chat.saveChat() old chatId:', chatId);
    }
    chat1.last_mesg = message;
    //console.log(chat1);
    chat1.save(function(err) {
      if (err) { next(err); return;}
      console.log('Chat.saveChat() finished');
      
      message['chat_id'] = chatId;
      console.log('Chat.addMessage() push new item');
      var chatMesg = new ChatMesgModel(message);
      chatMesg.save(function(err){
        if (err) { next(err); return;}
        console.log('Chat.addMessage() finished');
        next(null);
        });
    });
  });
}

chatSchema.statics.addMessage = function(chatId, creatorId, text, next) {
  var Chat = this,
    message = {'creator_id': creatorId, 'message': text, 'created_at': Date.now()};
  
  console.log('Chat.addMessage() called');
  Chat.findOne({'chat_id': chatId, 'recipients': creatorId}, function(err, chat1) {
    if (err) { next(err); return; }
    else if ( chat1==null ) {
      next({
        "err": 'Chat Object not found',
        "code": 404
        });
      return;
    }
    //chat1.chat_name = chat1.recipients.sort().toString();
    chat1.last_mesg = message;
    chat1.save(function(err) {
      if (err) { next(err); return;}
      
      console.log('Chat.addMessage() push new item');
      message['chat_id'] = chatId;
      var chatMesg = new ChatMesgModel(message);
      chatMesg.save(function(err){
        if (err) { next(err); return;}
        console.log('Chat.addMessage() finished');
        
        next(null, chat1.recipients);
        });
    });
  });
}

chatSchema.statics.removeRecipient = function(chatId, creatorId, recipientId, next) {
  var Chat = this;
  
  Chat.findOne({'chat_id': chatId, 'recipients': creatorId}, function(err, chat1) {
    if (err) { next(err); return; }
    else if ( chat1==null ) {
      next({
        "err": 'Chat Object not found',
        "code": 404
        });
      return;
    }
    
    for (i in chat1.recipients) {
      if (chat1.recipients[i] === recipientId) {
        chat1.recipients.splice(i, 1);
      }
    }
    
    chat1.save(function(err) {
      if (err) { next(err); return;}
      
      next(null);
    });
  });
}

chatSchema.statics.addRecipient = function(chatId, creatorId, recipientId, next) {
  var Chat = this;
  
  Chat.findOne({'chat_id': chatId, 'recipients': creatorId}, function(err, chat1) {
    if (err) { next(err); return; }
    else if ( chat1==null ) {
      next({
        "err": 'Chat Object not found',
        "code": 404
        });
      return;
    }
    
    for (i in chat1.recipients) {
      if (chat1.recipients[i] === recipientId) {
        chat1.recipients.splice(i, 1);
      }
    }
    
    chat1.recipients.push(recipientId);
    
    chat1.save(function(err) {
      if (err) { next(err); return;}
      
      next(null);
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