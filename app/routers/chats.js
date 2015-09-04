var express = require('express'),
 router = express.Router(),
  auth = require('../modules/auth');

module.exports = function(emitter){
    
router.get('/', auth.isAdministrator, function(req, res, next){
  var User = require('../models/user'),
    Chat = require('../models/chat');
      
  var page = 1;
  if ( typeof (req.query.page)!='undefined' ) {
    page = parseInt(req.query.page, 10);
  }
  var limit = 10;
  if ( typeof (req.query.limit)!='undefined' ) {
    limit = parseInt(req.query.limit, 10);
  }
  var offset = (page-1) * limit;
  
  var where = {};
    if ( typeof (req.query.Search)!='undefined' ) {
    var search = req.query.Search;
    if ( typeof (search.creator)!='undefined' ) { where['creator_id'] =new RegExp(search.creator, 'i'); }
    if ( typeof (search.recipient)!='undefined' ) { where['recipient_id'] =new RegExp(search.recipient, 'i'); }
  }
  
  Chat.Model.find(where).select('chat_id chat_name chat_icon recipients created_at last_mesg').skip(offset).limit(limit).sort('-created_at').exec(function(err, chats) {
    if (err) { next(err); return; }
    Chat.Model.count(where, function(err, count){
      if (err) { next(err); return; }
      /* send count in headers */
        res.set('X-Total-Count', count);
        
        /* find next page */
        var nextpage = app.locals.baseUrl + 'chats?page='+page;
        if ( (offset+limit) < count ) {
            nextpage = app.locals.baseUrl + 'chats?page='+(page+1);
        }
        var lastpage = app.locals.baseUrl + 'chats?page='+Math.ceil(count/limit)
        var prevpage = app.locals.baseUrl + 'chats?page='+page;
        if ( page>1 ) {
            prevpage = app.locals.baseUrl + 'chats?page='+(page-1);
        }
        res.links({
            'prev': prevpage,
            'next': nextpage,
            'last': lastpage,
            'first': app.locals.baseUrl + 'chats?page=1',
        });
        res.status(200).json({'code': 0, 'error': null, 'data':chats, 'count':count});
    });
  });
});

/* list convesations for a user */
router.get('/:uname([a-zA-Z0-9\-\_]+)',
  auth.canEditUser,
  function(req, res, next) {
    var User = require('../models/user'),
    Chat = require('../models/chat'),
    creator = req.params.uname,
    i, len=0, contacts=[],
    lastMesgArr={};
    
    Chat.Model.find({'recipients':creator}).select('chat_id chat_name chat_icon recipients created_at last_mesg').sort('-last_mesg.created_at').exec(function(err, chats) {
      if (err) { return next(err); }
      if (Array.isArray(chats)) {
        len = chats.length;
        return res.status(200).json({'code': 0, 'error': null, 'data':contacts, 'chats':chats});
      } 
      else {
        return res.status(200).json({'code': 0, 'error': null});
      }
    });
});

/* start a new chat with multiple recipients */
router.post('/:uname([a-zA-Z0-9\-\_]+)',
  auth.canEditUser,
  function(req, res, next) {
    console.log(req.body);
    var User = require('../models/user'),
      Chat = require('../models/chat'),
      creatorId = req.params.uname,
      message = req.body.message,
      recipients = typeof req.body.recipients !== 'undefined' ? req.body.recipients : [],
      chatId = (recipients.sort().toString() + ',' + Date.now()).hashCode(),
      chatTitle = typeof req.body.chat_title !== 'undefined' ? req.body.chat_title : recipients.sort().toString(),
      messageObject = {'creator_id': creatorId, 'message': message, 'created_at': Date.now()},
      i, len=0;

    if (typeof recipients !== 'object') {
      recipients = JSON.parse(recipients);
    }
    
    if (Array.isArray(recipients)) { len = recipients.length; } 
    if (len == 0) { res.status(400).json({'code': 400, 'error': 'Bad request.'}); return; }
    recipients.unshift(creatorId);
      
    /* save chat */
    console.log('Chat.saveChat() calling', [chatId, chatTitle, creatorId, recipients, message]);
    /*res.status(200).json({'code': 0, 'error': null});
    return;*/
    var chat1 = new Chat.Model({
        'chat_name': chatTitle, 
        'chat_id': chatId, 
        'recipients': recipients, 
        'last_mesg': messageObject 
        });
    chat1.save(function(err){
       if (err) {
           next(err);
           return;
       }
       /* call event emitter */
       emitter.emit('chat.save', recipients, {
            chatId: chat1.chat_id,
            messageId: req.body._id,
            messageObject: messageObject
            });
       /* send response */
       res.status(200).json({'code': 0, 'error': null});
    });
});

/* list convesations for a user with recipient */
router.get('/:uname([a-zA-Z0-9\-\_]+)/:recipient([a-zA-Z][a-zA-Z0-9\-\_]+)',
  auth.canEditUser,
  function(req, res, next) {
    var User = require('../models/user'),
    Chat = require('../models/chat'),
    creator = req.params.uname,
    recipient = req.params.recipient,
    i, len=0, contacts=[],
    lastMesgArr={};
    
    Chat.Model.find({'recipients': {$all: [creator, recipient]}}).select('chat_id chat_name chat_icon recipients created_at last_mesg').sort('-last_mesg.created_at').exec(function(err, chats) {
      if (err) { return next(err); }
      if (Array.isArray(chats)) {
        len = chats.length;
        return res.status(200).json({'code': 0, 'error': null, 'data':contacts, 'chats':chats});
      } 
      else {
        return res.status(200).json({'code': 0, 'error': null});
      }
    });
});

/* start a new chat */
router.post('/:uname([a-zA-Z][a-zA-Z0-9\-\_]+)/:recipient([a-zA-Z][a-zA-Z0-9\-\_]+)',
  auth.canEditUser,
  function(req, res, next) {
    var User = require('../models/user'),
     Chat = require('../models/chat'), 
     creatorId = req.params.uname,
     recipientId = req.params.recipient,
     message = typeof(req.body.message)!=='undefined' ? req.body.message : null,
     recipients = [creatorId, recipientId].sort(),
     chatId = (recipients.sort().toString() + ',' + Date.now()).hashCode(),
     chatTitle = typeof(req.body.chat_title)!=='undefined' ? req.body.chat_title : recipients.sort().toString(),
     messageObject = {'creator_id': creatorId, 'message': message, 'created_at': Date.now()};
    
    if (message==null) { res.status(400).json({'code': 400, 'error': 'Message field can\'t be empty.'}); return; }
    
    /* save chat */
    console.log('Chat.saveChat() calling', [chatId, chatTitle, creatorId, recipientId, recipients, message]);
    /*res.status(200).json({'code': 0, 'error': null});
    return;*/
    
    Chat.Model.findOne({recipients: {$eq: recipients.sort()} }, function(err, chat1){
       if (err) {
           next(err);
           return;
       }
       
       if (chat1 == null) {
           chat1 = new Chat.Model({
            'chat_name': chatTitle, 
            'chat_id': chatId, 
            'recipients': recipients, 
            'last_mesg': messageObject 
            });
       } else {
           chat1.last_mesg = messageObject;
       }
       
       chat1.save(function(err){
           if (err) {
               next(err);
               return;
           }
           /* call event emitter */
           emitter.emit('chat.save', recipients, {
            chatId: chat1.chat_id,
            messageId: req.body._id,
            messageObject: messageObject
            });
           /* send response */
           res.status(200).json({'code': 0, 'error': null});
       })
    });
    
})

/* fetch a  conversation history */
router.get('/:uname([a-zA-Z0-9\-\_]+)/:chat_id([0-9\-\_]+)',
  auth.canEditUser,
  function(req, res, next) {
    var User = require('../models/user'),
    Chat = require('../models/chat'),
    creator = req.params.uname,
    chatId = req.params.chat_id;
    
    Chat.Model.findOne({'recipients':creator,'chat_id':chatId}, function(err, chat) {
      if (err) { next(err); return; }
      else if ( chat==null ) { res.status(404).json({'code': 404, 'error': 'No records found.'}); return; }
      Chat.MesgModel.find({'chat_id': chatId}).sort('created_at').exec(function(err, messages){
        if (err) { next(err); return; }
        res.status(200).json({
          'history': messages,
          'chat': chat
          });
        });
      
    });
});

/* save a new message to old chat */
router.post('/:uname([a-zA-Z0-9\-\_]+)/:chat_id([0-9\-\_]+)',
  auth.canEditUser,
  function(req, res, next) {
    var User = require('../models/user'),
      Chat = require('../models/chat'),
      creatorId = req.params.uname,
      chatId = req.params.chat_id,
      message = typeof(req.body.message)!=='undefined' ? req.body.message : null,
      messageObject = {'creator_id': creatorId, 'message': message, 'created_at': Date.now()};
    
    if (message==null) { res.status(400).json({'code': 400, 'error': 'Message field can\'t be empty.'}); return; }
    
    /* save chat */
    console.log('Chat.addMessage() calling', [chatId, creatorId, message]);
    /*res.status(200).json({'code': 0, 'error': null});
    return;*/
    Chat.Model.findOne({"chat_id": chatId, "recipients": creatorId},
      function(err, chat1){
        if (err) {
          next(err);
          return;
        }
        if (chat1 == null) {
            next({
            "err": 'Chat Object not found',
            "code": 404
            });
            return;
        }
        chat1.last_mesg = messageObject;
        chat1.save(function(err){
            if (err) {
                next(err);
                return;
            }
            /* call event emitter */
            emitter.emit('chat.save', chat1.recipients, {
              chatId: chatId,
              messageId: req.body._id,
              messageObject: messageObject
              });
            /* send response */
            res.status(200).json({'code': 0, 'error': null});
        });
        
      });
    
});

/* update chat object specific details */
router.put('/:uname([a-zA-Z0-9\-\_]+)/:chat_id([0-9\-\_]+)',
  auth.canEditUser,
  function(req, res, next) {
    var User = require('../models/user'),
      Chat = require('../models/chat'),
      creatorId = req.params.uname,
      chatId = req.params.chat_id,
      chatTitle = req.body.chat_title,
      recipients = typeof req.body.recipients !== 'undefined' ? req.body.recipients : [];
      
    if (typeof recipients !== 'object') {
      recipients = JSON.parse(recipients);
    }
    
    if (!Array.isArray(recipients)) { recipients = []; } 
    Chat.Model.findOneAndUpdate({'chat_id': chatId, 'recipients': creatorId},
      { '$set': {'chat_name': chatTitle},
        '$addToSet': {'recipients': {'$each': recipients} }
      },
      function(err){
      if (err) { next(err); return; }
      
      /* send response */
      res.status(200).json({'code': 0, 'error': null});
    });
});

/* unsubscribe from chat history */
router.delete('/:uname([a-zA-Z0-9\-\_]+)/:chat_id([0-9\-\_]+)',
  auth.canEditUser,
  function(req, res, next) {
    var User = require('../models/user'),
    Chat = require('../models/chat'),
    creator = req.params.uname,
    chatId = req.params.chat_id;
    
    Chat.Model.findOneAndUpdate({"chat_id": chatId, "recipients": creator},
    {
      '$pull': {'recipients': creator }
    },
    function(err) {
    if (err) { next(err); return; }
    
    res.status(200).json({'code': 0, 'error': null});
    });
});

/* delete a single message */
router.delete('/:uname([a-zA-Z0-9\-\_]+)/:chat_id([0-9\-\_]+)/:id',
  auth.canEditUser,
  function(req, res, next) {
  var User = require('../models/user'),
    Chat = require('../models/chat'),
    creator = req.params.uname,
    chatId = req.params.chat_id,
    chatMesgId = req.params.id;
  
  Chat.MesgModel.remove({'creator_id':creator,'chat_id':chatId,'_id':chatMesgId}, function(err, chat) {
    if (err) { next(err); return; }
    res.status(200).json({'code': 0, 'error': null});
  })
  
});

/* add multiple recipients to old chat */
router.post('/:uname([a-zA-Z0-9\-\_]+)/:chat_id([0-9\-\_]+)/recipients',
  auth.canEditUser,
  function(req, res, next) {
  var User = require('../models/user'),
   Chat = require('../models/chat'),
   creator = req.params.uname,
   chatId = req.params.chat_id,
   i, len = 0,
   recipients = typeof req.body.recipients !== 'undefined' ? req.body.recipients : [];
   
  if (typeof recipients !== 'object') {
    recipients = JSON.parse(recipients);
  }

  if (Array.isArray(recipients)) { len = recipients.length; } 
  if (len == 0) { res.status(400).json({'code': 400, 'error': 'Bad request.'}); return; }
  
  Chat.Model.findOneAndUpdate({"chat_id": chatId, "recipients": creator},
    {
      '$addToSet': {'recipients': {'$each': recipients} }
    },
    function(err) {
    if (err) { next(err); return; }
    
    res.status(200).json({'code': 0, 'error': null});
    });
});

/* add new recipient to old chat */
router.post('/:uname([a-zA-Z0-9\-\_]+)/:chat_id([0-9\-\_]+)/recipients/:recipient([a-zA-Z0-9\-\_]+)',
  auth.canEditUser,
  function(req, res, next) {
  var User = require('../models/user'),
   Chat = require('../models/chat'),
   creator = req.params.uname,
   chatId = req.params.chat_id,
   recipient = req.params.recipient;
   
  Chat.Model.findOneAndUpdate({"chat_id": chatId, "recipients": creator},
    {
      '$addToSet': {'recipients': recipient }
    },
    function(err) {
    if (err) { next(err); return; }
    
    res.status(200).json({'code': 0, 'error': null});
    });
});

/* remove recipient from chat */
router.delete('/:uname([a-zA-Z0-9\-\_]+)/:chat_id([0-9\-\_]+)/recipients/:recipient([a-zA-Z0-9\-\_]+)',
    auth.canEditUser,
    function(req, res, next) {
    var User = require('../models/user'),
     Chat = require('../models/chat'),
     creator = req.params.uname,
     chatId = req.params.chat_id,
     recipient = req.params.recipient;
    
    Chat.Model.findOneAndUpdate({"chat_id": chatId, "recipients": creator},
    {
      '$pull': {'recipients': recipient }
    },
    function(err) {
    if (err) { next(err); return; }
    
    res.status(200).json({'code': 0, 'error': null});
    });
});

return router;
}