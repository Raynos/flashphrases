var hyperscript = require('hyperscript');
var mercury = require('mercury');
var h = mercury.h;
var editdist = require('../lib/editdist');
var inherits = require('inherits');
var ResultsBase = require('./results_base');

function Results() {
    this.element = hyperscript('div');
    ResultsBase.call(this);

    this.state = mercury.struct({
        results: mercury.array([], createResult)
    });

    mercury.app(this.element, this.state, render);

    function createResult(result) {
        return mercury.struct({
            level: mercury.value(result.level),
            session: mercury.struct({
                done: mercury.struct({
                    name: mercury.value(
                        result.session &&
                        result.session.done &&
                        result.session.done.name)
                })
            }),
            score: mercury.struct({
                value: mercury.value(result.score.value)
            }),
            phrase: mercury.value(result.phrase),
            got: mercury.value(result.got)
        });
    }
}

inherits(Results, ResultsBase);

var ops = {};
ops[editdist.SAME] = 'same';
ops[editdist.CHANGE] = 'change';
ops[editdist.DELETE] = 'delete';
ops[editdist.INSERT] = 'insert';

function groupby(key, a) {
    var r = [], g = null;
    for (var i=0, n=a.length; i<n; i++) {
        var item = a[i];
        var keyval = key(item, i, a);
        if (!g || g.key !== keyval) r.push(g = {key: keyval, items: []});
        g.items.push(item);
    }
    return r;
}

Results.prototype.setState = function (session) {
    this.state.results.set(session.results);
};

Results.prototype.update = function () {
    this.setState(this.session);
};

function render(state) {
    var resultsByLevel = computeResultsByLevel(state.results);

    return h('div.results', resultsByLevel.map(function (level) {
        return h('fieldset.level', [
            h('legend', 'Level ' + level.key),
            h('ul', level.items.map(renderResult))
        ]);
    }));

    function renderResult(result) {
        return h('li.result', [
            h('div.score', {
                className: scoreClassName(result)
            }, scoreText(result)),
            h('div.phrase', phraseSegments(result).map(renderStep))
        ]);
    }

    function renderStep(step) {
        if (step.op) {
            return h('span.edit', {
                className: step.op
            }, step.value);
        }

        return step.value;
    }
}

function computeResultsByLevel(results) {
    var relevantResults = results
        .filter(function(result) {
            if (!result.session || !result.session.done) return false;
            switch (result.session.done.name) {
                case 'abandon':
                case 'abort':
                    return false;
            }
            return true;
        })
        .reverse();

    var resultsByLevel = groupby(function (result) {
        return result.level;
    }, relevantResults);

    return resultsByLevel;
}

function phraseSegments(result) {
    var phrase = result.phrase;
    var got = result.got;

    if (!got || !result) {
        return [];
    }

    var trace = editdist.trace(phrase, got).edit;

    return trace.map(function (step) {
        if (step[0] === editdist.SAME) {
            return { value: phrase[step[1]] };
        }

        var value = (step[0] === editdist.INSERT ?
            got[step[2]] : phrase[step[1]]);

        return { op: ops[step[0]], value: value };
    });
}

function scoreClassName(result) {
    var value = result.score.value;
    var v = Math.max(0, Math.min(1, value / 20 + 0.5));
    
    return 'v' + Math.round(v * 10)
        .toString(16).toUpperCase();
}

function scoreText(result) {
    var value = result.score.value;

    return (value < 0 ? '-' : '+') + Math.abs(value);
}

module.exports = Results;
