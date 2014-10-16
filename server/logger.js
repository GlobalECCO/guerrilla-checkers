var winston = require('winston');

var logger = new winston.Logger({
  transports: [
    new winston.transports.Console({level: 'error', timestamp: true})
    new winston.transports.File({level: 'verbose', timestamp: true, filename: "log/game.log"})
  ]
  exceptionHandlers: [
      new winston.transports.File({ filename: 'log/game_exceptions.log' })
    ]
});


exports.logger = logger;
