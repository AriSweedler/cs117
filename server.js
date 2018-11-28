const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io').listen(server);
var players = {};
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
  const checkReadyLoop = () => {
    setTimeout(() => {
      io.emit('areYouReady', null);
      console.log("readyTICK");
      if (global.pause) {
        checkReadyLoop();
      }
    }, 1000);
  }
  const loop = () => {
    setTimeout(() => {
      io.emit('tick', players);
      loop();
    }, 1000/60);
  }

  console.log('a user connected');
  addPlayer(socket.id);

  // send the players object to all players
  io.sockets.emit('allPlayers', players);
  if (numPlayers() >= global.playersNeeded) {
    io.sockets.emit('gameReady', players);
    checkReadyLoop();
  }

  socket.on('ready', function(name) {
    if (!players[socket.id]) {
      console.log("adding player based on ready signal");
      addPlayer(socket.id);
      io.sockets.emit('allPlayers', players);
    }

    if (players[socket.id].ready) {
      return;
    }

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

    io.sockets.emit('gameReady', players);
  });

  socket.on('disconnect', function () {
    console.log('user disconnected');
    // remove this player from our players object
    delete players[socket.id];

    // emit a message to all players to remove this player
    io.emit('disconnect', socket.id);

    /* If there're 0 players left, then set game to new game state */
    if (numPlayers() === 0) {
      prepareNewGame();
    }
  });

  socket.on('playerDied', function () {
    // console.log('player hit a wall! Too bad.');
    // remove this player from our players object, so we don't update dead player state
    delete players[socket.id];
  });

  socket.on('clientNewGame', function() {
    console.log("Winner wants to play a new game");
    io.sockets.emit('serverNewGame', false);
    /* wait until we have enough people, then let players say they're ready */
    global.pause = true;
    players = {};

    /* Ask all clients if they're ready */
    checkReadyLoop();
  });

  // when a player moves, update the player data
  socket.on('playerMovement', function (playerData) {
    players[socket.id].x = playerData.x;
    players[socket.id].y = playerData.y;
    players[socket.id].rotation = playerData.rotation;
  });

  /* Send a 'tick' update to all players 60 times a second */
  checkReadyLoop();
  loop();
});

function getRandom(range) {
  const padding = 0.1 * range;
  const randRange = range - 2*padding
  return Math.floor(Math.random() * randRange) + padding;
}

function getRandomColor() {
  return (Math.random()*0xFFFFFF);
}

// create a new player and add it to our players object
function addPlayer(playerId) {
  players[playerId] = {
    rotation: getRandom(2*Math.PI),
    x: getRandom(800),
    y: getRandom(600),
    playerId: playerId,
    ready: false,
    color: getRandomColor(),
  };
}

function prepareNewGame() {
  players = {};
  global.pause = true;
}

const PORT = process.env.PORT || 8000;
server.listen(PORT, function () {
  console.log(`Listening on ${server.address().port}`);
});
