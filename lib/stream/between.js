var Transform = require('stream').Transform;
var util = require('util');

function BetweenStream(options) {
    if (!(this instanceof BetweenStream))
        return new BetweenStream(options);
    this.inside = false;
    var self = this;
    ['matchStart', 'matchEnd'].forEach(function(prop) {
        var val = options[prop];
        if (!val) throw new Error('missing ' + prop + ' pattern');
        if (!(val instanceof RegExp)) val = new RegExp(val);
        self[prop] = val;
    });
    Transform.call(this, options);
}

util.inherits(BetweenStream, Transform);

BetweenStream.prototype._transform = function(chunk, encoding, done) {
    var data = String(chunk);
    var match;
    if (!this.inside) {
        match = this.matchStart.exec(data);
        if (match) {
            this.inside = true;
            var i = match.index + match[0].length;
            if (i < data.length)
                this.push(data.slice(i));
        }
    } else {
        match = this.matchEnd.exec(data);
        if (match) {
            this.push(data.slice(0, match.index));
            this.inside = false;
        } else {
            this.push(data);
        }
    }
    done();
};

module.exports = BetweenStream;
