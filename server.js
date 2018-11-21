const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io').listen(server);
const players = {};
const global = {
  playersNeeded: 3
}
app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  console.log('a user connected');
  addPlayer(socket.id);

  // send the players object to the new player
  socket.emit('currentPlayers', players);
  // update all other players of the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);

  socket.on('disconnect', function () {
    console.log('user disconnected');
    // remove this player from our players object
    delete players[socket.id];

    // emit a message to all players to remove this player
    io.emit('disconnect', socket.id);

    if (numPlayers() < global.playersNeeded) {
      console.log("Pausing game");
      socket.broadcast.emit('pause', {pause: true});
    }
  });

  socket.on('playerDied', function () {
    // console.log('player hit a wall! Too bad.');
    // remove this player from our players object
    delete players[socket.id];
  });

  // when a player moves, update the player data
  socket.on('playerMovement', function (playerData) {
    players[socket.id] = {...playerData};
    // emit a message to all players about the player that moved
    socket.broadcast.emit('playerMoved', players[socket.id]);
  });

  /* when there're 3 players, let them start the game */
  const numPlayers = () => Object.keys(players).length;
  if (numPlayers() >= global.playersNeeded) {
    setTimeout(() => {socket.broadcast.emit('pause', {pause: false});}, 2000);
    console.log("Game is ready to start!");
  }

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
