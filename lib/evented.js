var EE = require('./event_stream_emitter');
var inherits = require('inherits');
var bisect = require('./bisect');
var extend = require('xtend/mutable');
var CachedObject = require('./cached_object');

function nowLt(a, b) {
    return a.now < b.now;
}

function nowSortCmp(a, b) {
    if      (nowLt(a, b)) return -1;
    else if (nowLt(b, a)) return  1;
    else                  return  0;
}

function insort(events, event) {
    var i = bisect.rel(nowLt, events, event);
    events.splice(i, 0, event);
    return events;
}

function Evented(data) {
    CachedObject.call(this);
    this.events = [];
    if (data) this.setData(data);
}

inherits(Evented, EE);

Evented.prototype.setData = function(data) {
    this.events = data.events || [];
    this.events.sort(nowSortCmp);
    this.clearCache();
    this.emit('change');
};

Evented.prototype.addEvent = function(name, now, data) {
    if (typeof name === 'object') {
        data = name;
        name = data.name;
        now = data.now;
    } else if (typeof now === 'object') {
        data = now;
        now = data.now;
    }
    var event = extend({
        name: name,
        now: now || Date.now()
    }, data || {});
    insort(this.events, event);
    this.clearCache();
    this.emit('eventAdd', event);
    this.emit('change');
    return event;
};

module.exports = Evented;
