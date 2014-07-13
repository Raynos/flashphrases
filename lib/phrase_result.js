var CachedObject = require('./cached_object');
var inherits = require('inherits');
var editdist = require('./editdist');
var Match = require('./match');
var Result = require('./result');
var resolveData = require('./data').resolveData;

function norm(s) {
    s = s.replace(/\s+/g, '');
    s = s.toUpperCase();
    return s;
}

function PhraseResult(data) {
    if (!(this instanceof PhraseResult)) return new PhraseResult(data);
    Result.call(this, data);
}

inherits(PhraseResult, Result);

PhraseResult.prototype.getData = function(minimal) {
    var data = resolveData(this);
    if (!minimal) data.score = this.score;
    return data;
};

PhraseResult.Defaults = {
    level: 1,
    baseValue: 1,
    goalDistProp: 0.1
};

PhraseResult.prototype.setData = function(data) {
    this.level = data.level || PhraseResult.Defaults.level;
    this.phrase = data.phrase || '';
    this.baseValue = data.baseValue || PhraseResult.Defaults.baseValue;
    this.goalDistProp = data.goalDistProp || PhraseResult.Defaults.goalDistProp;
    Result.prototype.setData.call(this, data);
    if (data.score) this._cache.score = data.score;
};

PhraseResult.sessionPattern = Match.compile(['merge',
    ['group', {name: 'display'}, 'display'],
    ['opt',
        ['group', {name: 'prompt'}, 'prompt'],
        ['group', ['star', {name: 'input'}], 'input'],
    ],
    ['group', ['opt', {name: Match.Atom.oneOf('abandon', 'abort', 'expire', 'judge', 'submit')}], 'done']
]);

PhraseResult.prototype.matchSession = function matchSession(events) {
    events = events || this.events;
    var match = Match.execRight(PhraseResult.sessionPattern, events);
    return match ? match.data : null;
};

CachedObject.defineProperty(PhraseResult.prototype, 'session', PhraseResult.prototype.matchSession);

PhraseResult.prototype.calcScore = function calcScore(session) {
    var score = {
        expected: norm(this.phrase),
        value: 0
    };

    session = session || this.session;
    if (!session) return score;

    if (!session.display) return score;
    score.displayTimeout = session.display.timeout;

    if (!session.prompt) return score;
    score.promptTimeout = session.prompt.timeout;
    score.displayElapsed = session.prompt.now - session.display.now;

    score.displayFactor = 1 - score.displayElapsed / score.displayTimeout;
    score.displayValue = Math.ceil(this.baseValue * score.displayFactor);
    score.value += score.displayValue;

    if (session.input.length) {
        score.got = norm(session.input[session.input.length-1].got);
        score.dist = editdist(score.expected, score.got);
        score.distProp = score.dist / score.expected.length;
        score.distFactor = Math.max(-2, 2 - score.distProp / this.goalDistProp);
        score.distValue = Math.ceil(this.baseValue * score.distFactor);
        score.value += score.distValue;
    }

    if (!session.done) return score;
    var doneAt = session.done.now;
    switch (session.done.name) {
        // TODO: case 'abort': ?
        // TODO: case 'abandon': ?
        // TODO: case 'expire': ?
        case 'judge':
        case 'submit':
            var last = session.input && session.input[session.input.length-1];
            if (last) doneAt = last.now;
            break;
    }
    score.promptElapsed = doneAt - session.prompt.now;
    score.promptFactor = 1 - score.promptElapsed / score.promptTimeout;
    score.promptValue = Math.ceil(this.baseValue * score.promptFactor);
    score.value += score.promptValue;

    score.pass = score.value > 0;

    return score;
};

CachedObject.defineProperty(PhraseResult.prototype, 'score', PhraseResult.prototype.calcScore);

module.exports = PhraseResult;
