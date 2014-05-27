var Transform = require('stream').Transform;
var util = require('util');

function UpperStream(options) {
    if (!(this instanceof UpperStream))
        return new UpperStream(options);
    Transform.call(this, options);
}

util.inherits(UpperStream, Transform);

UpperStream.prototype._transform = function(chunk, encoding, done) {
    var str = String(chunk);
    this.push(str.toUpperCase());
    done();
};

module.exports = UpperStream;
