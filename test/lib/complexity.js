var test = require('tape');

var Complexity = require('../../lib/complexity');

test('Complexity works at zero lo', function(assert) {
    var C = new Complexity({
        initial: [0, 0],
        step: [1, 2],
        lo: [0, 0],
        hi: [10, 20]
    });
    assert.deepEqual(C.value, [0, 0], 'expected initial value');
    assert.equal(C.level, 1, 'should start at first level');

    C.level++;
    assert.equal(C.level, 2, 'increment level should be sane');
    assert.deepEqual(C.value, [1, 2], 'expected second level value');

    C.level++;
    assert.equal(C.level, 3, 'second increment level should be sane');
    assert.deepEqual(C.value, [2, 4], 'expected third level value');


    C.level--;
    assert.equal(C.level, 2, 'decrement level should be sane');
    assert.deepEqual(C.value, [1, 2], 'expected second level value (post dec)');

    C.level--;
    assert.equal(C.level, 1, 'second decrement level should be sane');
    assert.deepEqual(C.value, [0, 0], 'expected first level value (post dec)');

    C.level = -100;
    assert.equal(C.level, 1, 'set should clamp to lo');
    assert.deepEqual(C.value, [0, 0], 'expected lo clamped value');

    C.level = 100;
    assert.equal(C.level, 11, 'set should clamp to hi');
    assert.deepEqual(C.value, [10, 20], 'expected hi clamped value');

    assert.end();
});
