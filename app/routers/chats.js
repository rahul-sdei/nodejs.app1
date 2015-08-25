var express = require('express');
var router = express.Router();

module.exports = function(socket){
    
router.get('/', function(req, res, next){
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
  
  Chat.Model.find(where).select('chat_id recipients').skip(offset).limit(limit).sort('-created_at').exec(function(err, chats) {
    if (err) { return next(err); }
    Chat.Model.count(where, function(err, count){
      if (err) { return next(err); }
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

/* start a new chat */
router.post('/:creator([a-zA-Z][a-zA-Z0-9\-\_]+)/:recipient([a-zA-Z][a-zA-Z0-9\-\_]+)', function(req, res, next) {
    var User = require('../models/user'),
      Chat = require('../models/chat');
      
    var creatorId = req.params.creator;
    var recipientId = req.params.recipient;
    var message = typeof(req.body.message)!='undefined' ? req.body.message : null;
    var recipients = [creatorId, recipientId].sort();
    var chatId = recipients.toString().hashCode();
    
    /* save chat */
    console.log('Chat.saveChat() calling', [chatId, creatorId, recipientId, recipients, message]);
    /*res.status(200).json({'code': 0, 'error': null});
    return;*/
    Chat.Model.saveChat(chatId, creatorId, recipients, message, function(err){
      if (err) {
        next(err);
        return;
      }
      
      /* throw notifications */
      for (i in recipients) {
        if (recipients[i]==creatorId) {
          /* send notification to sender */
          socket.notifyUser(creatorId, 'chat.sent', {
            '_id': req.body._id
            });
        } else {
          /* send notification to recipient */
          socket.notifyUser(recipients[i], 'chat.new', {
            'sender': creatorId,
            'message': message,
            'date': Date.now()
            });
        }
      }
      
      /* send response */
      res.status(200).json({'code': 0, 'error': null});
    });
    
})

/* save a new message to old chat */
router.post('/:creator([a-zA-Z0-9\-\_]+)/:chat_id([0-9\-\_]+)', function(req, res, next) {
    var User = require('../models/user'),
      Chat = require('../models/chat');
      
    var creatorId = req.params.creator;
    var chatId = req.params.chat_id;
    var message = typeof(req.body.message)!='undefined' ? req.body.message : null;
    
    /* save chat */
    console.log('Chat.addMessage() calling', [chatId, creatorId, message]);
    /*res.status(200).json({'code': 0, 'error': null});
    return;*/
    Chat.Model.addMessage(chatId, creatorId, message, function(err, recipients){
      if (err) {
        next(err);
        return;
      }
      
      /* throw notifications */
      for (i in recipients) {
        if (recipients[i]==creatorId) {
          /* send notification to sender */
          socket.notifyUser(creatorId, 'chat.sent', {
            '_id': req.body._id
            });
        } else {
          /* send notification to recipient */
          socket.notifyUser(recipients[i], 'chat.new', {
            'sender': creatorId,
            'message': message,
            'date': Date.now()
            });
        }
      }
      
      /* send response */
      res.status(200).json({'code': 0, 'error': null});
    });
})

/* list convesations for a user */
router.get('/:creator([a-zA-Z0-9\-\_]+)', function(req, res, next) {
    var User = require('../models/user'),
    Chat = require('../models/chat'),
    creator = req.params.creator,
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
      
      /*for (i = 0; i < len; i++) {
          contacts.push(chats[i].recipients);
          lastMesgArr[ chats[i].chat_id ] = chats[i].last_mesg;
      }
      User.find({}).select('username name location meta has_picture').in('username', contacts).exec(function(err, contacts){
          if (err) { return next(err); }
          return res.status(200).json({'code': 0, 'error': null, 'data':contacts, 'chats':lastMesgArr});
      })*/
    });
});

/* fetch a  conversation history */
router.get('/:creator([a-zA-Z0-9\-\_]+)/:chat_id([0-9\-\_]+)', function(req, res, next) {
    var User = require('../models/user'),
    Chat = require('../models/chat')
    creator = req.params.creator,
    chatId = req.params.chat_id;
    
    Chat.Model.findOne({'recipients':creator,'chat_id':chatId}, function(err, chat) {
      if (err) { next(err); return; }
      else if ( chat==null ) { res.status(404).json({'code': 404, 'error': 'No records found.'}); return; }
      Chat.MesgModel.find({'chat_id': chatId}, function(err, messages){
        if (err) { next(err); return; }
        res.status(200).json({
          'history': messages,
          'chat': chat
          });
        });
      
    });
});

/* delete a conversation history */
router.delete('/:creator([a-zA-Z0-9\-\_]+)/:chat_id([0-9\-\_]+)', function(req, res, next) {
    var User = require('../models/user'),
    Chat = require('../models/chat')
    creator = req.params.creator,
    chatId = req.params.chat_id;
    
    Chat.Model.removeRecipient(chatId, creator, function(err, chat) {
      if (err) { next(err); return; }
      res.status(200).json({'code': 0, 'error': null});
    });
});

/* delete a single message */
router.delete('/:creator([a-zA-Z0-9\-\_]+)/:chat_id([0-9\-\_]+)/:id', function(req, res, next) {
  var User = require('../models/user'),
    Chat = require('../models/chat')
    creator = req.params.creator,
    chatId = req.params.chat_id,
    chatMesgId = req.params.id;
  
  Chat.MesgModel.remove({'creator_id':creator,'chat_id':chatId,'_id':chatMesgId}, function(err, chat) {
    if (err) { next(err); return; }
    res.status(200).json({'code': 0, 'error': null});
  })
  
});

return router;
}