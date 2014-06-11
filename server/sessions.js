var Router = require('routes-router');
var jsonBody = require('body/json');
var sendJson = require('send-data/json');

var Session = require('../lib/session');

var sessions = {};

var sessionRoutes = new Router();

sessionRoutes.addRoute('/all', function(req, res, opts, done) {
    var keys = Object.keys(sessions).sort();
    sendJson(req, res, keys, done);
});

sessionRoutes.addRoute('/create', {
    PUT: function(req, res, opts, done) {
        var session = new Session();
        sessions[session.id] = session;
        sendJson(req, res, session.getData(), done);
    }
});

function loadSession(func) {
    return function(req, res, opts, done) {
        var session = sessions[opts.key];
        if (!session) return done({statusCode: 404, message: 'no such session'});
        opts.session = session;
        return func.call(this, req, res, opts, done);
    };
}

sessionRoutes.addRoute('/:key', loadSession(function(req, res, opts, done) {
    sendJson(req, res, opts.session.getData(), done);
}));

sessionRoutes.addRoute('/:key/result', {
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

sessionRoutes.addRoute('/:key/events', loadSession(function(req, res, opts) {
    opts.session.handleEventStream(req, res, {
        hello: 'listening to session ' + opts.session.id,
        keepalive: 5000
    });
}));

module.exports = sessionRoutes;
