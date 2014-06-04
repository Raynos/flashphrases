var EE = require('events').EventEmitter;
var inherits = require('inherits');

var Complexity = require('./complexity');
var editdist = require('./editdist');

function Engine(options) {
    options = options || {};
    if (!options.complexity) throw new Error ('missing complexity');

    this.complexity = new Complexity(options.complexity);
    this.maxErrorPerWord = options.maxErrorPerWord || 1;
    this.history = [];
    this.levelScore = 0;
    this.resetLevel();
}

inherits(Engine, EE);

Engine.prototype.scoreResult = function scoreResult(result, force) {
    result.dist = editdist.lossy(result.got, result.expected);
    result.maxErrors = result.expected.split(/ +/)
        .map(function(word) {return Math.min(this.maxErrorPerWord, word.length);}.bind(this))
        .reduce(function(a, b) {return a + b;})
        ;
    result.correct = result.dist <= result.maxErrors;
    result.finished = force || result.correct;
    if (result.correct) {
        var diffDisplay = Math.max(0, result.timeout.display - result.elapsed.display);
        var diffInput = Math.max(0, result.timeout.input - result.elapsed.input);
        var diffError = result.maxErrors - result.dist;
        diffDisplay /= 100; // milli -> deci seconds
        diffInput /= 100; // milli -> deci seconds
        result.score = diffError + diffInput + diffDisplay;
    } else {
        result.score = 0;
    }
};

Engine.prototype.resetLevel = function resetLevel() {
    this.levelScore = 0;
    this.levelGoal = 2 + (2 * this.complexity.level) * 100;
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

    this.levelScore += result.score;
    if (this.levelScore > this.levelGoal) {
        this.complexity.level++;
        this.resetLevel();
    }

    var util = require('util');
    console.log(util.format(
        'level %s (%s/%s = %s%%)',
        this.complexity.level,
        this.levelScore, this.levelGoal,
        (100 * Math.round(this.levelScore) / this.levelGoal).toFixed(2)));
    console.log(result);
};

module.exports = Engine;
