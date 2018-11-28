var config = {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};
var global = {
  playerSpeed: 150,
  wallDelay: 7,
  wallRadius: 8,
  playerRadius: 5,
  pause: true,
  ready: false
}

var game = new Phaser.Game(config);

function preload()
{
  this.load.image('player', 'assets/player.png');
  this.load.image('wall', 'assets/wall-circle.png');
}

function create()
{
  var self = this;
  this.disableVisibilityChange = true;
  global.socket = this.socket = io();
  global.walls = this.walls = this.physics.add.staticGroup();
  global.otherPlayers = this.physics.add.group();

  /* Recv all the players in the game from the server, place them in the start position */
  this.socket.on('allPlayers', function (players) {
    /* clear walls */
    global.walls.clear(true, true);
    for (let id in players) {
      if (id == global.socket.id) {
        addMyself(self, players[id]);
      } else {
        addOtherPlayers(self, players[id]);
      }
    }
  });

  this.socket.on('namePlayers', function (players) {
    /* clear walls */
    global.walls.clear(true, true);
    global.otherPlayers.getChildren().forEach(function (otherPlayer) {
      otherPlayer.name = players[otherPlayer.playerId].name
    });
    console.log(global.otherPlayers);
  });

  this.socket.on('disconnect', function (playerId) {
    global.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerId === otherPlayer.playerId) {
        console.log(`Player ${playerId} disconnected`);
        otherPlayer.destroy();
      }
    });
  });

  this.socket.on('areYouReady', function () {
    if (global.ready === true) {
      document.querySelector('.modal').style.display = 'none';
      global.myName = document.getElementById('name').value;
      self.socket.emit('ready', global.myName);
    }
  });

  /* Recv position for all the players in the game, update their positions */
  this.socket.on('tick', function (players) {
    let playersLeft = 0;
    for (let id in players) {
      playersLeft++;
      global.winnerID = id;
      if (id == global.socket) {
        continue;
      }
      global.otherPlayers.getChildren().forEach(function (otherPlayer) {
        if (id === otherPlayer.playerId) {
          otherPlayer.setRotation(players[id].rotation);
          otherPlayer.setPosition(players[id].x, players[id].y);
          placeWall(otherPlayer);
        }
      });
    };

    if (playersLeft == 1 && !global.pause) {
      console.log("Winner ID: " + global.winnerID);
      let winnerName;
      global.otherPlayers.getChildren().forEach(function (otherPlayer) {
        if (global.winnerID === otherPlayer.playerId) {
          winnerName = players[global.winnerID].name;
        }
      });

      document.getElementById('winner-modal').style.display = 'grid';
      if (winnerName === undefined) {
        document.getElementById('winner').innerHTML = "You won!!";
        /* TODO give winner opportunity to play again */
      } else {
        document.getElementById('winner').innerHTML = `The winner is ${winnerName}`;
      }
    }
  });

  this.socket.on('gameReady', function () {
    /* The game is ready. Players can now say that they are ready. When all players say this, game starts */
    document.getElementById('ready-btn').disabled = false;
  });

  this.socket.on('pause', function (value) {
    global.pause = value;
  });

  this.cursors = this.input.keyboard.createCursorKeys();
}

function update()
{
  if (!ship || global.pause || ship.dead === true) {
    return;
  }
  
  this.physics.add.overlap(ship, global.walls, hitWall, null, this);

  /* clamp player position - for now  */
  if (ship.x < 0 || ship.x > config.width) {
    let diff = ship.x - config.width/2
    ship.x -= 2*diff;
  }
  if (ship.y < 0 || ship.y > config.height) {
    let diff = ship.y - config.height/2
    ship.y -= 2*diff;
  }

  /* emit player movement */
  const shipState = { x: ship.x, y: ship.y, rotation: ship.rotation, color: ship.color };
  this.socket.emit('playerMovement', shipState);

  /* place the wall far enough behind the player to prevent collision */
  placeWall(ship);

  if (this.cursors.left.isDown) {
    ship.setAngularVelocity(-global.playerSpeed);
  } else if (this.cursors.right.isDown) {
    ship.setAngularVelocity(global.playerSpeed);
  } else {
    ship.setAngularVelocity(0);
  }
  const direction = ship.body.velocity;
  this.physics.velocityFromRotation(ship.rotation, global.playerSpeed, direction);
}

var ship;
function addMyself(self, playerInfo) {
  /*  Don't add myself twice */
  if (global.ship) {return;}

  ship = global.ship = self.ship = self.physics.add.image(playerInfo.x, playerInfo.y, 'player').setOrigin(0.5, 0.5);
  ship.color = playerInfo.color;
  ship.dead = false;
  ship.setDrag(100);

  ship.setTint(ship.color);

  /* fill the wallPositions array  with wallDelay cruft values, so that we don't place a wall on top of ourselves and collide with it */
  ship.wallPosition = new Array(global.wallDelay).fill({x: -100, y: -100});

  /* set the collision body of this dude to a circle of radius 8 */
  ship.setCircle(global.playerRadius);
}

function addOtherPlayers(self, playerInfo) {
  /* Don't add other player twice */
  for (let id in global.players) {
    if (id === playerInfo.playerId) {
      console.log("player already added");
      return;
    }
  }

  /* create other player object */
  let otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'player').setOrigin(0.5, 0.5).setTint(playerInfo.color);

  /* update it with the playerInfo details passed in */
  otherPlayer.color = playerInfo.color;
  otherPlayer.playerId = playerInfo.playerId;
  otherPlayer.rotation = playerInfo.rotation;
  otherPlayer.x = playerInfo.x;
  otherPlayer.y = playerInfo.y;
  /* allow other player to place walls */
  otherPlayer.wallPosition = new Array(global.wallDelay + 10).fill({x: -100, y: -100});

  /* add otherPlayer to the "otherPlayers" physics group */
  global.otherPlayers.add(otherPlayer);
}

function hitWall() {
  global.socket.emit('playerDied');
  ship.dead = true;
  ship.disableBody(true, false);
  /* TODO play death animation/sound */
  console.log("Collision");
}

function placeWall(ship) {
  /* add to the start of the array (unshift), and pop off of the back */
  ship.wallPosition.unshift({x: ship.x, y: ship.y});
  const pos = ship.wallPosition.pop();

  /* place a new wall at the old position of the ship */
  global.walls.create(pos.x, pos.y, 'wall')
      .setTint(ship.color)
      .setCircle(global.wallRadius);
}