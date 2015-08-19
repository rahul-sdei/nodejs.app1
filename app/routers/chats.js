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
  
  Chat.Model.find(where).select('creator_id recipient_id').skip(offset).limit(limit).sort('-creator_id').exec(function(err, chats) {
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

/* start a new chat, or save new message */
router.post('/', function(req, res, next) {
    var User = require('../models/user'),
      Chat = require('../models/chat');
      
    var creator_id = typeof(req.body.creator)!='undefined' ? req.body.creator : null;
    var recipient_id = typeof(req.body.recipient)!='undefined' ? req.body.recipient : null;
    var message = typeof(req.body.message)!='undefined' ? req.body.message : null;
    
    /* save chat */
    Chat.Model.sendChat(creator_id, creator_id, recipient_id, message, next); // for sender
    Chat.Model.sendChat(creator_id, recipient_id, creator_id, message, next); // for recipient
    
    /* send notification to recipient */
    socket.notifyUser(recipient_id, 'chat.new', { 'sender': creator_id, 'message': message, 'date': Date.now() });
    /* send notification to sender */
    socket.notifyUser(creator_id, 'chat.sent', {
      '_id': req.body._id
      });
    
    /* send response */
    res.status(200).json({'code': 0, 'error': null});
})

/* list convesations for a user */
router.get('/:creator([a-zA-Z0-9\-\_]+)', function(req, res, next) {
    var User = require('../models/user'),
    Chat = require('../models/chat'),
    creator = req.params.creator,
    i, len=0, contacts=[],
    lastMesg={};
    
    Chat.Model.find({'creator_id':creator}, 'creator_id recipient_id last_mesg', function(err, chats) {
      if (err) { return next(err); }
      if (Array.isArray(chats)) { len = chats.length; } 
      else { res.status(200).json({'code': 0, 'error': null}); return; }
      for (i = 0; i < len; i++) {
          contacts.push(chats[i].recipient_id);
          lastMesg[ chats[i].recipient_id ] = chats[i].last_mesg;
      }
      User.find({}).select('username name location meta has_picture').in('username', contacts).exec(function(err, contacts){
          if (err) { return next(err); }
          return res.status(200).json({'code': 0, 'error': null, 'data':contacts, 'chats':lastMesg});
      })
    });
});

/* fetch a  conversation history */
router.get('/:creator([a-zA-Z0-9\-\_]+)/:recipient([a-zA-Z0-9\-\_]+)', function(req, res, next) {
    var User = require('../models/user'),
    Chat = require('../models/chat')
    creator = req.params.creator,
    recipient = req.params.recipient;
    Chat.Model.findOne({'creator_id':creator,'recipient_id':recipient}, function(err, chat) {
      if (err) { return next(err); }
      else if ( chat==null ) { res.status(404).json({'code': 404, 'error': 'No records found.'}); return; }
      res.status(200).json(chat.messages);
    });
});

/* delete a conversation history */
router.delete('/:creator([a-zA-Z0-9\-\_]+)/:recipient([a-zA-Z0-9\-\_]+)', function(req, res, next) {
    var User = require('../models/user'),
    Chat = require('../models/chat')
    creator = req.params.creator,
    recipient = req.params.recipient;
    Chat.Model.findOne({'creator_id':creator,'recipient_id':recipient}, function(err, chat) {
      if (err) { return next(err); }
      else if ( chat==null ) { res.status(404).json({'code': 404, 'error': 'No records found.'}); return; }
      chat.remove(function(err){
          if ( err ) { return next(err); }
          res.status(200).json({'code': 0, 'error': null});
      })
    });
});

/* delete a single message */
router.delete('/:creator([a-zA-Z0-9\-\_]+)/:recipient([a-zA-Z0-9\-\_]+)/:id', function(req, res, next) {
  var User = require('../models/user'),
    Chat = require('../models/chat')
    creator = req.params.creator,
    recipient = req.params.recipient,
    chatMesgId = req.params.id;
  
  Chat.Model.findOne({'creator_id':creator,'recipient_id':recipient}, function(err, chat) {
    if (err) { return next(err); }
    else if ( chat==null ) { res.status(404).json({'code': 404, 'error': 'No records found.'}); return; }
    var chatMesg = chat.messages.id(chatMesgId);
    if ( chatMesg == null ) { res.status(404).json({'code': 404, 'error': 'No records found.'}); return; }
    chatMesg.remove();
    chat.save(function(err) {
      if (err) { return next(err); }
      res.status(200).json({'code': 0, 'error': null});
    });
  })
  
});

return router;
}