var express = require('express'),
    app = express(),
    server = app.listen(process.env.PORT || 3000),
    io = require('socket.io').listen(server);
var gamejs = require('./game.js');

var Game = gamejs.Game;
var game = new Game();

io.configure(function () {
  io.enable('browser client minification');
  io.enable('browser client etag');
  io.enable('browser client gzip');
  io.set('log level', 1);
  io.set('transports', ['xhr-polling']);
  io.set('polling duration', 10);
});

io.sockets.on('connection', function (socket) {
  console.log('JOINED');
  var playerName = "player" + game.numPlayers; // bind player name to this socket
  
  if (game.numPlayers > 0) {
    socket.emit('state', game.getState());
  }
  
  var x = 201;
  var y = 311;
  
  game.join(playerName, x, y);
  
  socket.broadcast.emit('join', { name: playerName, x: x, y: y });
  
  socket.on('move', function (data) {
    game.move(playerName, data.x, data.y, data.crouch);
    data.name = playerName;
    socket.broadcast.emit('move', data);
  });
  
  socket.on('disconnect', function () {
    console.log('LEFT');
    game.leave(playerName);
    socket.broadcast.emit('leave', playerName);
  });
});

app.configure(function () {
  app.use(express.static(__dirname + '/public'));
});


