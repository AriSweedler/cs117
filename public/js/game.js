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
  },
  speed: 150
};
var global = {}

var game = new Phaser.Game(config);

function preload()
{
  this.load.image('ship', 'assets/ship.png');
  this.load.image('wall', 'assets/white.png');
}

function create()
{
  var self = this;
  this.disableVisibilityChange = true;
  global.socket = this.socket = io();
  global.walls = this.walls = this.physics.add.staticGroup();
  global.myWalls = this.myWalls = this.physics.add.staticGroup();
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
        self.walls.create(playerInfo.x, playerInfo.y, 'wall')//.setDisplaySize(10, 10);
      }
    });
  });

  this.cursors = this.input.keyboard.createCursorKeys();
}

function update()
{
  if (!this.ship || global.dead === true) {
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

  // emit player movement
  var x = this.ship.x;
  var y = this.ship.y;
  var r = this.ship.rotation;
  if (this.ship.oldPosition && (x !== this.ship.oldPosition.x || y !== this.ship.oldPosition.y || r !== this.ship.oldPosition.rotation)) {
    this.socket.emit('playerMovement', { x: this.ship.x, y: this.ship.y, rotation: this.ship.rotation });
    let wall = global.myWalls.create(x, y, 'wall')
    // wall.setDisplaySize(10, 10);
    wall.setTint(global.color);
  }

  // save old position data
  this.ship.oldPosition = {
    x: this.ship.x,
    y: this.ship.y,
    rotation: this.ship.rotation
  };

  if (this.cursors.left.isDown) {
    this.ship.setAngularVelocity(-config.speed);
  } else if (this.cursors.right.isDown) {
    this.ship.setAngularVelocity(config.speed);
  } else {
    this.ship.setAngularVelocity(0);
  }
  this.physics.velocityFromRotation(this.ship.rotation + 1.5, config.speed, this.ship.body.velocity);
}

function addPlayer(self, playerInfo) {
  self.ship = self.physics.add.image(playerInfo.x, playerInfo.y, 'ship').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
  self.ship.setTint(playerInfo.color);
  self.ship.setDrag(100);
  self.ship.setAngularDrag(100);
  global.ship = self.ship;
  global.dead = false;
  global.color = playerInfo.color;
}

function addOtherPlayers(self, playerInfo) {
  const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'ship').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
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