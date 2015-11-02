'use strict';

var path = require('path');
var _    = require('underscore');

var defaults = {
  env: process.env.NODE_ENV            || 'development',
  port: process.env.PORT               || 8080,
  listen_host: process.env.LISTEN_HOST || '0.0.0.0',
  session: {
    secret: process.env.SESSION_SECRET || 'howdoesyourgardengrow',
    ttl: process.env.SESSION_TTL       || 1200 /* 20 mins */
  },
  redis: {
    port: process.env.REDIS_PORT || 6379,
    host: process.env.REDIS_HOST || '127.0.0.1'
  }
}

var Foundation = function() {
  // Expose Express
  this.express = require('express');

  // Expose the HOF
  this.hof = require('hof');

  // Expose errors
  this.errors = {
    BaseError: require('./lib/base-error')
  }
}

Foundation.prototype.init = function(config) {
   // Set config object
  this.config = config || defaults;

  // Expose logger
  this.logger = require('./lib/logger')(this.config.env);

  // Expose controllers
  this.controllers = {
    BaseController: require('./lib/base-controller')(this.logger)
  };
  this.controllers.DateController = require('./lib/date-controller')(
    this.controllers.BaseController,
    this.errors.BaseError);

  // Build app
  var app = this.express();
  var churchill = require('churchill');
  var session = require('express-session');
  var redis = require('redis');
  var RedisStore = require('connect-redis-crypto')(session);
  require('moment-business');

  if (this.config.env !== 'ci') {
    app.use(churchill(this.logger));
  }

  if (this.config.env === 'development') {
    app.use('/public', this.express.static(path.resolve(__dirname, './public')));
  }

  app.use(function setAssetPath(req, res, next) {
    res.locals.assetPath = '/public';
    next();
  });

  require('hof').template.setup(app);
  app.set('view engine', 'html');
  app.set('views', path.resolve('./apps/common/views'));
  app.enable('view cache');
  app.use(require('express-partial-templates')(app));
  app.engine('html', require('hogan-express-strict'));

  app.use(require('body-parser').urlencoded({extended: true}));
  app.use(require('body-parser').json());

  app.use(function setBaseUrl(req, res, next) {
    res.locals.baseUrl = req.baseUrl;
    next();
  });

  /*************************************/
  /******* Redis session storage *******/
  /*************************************/
  var client = redis.createClient(this.config.redis.port, this.config.redis.host);

  client.on('error', function clientErrorHandler(e) {
    throw e;
  });

  var redisStore = new RedisStore({
    client: client,
    ttl: this.config.session.ttl,
    secret: this.config.session.secret
  });

  function secureCookies(req, res, next) {
    var cookie = res.cookie.bind(res);
    res.cookie = function cookieHandler(name, value, options) {
      options = options || {};
      options.secure = (req.protocol === 'https');
      options.httpOnly = true;
      options.path = '/';
      cookie(name, value, options);
    };
    next();
  }

  function initSession(req, res, next) {
    session({
      store: redisStore,
      cookie: {
        secure: (req.protocol === 'https')
      },
      key: 'foundation.sid',
      secret: config.session.secret,
      resave: true,
      saveUninitialized: true
    })(req, res, next);
  }

  app.use(require('cookie-parser')(this.config.session.secret));
  app.use(secureCookies);
  app.use(initSession);

  app.get('/cookies', function renderCookies(req, res) {
    res.render('cookies');
  });
  app.get('/terms-and-conditions', function renderTerms(req, res) {
    res.render('terms');
  });

  // errors
  app.use(require('./errors/')(this.config.env, this.logger));
  
  // Common journey
  this.common = this.config.common ? {
    fields: require(path.resolve(this.config.common,  'fields'))
  } : {
    fields: {}
  };

  // Expose app
  this.app = app;
};

Foundation.prototype.start = function() {
  this.app.listen(this.config.port, this.config.host);
  this.logger.info('Foundation Form listening on port', this.config.port);
};

Foundation.prototype.use = function(middleware) {
  this.app.use(middleware);
};

Foundation.prototype.journeyRouter = function(urn, journeyDir) {
  var wizard     = this.hof.wizard;
  var mixins     = this.hof.mixins;
  var i18nFuture = this.hof.i18n;
  var router     = this.express.Router();

  var fields = _.extend(
    this.common.fields,
    require(path.resolve(journeyDir, 'fields')));

  var i18n = i18nFuture({
    path: path.resolve(journeyDir, 'translations', '__lng__', '__ns__.json')
  });

  router.use(mixins(i18n.translate.bind(i18n), fields));

  router.use(urn, wizard(require(path.resolve(journeyDir, 'steps')), fields, {
    controller: this.controllers.BaseController,
    templatePath: path.resolve(journeyDir, 'views'),
    translate: i18n.translate.bind(i18n),
    params: '/:action?'
  }));

  return router;
}

Foundation.prototype.journey = function(urn, journeyDir) {
  this.app.use(this.journeyRouter(urn, journeyDir));
}

// Export an instance of Foundation
var foundation = module.exports = exports = new Foundation();

foundation.version = require('./package.json').version;
