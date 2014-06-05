// XXX require('global/mumble')
var window = global.window;

var data = null;

function load() {
    if (!data) {
        var hash = window.location.hash;
        if (hash && hash[0] === '#') hash = hash.slice(1);
        var parts = hash.split(';');
        var out = {};
        parts.forEach(function(part) {
            var i = part.indexOf('=');
            if (i === -1) {
                out[part] = true;
            } else {
                var key = part.slice(0, i);
                var val = part.slice(i + 1);
                out[key] = val;
            }
        });
        data = out;
    }
    return data;
}

function save() {
    window.location.hash = '#' + Object.keys(data)
        .map(function(key) {
            return key + '=' + data[key];
        })
        .join(';');
}

function get(key) {
    return load()[key];
}

function set(key, val) {
    if (!data) load();
    if (val === null || val === undefined) {
        delete data[key];
    } else {
        data[key] = val;
    }
    save();
}

module.exports.load = load;
module.exports.save = save;
module.exports.get = get;
module.exports.set = set;
