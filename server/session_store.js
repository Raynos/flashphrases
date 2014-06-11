var nextTick = process.nextTick;

var Session = require('../lib/session');

function SessionStore() {
    this.cache = {};
}

SessionStore.prototype.keys = function(done) {
    done(null, Object.keys(this.cache));
};

SessionStore.prototype.load = function(id, done) {
    var self = this;
    return nextTick(function() {
        done(null, self.cache[id]);
    });
};

SessionStore.prototype.save = function(session, done) {
    var self = this;
    nextTick(function() {
        self.cache[session.id] = session;
        done(err, session);
    });
};

module.exports = SessionStore;
