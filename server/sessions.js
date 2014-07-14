var Router = require('routes-router');
var jsonBody = require('body/json');
var path = require('path');
var resolveData = require('../lib/data').resolveData;
var sendError = require('send-data/error');
var sendJson = require('send-data/json');

var config = require('./config');
var Session = require('../lib/session');
var SessionStore = require('./session_store');

var sessions = new SessionStore(path.resolve(path.join(config.var, 'sessions')));

var sessionRoutes = new Router();

sessionRoutes.addRoute('/all', function(req, res, opts, done) {
    sessions.keys(function(err, keys) {
        if (err) return sendError(req, res, err, done);
        sendJson(req, res, keys, done);
    });
});

sessionRoutes.addRoute('/create', {
    PUT: function(req, res, opts, done) {
        jsonBody(req, res, function(err, data) {
            sessions.save(Session(data), function(err, session) {
                if (err) return sendError(req, res, err, done);
                sendJson(req, res, resolveData(session), done);
            });
        });
    }
});

function loadSession(func) {
    return function(req, res, opts, done) {
        sessions.load(opts.sessionId, function(err, session) {
            if (!session) {
                return done({
                    statusCode: 404,
                    message: 'no such session'
                });
            }
            opts.session = session;
            return func.call(this, req, res, opts, done);
        });
    };
}

sessionRoutes.addRoute('/:sessionId', loadSession(function(req, res, opts, done) {
    sendJson(req, res, resolveData(opts.session), done);
}));

sessionRoutes.addRoute('/:sessionId/result', {
    PUT: loadSession(function(req, res, opts, done) {
        jsonBody(req, res, function(err, resultOrResults) {
            if (err) return done(err);
            if (Array.isArray(resultOrResults)) {
                resultOrResults.forEach(function(result) {
                    opts.session.addResult(result);
                });
            } else {
                opts.session.addResult(resultOrResults);
            }
            res.end();
        });
    })
});

sessionRoutes.addRoute('/:sessionId/listen', loadSession(function(req, res, opts) {
    opts.session.handleEventStream(req, res, {
        hello: 'listening to session ' + opts.session.id,
        keepalive: 5000
    });
}));

module.exports = sessionRoutes;
