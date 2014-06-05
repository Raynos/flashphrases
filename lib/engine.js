var EE = require('events').EventEmitter;
var inherits = require('inherits');

var Complexity = require('./complexity');
var editdist = require('./editdist');
var Sample = require('./sample');

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
}

inherits(Engine, EE);

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

    var util = require('util');
    console.log(util.format(
        'level %s +%s => (%s/%s = %s%%)',
        this.complexity.level,
        result.score,
        this.levelScore, this.levelGoal,
        (100 * Math.round(this.levelScore) / this.levelGoal).toFixed(2)));
};

module.exports = Engine;
