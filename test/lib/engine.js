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
    assert.equal(eng.levelGoal, 400, 'correct level 1 goal');
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
    assert.equal(eng.levelGoal, 600, 'correct level 2 goal');

    eng.levelScore = 42;
    eng.complexity.level++;
    assert.equal(eng.complexity.level, 3, 'start at level 1');
    assert.equal(eng.levelScore, 0, 'no score');
    assert.equal(eng.levelGoal, 800, 'correct level 3 goal');

    eng.levelScore = 42;
    eng.complexity.level = 1;
    assert.equal(eng.complexity.level, 1, 'start at level 1');
    assert.equal(eng.levelScore, 0, 'no score');
    assert.equal(eng.levelGoal, 400, 'correct level 1 goal');

    assert.end();
});

test('Engine.scoreResult', function(assert) {
    var eng = new Engine({
        complexity: {
            initial: [2, 8],
            step: [1, 4],
            lo: [2, 8],
            hi: [8, 32],
        },
        maxErrorPerWord: 2
    });

    assert.deepEqual(eng.scoreResult({
        timeout: {
            display: 1500,
            input: 10000
        },
        elapsed: {},
        expected: 'alpha bravo gamma',
        got: ''
    }), {
        timeout: {
            display: 1500,
            input: 10000
        },
        elapsed: {},
        expected: 'alpha bravo gamma',
        got: '',
        dist: 15,
        maxErrors: 6,
        correct: false,
        finished: false,
        score: 0
    }, 'initially');

    assert.deepEqual(eng.scoreResult({
        timeout: {
            display: 1500,
            input: 10000
        },
        elapsed: {
            display: 1000
        },
        expected: 'alpha bravo gamma',
        got: ''
    }), {
        timeout: {
            display: 1500,
            input: 10000
        },
        elapsed: {
            display: 1000
        },
        expected: 'alpha bravo gamma',
        got: '',
        dist: 15,
        maxErrors: 6,
        correct: false,
        finished: false,
        score: 0
    }, 'displayed');

    assert.deepEqual(eng.scoreResult({
        timeout: {
            display: 1500,
            input: 10000
        },
        elapsed: {
            display: 1000,
            input: 0
        },
        expected: 'alpha bravo gamma',
        got: ''
    }), {
        timeout: {
            display: 1500,
            input: 10000
        },
        elapsed: {
            display: 1000,
            input: 0
        },
        expected: 'alpha bravo gamma',
        got: '',
        dist: 15,
        maxErrors: 6,
        correct: false,
        finished: false,
        score: 0
    }, 'inputing');

    assert.deepEqual(eng.scoreResult({
        timeout: {
            display: 1500,
            input: 10000
        },
        elapsed: {
            display: 1000,
            input: 200
        },
        expected: 'alpha bravo gamma',
        got: 'alpha b',
    }), {
        timeout: {
            display: 1500,
            input: 10000
        },
        elapsed: {
            display: 1000,
            input: 200
        },
        expected: 'alpha bravo gamma',
        got: 'alpha b',
        dist: 9,
        maxErrors: 6,
        correct: false,
        finished: false,
        score: 0
    }, 'some input');

    assert.deepEqual(eng.scoreResult({
        timeout: {
            display: 1500,
            input: 10000
        },
        elapsed: {
            display: 1000,
            input: 500
        },
        expected: 'alpha bravo gamma',
        got: 'alpha brvo g',
    }), {
        timeout: {
            display: 1500,
            input: 10000
        },
        elapsed: {
            display: 1000,
            input: 500
        },
        expected: 'alpha bravo gamma',
        got: 'alpha brvo g',
        dist: 5,
        maxErrors: 6,
        correct: true,
        finished: true,
        score: 101 // (6 - 5) + (10000 - 500) / 100 + (1500 - 1000) / 100
    }, 'enough input');

    assert.deepEqual(eng.scoreResult({
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
    }, true), {
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
        dist: 14,
        maxErrors: 6,
        correct: false,
        finished: true,
        score: 0
    }, 'aborted');

    assert.end();
});
