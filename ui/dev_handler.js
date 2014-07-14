var http = require('http');
var Router = require('routes-router');
var sendError = require("send-data/error");
require('../lib/phrase_session');

var routes = new Router();

routes.addRoute('/session*?', require('../server/sessions'));

function devHandler(req, res) {
    var handled = true;
    routes(req, res, function(err) {
        if (err) {
            if (err.notFound) {
                handled = false;
            } else {
                if (err.statusCode) {
                    var mess = err.message || http.STATUS_CODES[err.statusCode];
                    res.writeHead(err.statusCode, mess, {'content-type': 'text/plain'});
                    res.end(mess);
                } else {
                    sendError(req, res, {
                        body: err,
                        statusCode: 500
                    });
                }
            }
        }
    });
    return handled;
}

module.exports = devHandler;
