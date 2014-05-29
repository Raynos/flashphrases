var componentWise = require('./componentwise');

var arAdd = componentWise.numOp(function(a, b) {return a + b;});
var arSub = componentWise.numOp(function(a, b) {return a - b;});

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
    this.initial = options.initial;
    this.step = options.step;
    this.value = this.initial;
}

Complexity.prototype.inc = function() {
    var c = arAdd(this.value, this.step);
    this.value = c;
    return this.value;
};

Complexity.prototype.dec = function() {
    var c = arSub(this.value, this.step);
    this.value = c;
    return this.value;
};

module.exports = Complexity;
