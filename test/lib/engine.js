var test = require('tape');

var Engine = require('../../lib/engine');

test('Engine construction', function(assert) {
    var eng = new Engine({
        complexity: {
            initial: [2, 8],
            step: [1, 4],
            lo: [2, 8],
            hi: [8, 32],
        }
    });
    assert.equal(eng.complexity.level, 1, 'start at level 1');
    assert.deepEqual(eng.history, [], 'no history');
    assert.equal(eng.levelScore, 0, 'no score');
    assert.equal(eng.levelGoal, 200, 'correct level 1 goal');
    assert.end();
});

test('Engine tracks complexity level', function(assert) {
    var eng = new Engine({
        complexity: {
            initial: [2, 8],
            step: [1, 4],
            lo: [2, 8],
            hi: [8, 32],
        }
    });

    eng.levelScore = 42;
    eng.complexity.level++;
    assert.equal(eng.complexity.level, 2, 'start at level 1');
    assert.equal(eng.levelScore, 0, 'no score');
    assert.equal(eng.levelGoal, 300, 'correct level 2 goal');

    eng.levelScore = 42;
    eng.complexity.level++;
    assert.equal(eng.complexity.level, 3, 'start at level 1');
    assert.equal(eng.levelScore, 0, 'no score');
    assert.equal(eng.levelGoal, 400, 'correct level 3 goal');

    eng.levelScore = 42;
    eng.complexity.level = 1;
    assert.equal(eng.complexity.level, 1, 'start at level 1');
    assert.equal(eng.levelScore, 0, 'no score');
    assert.equal(eng.levelGoal, 200, 'correct level 1 goal');

    assert.end();
});

function fillna(obj, fill) {
    if (Array.isArray(obj)) {
        return obj.map(function(val) {return fillna(val, fill);});
    } else if (typeof obj === 'object') {
        var r = {};
        Object.keys(obj).forEach(function(key) {
            r[key] = fillna(obj[key], fill);
        });
        return r;
    } else if (typeof obj === 'number' && isNaN(obj)) {
        return fill;
    } else {
        return obj;
    }
}

test('Engine.scoreResult', function(assert) {
    var eng = new Engine({
        complexity: {
            initial: [2, 8],
            step: [1, 4],
            lo: [2, 8],
            hi: [8, 32],
        },
        maxErrorRate: 0.3,
        now: function() {return 42;}
    });

    [
        {
            desc: 'initially',
            result: {
                timeout: {
                    display: 1500,
                    input: 10000
                },
                elapsed: {
                    display: NaN,
                    input: NaN
                },
                expected: 'alpha bravo gamma',
                got: ''
            },
            expected: {
                doneAt: 42,
                forced: false,
                timeout: {
                    display: 1500,
                    input: 10000
                },
                elapsed: {
                    display: 0,
                    input: 0
                },
                expected: 'alpha bravo gamma',
                got: '',
                errorRate: 1,
                level: 1,
                dist: 15,
                maxDist: 4,
                correct: false,
                finished: false,
                score: 0
            }
        },

        {
            desc: 'displayed',
            result: {
                inputShownAt: 100,
                displayedAt: 33,
                timeout: {
                    display: 1500,
                    input: 10000
                },
                elapsed: {
                    display: NaN,
                    input: NaN
                },
                expected: 'alpha bravo gamma',
                got: ''
            },
            expected: {
                doneAt: 42,
                inputShownAt: 100,
                displayedAt: 33,
                forced: false,
                timeout: {
                    display: 1500,
                    input: 10000
                },
                elapsed: {
                    display: 67,
                    input: -58
                },
                expected: 'alpha bravo gamma',
                got: '',
                errorRate: 1,
                level: 1,
                dist: 15,
                maxDist: 4,
                correct: false,
                finished: false,
                score: 0
            }
        },

        {
            desc: 'inputing',
            result: {
                inputShownAt: 100,
                displayedAt: 33,
                timeout: {
                    display: 1500,
                    input: 10000
                },
                elapsed: {
                    display: NaN,
                    input: NaN
                },
                expected: 'alpha bravo gamma',
                got: ''
            },
            expected: {
                inputShownAt: 100,
                displayedAt: 33,
                doneAt: 42,
                forced: false,
                timeout: {
                    display: 1500,
                    input: 10000
                },
                elapsed: {
                    display: 67,
                    input: -58
                },
                expected: 'alpha bravo gamma',
                got: '',
                errorRate: 1,
                level: 1,
                dist: 15,
                maxDist: 4,
                correct: false,
                finished: false,
                score: 0
            }
        },

        {
            desc: 'some input',
            result: {
                inputShownAt: 100,
                displayedAt: 33,
                timeout: {
                    display: 1500,
                    input: 10000
                },
                elapsed: {
                    display: NaN,
                    input: NaN
                },
                expected: 'alpha bravo gamma',
                got: 'alpha b',
            },
            expected: {
                inputShownAt: 100,
                displayedAt: 33,
                doneAt: 42,
                forced: false,
                timeout: {
                    display: 1500,
                    input: 10000
                },
                elapsed: {
                    display: 67,
                    input: -58
                },
                expected: 'alpha bravo gamma',
                got: 'alpha b',
                errorRate: 0.6,
                level: 1,
                dist: 9,
                maxDist: 4,
                correct: false,
                finished: false,
                score: 0
            }
        },

        {
            desc: 'enough input',
            result: {
                inputShownAt: 100,
                displayedAt: 33,
                timeout: {
                    display: 1500,
                    input: 10000
                },
                elapsed: {
                    display: NaN,
                    input: NaN
                },
                expected: 'alpha bravo gamma',
                got: 'alpha brvo gam',
            },
            expected: {
                inputShownAt: 100,
                displayedAt: 33,
                doneAt: 42,
                forced: false,
                timeout: {
                    display: 1500,
                    input: 10000
                },
                elapsed: {
                    display: 67,
                    input: -58
                },
                expected: 'alpha bravo gamma',
                got: 'alpha brvo gam',
                errorRate: 0.2,
                level: 1,
                dist: 3,
                maxDist: 4,
                correct: true,
                finished: true,
                finishedAt: 42,
                score: 50
            }
        },

        {
            desc: 'aborted',
            result: {
                inputShownAt: 100,
                displayedAt: 33,
                timeout: {
                    display: 1500,
                    input: 10000
                },
                elapsed: {
                    display: 1000,
                    input: 500
                },
                expected: 'alpha bravo gamma',
                got: 'wat',
            },
            force: true,
            expected: {
                inputShownAt: 100,
                displayedAt: 33,
                doneAt: 42,
                forced: true,
                timeout: {
                    display: 1500,
                    input: 10000
                },
                elapsed: {
                    display: 67,
                    input: -58
                },
                expected: 'alpha bravo gamma',
                got: 'wat',
                errorRate: 14/15,
                level: 1,
                dist: 14,
                maxDist: 4,
                correct: false,
                finished: true,
                finishedAt: 42,
                score: 0
            }
        },
    ].forEach(function(testCase) {
        var result = testCase.result;
        eng.scoreResult(result, testCase.force);
        result = fillna(result, 0);
        assert.deepEqual(result, testCase.expected, testCase.desc);
    });

    assert.end();
});
