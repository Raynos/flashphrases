var EE = require('events').EventEmitter;
var inherits = require('inherits');

var Complexity = require('./complexity');
var editdist = require('./editdist');

function Engine(options) {
    options = options || {};
    if (!options.complexity) throw new Error ('missing complexity');

    this.complexity = new Complexity(options.complexity);
    this.maxErrorRate = options.maxErrorRate || 0.3;
    this.history = [];
    this.levelScore = 0;
    this.complexity.on('change', this.resetLevel.bind(this));
    this.resetLevel();
}

inherits(Engine, EE);

Engine.prototype.scoreResult = function scoreResult(result, force) {
    var stripped = result.expected.replace(/ +/g, '');
    result.dist = editdist.lossy(result.got, result.expected);
    result.maxDist = Math.floor(this.maxErrorRate * stripped.length);
    result.correct = result.dist <= result.maxDist;
    result.finished = force || result.correct;
    result.score = this.calcScore(result);
    return result;
};

Engine.prototype.calcScore = function calcScore(result) {
    if (!result.correct) return 0;
    var diffDisplay = Math.max(0, result.timeout.display - result.elapsed.display);
    var diffInput = Math.max(0, result.timeout.input - result.elapsed.input);
    var diffError = result.maxDist - result.dist;
    diffDisplay /= 100; // milli -> deci seconds
    diffInput /= 100; // milli -> deci seconds
    return diffError + diffInput + diffDisplay;
};

Engine.prototype.resetLevel = function resetLevel() {
    this.levelScore = 0;
    this.levelGoal = (2 + 2 * this.complexity.level) * 100;
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

    var util = require('util');
    console.log(util.format(
        'level %s +%s => (%s/%s = %s%%)',
        this.complexity.level,
        result.score,
        this.levelScore, this.levelGoal,
        (100 * Math.round(this.levelScore) / this.levelGoal).toFixed(2)));
};

module.exports = Engine;
