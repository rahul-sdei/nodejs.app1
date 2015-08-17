var socket = {};
socket['on'] = false;

socket['connect'] = function(user) {
  if ( socket['on'] !==false ) { return; }
  
  if ( typeof(io) === 'undefined' ) {
    console.log('Couldn\'t connect io.socket');
    return ;
  }
  
  console.log('Connect io.socket: ', app.baseUrl);
  
  var session = io.connect(app.baseUrl);
  session.on('connect', function() {
    socket['on'] = true;
    session.emit('login', { 'uname': user['uname'] });
  });
  
  session.on('flash', function(message){
    console.log(message);
  });
  
  session.on('chat', function(data){
    console.log(data);
    newMessage(data);
  });
};
