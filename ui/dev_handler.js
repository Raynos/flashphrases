var routes = require('../server/sessions');
var sendError = require("send-data/error");

function devHandler(req, res) {
    var handled = true;
    routes(req, res, function(err) {
        if (err.notFound || err.statusCode === 404) {
            handled = false;
        } else {
            sendError(req, res, {
                body: err,
                statusCode: err.statusCode || 500
            });
        }
    });
    return handled;
}

module.exports = devHandler;
