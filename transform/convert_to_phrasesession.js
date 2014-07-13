var extend = require('xtend/mutable');
var inherits = require('inherits');
var EE = require('../lib/event_stream_emitter');
var PhraseSession = require('../lib/phrase_session');
var resolveData = require('../lib/data').resolveData;

module.exports = convertToPhrasesession;

var Expected = {
    correct: true,
    displayFactor: true,
    displayedAt: true,
    dist: true,
    doneAt: true,
    elapsed: true,
    errorFactor: true,
    errorRate: true,
    expected: true,
    expired: true,
    finished: true,
    finishedAt: true,
    forced: true,
    got: true,
    inputFactor: true,
    inputShownAt: true,
    level: true,
    maxDist: true,
    score: true,
    timeout: true
};

convertToPhrasesession.alwaysReturns = true;
convertToPhrasesession.inplace = true;
convertToPhrasesession.sessionType = LegacySession;

function LegacySession(data) {
    if (!(this instanceof LegacySession)) {
        return new LegacySession(data);
    }
    extend(this, data);
}

inherits(LegacySession, EE);

LegacySession.prototype.getData = function() {
    return resolveData(this);
};

function convertToPhrasesession(session) {
    return new PhraseSession({
        id: session.id,
        base: 10,
        perLevel: 10,
        goalDistProp: 0.3,
        complexity: {
            initial: [2, 10],
            step: [1, 5],
            lo: [2, 10],
            hi: [10, 50]
        },
        results: session.results.map(function(result) {
            var events = [
                {
                    name: "display",
                    now: result.displayedAt,
                    timeout: result.timeout.display
                },
                {
                    name: "prompt",
                    now: result.inputShownAt,
                    timeout: result.timeout.input
                },
                {
                    name: "input",
                    now: result.doneAt || (result.inputShownAt + result.elapsed.input),
                    got: result.got
                }
            ];
            if (result.finished) {
                events.push({
                    name: "submit",
                    now: result.finishedAt || (result.inputShownAt + result.elapsed.input),
                    expired: result.expired,
                    forced: result.forced
                });
            }
            var unexpected = Object.keys(result).filter(function(key) {return !Expected[key];});
            if (unexpected.length) console.log('unexpected keys', unexpected);
            return {
                phrase: result.expected,
                level: result.level,
                events: events
            };
        })
    });
}
