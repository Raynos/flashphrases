var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var nextTick = process.nextTick;
var resolveData = require('../lib/data').resolveData;

function SessionStore(dir, sessionType) {
    this.cache = {};
    this.dir = path.resolve(dir);
    if (sessionType) this.sessionType = sessionType;
}

SessionStore.prototype.sessionType = require('../lib/session');

SessionStore.prototype.keys = function(done) {
    fs.readdir(this.dir, done);
};

SessionStore.prototype.hook = function(session) {
    var self = this;
    session.on('change', function() {
        self.save(session, function(err) {
            if (err) {
                console.error(
                    'failed to save changes to session %s: %s',
                    session.id, err);
            }
        });
    });
};

SessionStore.prototype.load = function(id, done) {
    var self = this;
    if (this.cache[id]) {
        return nextTick(function() {
            done(null, self.cache[id]);
        });
    }
    fs.readFile(path.join(this.dir, id), function(err, buf) {
        if (err) {
            if (err.code === 'ENOENT') err = null;
            return done(err, null);
        }
        var data = JSON.parse(String(buf)); // TODO safe parse
        var session = self.sessionType(data);
        self.cache[session.id] = session;
        self.hook(session);
        done(null, session);
    });
};

SessionStore.prototype.save = function(session, done) {
    var self = this;
    var data = JSON.stringify(resolveData(session), null, 2);
    mkdirp(self.dir, function(err) {
        if (err) return done(err, session);
        fs.writeFile(path.join(self.dir, session.id), data, function(err) {
            if (!err) {
                if (self.cache[session.id] !== session) {
                    self.hook(session);
                    self.cache[session.id] = session;
                }
            }
            done(err, session);
        });
    });
};

module.exports = SessionStore;
