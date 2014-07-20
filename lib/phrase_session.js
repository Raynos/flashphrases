var deepCopy = require('deepcopy');
var deepExtend = require('deep-extend');
var forEach = require('for-each');
var groupBy = require('group-by');
var cached = require('./async_cached');
var inherits = require('inherits');
var CachedObject = require('./cached_object');
var Complexity = require('./complexity');
var Markov = require('./markov');
var PhraseResult = require('./phrase_result');
var Sample = require('./sample');
var Session = require('./session');
var util = require('util');
var varData = require('./var_data');

var loadMarkovMap = cached(function(id, callback) {
    varData.get(id, function(err, data) {
        if (err) return callback(err);
        var markovMap = Markov.makeMap(data);
        callback(null, markovMap);
    });
});

function sampleResultTimings(results) {
    return results.reduce(function(sample, result) {
        if (result.score.pass !== undefined) {
            sample.prompt.add(result.score.promptElapsed);
            sample.display.add(result.score.displayElapsed);
        }
        return sample;
    }, {
        prompt: new Sample(),
        display: new Sample()
    });
}

function PhraseSession(data) {
    if (!(this instanceof PhraseSession)) return new PhraseSession(data);
    Session.apply(this, arguments);
    this.complexity.on('change', this.levelChanged.bind(this));
}

PhraseSession.Defaults = {
    base: 10,
    baseTimeout: {
        display: 750,
        prompt: 2500
    },
    perLevel: 10,
    goalDistProp: 0.3,
    complexity: {
        lo: [1, 5],
        step: [1, 5],
        hi: [10, 50],
        initial: [2, 10]
    },
    corpus: 'gutenberg-upper-upto5'
};

inherits(PhraseSession, Session);

Session.registerType(PhraseSession);

PhraseSession.prototype.resultType = PhraseResult;

CachedObject.defineProperty(PhraseSession.prototype, 'levelResults', function() {
    var level = this.complexity.level;
    for (var i=this.results.length-1; i >= 0; i--)
        if (this.results[i].level !== level) break;
    return this.results.slice(i+1);
});

PhraseSession.prototype.computeLevelScore = function computeLevelScore() {
    var self = this;
    function calc() {
        var score = self.levelResults.reduce(function(totalValue, result) {
            var resultScore = result.score;
            return totalValue + (resultScore.done ? resultScore.value : 0);
        }, 0);
        if (score < 0 && self.complexity.level > 1) {
            self.complexity.level--;
            return calc();
        } else if (score > self.levelGoal && self.complexity.level < self.complexity.maxLevel) {
            self.complexity.level++;
            return calc();
        }
        return score;
    }
    return calc();
};

CachedObject.defineProperty(PhraseSession.prototype, 'levelScore', PhraseSession.prototype.computeLevelScore);

CachedObject.defineProperty(PhraseSession.prototype, 'levelGoal', function() {
    return this.complexity.level * this.base * this.perLevel;
});

CachedObject.defineProperty(PhraseSession.prototype, 'currentLevelTiming', function() {
    return sampleResultTimings(this.levelResults);
});

CachedObject.defineProperty(PhraseSession.prototype, 'levelTiming', function() {
    var levelResults = groupBy(this.results, function(result) {return result.level;});
    var byLevel = {};
    forEach(levelResults, function(results, level) {
        byLevel[level] = sampleResultTimings(results);
    });
    return byLevel;
});

CachedObject.defineProperty(PhraseSession.prototype, 'refLevel', function() {
    var level = this.complexity.level;
    var byLevel = this.levelTiming;
    for (var old=level; old>0; old--)
        if (byLevel[old]) return old;
    return null;
});

CachedObject.defineProperty(PhraseSession.prototype, 'refLevelTiming', function() {
    var refLevel = this.refLevel;
    var byLevel = this.levelTiming;
    if (refLevel && byLevel[refLevel])
        return byLevel[refLevel];
    return null;
});

CachedObject.defineProperty(PhraseSession.prototype, 'timeout', function() {
    // TODO: a more nuanced (at least age-sensitive) statistic would be better
    // than the simple sample hi-threshold approach below
    var self = this;
    function getTimeout(name) {
        var S = self.currentLevelTiming[name];
        if (S && !isNaN(S.hi)) return S.hi;
        var sample = this.refLevelTiming;
        if (sample) {
            S = sample[name];
            if (S && !isNaN(S.hi)) {
                return this.complexity.level * S.hi / this.refLevel;
            }
        }
        return self.complexity.level * self.baseTimeout[name];
    }
    return Object.keys(this.baseTimeout).reduce(function(timeout, name) {
        timeout[name] = Math.round(getTimeout(name));
        return timeout;
    }, {});
});

PhraseSession.prototype.clearCache = function() {
    CachedObject.prototype.clearCache.call(this);
    this._cache.levelScore = this.computeLevelScore();
};

PhraseSession.prototype.describe = function() {
    return util.format(
        'level %s (%s/%s = %s%%)',
        this.complexity.level,
        this.levelScore,
        this.levelGoal,
        (100 * this.levelScore / this.levelGoal).toFixed(2)
    );
};

PhraseSession.prototype.generatePhrase = function() {
    if (!this._markovMap) {
        throw new Error('no markovMap available to generate phrase');
    }
    var phrase = this._markovMap.generatePhrase.apply(this._markovMap, this.complexity.value);
    // TODO: make downcasing less hacky
    if (!!~this.corpus.indexOf('upper')) phrase = phrase.toLowerCase();
    return phrase;
};

PhraseSession.prototype.createResult = function(data) {
    data = data || {};
    if (!data.level) data.level = this.complexity.level;
    if (!data.phrase) data.phrase = this.generatePhrase();
    if (!data.baseValue) data.baseValue = this.base;
    if (!data.goalDistProp) data.goalDistProp = this.goalDistProp;
    var result = Session.prototype.createResult.call(this, data);
    result.levelScore = data.levelScore === undefined ? this.levelScore : data.levelScore;
    result.levelGoal = data.levelGoal === undefined ? this.levelGoal : data.levelGoal;
    return result;
};

PhraseSession.prototype.setData = function(data) {
    data = deepExtend(deepCopy(PhraseSession.Defaults), data || {});
    this.base = data.base;
    this.baseTimeout = data.baseTimeout;
    this.perLevel = data.perLevel;
    this.goalDistProp = data.goalDistProp;
    this.complexity = new Complexity(data.complexity);
    this.corpus = data.corpus;
    this._markovMap = null;
    Session.prototype.setData.call(this, data);
    loadMarkovMap(this.corpus, function(err, markovMap) {
        if (err) {
            console.log('failed to load markovMap:', err);
        } else {
            this._markovMap = markovMap;
        }
    }.bind(this));
};

PhraseSession.prototype.setResults = function(results) {
    Session.prototype.setResults.call(this, results);
    this.complexity.level = this.results.length ? this.results[this.results.length-1].level : 1;
};

PhraseSession.prototype.levelChanged = function levelChanged(/* old, level */) {
    this.clearCache();
    this.emit('change');
};

module.exports = PhraseSession;
module.exports.PhraseResult = PhraseResult;
