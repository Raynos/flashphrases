var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var nextTick = process.nextTick;

var Session = require('../lib/session');

function SessionStore(dir) {
    this.cache = {};
    this.dir = dir;
}

SessionStore.prototype.keys = function(done) {
    fs.readdir(this.dir, done);
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
        var session = new Session(data);
        self.cache[session.id] = session;
        done(null, session);
    });
};

SessionStore.prototype.save = function(session, done) {
    var self = this;
    mkdirp(self.dir, function(err) {
        if (err) return done(err, session);
        var data = JSON.stringify(session.getData());
        fs.writeFile(path.join(self.dir, session.id), data, function(err) {
            if (err) return done(err, session);
            if (self.cache[session.id] !== session) {
                self.cache[session.id] = session;
            }
            done(err, session);
        });
    });
};

module.exports = SessionStore;
