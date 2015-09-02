module.exports = function(emitter, socket){
    
    emitter.on('chat.save', function(recipients, options){
        var creatorId = null,
         message = null,
         createdDate = null,
         chatId = null;
        for (var i in recipients) {
            creatorId = options.messageObject.creator_id;
            message = options.messageObject.message;
            createdDate = options.messageObject.created_at;
            chatId = options.chatId;
            if (recipients[i] === creatorId) {
              /* send notification to sender */
              socket.notifyUser(recipients[i], 'chat.sent', {
                '_id': options.messageId,
                'chatId': options.chatId,
                });
            } else {
              /* send notification to recipient */
              socket.notifyUser(recipients[i], 'chat.new', {
                'chatId': chatId,
                'sender': creatorId,
                'message': message,
                'date': createdDate
                });
            }
        }
        });
    
    return emitter;
}