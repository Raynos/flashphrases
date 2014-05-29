var componentWise = require('./componentwise');

var arAdd = componentWise.numOp(function(a, b) {return a + b;});
var arSub = componentWise.numOp(function(a, b) {return a - b;});
var arLt = componentWise.numRelation(function(a, b) {return a < b;});
var arGt = componentWise.numRelation(function(a, b) {return a > b;});

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
}

Complexity.prototype.inc = function() {
    var c = arAdd(this.value, this.step);
    if (!arGt(c, this.hi)) this.value = c;
    return this.value;
};

Complexity.prototype.dec = function() {
    var c = arSub(this.value, this.step);
    if (!arLt(c, this.lo)) this.value = c;
    return this.value;
};

module.exports = Complexity;
