define(['winston'], function(winston) {

  winston.cli();

  var logger = new winston.Logger({
    transports: [
      new winston.transports.Console({level: 'error', timestamp: true})
      new winston.transports.File({level: 'verbose', timestamp: true, filename: "logs/gc.log"})
    ]
  });

  logger.cli();

  return logger;
});
