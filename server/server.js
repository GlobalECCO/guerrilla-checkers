var requirejs = require('requirejs'),
    logger    = require('./logger');

requirejs.config({
  nodeRequire: require,
  paths: {
    underscore: "./vendor/underscore"
  },
  shim: {
    underscore: {
      exports: '_'
    }
  }
});

requirejs([
  'underscore',
  './lib/checkers',
  './lib/vote'],
  function(
    _,
    Game,
    Vote) {

var metadata = new Game.Metadata();
var SPECTATOR = 'spectator';

var Server = function(gameFactory, dbgame, egs_notifier) {
  var me = this;
  me.egs_notifier = egs_notifier;
  me.dbgame = dbgame;
  me.gameFactory = gameFactory;
  me.game = gameFactory();
  me.arrPlayers = [];
  me.arrRoles = [metadata.roles[0].slug, metadata.roles[1].slug];
  me.votes = {};

  me.requestReset = function() {
    me.startVote(
      'reset',
      'Would you like reset the game',
      function() { me.resetGame(); });
  };
};

Server.prototype.getDBGame = function() {
  return this.dbgame;
}

Server.prototype.startVote = function(name, question, onPass, getVoters) {
  var me = this;
  onPass = onPass || function() {};
  if (this.votes[name]) { return; } // vote already in progress
  getVoters = getVoters || function() {
      return _.filter(me.arrPlayers, function(player) {
        var role = player.getRole();
        return role === metadata.roles[0].slug
          || role === metadata.roles[1].slug;
      });};
  logger.debug('getVoters: ', getVoters);
  var vote = new Vote('reset',
           "Would you like to reset the game?",
           getVoters,
           function() { onPass(); }, //onPass
           function() { delete me.votes[name]; }, //onCompleted
           function() {}); //onFail
  me.votes[vote.getName()] = vote;
  _.each(getVoters(), function(player){ me.requestVote(player, vote); });
};

Server.prototype.requestVote = function(player, vote) {
  player.getSocket().emit('getVote', {
    'name': vote.getName(),
    'question': vote.getQuestion()
  });
};

Server.prototype.updateServerStatus = function() {
  var me = this;
  me.broadcast('num_connected_users', me.arrPlayers.length);
};

Server.prototype.refreshBoard = function(result, arrPlayers) {
  var me = this;
  var data = {
    result: result,
    gameState: me.game.asDTO()
  };

  logger.debug('saving new game state');
  this.dbgame.gameState = JSON.stringify(data.gameState);
  this.dbgame.save(function(err) { if (err) throw err; });

  logger.debug('update players: ', me.arrPlayers.length);
  _.each(arrPlayers || me.arrPlayers, function(player) {
    var socket = player.getSocket();
    if (_.isUndefined(socket) || _.isNull(socket)) { return; }
    socket.emit('update', data);
  });
  var winner = me.game.getWinner();
  if (winner) {
    me.broadcast('gameOver', {winner: winner});
    me.broadcast('message', {user: 'game', message: 'Game Over'});
    var role = _.find(metadata.roles, function(role){ return role.slug === winner });
    me.broadcast('message', {user: 'game', message: 'Winner: ' + role.name});
    if (!me.game.winner) { //the game was forfeit, don't notify again TODO this is ugly
      me.egs_notifier.gameover(me.game.getWinner(), me.game.getScores());
    }
  }
};

Server.prototype.resetGame = function() {
  this.game = this.gameFactory();
  this.refreshBoard(true);
};

Server.prototype.endGame = function() {
//  this.requestReset();
};

Server.prototype.addPlayer = function(socket, user) {
  if (!user) throw "AddPlayer called with 'null' for user."

  var me = this;

  var role = null;

  var role1 = metadata.roles[0];
  var role2 = metadata.roles[1];
  logger.debug("Roles: ", { role1: role1, role2: role2 });
  var role1player = _.isUndefined(this.dbgame.roles[role1.slug]) ? null : this.dbgame.roles[role1.slug];
  var role2player = _.isUndefined(this.dbgame.roles[role2.slug]) ? null : this.dbgame.roles[role2.slug];

  logger.debug("Determining player role.");
  logger.debug("Role1 player id: " + role1player);
  logger.debug("Role2 player id: " + role2player);
  logger.debug("User.gaming_id: " + user.gaming_id);
  if (role1player !== null && user.gaming_id === role1player) {
    role = role1.slug;
  } else if (role2player !== null && user.gaming_id === role2player) {
    role = role2.slug;
  } else {
    // Player was not previously assigned a role (or was spectating)
    if (role1player === null) {

      role = role1.slug;
      this.dbgame.roles[role1.slug] = user.gaming_id;
      this.dbgame.save(function(err) { if (err) throw err; });

    } else if (role2player === null) {

      role = role2.slug;
      this.dbgame.roles[role2.slug] = user.gaming_id;
      this.dbgame.save(function(err) { if (err) throw err; });

    } else {
      role = SPECTATOR;
    }
  }

  var player = new Player(socket, this, user, role);
  this.arrPlayers.push(player);

  socket.on('disconnect', function(data) {
    logger.info('disconnected player: '+user.gaming_id);
    me.arrPlayers = _.without(me.arrPlayers, player);
    me.updateServerStatus();
    var votesToDelete = [];
    logger.debug('active votes: ', me.votes);
    _.each(me.votes, function(vote) {
      if (vote.getVoters().length === 0) {
        votesToDelete.push(vote.getName());
      }
      else {
        vote.determineResult();
      }
    });
    _.each(votesToDelete, function(name) {
      logger.debug('removing dead vote: ', name);
      delete me.votes[name];
    });
  });

  socket.on('requestReset', function(data) {
//    logger.debug('reseting game');
//    me.requestReset();
  });


  socket.on('vote', function(ballot) {
    if (ballot) {
      logger.debug(player.getSocket().id, ' voted ', ballot.choice, ' for ', ballot.name);
      var vote = me.votes[ballot.name];
      if (vote) {
        vote.addVote(ballot.choice, player);
      }
    }
  });

  // handle user chat message
  socket.on('message', function(data) {
    me.broadcast('message', data);
  });

  me.broadcast('num_connected_users', me.arrPlayers.length);
  socket.emit('board_type', 'guerrilla');
  return player;
};

Server.prototype.getPlayerCount = function() {
  return this.arrPlayers.length;
};

Server.prototype.broadcast = function(message, data, source) {
  var players = this.arrPlayers;
  if (source) {
    players = _.reject(this.arrPlayers, function(player) {
      player === source;
    });
  }
  _.each(players, function(player) {
    player.getSocket().emit(message, data);
  });
};

Server.prototype.getGame = function() {
  return this.game;
};

Server.prototype.getId = function() {
  return this.dbgame.id;
};

var Player = function(_socket, server, user, role) {
  var me = this;
  me.server = server;
  me.role = role;
  me.socket = _socket;
  me.id = me.socket.handshake.sessionID;

  me.socket.emit('user_info', {
    name: user.gaming_id
  });

  // checkers protocol
  me.socket.on('moveCOIN', function(data) {
    logger.debug(data);
    logger.info('### COIN move requested. Piece at ('+data.piece.x+','+data.piece.y+") to ("+data.position.x+","+data.position.y+")");
    var result = me.server.getGame().moveSoldierPiece(data.piece, data.position);
    me.server.refreshBoard(result);
    if (!me.server.getGame().getWinner() && me.server.getGame().isGuerrillaTurn()) {
      me.server.egs_notifier.move(metadata.roles[0].slug);
    }
  });

  me.socket.on('placeGuerrilla', function(data) {
    logger.info("### Guerrilla move requested.");
    logger.debug(data);
    var result = me.server.getGame().placeGuerrillaPiece(data.position);
    me.server.refreshBoard(result);
    if (!me.server.getGame().getWinner() && me.server.getGame().isSoldierTurn()) {
      me.server.egs_notifier.move(metadata.roles[1].slug);
    }
  });

  me.socket.on('forfeit', function(data) {
    me.server.getGame().forfeit(role);
    me.server.refreshBoard(null);
    me.server.egs_notifier.forfeit(role);
    me.server.broadcast('message', {user: 'game', message: user.gaming_id + " has forfeit the game."});
  });

  // notify other users
  me.socket.broadcast.emit('user_connect', {
    user: me.socket.handshake.address.address
  });

  // refresh board
  me.socket.emit('role', role);
  me.server.refreshBoard(true, [me]);

  // send recent messages
  //fetchRecentMessages(function(err,messages) {

  //  for(var i = messages.length-1; i >= 0; --i) {
  //    var message = messages[i];
  //    logger.debug(message);
  //    me.socket.emit('message', message);
  //  }

  //});
};

Player.prototype.getId = function() {
  return this.id;
};

Player.prototype.getSocket = function() {
  return this.socket;
};

Player.prototype.getRole = function() {
  return this.role;
};

Player.prototype.setRole = function(role) {
  this.role = role;
};


module.exports.Player = Player;
module.exports.Server = Server;
module.exports.Metadata = Game.Metadata;
}); // requirejs define

