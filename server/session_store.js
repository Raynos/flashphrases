var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var nextTick = process.nextTick;
var resolveData = require('../lib/data').resolveData;

function SessionStore(dir, sessionType) {
    this.cache = {};
    this.saving = {};
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
        var saving = self.saving[session.id];
        if (saving && saving.length) return;
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
    var dirPath = path.join(this.dir, id);
    var session = this.cache[id];
    if (session) {
        return nextTick(function() {
            done(null, self.cache[id]);
        });
    }
    load();
    function load() {
        fs.readFile(dirPath, function(err, buf) {
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
    }
};

SessionStore.prototype.save = function(session, done) {
    var saving = this.saving[session.id];
    if (saving) {
        saving.push(done);
        return;
    }
    saving = this.saving[session.id] = [];
    var self = this;
    var data = JSON.stringify(resolveData(session), null, 2);
    var dirPath = path.join(self.dir, session.id);
    if (self.cache[session.id] !== session) {
        self.hook(session);
        self.cache[session.id] = session;
    }
    mkdirp(self.dir, function(err) {
        if (err) return done(err, session);
        fs.writeFile(dirPath, data, function(err) {
            done(err, session);
            delete self.saving[session.id];
            if (saving.length) {
                nextTick(function() {
                    self.save(session, function(err, session) {
                        for (var i=0, n=saving.length; i<n; i++) saving[i](err, session);
                    });
                });
            }
        });
    });
};

module.exports = SessionStore;
