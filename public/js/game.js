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
  wallDelay: 10,
  wallRadius: 8,
  playerRadius: 5,
  pause: true
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
  this.otherPlayers = this.physics.add.group();

  this.socket.on('currentPlayers', function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        addPlayer(self, players[id]);
        self.physics.add.overlap(self.ship, self.walls, hitWall, null, this);
      } else {
        addOtherPlayers(self, players[id]);
      }
    });
  });

  this.socket.on('pause', function (gameState) {
    global.pause = gameState.pause;
  });

  this.socket.on('newPlayer', function (playerInfo) {
    addOtherPlayers(self, playerInfo);
  });

  this.socket.on('disconnect', function (playerId) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerId === otherPlayer.playerId) {
        otherPlayer.destroy();
      }
    });
    
  });

  this.socket.on('playerMoved', function (playerInfo) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerInfo.playerId === otherPlayer.playerId) {
        otherPlayer.setRotation(playerInfo.rotation);
        otherPlayer.setPosition(playerInfo.x, playerInfo.y);
        const wall = self.walls.create(playerInfo.x, playerInfo.y, 'wall')
            .setTint(playerInfo.color)
            .setCircle(global.wallRadius);
      }
    });
  });

  this.cursors = this.input.keyboard.createCursorKeys();
}

function update()
{
  if (!this.ship || global.pause || global.dead === true) {
    return;
  }

  /* clamp player position - for now  */
  if (this.ship.x < 0 || this.ship.x > config.width) {
    let diff = this.ship.x - config.width/2
    this.ship.x -= 2*diff;
  }
  if (this.ship.y < 0 || this.ship.y > config.height) {
    let diff = this.ship.y - config.height/2
    this.ship.y -= 2*diff;
  }

  /* emit player movement */
  const shipState = { x: this.ship.x, y: this.ship.y, rotation: this.ship.rotation, color: global.color };
  this.socket.emit('playerMovement', shipState);

  /* place the wall far enough behind the player to prevent collision */
  placeWall(this.ship);

  if (this.cursors.left.isDown) {
    this.ship.setAngularVelocity(-global.playerSpeed);
  } else if (this.cursors.right.isDown) {
    this.ship.setAngularVelocity(global.playerSpeed);
  } else {
    this.ship.setAngularVelocity(0);
  }
  const direction = this.ship.body.velocity;
  this.physics.velocityFromRotation(this.ship.rotation, global.playerSpeed, direction);
}

function addPlayer(self, playerInfo) {
  self.ship = self.physics.add.image(playerInfo.x, playerInfo.y, 'player').setOrigin(0.5, 0.5);
  self.ship.setTint(playerInfo.color);
  self.ship.setDrag(100);
  self.ship.setAngularDrag(100);
  self.ship.oldPosition = new Array(global.wallDelay).fill({x: -100, y: -100});
  /* set the collision body of this dude to a circle of radius 8 */
  self.ship.setCircle(global.playerRadius);
  global.ship = self.ship;
  global.dead = false;
  global.color = playerInfo.color;
}

function addOtherPlayers(self, playerInfo) {
  const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'player').setOrigin(0.5, 0.5);
  otherPlayer.playerId = playerInfo.playerId;
  otherPlayer.setTint(playerInfo.color);
  self.otherPlayers.add(otherPlayer);
}

function hitWall() {
  global.socket.emit('playerDied');
  global.dead = true;
  global.ship.disableBody(true, false);
  /* play death animation */
  console.log("Collision");
}

function placeWall(ship) {
  /* add to the start of the array */
  ship.oldPosition.unshift({x: ship.x, y: ship.y});
  /* pop off the back */
  const oldPos = ship.oldPosition.pop();

  /* place a new wall at the old position of the ship */
  let wall = global.walls.create(oldPos.x, oldPos.y, 'wall')
      .setTint(global.color)
      .setCircle(global.wallRadius);
}