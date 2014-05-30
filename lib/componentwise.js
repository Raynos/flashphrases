function op(elop) {
    return function(a, b) {
        var i, n=a.length, m=b.length;
        var c = new Array(n);
        for (i=0; i<n && i<m; i++) {
            c[i] = elop(a[i], b[i]);
        }
        for (; i<n; i++) {
            c[i] = a[i];
        }
        return c;
    };
}

function scalarOp(elop) {
    return function(s, a) {
        var i, n=a.length;
        var c = new Array(n);
        for (i=0; i<n; i++) {
            c[i] = elop(s, a[i]);
        }
        return c;
    };
}

function relation(elrel) {
    return function(a, b) {
        return a
            .map(function(v, i) {return elrel(v, b[i]);})
            .reduce(function(all, bool) {return all && bool;}, true)
            ;
    };
}

function numOp(elop) {
    return function(a, b) {
        var i, n=a.length, m=b.length;
        var c = new Array(n);
        for (i=0; i<n && i<m; i++) {
            if (typeof a[i] === 'number' && typeof b[i] === 'number') {
                c[i] = elop(a[i], b[i]);
            } else {
                c[i] = a[i];
            }
        }
        for (; i<n; i++) {
            c[i] = a[i];
        }
        return c;
    };
}

function numRelation(elrel) {
    return function(a, b) {
        return a
            .map(function(v, i) {
                if (i >= b.length) return true;
                if (typeof v !== 'number') return true;
                return elrel(v, b[i]);
            })
            .reduce(function(all, bool) {return all && bool;}, true)
            ;
    };
}

function scalarNumOp(elop) {
    return function(s, a) {
        var i, n=a.length;
        var c = new Array(n);
        for (i=0; i<n; i++) {
            if (typeof a[i] === 'number') {
                c[i] = elop(s, a[i]);
            } else {
                c[i] = a[i];
            }
        }
        return c;
    };
}

module.exports.op = op;
module.exports.numOp = numOp;
module.exports.scalarOp = scalarOp;
module.exports.scalarNumOp = scalarNumOp;
module.exports.relation = relation;
module.exports.numRelation = numRelation;
