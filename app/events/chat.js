module.exports = function(emitter, socket){
    
    emitter.on('chat.save', function(recipients, id, messageObject){
        var creatorId = null,
         message = null,
         createdDate = null;
        for (var i in recipients) {
            creatorId = messageObject ['creator_id'];
            message = messageObject ['message'];
            createdDate = messageObject ['created_at'];
            if (recipients[i] === creatorId) {
              /* send notification to sender */
              socket.notifyUser(recipients[i], 'chat.sent', {
                '_id': id
                });
            } else {
              /* send notification to recipient */
              socket.notifyUser(recipients[i], 'chat.new', {
                'sender': creatorId,
                'message': message,
                'date': createdDate
                });
            }
        }
        });
    
    return emitter;
}