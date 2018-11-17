# CS 117 final project

We will be making a networked version of Achtung die curve

## Resources we used as guides in making this game:

* A Javascript implementatino of [achtung-die-kurve](https://github.com/stravid/achtung-die-kurve)

* A [simple game](https://codeburst.io/how-to-make-a-simple-multiplayer-online-car-game-with-javascript-89d47908f995) using Sockets.io + Phaser
  * Also used it to help decide where state would live in our client/server system
  * It was written by a really competent web developer, so it was kinda tough to understand
  * Webpack makes config complicated. Lots of folders are weird.
  * After seeing that this used outdated version of the phaser library, I searched for a phaser3 tutorial.
 
* Another look at a similar application as above - but [simplified](https://gamedevacademy.org/create-a-basic-multiplayer-game-in-phaser-3-with-socket-io-part-1/)
  * It was nice to see how they differed, it let us know what things we could experiment and when we shouldn't mess with stuff.
  * Also, not having webpack made everything in this project a lot simpler to configure initially, but more of a pain to develop.
  
  
## Most important tools used

* [Node.js](https://nodejs.org/en/), an environment for running JavaScript outside of your browser. Used to "write" our server. (Used to include a JavaScript server then serve it)

* [Phaser](https://phaser.io/), a JavaScript library containing all sorts of useful stuff for making games in the browser

* [Sockets.io](https://socket.io/), a JavaScript library that makes network communication suuuuuper easy. Suuuuper rad.
  

## Installation

### short version
1. clone this repo
1. `npm install`
1. `npm start`

### long version

1. Make sure you have [Node.js](https://nodejs.org/en/) installed on your machine.
    1. We use a Node to help us manage dependencies and to 

1. Clone this repo, and enter the directory
    1. `git clone git@github.com:AriSweedler/cs117.git && cd cs117`

1. Install all the node modules
    1. `npm install`
    1. Node knows which packages you need to install because of the package.json file in your pwd.

1. Serve the game using a local server that we launch using a script
    1. `npm start`
    1. Node knows what script to run to launch the server because of the package.json file in your pwd.
  
1. Open https://localhost:8000 on your machine to query the server you just launched.
    1. If you know your local IP address, then anyone on your local network can see your server, and they'll be able to connect to your game by visiting https://<YOUR LOCAL IP ADDRESS>:8000
        1. Find your local IP address: `ifconfig | awk '/inet (10|172|192)/ {print $2;}'`
        1. If that doesn't work: `ifconfig` and sort through all the cruft
    1. If you have no friends, then you can open up multiple instances of the  game in a new browser/browser tab/browser window.
