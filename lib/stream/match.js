var Transform = require('stream').Transform;
var util = require('util');

function MatchStream(options) {
    if (!(this instanceof MatchStream))
        return new MatchStream(options);
    options.objectMode = true;
    if (!options.regex) throw new Error('missing regex option');
    this.regex = options.regex;
    this.buffer = '';
    Transform.call(this, options);
}

util.inherits(MatchStream, Transform);

MatchStream.prototype.lastMatch = null;

MatchStream.prototype._transform = function(chunk, encoding, done) {
    this.buffer += String(chunk);
    this.regex.lastIndex = 0;
    var match = this.regex.exec(this.buffer);
    while (match) {
        var end = match.index + match[0].length;
        if (end >= this.buffer.length) {
            this.lastMatch = match;
            this.buffer = this.buffer.slice(match.index);
            break;
        }
        this._emit(match);
        match = this.regex.exec(this.buffer);
    }
    done();
};

MatchStream.prototype._flush = function(done) {
    this._emit(this.lastMatch);
    delete this.lastMatch;
    this.buffer = '';
    done();
};

MatchStream.prototype._emit = function(match) {
    this.push(match);
};

module.exports = MatchStream;
