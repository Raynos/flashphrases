var Transform = require('stream').Transform;
var util = require('util');

function DebugStream(options) {
    if (!(this instanceof DebugStream))
        return new DebugStream(options);

    // TODO: support eent debugging?
    // Readable events:
    //     readable data error close end
    // Writable events:
    //     drain finish pipe unpipe error

    Transform.call(this, options);
}

util.inherits(DebugStream, Transform);

DebugStream.prototype._log = function() {
    console.log.apply(console, arguments);
};

DebugStream.prototype._transform = function(chunk, encoding, done) {
    if (this._readableState.objectMode) {
        this._log('chunk ' + chunk);
        this.push(chunk);
    } else {
        var str = String(chunk);
        this._log('chunk ' + JSON.stringify(str));
        this.push(str);
    }
    done();
};

DebugStream.prototype._flush = function(done) {
    this._log('flush');
    done();
};

module.exports = DebugStream;
