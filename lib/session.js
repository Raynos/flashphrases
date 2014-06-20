var EE = require('./event_stream_emitter');
var inherits = require('inherits');
var uuid = require('uuid');

function Session(dataOrId) {
    switch (typeof dataOrId) {
        case 'object':
            this.setData(dataOrId);
            break;
        default:
            this.id = dataOrId || uuid.v4();
            this.results = [];
    }
}

inherits(Session, EE);

Session.prototype.getData = function() {
    return {
        id: this.id,
        results: this.results
    };
};

Session.prototype.setData = function(data) {
    if (this.id !== undefined && data.id !== this.id) throw new Error('session data id mismatch');
    if (this.id === undefined) this.id = data.id;
    this.results = data.results;
    this.emit('change');
};

Session.prototype.addResult = function(result) {
    this.results.push(result);
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
