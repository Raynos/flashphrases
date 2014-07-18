var EE = require('events').EventEmitter;
var inherits = require('inherits');

var componentWise = require('./componentwise');

var arAdd = componentWise.numOp(function(a, b) {return a + b;});
var arSub = componentWise.numOp(function(a, b) {return a - b;});
var arFloorDiv = componentWise.numOp(function(a, b) {return Math.floor(a / b);});
var arLt = componentWise.numRelation(function(a, b) {return a < b;});
var arGt = componentWise.numRelation(function(a, b) {return a > b;});
var arScale = componentWise.scalarNumOp(function(s, a) {return s*a;});

function Complexity(options) {
    if (!this instanceof Complexity) return new Complexity(options);
    this.setData(options || {});
}

inherits(Complexity, EE);

Complexity.prototype.setData = function(data) {
    if (!data.initial)
        throw new Error('missing initial option');
    if (!Array.isArray(data.initial))
        throw new Error('invalid initial option');
    if (!data.step)
        throw new Error('missing step option');
    if (!Array.isArray(data.step))
        throw new Error('invalid step option');
    if (data.lo &&
        !Array.isArray(data.lo)) {
        throw new Error('invalid lo option');
    }
    if (!data.hi)
        throw new Error('missing hi option');
    if (!Array.isArray(data.hi))
        throw new Error('invalid hi option');
    this.lo = data.lo || this.hi.map(function() {return 1;});
    this.step = data.step;
    this.hi = data.hi;
    this.initial = data.initial;
    this.value = data.initial || this.initial;
};

Object.defineProperty(Complexity.prototype, 'maxLevel', {
    get: function getMaxLevel() {
        var diff = arSub(this.hi, this.lo);
        var qs = arFloorDiv(diff, this.step);
        var q = Math.min.apply(Math, qs);
        return q;
    }
});

Object.defineProperty(Complexity.prototype, 'level', {
    enumerable: true,
    get: function getLevel() {
        var diff = arSub(this.value, this.lo);
        var qs = arFloorDiv(diff, this.step);
        return 1 + Math.min.apply(Math, qs);
    },
    set: function setLevel(level) {
        var old = this.level;
        var value = arAdd(this.lo, arScale(level-1, this.step));
        if (arGt(value, this.hi)) value = this.hi;
        else if (arLt(value, this.lo)) value = this.lo;
        this.value = value;
        this.emit('change', old, level);
        return value;
    }
});

module.exports = Complexity;
