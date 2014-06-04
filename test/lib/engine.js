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
    assert.equal(eng.levelGoal, 202, 'correct level 1 goal');
    assert.end();
});
