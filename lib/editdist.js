var copy = require('deepcopy');

function editdist(a, b) {
    // TODO: could be faster and more memory efficient

    var m = a.length;
    var n = b.length;
    var d = [];
    var i, j;

    if (!m) return n;
    if (!n) return m;

    for (i = 0; i <= m; i++) d[i] = [i];
    for (j = 0; j <= n; j++) d[0][j] = j;

    for (j = 1; j <= n; j++) {
        for (i = 1; i <= m; i++) {
            if (a[i-1] === b[j-1]) d[i][j] = d[i - 1][j - 1];
            else d[i][j] = Math.min(d[i-1][j], d[i][j-1], d[i-1][j-1]) + 1;
        }
    }
    return d[m][n];
}

editdist.lossy = function lossy(a, b) {
    a = a.toLowerCase().replace(/\s+/g, '');
    b = b.toLowerCase().replace(/\s+/g, '');
    return editdist(a, b);
};

function indexOfBest(prefer, items) {
    var best = null, bestI = null;
    for (var i=0, n=items.length; i<n; i++) {
        if (best === null || prefer(items[i], best)) {
            best = items[i];
            bestI = i;
        }
    }
    return bestI;
}

function lt(a, b) {
    return a < b;
}

var SAME   = editdist.SAME   = 0;
var CHANGE = editdist.CHANGE = 1;
var DELETE = editdist.DELETE = 2;
var INSERT = editdist.INSERT = 3;

editdist.trace = function trace(a, b) {
    var m = a.length;
    var n = b.length;
    var d = [];
    var t = [];
    var i, j;

    if (!m) return {edit: [], dist: n};
    if (!n) return {edit: [], dist: m};

    d[0] = [0];
    t[0] = [[]];

    for (j=1; j <= n; j++) {
        d[0][j] = j;
        t[0][j] = copy(t[0][j-1]);
        t[0][j].push([INSERT, 0, j-1]);
    }

    for (i=1; i <= m; i++) {
        d[i] = [i];
        t[i] = copy(t[i-1]);
        t[i][0].push([DELETE, i-1, 0]);
    }

    for (j = 1; j <= n; j++) {
        for (i = 1; i <= m; i++) {
            if (a[i-1] === b[j-1]) {
                d[i][j] = d[i-1][j-1];
                t[i][j] = t[i-1][j-1].concat([[SAME, i-1, j-1]]);
            } else {
                var ds = [
                    d[i-1][j],
                    d[i][j-1],
                    d[i-1][j-1]
                ];
                var minI = indexOfBest(lt, ds);
                d[i][j] = ds[minI] + 1;
                switch(minI) {
                    case 0:
                        t[i][j] = t[i-1][j].concat([[DELETE, i-1, j]]);
                        break;
                    case 1:
                        t[i][j] = t[i][j-1].concat([[INSERT, i, j-1]]);
                        break;
                    case 2:
                        t[i][j] = t[i-1][j-1].concat([[CHANGE, i-1, j-1]]);
                        break;
                }
            }
        }
    }

    return {
        edit: t[m][n],
        dist: d[m][n]
    };
};

module.exports = editdist;
