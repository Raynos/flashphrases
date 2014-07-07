var bisect = require('./bisect');
var EE = require('events').EventEmitter;
var inherits = require('inherits');

function quantile() {
    var self = this;
    function getQuantile(q) {
        if (!self.length) return NaN;
        var p = (self.length - 1) * q;
        var i = Math.floor(p);
        var j = Math.ceil(p);
        return (self[i] + self[j])/2;
    }
    switch (arguments.length) {
        case 0:
            return;
        case 1:
            return getQuantile(arguments[0]);
        default:
            return Array.prototype.map.call(arguments, getQuantile);
    }
}

function Sample() {
    this.order = [];
    this.values = [];
    this.quantile = quantile.bind(this.values);
}

Object.defineProperty(Sample.prototype, 'median', {
    enumerable: true,
    get: function getMedian() {
        return this.quantile(0.5);
    }
});

Object.defineProperty(Sample.prototype, 'iqr', {
    enumerable: true,
    get: function getIQR() {
        if (this.values.length < 3) return NaN;
        var qs = this.quantile(0.25, 0.75);
        return qs[1] - qs[0];
    }
});

Object.defineProperty(Sample.prototype, 'lo', {
    enumerable: true,
    get: function getLo() {
        if (this.values.length < 3) return NaN;
        var qs = this.quantile(0.25, 0.50, 0.75);
        var iqr = qs[2] - qs[0];
        var tol = 3 * iqr / 2;
        return qs[0] - tol;
    }
});

Object.defineProperty(Sample.prototype, 'hi', {
    enumerable: true,
    get: function getHi() {
        if (this.values.length < 3) return NaN;
        var qs = this.quantile(0.25, 0.50, 0.75);
        var iqr = qs[2] - qs[0];
        var tol = 3 * iqr / 2;
        return qs[2] + tol;
    }
});

Object.defineProperty(Sample.prototype, 'range', {
    enumerable: true,
    get: function getRange() {
        if (this.values.length < 3) return [NaN, NaN, NaN];
        var qs = this.quantile(0.25, 0.50, 0.75);
        var iqr = qs[2] - qs[0];
        var tol = 3 * iqr / 2;
        return [qs[0] - tol, qs[1], qs[2] + tol];
    }
});

inherits(Sample, EE);

Sample.prototype.add = function addValue(value) {
    var i = bisect.right(this.values, value);
    this.values.splice(i, 0, value);
    for (var o=this.order, n=o.length, j=0; j<n; j++)
        if (o[j] >= i) o[j]++;
    this.order.push(i);
    this.emit('change');
};

Sample.prototype.inOrder = function inOrder() {
    var ar = new Array(this.order.length);
    for (var o=this.order, n=o.length, i=0; i<n; i++)
        ar[i] = this.values[o[i]];
    return ar;
};

module.exports = Sample;
