var cookie = require('cookie-cutter');
var deepCopy = require('deepcopy');
var deepExtend = require('deep-extend');
var EE = require('events').EventEmitter;
var inherits = require('inherits');
var resolveData = require('./data').resolveData;
var util = require('util');
var xhr = require('xhr');

var Session = require('./session');

function Engine(options) {
    options = options || {};
    this.defaultSessionOptions = options.session || {};
    if (options.sessionCookie) {
        this.sessionCookie = options.sessionCookie;
        this.loadOrCreateSession();
    } else {
        this.session = Session(this.defaultSessionOptions);
        this.hookSession(this.session);
    }
}

inherits(Engine, EE);

Engine.prototype.loadOrCreateSession = function loadOrCreateSession(key) {
    key = key || cookie.get(this.sessionCookie);
    if (key) {
        this.loadSession(key);
    } else {
        this.createSession();
    }
};

Engine.prototype.createSession = function createSession(options) {
    options = deepExtend(deepCopy(this.defaultSessionOptions), options || {});
    var self = this;
    xhr({
        method: 'PUT',
        uri: '/session/create',
        json: options
    }, function(err, resp, session) {
        if (err) return self.emit('error', err);
        cookie.set(self.sessionCookie, session.id);
        self.session = Session(session);
        self.hookSession(self.session);
        self.emit('ready');
    });
};

Engine.prototype.loadSession = function loadSession(key) {
    var self = this;
    xhr({
        method: 'GET',
        uri: '/session/' + key,
        json: true
    }, function(err, resp, session) {
        if (err) {
            if (err.statusCode === 404) {
                return self.createSession();
            } else {
                return self.emit('error', err);
            }
        }
        if (self.session && self.session.id === session.id) {
            self.session.setData(session);
        } else {
            self.session = Session(session);
            self.hookSession(self.session);
        }
        self.emit('ready');
    });
};

Engine.prototype.hookSession = function hookSession(session) {
    session.on('resultAdd', this.onResultAdded.bind(this, session));
};

Engine.prototype.hookResult = function hookResult(session, result) {
    result.on('eventAdd', this.onResultEventAdded.bind(this, session, result));
};

Engine.prototype.onResultAdded = function onResultAdded(session, result) {
    if (this.sessionCookie) {
        xhr({
            method: 'PUT',
            uri: '/session/' + session.id + '/result/add',
            json: resolveData(result)
        }, function(err) {
            // TODO: re-send
            if (err) console.error('failed to add result:', err);
        });
    }
    if (this.session.type !== 'legacy') {
        this.hookResult(session, result);
    }
};

Engine.prototype.onResultEventAdded = function onResultEventAdded(session, result, event) {
    if (this.sessionCookie) {
        xhr({
            method: 'PUT',
            uri: util.format('/session/%s/result/%s/event/add', session.id, result.id),
            json: resolveData(event)
        }, function(err) {
            // TODO: re-send
            if (err) console.error('failed to add result event:', err);
        });
    }
};

module.exports = Engine;
