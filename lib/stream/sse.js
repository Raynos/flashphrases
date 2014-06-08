var Transform = require('stream').Transform;
var http = require('http');
var util = require('util');

/*
 * {
 *     retry   : Number,
 *     comment : String,
 *     id      : Number,
 *     name    : String,
 *     data    : String
 * }
 */

function SSEStream(options) {
    if (!(this instanceof SSEStream))
        return new SSEStream(options);
    Transform.call(this, options);
    this._writableState.objectMode = true;
    this._readableState.objectMode = false;
    options = options || {};
    var hello = options.hello;
    if (hello !== undefined && hello !== null) this.write({comment: hello});
    if (options.keepalive) this.setKeepalive(options.keepalive);
}

util.inherits(SSEStream, Transform);

SSEStream.canHandle = function(req) {
    var accept = req.headers.accept;
    return req.method === 'GET' && accept && !!~accept.indexOf('text/event-stream');
};

SSEStream.handler = function(options, callback) {
    return function(req, res) {
        var stream = SSEStream.handle(req, res, options);
        callback(stream);
    };
};

SSEStream.handle = function(req, res, options) {
    if (req.method !== 'GET') {
        console.log('bad method');
        res.writeHead(405);
        res.end(http.STATUS_CODES[405] + '\n');
        return;
    }
    if (req.headers.accept && !~req.headers.accept.indexOf('text/event-stream')) {
        res.writeHead(406);
        res.end(http.STATUS_CODES[406] + '\n');
        return;
    }
    req.socket.setNoDelay(true);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    var stream = new SSEStream(options);
    stream.pipe(res);
    return stream;
};

SSEStream.prototype.setKeepalive = function(interval, message) {
    message = message || 'keepalive';
    this.clearKeepalive();
    var tick;
    var self = this;
    if (typeof message === 'function') {
        tick = function() {self.write({comment: message.call(self)});};
    } else {
        tick = function() {self.write({comment: message});};
    }
    this.keepaliveInterval = setInterval(tick, interval);
};

SSEStream.prototype.clearKeepalive = function() {
    if (this.keepaliveInterval) {
        clearInterval(this.keepaliveInterval);
        delete this.keepaliveInterval;
    }
};

SSEStream.prototype._transform = function(event, encoding, done) {
    if (event.retry !== undefined) this.push('retry: ' + event.retry + '\n\n');
    if (event.comment !== undefined) this.push(':' + event.comment + '\n\n');
    var buf = '';
    if (event.id !== undefined) buf += 'id: ' + event.id + '\n';
    if (event.name !== undefined) buf += 'name: ' + event.name + '\n';
    if (event.data !== undefined) {
        var lines = event.data.split(/\n/g);
        buf += 'data: ' + lines.join('\ndata: ') + '\n';
    }
    if (buf) this.push(buf + '\n');
    done();
};

SSEStream.prototype._flush = function(done) {
    this.clearKeepalive();
    done();
};

module.exports = SSEStream;
