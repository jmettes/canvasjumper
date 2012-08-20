(function (exports) {

  var Game = function () {
    this.players = {};
    this.numPlayers = 0;
  };

  Game.prototype.join = function (name, x, y) {  
    this.players[name] = new Player(x, y, false);
    this.numPlayers++;
  };

  Game.prototype.move = function (name, x, y, crouch) {
    if (typeof this.players[name] !== "undefined") {
      this.players[name].x = x;
      this.players[name].y = y;
      this.players[name].crouch = crouch;
    }
  };

  Game.prototype.getState = function () {
    var state = {};
    for (var player in this.players) {
      state[player] = {
        x: this.players[player].x,
        y: this.players[player].y,
        crouch: this.players[player].crouch
      };
    }

    return state;
  };

  Game.prototype.leave = function (name) {
    delete this.players[name];
    this.numPlayers--;
  };


  var Player = function (x, y, crouch) {
    this.x = x;
    this.y = y;
    this.crouch = crouch;
  };

  exports.Game = Game;

}) (typeof global === "undefined" ? window : exports);

