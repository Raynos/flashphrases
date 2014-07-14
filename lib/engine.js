var cookie = require('cookie-cutter');
var deepCopy = require('deepcopy');
var deepExtend = require('deep-extend');
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
    this.defaultSessionOptions = options.session || {};

    if (!options.complexity) throw new Error ('missing complexity');
    if (!options.generate) throw new Error('missing generate');

    this.now = options.now || Date.now;
    this.base = options.base || 10;
    this.perLevel = options.perLevel || 10;
    this.complexity = new Complexity(options.complexity);
    this.maxErrorRate = options.maxErrorRate || 0.3;
    this.levelScore = 0;
    this.levelInputSample = new Sample();
    this.levelDisplaySample = new Sample();
    this.complexity.on('change', this.levelChanged.bind(this));
    this.generateFunc = options.generate;
    this.resetLevel();

    if (options.sessionCookie) {
        this.sessionCookie = options.sessionCookie;
        this.loadOrCreateSession();
    } else {
        this.session = Session(this.defaultSessionOptions);
        this.hookSession(this.session);
    }
}

inherits(Engine, EE);

Engine.prototype.generate = function() {
    return this.generateFunc.apply(this, this.complexity.value);
};

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
        self.initFromSession();
        self.emit('ready');
    });
};

Engine.prototype.initFromSession = function() {
    this.resetLevel();
    var self = this;
    this.session.results.forEach(function(result) {
        if (result.level !== self.complexity.level) {
            self.complexity.level = result.level;
        }
        self.levelScore += result.score;
        if (result.correct) {
            self.levelInputSample.add(result.elapsed.input);
            self.levelDisplaySample.add(result.elapsed.display);
        }
    });
    self.updateTimeouts();
    console.log('continuing at %s', this.describe());
};

Engine.prototype.hookSession = function hookSession(session) {
    var self = this;
    session.on('resultAdd', function(result) {
        if (this.sessionCookie) {
            xhr({
                method: 'PUT',
                uri: '/session/' + self.session.id + '/result',
                json: result
            }, function(err) {
                // TODO: re-send
                if (err) console.error('failed to add result:', err);
            });
        }
    });
};

Engine.prototype.scoreResult = function scoreResult(result, force) {
    result.doneAt = this.now();
    result.forced = Boolean(force);
    result.elapsed.input = result.doneAt - result.inputShownAt;
    result.elapsed.display = result.inputShownAt - result.displayedAt;
    result.level = this.complexity.level;
    if (result.expected !== null) {
        var stripped = result.expected.replace(/ +/g, '');
        if (result.got !== null) {
            result.dist = editdist.lossy(result.got, result.expected);
            result.errorRate = result.dist / stripped.length;
            result.maxDist = Math.floor(this.maxErrorRate * stripped.length);
            result.correct = result.dist <= result.maxDist;
        }
    }
    result.finished = Boolean(force || result.correct);
    if (result.finished) result.finishedAt = this.now();
    result.score = this.calcScore(result);
    return result.finished;
};

Engine.prototype.calcScore = function calcScore(result) {
    if (!result.correct) return 0;
    result.displayFactor = Math.max(1, 2 - result.elapsed.display / result.timeout.display);
    result.inputFactor = Math.max(1, 2 - result.elapsed.input / result.timeout.input);
    result.errorFactor = Math.max(1, 2 - result.errorRate / this.maxErrorRate);
    return Math.round((this.base - 0.5) * result.displayFactor * result.inputFactor * result.errorFactor);
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
    var k = 3; // TODO setting
    var lastK = this.session.results.slice(-k);
    var lastKExpired = lastK
        .reduce(function(allExpired, result) {
            return allExpired && Boolean(result.expired);
        }, lastK.length >= k);
    if (lastKExpired) return this.emit('idle');

    if (isNaN(result.score)) {
        console.error('bogus result', result);
        return;
    }

    this.levelScore += result.score;
    if (this.levelScore > this.levelGoal) this.complexity.level++;

    if (result.correct) {
        this.levelInputSample.add(result.elapsed.input);
        this.levelDisplaySample.add(result.elapsed.display);
        this.updateTimeouts();
    }

    if (!(result.correct === undefined || result.correct === null)) {
        console.log(util.format('+%s -- %s', result.score, this.describe()));
        this.session.addResult(result);
    }
};

Engine.prototype.updateTimeouts = function() {
    var input = this.levelInputSample.hi;
    var display = this.levelDisplaySample.hi;
    if (!isNaN(input)) this.emit('setTimeout', 'input', input);
    if (!isNaN(display)) this.emit('setTimeout', 'display', display);
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
