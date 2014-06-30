var test = require('tape');
var util = require('util');

var editdist = require('../../lib/editdist');

var DistTests = [
    {
        a: '', b: '',
        expected: {
            dist: 0
        }
    },

    {
        a: 'a', b: 'a',
        expected: {
            dist: 0
        }
    },

    {
        a: 'a', b: 'b',
        expected: {
            dist: 1
        }
    },

    {
        a: 'b', b: 'a',
        expected: {
            dist: 1
        }
    },

    {
        a: 'doge', b: 'dog',
        expected: {
            dist: 1
        }
    },

    {
        a: 'dog', b: 'doge',
        expected: {
            dist: 1
        }
    },

    {
        a: 'cat', b: 'cab',
        expected: {
            dist: 1
        }
    },

    {
        a: 'kitten', b: 'sitting',
        expected: {
            dist: 3
        }
    },

    {
        a: 'stop', b: 'tops',
        expected: {
            dist: 2
        }
    },

    {
        a: 'rosettacode', b: 'raisethysword',
        expected: {
            dist: 8
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
