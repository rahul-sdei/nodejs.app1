var express = require('express'),
  io = null,
  users = {},
  clients = {};

var Socket = {
    
  'connect': function(server) {
    io = require('socket.io').listen(server);
    io.sockets.on('connection', function (socket) {
      console.log('New connection');
      socket.on('login', function(user){
        var username = user.uname;
        socket.username = username;
        // add the client's username to the global list
        if (typeof(users[username])=='undefined') {
          users[username] = [];
        }
        users[username].push(socket.id);
        // add socket reference to global list
        clients[socket.id] = socket;
        // echo to client they've connected
        socket.emit('flash', username + ', you are connected.');
        console.log('Connected: ' + username + ' on ' + socket.id);
      });
    });
  },
  
  'notifyUser': function (uname, event, data) {
    var recipients = null;
    for(var key in users) {
      if(key === uname) {
        recipients = users[key];
        break;
      }
    }
    if ( recipients === null ) { return; }
    
    for(var i = 0; i < recipients.length; i++) {
    try{
    var socket_id = recipients[i];
    console.log('Push to socket-id: ' + socket_id);
    clients[socket_id].emit(event, data);
    } catch (err) {
    console.log(err);
    }
    }
  },

}

module.exports = Socket;