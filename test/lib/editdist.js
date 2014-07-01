var test = require('tape');
var util = require('util');

var editdist = require('../../lib/editdist');

var DistTests = [
    {
        a: '', b: '',
        expected: {
            dist: 0,
            edit: []
        }
    },

    {
        a: 'a', b: 'a',
        expected: {
            dist: 0,
            edit: [
                [editdist.SAME, 0, 0]
            ]
        }
    },

    {
        a: 'a', b: 'b',
        expected: {
            dist: 1,
            edit: [
                [editdist.CHANGE, 0, 0],
            ]
        }
    },

    {
        a: 'b', b: 'a',
        expected: {
            dist: 1,
            edit: [
                [editdist.CHANGE, 0, 0],
            ]
        }
    },

    {
        a: 'doge', b: 'dog',
        expected: {
            dist: 1,
            edit: [
                [editdist.SAME,   0, 0],
                [editdist.SAME,   1, 1],
                [editdist.SAME,   2, 2],
                [editdist.DELETE, 3, 3]
            ]
        }
    },

    {
        a: 'dog', b: 'doge',
        expected: {
            dist: 1,
            edit: [
                [editdist.SAME,   0, 0],
                [editdist.SAME,   1, 1],
                [editdist.SAME,   2, 2],
                [editdist.INSERT, 3, 3]
            ]
        }
    },

    {
        a: 'cat', b: 'cab',
        expected: {
            dist: 1,
            edit: [
                [editdist.SAME,   0, 0],
                [editdist.SAME,   1, 1],
                [editdist.CHANGE, 2, 2]
            ]
        }
    },

    {
        a: 'kitten', b: 'sitting',
        expected: {
            dist: 3,
            edit: [
                [editdist.CHANGE, 0, 0],
                [editdist.SAME,   1, 1],
                [editdist.SAME,   2, 2],
                [editdist.SAME,   3, 3],
                [editdist.CHANGE, 4, 4],
                [editdist.SAME,   5, 5],
                [editdist.INSERT, 6, 6]
            ]
        }
    },

    {
        a: 'stop', b: 'tops',
        expected: {
            dist: 2,
            edit: [
                [editdist.DELETE, 0, 0],
                [editdist.SAME,   1, 0],
                [editdist.SAME,   2, 1],
                [editdist.SAME,   3, 2],
                [editdist.INSERT, 4, 3]
            ]
        }
    },

    {
        a: 'rosettacode', b: 'raisethysword',
        expected: {
            dist: 8,
            edit: [
                [editdist.SAME,    0,  0],
                [editdist.CHANGE,  1,  1],
                [editdist.INSERT,  2,  2],
                [editdist.SAME,    2,  3],
                [editdist.SAME,    3,  4],
                [editdist.SAME,    4,  5],
                [editdist.CHANGE,  5,  6],
                [editdist.CHANGE,  6,  7],
                [editdist.CHANGE,  7,  8],
                [editdist.INSERT,  8,  9],
                [editdist.SAME,    8, 10],
                [editdist.INSERT,  9, 11],
                [editdist.SAME,    9, 12],
                [editdist.DELETE, 10, 13]
            ]
        }
    },

    {
        a: 'word', b: 'word',
        expected: {
            dist: 0,
            edit: [
                [editdist.SAME, 0, 0],
                [editdist.SAME, 1, 1],
                [editdist.SAME, 2, 2],
                [editdist.SAME, 3, 3]
            ]
        }
    },

    {
        a: 'word', b: 'ord',
        expected: {
            dist: 1,
            edit: [
                [editdist.DELETE, 0, 0],
                [editdist.SAME,   1, 0],
                [editdist.SAME,   2, 1],
                [editdist.SAME,   3, 2]
            ]
        }
    },

    {
        a: 'word', b: 'wrd',
        expected: {
            dist: 1,
            edit: [
                [editdist.SAME,   0, 0],
                [editdist.DELETE, 1, 1],
                [editdist.SAME,   2, 1],
                [editdist.SAME,   3, 2]
            ]
        }
    },

    {
        a: 'word', b: 'rd',
        expected: {
            dist: 2,
            edit: [
                [editdist.DELETE, 0, 0],
                [editdist.DELETE, 1, 0],
                [editdist.SAME,   2, 0],
                [editdist.SAME,   3, 1]
            ]
        }
    },

    {
        a: 'word', b: '1word',
        expected: {
            dist: 1,
            edit: [
                [editdist.INSERT, 0, 0],
                [editdist.SAME,   0, 1],
                [editdist.SAME,   1, 2],
                [editdist.SAME,   2, 3],
                [editdist.SAME,   3, 4]
            ]
        }
    },

    {
        a: 'word', b: '12word',
        expected: {
            dist: 2,
            edit: [
                [editdist.INSERT, 0, 0],
                [editdist.INSERT, 0, 1],
                [editdist.SAME,   0, 2],
                [editdist.SAME,   1, 3],
                [editdist.SAME,   2, 4],
                [editdist.SAME,   3, 5]
            ]
        }
    },

    {
        a: 'word', b: 'word12',
        expected: {
            dist: 2,
            edit: [
                [editdist.SAME,   0, 0],
                [editdist.SAME,   1, 1],
                [editdist.SAME,   2, 2],
                [editdist.SAME,   3, 3],
                [editdist.INSERT, 4, 4],
                [editdist.INSERT, 4, 5]
            ]
        }
    },

    {
        a: 'word', b: 'word1',
        expected: {
            dist: 1,
            edit: [
                [editdist.SAME,   0, 0],
                [editdist.SAME,   1, 1],
                [editdist.SAME,   2, 2],
                [editdist.SAME,   3, 3],
                [editdist.INSERT, 4, 4]
            ]
        }
    },

    {
        a: 'word', b: 'wor',
        expected: {
            dist: 1,
            edit: [
                [editdist.SAME,   0, 0],
                [editdist.SAME,   1, 1],
                [editdist.SAME,   2, 2],
                [editdist.DELETE, 3, 3]
            ]
        }
    },

    {
        a: 'word', b: 'wo',
        expected: {
            dist: 2,
            edit: [
                [editdist.SAME,   0, 0],
                [editdist.SAME,   1, 1],
                [editdist.DELETE, 2, 2],
                [editdist.DELETE, 3, 2]
            ]
        }
    },

    {
        a: 'word', b: 'aword',
        expected: {
            dist: 1,
            edit: [
                [editdist.INSERT, 0, 0],
                [editdist.SAME,   0, 1],
                [editdist.SAME,   1, 2],
                [editdist.SAME,   2, 3],
                [editdist.SAME,   3, 4]
            ]
        }
    }
];

test('editdist', function(assert) {
    DistTests.forEach(function(testCase) {
        var desc = util.format('d(%j, %j) = %j', testCase.a, testCase.b, testCase.expected.dist);
        var got = editdist(testCase.a, testCase.b);
        assert.equal(got, testCase.expected.dist, desc);
    });
    assert.end();
});

test('editdist.trace', function(assert) {
    DistTests.forEach(function(testCase) {
        var desc = util.format('%j and %j', testCase.a,testCase.b);
        var got = editdist.trace(testCase.a,testCase.b);
        assert.deepEqual(got.dist, testCase.expected.dist, 'expected dist for ' + desc);
        assert.deepEqual(got.edit, testCase.expected.edit, 'expected edit for ' + desc);
    });
    assert.end();
});
