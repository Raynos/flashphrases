var Router = require('routes-router');
var jsonBody = require('body/json');
var resolveData = require('../lib/data').resolveData;
var sendJson = require('send-data/json');

var resultRoutes = new Router();

function loadResult(func) {
    return function(req, res, opts, done) {
        // TODO: use an index for this
        for (var a=opts.session.results, i=0, n=a.length; i<n; i++) {
            if (a[i].id === opts.resultId) {
                opts.result = a[i];
                return func.call(this, req, res, opts, done);
            }
        }
        return done({
            statusCode: 404,
            message: 'no such result'
        });
    };
}

resultRoutes.addRoute('/', {
    PUT: function(req, res, opts, done) {
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
    }
});

resultRoutes.addRoute('/:resultId', {
    GET: loadResult(function(req, res, opts, done) {
        sendJson(req, res, resolveData(opts.result), done);
    })
});

resultRoutes.addRoute('/:resultId/listen', loadResult(function(req, res, opts) {
    opts.result.handleEventStream(req, res, {
        hello: 'listening to session ' + opts.session.id,
        keepalive: 5000
    });
}));

module.exports = resultRoutes;
