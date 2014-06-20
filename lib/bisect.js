function bisectLeft(ar, v) {
    var lo = 0, hi = ar.length-1;
    while (lo <= hi) {
        var q = Math.floor(lo / 2 + hi / 2);
        if      (v <= ar[q]) hi = q-1;
        else                 lo = q+1;
    }
    return lo;
}

function bisectRight(ar, v) {
    var lo = 0, hi = ar.length-1;
    while (lo <= hi) {
        var q = Math.floor(lo / 2 + hi / 2);
        if      (v < ar[q]) hi = q-1;
        else                lo = q+1;
    }
    return lo;
}

module.exports       = bisectLeft;
module.exports.left  = bisectLeft;
module.exports.right = bisectRight;
