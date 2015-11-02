'use strict';
var path = require('path');
var hof = require('hof');
var i18n = hof.i18n({
  path: path.resolve(__dirname, '../apps/common/translations/__lng__/__ns__.json')
});

var Middleware = function(env, logger) {
  var showStack = env === 'development';

  /*eslint no-unused-vars: 0*/
  return function errorHandler(err, req, res, next) {
    /*eslint no-unused-vars: 1*/
    var content = {};

    if (err.code === 'SESSION_TIMEOUT') {
      content.title = i18n.translate('errors.session.title');
      content.message = i18n.translate('errors.session.message');
    }

    err.template = 'error';
    content.title = content.title || i18n.translate('errors.default.title');
    content.message = content.message || i18n.translate('errors.default.message');

    res.statusCode = err.status || 500;

    logger.error(err.message || err.error, err);

    res.render(err.template, {
      error: err,
      content: content,
      showStack: showStack,
      startLink: req.path.replace(/^\/([^\/]*).*$/, '$1')
    });
  };
}

module.exports = Middleware;
