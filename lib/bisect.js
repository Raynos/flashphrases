function bisectRel(rel, ar, v) {
    var lo = 0, hi = ar.length-1;
    while (lo <= hi) {
        var q = Math.floor(lo / 2 + hi / 2);
        if      (rel(v, ar[q])) hi = q-1;
        else                    lo = q+1;
    }
    return lo;
}

var bisectLeft = bisectRel.bind(null, function(a, b) {return a <= b;});
var bisectRight = bisectRel.bind(null, function(a, b) {return a < b;});

module.exports.rel   = bisectRel;
module.exports.left  = bisectLeft;
module.exports.right = bisectRight;
