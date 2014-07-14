var uuid = require('uuid');
var inherits = require('inherits');
var Evented = require('./evented');

function Result(data) {
    if (!(this instanceof Result)) return new Result(data);
    Evented.call(this, data);
}

inherits(Result, Evented);

Result.prototype.setData = function(data) {
    if (this.id !== undefined && data.id !== this.id) throw new Error('result data id mismatch');
    if (this.id === undefined) this.id = data.id || uuid.v4();
    Evented.prototype.setData.call(this, data);
};

module.exports = Result;
