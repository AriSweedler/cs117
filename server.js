const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io').listen(server);
const players = {};
const numPlayers = () => Object.keys(players).length;
const global = {
  playersNeeded: 3
}

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('a user connected');
  addPlayer(socket.id);

  setTimeout(()=>{return null}, 1000);

  // send the players object to all players
  io.sockets.emit('allPlayers', players);
  // socket.broadcast.emit('allPlayers', players);

  socket.on('disconnect', function () {
    console.log('user disconnected');
    // remove this player from our players object
    delete players[socket.id];

    // emit a message to all players to remove this player
    io.emit('disconnect', socket.id);
  });

  socket.on('playerDied', function () {
    // console.log('player hit a wall! Too bad.');
    // remove this player from our players object, so we don't update dead player state
    delete players[socket.id];
  });

  // when a player moves, update the player data
  socket.on('playerMovement', function (playerData) {
    players[socket.id] = {...playerData};
  });

  /* Send a 'tick' update to all players 60 times a second */
  const loop = () => {
    setTimeout(() => {
      socket.broadcast.emit('tick', players);
      loop();
    }, 1000/60);
  }
  loop();
  

});

function getRandom(range) {
  const padding = 0.1 * range;
  const randRange = range - 2*padding
  return Math.floor(Math.random() * randRange) + padding;
}

// create a new player and add it to our players object
function addPlayer(playerId) {
  players[playerId] = {
    rotation: getRandom(2*Math.PI),
    x: getRandom(800),
    y: getRandom(600),
    playerId: playerId,
    color: (Math.floor(Math.random() * 2) == 0) ? 0xff0000 : 0x0000ff
  };
}

const PORT = 8000;
server.listen(PORT, function () {
  console.log(`Listening on ${server.address().port}`);
});
