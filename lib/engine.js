var cookie = require('cookie-cutter');
var EE = require('events').EventEmitter;
var inherits = require('inherits');
var util = require('util');
var xhr = require('xhr');

var Complexity = require('./complexity');
var editdist = require('./editdist');
var Sample = require('./sample');
var Session = require('./session');

function Engine(options) {
    options = options || {};
    if (!options.complexity) throw new Error ('missing complexity');

    this.base = options.base || 10;
    this.perLevel = options.perLevel || 10;
    this.complexity = new Complexity(options.complexity);
    this.maxErrorRate = options.maxErrorRate || 0.3;
    this.history = [];
    this.levelScore = 0;
    this.levelInputSample = new Sample();
    this.levelDisplaySample = new Sample();
    this.complexity.on('change', this.levelChanged.bind(this));
    this.resetLevel();

    if (options.sessionCookie) {
        this.sessionCookie = options.sessionCookie;
        this.loadOrCreateSession();
    } else {
        this.session = new Session();
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

Engine.prototype.createSession = function createSession() {
    var self = this;
    xhr({
        method: 'PUT',
        uri: '/create',
        json: true
    }, function(err, resp, session) {
        if (err) return self.emit('error', err);
        cookie.set(self.sessionCookie, session.id);
        self.session = new Session(session);
        self.emit('ready');
    });
};

Engine.prototype.loadSession = function loadSession(key) {
    var self = this;
    xhr({
        method: 'GET',
        uri: '/' + key,
        json: true
    }, function(err, resp, session) {
        if (err) {
            if (err.message === 'not found') {
                return self.createSession();
            } else {
                return self.emit('error', err);
            }
        }
        if (self.session && self.session.id === session.id) {
            self.session.setData(session);
        } else {
            self.session = new Session(session);
        }
        self.emit('ready');
    });
};

Engine.prototype.scoreResult = function scoreResult(result, force) {
    result.level = this.complexity.level;
    var stripped = result.expected.replace(/ +/g, '');
    result.dist = editdist.lossy(result.got, result.expected);
    result.errorRate = result.dist / stripped.length;
    result.maxDist = Math.floor(this.maxErrorRate * stripped.length);
    result.correct = result.dist <= result.maxDist;
    result.finished = force || result.correct;
    result.score = this.calcScore(result);
    return result;
};

Engine.prototype.calcScore = function calcScore(result) {
    if (!result.correct) return 0;
    var displayFactor = Math.max(1, 2 - result.elapsed.display / result.timeout.display);
    var inputFactor = Math.max(1, 2 - result.elapsed.input / result.timeout.input);
    var errorFactor = Math.max(1, 2 - result.errorRate / this.maxErrorRate);
    return Math.round((this.base - 0.5) * displayFactor * inputFactor * errorFactor);
};

Engine.prototype.levelChanged = function levelChanged(old, level) {
    var factor = level / old;
    var input = this.levelInputSample.hi;
    var display = this.levelDisplaySample.hi;
    if (!isNaN(input)) this.emit('setTimeout', 'input', Math.round(input * factor));
    if (!isNaN(display)) this.emit('setTimeout', 'display', Math.round(display * factor));
    this.resetLevel();
};

Engine.prototype.resetLevel = function resetLevel() {
    this.levelScore = 0;
    this.levelGoal = (this.complexity.level + 1) * this.base * this.perLevel;
    this.levelInputSample = new Sample();
    this.levelDisplaySample = new Sample();
};

Engine.prototype.onResult = function onResult(result) {
    // TODO: prune and/or archive history?
    this.history.push(result);

    var k = 3; // TODO setting

    var lastK = this.history.slice(-k);
    var lastKExpired = lastK
        .reduce(function(allExpired, result) {
            return allExpired && Boolean(result.expired);
        }, lastK.length >= k);
    if (lastKExpired) return this.emit('idle');

    // TODO: adjust dispalyTime and inputTime in addition to complexity

    if (isNaN(result.score)) {
        console.error('bogus result', result);
        return;
    }

    this.levelScore += result.score;
    if (this.levelScore > this.levelGoal) this.complexity.level++;

    if (result.correct) {
        this.levelInputSample.add(result.elapsed.input);
        this.levelDisplaySample.add(result.elapsed.display);
        var input = this.levelInputSample.hi;
        var display = this.levelDisplaySample.hi;
        if (!isNaN(input)) this.emit('setTimeout', 'input', input);
        if (!isNaN(display)) this.emit('setTimeout', 'display', display);
    }

    console.log(util.format('+%s -- %s', result.score, this.describe()));
};

Engine.prototype.describe = function() {
    return util.format(
        'level %s (%s/%s = %s%%)',
        this.complexity.level,
        this.levelScore,
        this.levelGoal,
        (100 * this.levelScore / this.levelGoal).toFixed(2)
    );
};

module.exports = Engine;
