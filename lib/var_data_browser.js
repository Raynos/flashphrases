var safeParse = require('safe-json-parse/callback');
var xhr = require('xhr');

function getData(id, callback) {
    var idPath = '.var/' + id + '.json';
    xhr('/' + idPath, function (err, resp, body) {
        if (err) return callback(err);
        safeParse(body, callback);
    });
}

module.exports.get = getData;
