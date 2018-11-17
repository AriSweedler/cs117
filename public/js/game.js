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

var game = new Phaser.Game(config);

function preload()
{
  this.load.image('ship', 'assets/ship.png');
  this.load.image('wall', 'assets/yellow.png');
}

function create()
{
  var self = this;
  this.disableVisibilityChange = true;
  this.socket = io();
  this.otherPlayers = this.physics.add.group();
  this.walls = this.physics.add.staticGroup();

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
        self.walls.create(playerInfo.x, playerInfo.y, 'wall');
      }
    });

  });

  this.cursors = this.input.keyboard.createCursorKeys();
}

function update()
{
  if (!this.ship || this.ship.dead === true) {
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
  if (playerInfo.team === 'blue') {
    self.ship.setTint(0x0000ff);
  } else {
    self.ship.setTint(0xff0000);
  }
  self.ship.setDrag(100);
  self.ship.setAngularDrag(100);
  self.ship.dead = false;
}

function addOtherPlayers(self, playerInfo) {
  const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'ship').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
  if (playerInfo.team === 'blue') {
    otherPlayer.setTint(0x0000ff);
  } else {
    otherPlayer.setTint(0xff0000);
  }
  otherPlayer.playerId = playerInfo.playerId;
  self.otherPlayers.add(otherPlayer);
}

function hitWall() {
  self.ship.dead = true;
  /* play death animation */
  console.log("Collision");
}