var extend = require('xtend/mutable');

var Atom = {};

Atom.literal = function literal(lit) {
    return function(o) {return o === lit;};
};

Atom.objectWith = function objectWith(spec) {
    var keys = Object.keys(spec);
    var n = keys.length;
    for (var j=0; j<n; j++) {
        if (typeof spec[keys[j]] !== 'function') {
            spec[keys[j]] = Atom.literal(spec[keys[j]]);
        }
    }
    return function(o) {
        if (typeof o !== 'object') return false;
        for (var j=0; j<n; j++) {
            var key = keys[j];
            if (!spec[key](o[key])) return false;
        }
        return true;
    };
};

Atom.merge = function(a, b) {
    if (Array.isArray(a)) a = a.reduce(Atom.merge);
    if (Array.isArray(b)) b = b.reduce(Atom.merge);
    return extend(a, b);
};

Atom.oneOf = function oneOf() {
    var things = Array.prototype.slice.apply(arguments);
    return function(_) {
        return !!~things.indexOf(_);
    };
};

module.exports.Atom = Atom;

function withArray(func) {
    return function() {
        var ar;
        if (arguments.length === 1 && Array.isArray(arguments[0])) {
            ar = arguments[0];
        } else {
            ar = Array.prototype.slice.call(arguments, 0);
        }
        return func.call(this, ar);
    };
}

function asArray(val) {
    if (val === undefined) return [];
    if (val === null) return [];
    return Array.isArray(val) ? val : [val];
}

function Opt(expr) {
    return function(a, i) {
        var r = expr(a, i);
        return r || [null, i];
    };
}
module.exports.Opt = Opt;

var Seq = withArray(function Seq(exprs) {
    return exprs.reduce(function(f, g) {
        return function(a, i) {
            var r1 = f(a, i);
            if (!r1) return null;
            i = r1[1];
            var r2 = g(a, i);
            if (!r2) return null;
            var val = asArray(r1[0]);
            val.push.apply(val, asArray(r2[0]));
            return [val, r2[1]];
        };
    });
});
module.exports.Seq = Seq;

var Alt = withArray(function Alt(exprs) {
    return exprs.reduce(function(f, g) {
        return function(a, i) {
            return f(a, i) || g(a, i);
        };
    });
});
module.exports.Alt = Alt;

function Star(expr) {
    return function(a, i) {
        var r = [[], i];
        while (r[1] < a.length) {
            var match = expr(a, r[1]);
            if (!match) break;
            r[0].push(match[0]);
            r[1]++;
        }
        return r;
    };
}
module.exports.Star = Star;

function Group(expr, name) {
    var transform;
    if (name) {
        transform = function(val) {
            var r = {};
            r[name] = val;
            return r;
        };
    } else {
        transform = function(val) {return [val];};
    }
    return function(a, i) {
        var r = expr(a, i);
        if (!r) return null;
        return [transform(r[0]), r[1]];
    };
}
module.exports.Group = Group;

function Start(a, i) {
    if (i > 0) return null;
    return [null, i];
}
module.exports.Start = Start;

function End(a, i) {
    var j = a.length - 1;
    if (i < j) return null;
    return [null, i];
}
module.exports.End = End;

function Any(a, i) {
    if (i >= a.length) return null;
    return [a[i], i+1];
}
module.exports.Any = Any;

function Plus(expr) {
    return Seq(expr, Star(expr));
}
module.exports.Plus = Plus;

function Pred(pred) {
    return function(a, i) {
        if (i >= a.length) return null;
        var data = pred(a[i]);
        if (!data) return null;
        if (data === true) data = a[i];
        return [data, i+1];
    };
}
module.exports.Pred = Pred;

Pred.lift = function(func) {
    return function() {
        var pred = func.apply(this, arguments);
        return Pred(pred);
    };
};

var Literal = Pred.lift(Atom.literal);
module.exports.Literal = Literal;

var ObjectWith = Pred.lift(Atom.objectWith);
module.exports.ObjectWith = ObjectWith;

var Merge = withArray(function Merge(exprs) {
    return exprs.reduce(function(f, g) {
        return function(a, i) {
            var r1 = f(a, i);
            if (!r1) return null;
            var r2 = g(a, r1[1]);
            if (!r2) return null;
            return [Atom.merge(r1[0], r2[0]), r2[1]];
        };
    });
});
module.exports.Merge = Merge;

function compile(spec) {
    if (typeof spec === 'function') return spec;
    if (Array.isArray(spec)) {
        var head = spec[0], tail = spec.slice(1);
        if (typeof head === 'function') {
            head = 'seq';
            tail = spec;
        }
        var op = compile.ops[head];
        if (!op) throw new Error('unknown match op ' + JSON.stringify(head));
        return op.apply(this, tail);
    }
    if (typeof spec === 'object') return ObjectWith(spec);
    return Literal(spec);
}

compile.withArg = function withCompiledArgs(func) {
    return function() {
        var tail = Array.prototype.slice.apply(arguments);
        tail[0] = compile(tail[0]);
        return func.apply(this, tail);
    };
};

compile.withArgs = function withCompiledArgs(func) {
    return function() {
        var tail = Array.prototype.slice.apply(arguments);
        tail = tail.map(compile);
        return func.apply(this, tail);
    };
};

compile.withSeqArgs = function withCompiledSeqArgs(func) {
    return function() {
        var tail = Array.prototype.slice.apply(arguments);
        tail = tail.map(compile);
        return func.call(this, Seq(tail));
    };
};

compile.ops = {
    alt: compile.withArgs(Alt),
    seq: compile.withArgs(Seq),
    merge: compile.withArgs(Merge),
    opt: compile.withSeqArgs(Opt),
    star: compile.withSeqArgs(Star),
    plus: compile.withSeqArgs(Plus),
    group: compile.withArg(Group),
    start: Start,
    end: End,
    any: Any,
    pred: Pred,
    literal: Literal,
    objectwith: ObjectWith
};

module.exports.compile = compile;

function exec(pat, a) {
    for (var i=0, n=a.length; i<n; i++) {
        var r = pat(a, i);
        if (r) return {
            data: r[0],
            start: i,
            end: r[1]
        };
    }
    return null;
}
module.exports.exec = exec;

function execRight(pat, a) {
    for (var n=a.length, i=n-1; i>=0; i--) {
        var r = pat(a, i);
        if (r) return {
            data: r[0],
            start: i,
            end: r[1]
        };
    }
    return null;
}
module.exports.execRight = execRight;
