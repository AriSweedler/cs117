// import Game from './state/Game';

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

const game = new Phaser.Game(config);

function preload ()
{  
  this.load.image('dot', 'assets/dot.png');
}

const cursor = null;
let player = null;
function create ()
{
  cursors = this.input.keyboard.createCursorKeys();
  player = this.physics.add.image(0, 0, 'dot');
}

function update ()
{
  let left = cursors.left.isDown;
  let right = cursors.right.isDown;

  if (left) {
    player.setVelocityX(-160);
  }

  if (right) {
    player.setVelocityX(160);
  }

  if (!left && !right) {
    player.setVelocityX(0);
  }
}