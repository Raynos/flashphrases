var EE = require('./event_stream_emitter');
var inherits = require('inherits');
var uuid = require('uuid');
var CachedObject = require('./cached_object');

function Session(dataOrId) {
    if (!(this instanceof Session)) {
        return new Session(dataOrId);
    }
    CachedObject.call(this);
    switch (typeof dataOrId) {
        case 'object':
            this.setData(dataOrId);
            break;
        default:
            this.setData({
                id: dataOrId,
                results: []
            });
    }
}

inherits(Session, EE);

Session.prototype.setData = function(data) {
    if (this.id !== undefined && data.id !== this.id) throw new Error('session data id mismatch');
    if (this.id === undefined) this.id = data.id || uuid.v4();
    this.setResults(data.results);
    this.emit('change');
};

Session.prototype.setResults = function(results) {
    this.results = results || [];
};

Session.prototype.addResult = function(result) {
    this.results.push(result);
    this.clearCache();
    this.emit('resultAdd', result);
    this.emit('change');
};

Session.prototype.currentLevelResults = function() {
    var rs = this.results, n = rs.length;
    if (!n) return [];
    var level = rs[n-1].level;
    var i=n-1;
    while (i>0 && rs[i-1].level === level) i--;
    return rs.slice(i);
};

module.exports = Session;
