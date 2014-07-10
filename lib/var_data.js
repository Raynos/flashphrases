var fs = require('fs');
var path = require('path');
var xhr = require('xhr');

function getData(id, callback) {
    console.log('getting', id);
    function parse(err, str) {
        if (err) return callback(err);
        var data;
        try {
            data = JSON.parse(str);
        } catch (e) {
            return callback(e, null);
        }
        callback(err, data);
    }
    var idPath = '.var/' + id + '.json';
    if (fs.readFile) {
        var filePath = path.resolve(__dirname + '/../' + idPath);
        fs.readFile(filePath, 'utf8', parse);
    } else {
        xhr('/' + idPath, function (err, resp, body) {
            parse(err, body);
        });
    }
}

module.exports.get = getData;
