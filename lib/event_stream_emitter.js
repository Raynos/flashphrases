var EE = require('events').EventEmitter;
var inherits = require('inherits');
var SSEStream = require('../lib/stream/sse');
var resolveData = require('./data').resolveData;

function EventStreamEmitter() {
}

inherits(EventStreamEmitter, EE);

EventStreamEmitter.prototype.handleEventStream = function(req, res, opts) {
    var self = this;
    var stream = SSEStream.handle(req, res, opts);
    if (stream) {
        this.addEventStream(stream);
        stream.on('end', function() {
            self.removeEventStream(stream);
        });
        return stream;
    }
};

EventStreamEmitter.prototype.addEventStream = function(stream) {
    var streams = this._eventstreams;
    if (!streams) streams = this._eventstreams = [];
    this._eventstreams.push(stream);
    return stream;
};

EventStreamEmitter.prototype.removeEventStream = function(stream) {
    var streams = this._eventstreams;
    if (!streams) streams = this._eventstreams = [];
    for (var i=0, n=streams.length; i<n; i++) {
        if (streams[i] === stream) {
            streams.splice(i--, 1);
        }
    }
};

EventStreamEmitter.prototype.emit = function(name) {
    EE.prototype.emit.apply(this, arguments);
    var streams = this._eventstreams;
    if (!streams) streams = this._eventstreams = [];
    var n = streams.length;
    if (!n) return;
    var data;
    if (arguments.length > 2) {
        data = Array.prototype.slice(arguments, 1);
    } else {
        data = arguments[1];
    }
    data = resolveData(data);
    var event = {
        name: name,
        data: JSON.stringify(data)
    };
    for (var i=0; i<n; i++) streams[i].write(event);
};

module.exports = EventStreamEmitter;
