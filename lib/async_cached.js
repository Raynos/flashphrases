function asyncCached(func) {
    var cache = {};
    var loading = {};
    return function get(arg, callback) {
        if (loading[arg]) {
            loading[arg].push(callback);
            return;
        } else {
            loading[arg] = [callback];
        }
        if (cache[arg]) return callback(null, cache[arg]);
        func(arg, function(err, res) {
            if (!err) cache[arg] = res;
            for (var i=0, l=loading[arg], n=l.length; i<n; i++)
                l[i].call(this, err, res);
        });
    };
}

module.exports = asyncCached;
