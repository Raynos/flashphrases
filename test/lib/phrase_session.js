var test = require('tape');

var Session = require('../../lib/session');
require('../../lib/phrase_session');

test('PhraseSession construction', function phraseSessionConstruction(assert) {
    var sess = Session({
        type: 'phrase_session',
        complexity: {
            initial: [2, 8],
            step: [1, 4],
            lo: [2, 8],
            hi: [8, 32],
        }
    });
    assert.equal(sess.complexity.level, 1, 'start at level 1');
    assert.deepEqual(sess.results, [], 'no session results');
    assert.equal(sess.levelScore, 0, 'no score');
    assert.equal(sess.levelGoal, 200, 'correct level 1 goal');
    assert.end();
});

test('PhraseSession tracks complexity level', function phraseSessionComplexity(assert) {
    var sess = Session({
        type: 'phrase_session',
        complexity: {
            initial: [2, 8],
            step: [1, 4],
            lo: [2, 8],
            hi: [8, 32],
        }
    });

    sess.levelScore = 42;
    sess.complexity.level++;
    assert.equal(sess.complexity.level, 2, 'start at level 1');
    assert.equal(sess.levelScore, 0, 'no score');
    assert.equal(sess.levelGoal, 300, 'correct level 2 goal');

    sess.levelScore = 42;
    sess.complexity.level++;
    assert.equal(sess.complexity.level, 3, 'start at level 1');
    assert.equal(sess.levelScore, 0, 'no score');
    assert.equal(sess.levelGoal, 400, 'correct level 3 goal');

    sess.levelScore = 42;
    sess.complexity.level = 1;
    assert.equal(sess.complexity.level, 1, 'start at level 1');
    assert.equal(sess.levelScore, 0, 'no score');
    assert.equal(sess.levelGoal, 200, 'correct level 1 goal');

    assert.end();
});
