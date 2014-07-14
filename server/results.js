var Router = require('routes-router');
var jsonBody = require('body/json');

var resultRoutes = new Router();

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

module.exports = resultRoutes;
