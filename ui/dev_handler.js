var http = require('http');
var routes = require('../server/sessions');
var sendError = require("send-data/error");

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
