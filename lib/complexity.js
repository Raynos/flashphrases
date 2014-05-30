var componentWise = require('./componentwise');

var arAdd = componentWise.numOp(function(a, b) {return a + b;});
var arSub = componentWise.numOp(function(a, b) {return a - b;});
var arFloorDiv = componentWise.numOp(function(a, b) {return Math.floor(a / b);});
var arLt = componentWise.numRelation(function(a, b) {return a < b;});
var arGt = componentWise.numRelation(function(a, b) {return a > b;});
var arScale = componentWise.scalarNumOp(function(s, a) {return s*a;});

function Complexity(options) {
    if (!this instanceof Complexity) {
        return new Complexity(options);
    }
    options = options || {};

    // TODO: ick
    if (!options.initial)
        throw new Error('missing initial option');
    if (!Array.isArray(options.initial))
        throw new Error('invalid initial option');
    if (!options.step)
        throw new Error('missing step option');
    if (!Array.isArray(options.step))
        throw new Error('invalid step option');
    if (options.lo &&
        !Array.isArray(options.lo)) {
        throw new Error('invalid lo option');
    }
    if (!options.hi)
        throw new Error('missing hi option');
    if (!Array.isArray(options.hi))
        throw new Error('invalid hi option');

    this.initial = options.initial;
    this.step = options.step;
    this.hi = options.hi;
    this.lo = options.lo ||
              this.hi.map(function() {return 1;});
    this.value = this.initial;
    Object.defineProperty(this, 'level', {
        enumerable: true,
        get: this.getLevel,
        set: this.setLevel
    });
}

Complexity.prototype.getLevel = function() {
    var diff = arSub(this.value, this.lo);
    var qs = arFloorDiv(diff, this.step);
    return 1 + Math.min.apply(Math, qs);
};

Complexity.prototype.setLevel = function(level) {
    var value = arAdd(this.lo, arScale(level-1, this.step));
    if (arGt(value, this.hi)) value = this.hi;
    else if (arLt(value, this.lo)) value = this.lo;
    this.value = value;
    return value;
};

module.exports = Complexity;
