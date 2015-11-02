'use strict';

var winston = require('winston');

var Logger = function(env) {
  var loggingTransports = [];
  var exceptionTransports = [];
  var notProd = (env === 'development' || env === 'ci');
  var levels = {
    info: 0,
    email: 1,
    warn: 2,
    error: 3
  };
  var colors = {
    info: 'green',
    email: 'magenta',
    warn: 'yellow',
    error: 'red'
  };

  loggingTransports.push(
    new (winston.transports.Console)({
      json: (notProd === true) ? false : true,
      timestamp: true,
      colorize: true,
      stringify: function stringify(obj) {
        return JSON.stringify(obj);
      }
    })
  );

  exceptionTransports.push(
    new (winston.transports.Console)({
      json: (notProd === true) ? false : true,
      timestamp: true,
      colorize: true,
      stringify: function stringify(obj) {
        return JSON.stringify(obj);
      }
    })
  );

  var transports = {
    levels: levels,
    transports: loggingTransports,
    exceptionHandlers: exceptionTransports,
    exitOnError: true
  };

  if (notProd) {
    delete transports.exceptionHandlers;
  }

  var logger = new (winston.Logger)(transports);

  winston.addColors(colors);
  
  return logger;
}

module.exports = Logger;
