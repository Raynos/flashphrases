var Transform = require('stream').Transform;
var util = require('util');

function AccumStream(options) {
    if (!(this instanceof AccumStream))
        return new AccumStream(options);
    options.objectMode = true;
    if (!options.classifier) throw new Error('missing classifier option');
    this.classifier = options.classifier;
    this.buffer = [];
    Transform.call(this, options);
}

util.inherits(AccumStream, Transform);

AccumStream.prototype.kill = function() {
    this.buffer = null;
};

AccumStream.prototype._transform = function(data, _, done) {
    data = this.classifier(data);
    if (data !== undefined && data !== null && this.buffer) this.buffer.push(data);
    done();
};

AccumStream.prototype.emitBuffer = function() {
    if (this.buffer && this.buffer.length) {
        this.push(this.buffer);
    }
    this.buffer = [];
};

AccumStream.prototype._flush = function(done) {
    this.emitBuffer();
    done();
};


module.exports = AccumStream;
