document.addEventListener('DOMContentLoaded', function() {

    window.requestAnimFrame = (function(){
        return  window.requestAnimationFrame       ||
                        window.webkitRequestAnimationFrame ||
                        window.mozRequestAnimationFrame    ||
                        window.oRequestAnimationFrame      ||
                        window.msRequestAnimationFrame     ||
                        function(/* function */ callback, /* DOMElement */ element){
                            window.setTimeout(callback, 1000 / 60);
                        };
    })();

    var socket = io.connect();

    window.onbeforeunload = function() {
      socket.disconnect();
    };

    var map = [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,2],
        [0,0,1,0,1,1,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
        [1,0,0,0,0,0,0,0,1,1,0,0,0,1,1,1,1,0,0,0],
        [0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],
        [0,0,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,2,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0],
        [0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0],
        [0,0,0,0,0,0,1,1,1,1,1,1,1,0,1,0,0,1,1,1]
    ];

    var tileSize = 25;

    var c = document.getElementById('c');
    var ctx = c.getContext('2d');

    var p = document.getElementById('p');
    var ctx2 = p.getContext('2d');

    c.w = c.width;
    c.h = c.height;

    function drawMap() {
        ctx.fillStyle = "rgb(250, 245, 245)";
        ctx.fillRect(0,0,c.w,c.h);
        for(var row = 0; row <= 14; row++) {
            for (var col = 0; col <= 19; col++) {
                var tile = map[row][col];

                if (tile == 1) {
                    ctx.fillStyle = "#333";
                    ctx.fillRect(col * tileSize + .5, row * tileSize, tileSize + .5, tileSize);
                } else if (tile == 0) {
//                    ctx.strokeStyle = "#ccc";
//                    ctx.strokeRect(col * tileSize + 1, row * tileSize + 1, tileSize, tileSize);
                } else if (tile == 2) {
                    ctx.strokeStyle = "#988";
                    ctx.strokeRect(col * tileSize, row * tileSize, tileSize + 1, tileSize);
                }

            }
        }
    }


    var player = new (function() {
        var width = 15;
        var height = 35; // make taller than tileSize

        this.left = false;
        this.right = false;
        this.down = false;

        this.speed = 4;
        this.gravity = .5;

        this.jumpStart = -6;
        this.jumpSpeed = 0;

        this.onGround = false;
        this.isCrouch = 0;

        this.onLadder = false;

        this.x = 201;
        this.y = 311;

        this.dx = 0;
        this.dy = 0;

        this.prev = { x: this.x, y: this.y, crouch: this.isCrouch };

        this.move = function() {
            /* velocity */
            if (this.right) {
                this.dx = this.speed;
            } else if (this.left) {
                this.dx = -this.speed;
            } else {
                this.dx = 0;
            }

            /* x collision detection */
            if (this.dx != 0) {
                if (getCorners(this.x + this.dx, this.y)) {
                    this.x += this.dx;
                } else {
                    if (this.dx < 0) { // left
                        this.x = Math.floor(this.x / tileSize) * tileSize + 1;
                    } else if (this.dx > 0) { // right
                        this.x = (Math.floor((this.x + this.speed) / tileSize) + 1) * tileSize - width;
                    }
                }

                this.onLadder = false;
            }

            /* jumping/falling */
            if (this.onGround) {
                if (this.up) {
                    this.jumpSpeed = this.jumpStart;
                    this.onGround = false;
                } else if (getCorners(this.x, this.y + 1)) {
                    this.jumpSpeed = 0;
                    this.onGround = false;
                }
            } else {
                this.jumpSpeed += this.gravity;

                /* limit falling speed */
                if (this.jumpSpeed > tileSize) {
                    this.jumpSpeed = tileSize;
                } else if (this.jumpSpeed < -tileSize) {
                    this.jumpSpeed = -tileSize;
                }

                /* do jump/fall, or collide */
                if (getCorners(this.x, this.y + this.jumpSpeed)) {
                    this.y += this.jumpSpeed;
                } else if (this.jumpSpeed < 0) { // upwards
                    this.y = Math.floor(this.y / tileSize) * tileSize;
                    this.jumpSpeed = 0;
                } else if (this.jumpSpeed > 0) { // downwards
                    if (getCorners(this.x, Math.floor((this.y + this.jumpSpeed) / tileSize) * tileSize + height)) {
                      this.y = Math.floor((this.y + this.jumpSpeed) / tileSize) * tileSize + height;
                    } else { // jumpspeed too much
                      while (getCorners(this.x, this.y + 1)) {
                        this.y++;
                      } 
                    }

                    this.onGround = true;
                }
            }

            /* crouching */
            if (this.down) {
                height = 25;
                this.speed = 1.5;
                this.isCrouch++;
            } else {
              this.speed = 2.5;
              if (getCorners(this.x, Math.floor((this.y + this.jumpSpeed) / tileSize) * tileSize - 10)) {
                height = 35;
                if (this.isCrouch > 0)
                  this.y -= 10;
                this.isCrouch = 0;
              }
            }
            if (this.isCrouch == 1)
                this.y += 10;

            /* ladders */
            if (isLadder(this.x + this.speed, this.y + this.jumpSpeed)) {
              if (this.up) {
                //
              }
            }
        };

        this.draw = function() {
            ctx2.clearRect(0, 0, p.width, p.height);
            ctx2.fillStyle = "#988";
            ctx2.fillRect(this.x, this.y, width, height);
        }

        this.update = function(crouch) {
            socket.emit('move', { x: this.x, y: this.y, crouch: crouch });

            this.prev = {
              x: this.x,
              y: this.y,
              crouch: crouch
            };
        }

        function getCorners(x, y) {
            var upY = Math.floor(y / tileSize);
            var downY = Math.floor((y + height - 1) / tileSize);
            var middleY = Math.floor((y + height / 2 - 1) / tileSize);
            var leftX = Math.floor(x / tileSize);
            var rightX = Math.floor((x + width - 1) / tileSize);

            if (upY < 0 || downY >= 15 || leftX < 0 || rightX >= 20) {
                    return false;
            }

            var ul = isWalkable(leftX, upY);
            var dl = isWalkable(leftX, downY);
            var ml = isWalkable(leftX, middleY);
            var ur = isWalkable(rightX, upY);
            var dr = isWalkable(rightX, downY);
            var mr = isWalkable(rightX, middleY);

            return ul && dl && ml && ur && dr && mr;
        };

        function isLadder() {
        }

        function isWalkable(x, y) {
            if (map[y][x] != 1) {
                return true;
            }   

            return false;
        }

    })();

    window.addEventListener('keydown', function(evt) {
        switch(evt.keyCode) {
            case 68: // d
                player.right = true;
                break;
            case 65: // a
                player.left = true;
                break;
            case 83: // s
                player.down = true;
                break;
            case 32: // space
                player.up = true;
                break;
        }
    }, true);

    window.addEventListener('keyup', function(evt) {
        switch(evt.keyCode) {
            case 68: // d
                player.right = false;
                break;
            case 65: // a
                player.left = false;
                break;
            case 83: // s
                player.down = false;
                break;
            case 32: // space
                player.up = false;
                break;
        }
    }, true);

    var users = [];

    function User (x, y, crouch) {
      this.x = x;
      this.y = y;
      this.w = 15;
      if (crouch) {
        this.h = 25;
      } else {
        this.h = 35;
      }
    }

    function drawUsers() {
      for (name in users) {
        ctx2.fillStyle = "#cbb";
        ctx2.fillRect(users[name].x, users[name].y, users[name].w, users[name].h);
      }
    }

    socket.on('join', function (data) {
      users[data.name] = new User(data.x, data.y, false);
    });

    socket.on('move', function (data) {
      users[data.name].x = data.x;
      users[data.name].y = data.y;
      if (data.crouch) {
        users[data.name].h = 25;
      } else {
        users[data.name].h = 35;
      }
    });

    socket.on('state', function (data) {
      for (name in data) {
        users[name] = new User(data[name].x, data[name].y, data[name].crouch);
      }
    });

    socket.on('leave', function(name) {
      delete users[name];
    });

    setInterval(function(){
      var crouch = player.isCrouch != 0 ? true : false;
      // send only if different from last move
      if (!(player.x == player.prev.x && player.y == player.prev.y && crouch == player.prev.crouch)) {
        player.update(crouch);
      }
    }, 250);

    drawMap(); // only need to draw it once

    (function gameLoop() {
//    setInterval(function(){
        player.move();
        player.draw();
        drawUsers();
        requestAnimFrame(gameLoop, ctx2);
//    }, 300);
    })();

}, false);

