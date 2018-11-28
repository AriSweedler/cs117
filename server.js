const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io').listen(server);
const players = {};
const numPlayers = () => Object.keys(players).length;
const global = {
  playersNeeded: 2,
  pause: true
}

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('a user connected');
  addPlayer(socket.id);

  // send the players object to all players
  io.sockets.emit('allPlayers', players);
  if (numPlayers() >= global.playersNeeded) {
    io.sockets.emit('gameReady', players);
  }

  socket.on('ready', function(name) {
    players[socket.id].ready = true;
    players[socket.id].name = name;
    let playersReady = 0;
    for (let id in players) {
      playersReady += players[id].ready?1:0;
    }

    if (playersReady >= global.playersNeeded && global.pause) {
      console.log("START");
      io.sockets.emit('namePlayers', players);
      global.pause = false;
      io.sockets.emit('pause', false);
    }
  });

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
    players[socket.id].x = playerData.x;
    players[socket.id].y = playerData.y;
    players[socket.id].rotation = playerData.rotation;
  });

    /* Send a 'tick' update to all players 60 times a second */
    const checkReadyLoop = () => {
      setTimeout(() => {
        io.emit('areYouReady', null);
        if (global.pause) {
          checkReadyLoop();
        }
      }, 1000);
    }
    checkReadyLoop();
  
    const loop = () => {
      setTimeout(() => {
        io.emit('tick', players);
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
    ready: false,
    color: (Math.floor(Math.random() * 2) == 0) ? 0xff0000 : 0x0000ff,
    name: "bob"
  };
}

const PORT = 80;
server.listen(PORT, function () {
  console.log(`Listening on ${server.address().port}`);
});
