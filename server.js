var http = require('http');
var url = require('url');
var fs = require('fs');

var server = http.createServer(function(request, response){
console.log('Connection');
var path = url.parse(request.url).pathname;

switch(path){
 case '/':
  response.writeHead(200, {'Content-Type': 'text/html'});
  response.write('Hello World!');
  break;
 case '/socket.html':
  console.log('Reading filename: ' + __dirname + path + ' ...');
  fs.readFile(__dirname + path, 'utf8', function(error, data){
  if(error){
   console.log('File reading error: '+error+' ...');
   response.writeHead(404);
   response.write('Opps ' + path + ' doesn\'t exist - 404');
   } else {
   console.log('File reading finished ...');
   response.writeHead(200, {'Content-Type': 'text/html'});
   response.write(data);
   }
  response.end();
  });
  break;
 default:
  response.writeHead(404);
  response.write('Opps ' + path + ' doesn\'t exist - 404');
  break;
}
});

server.listen(8001);
var io = require('socket.io').listen(server);
io.sockets.on('connection', function(socket){
 socket.emit('message', {'message': 'Hello world!'});
 setInterval(function(){
  socket.emit('date', {'date': new Date()});
  },1000);
 socket.on('chat', function(data){
  console.log('New chat mesg: ' + data.mesg + ' ...');
  io.sockets.emit('mesg', {'mesg': data.mesg});
  })
});
