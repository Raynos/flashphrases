var test = require('tape');
var util = require('util');

var bisect = require('../../lib/bisect');

test('bisect.left', function(assert) {
    [
        {ar: [],     value: 3, expected: 0},
        {ar: [3],    value: 4, expected: 1},
        {ar: [3, 4], value: 2, expected: 0},

        {ar: [3, 5, 7], value: 2, expected: 0},
        {ar: [3, 5, 7], value: 3, expected: 0},
        {ar: [3, 5, 7], value: 4, expected: 1},
        {ar: [3, 5, 7], value: 5, expected: 1},
        {ar: [3, 5, 7], value: 6, expected: 2},
        {ar: [3, 5, 7], value: 7, expected: 2},
        {ar: [3, 5, 7], value: 8, expected: 3},

        {ar: [3, 3, 5, 5, 7, 7], value: 2, expected: 0},
        {ar: [3, 3, 5, 5, 7, 7], value: 3, expected: 0},
        {ar: [3, 3, 5, 5, 7, 7], value: 4, expected: 2},
        {ar: [3, 3, 5, 5, 7, 7], value: 5, expected: 2},
        {ar: [3, 3, 5, 5, 7, 7], value: 6, expected: 4},
        {ar: [3, 3, 5, 5, 7, 7], value: 7, expected: 4},
        {ar: [3, 3, 5, 5, 7, 7], value: 8, expected: 6},

    ].forEach(function(testCase) {
        var desc = util.format('bisect.left(%j, %j)', testCase.ar, testCase.value);
        assert.equal(bisect.left(testCase.ar, testCase.value), testCase.expected, desc);
    });

    assert.end();
});

test('bisect.right', function(assert) {
    [
        {ar: [],     value: 3, expected: 0},
        {ar: [3],    value: 4, expected: 1},
        {ar: [3, 4], value: 2, expected: 0},

        {ar: [3, 5, 7], value: 2, expected: 0},
        {ar: [3, 5, 7], value: 3, expected: 1},
        {ar: [3, 5, 7], value: 4, expected: 1},
        {ar: [3, 5, 7], value: 5, expected: 2},
        {ar: [3, 5, 7], value: 6, expected: 2},
        {ar: [3, 5, 7], value: 7, expected: 3},
        {ar: [3, 5, 7], value: 8, expected: 3},

        {ar: [3, 3, 5, 5, 7, 7], value: 2, expected: 0},
        {ar: [3, 3, 5, 5, 7, 7], value: 3, expected: 2},
        {ar: [3, 3, 5, 5, 7, 7], value: 4, expected: 2},
        {ar: [3, 3, 5, 5, 7, 7], value: 5, expected: 4},
        {ar: [3, 3, 5, 5, 7, 7], value: 6, expected: 4},
        {ar: [3, 3, 5, 5, 7, 7], value: 7, expected: 6},
        {ar: [3, 3, 5, 5, 7, 7], value: 8, expected: 6},

    ].forEach(function(testCase) {
        var desc = util.format('bisect.right(%j, %j)', testCase.ar, testCase.value);
        assert.equal(bisect.right(testCase.ar, testCase.value), testCase.expected, desc);
    });

    assert.end();
});
