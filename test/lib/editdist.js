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
    },

    {
        a: 'word', b: 'word',
        expected: {
            dist: 0
        }
    },

    {
        a: 'word', b: 'ord',
        expected: {
            dist: 1
        }
    },

    {
        a: 'word', b: 'wrd',
        expected: {
            dist: 1
        }
    },

    {
        a: 'word', b: 'rd',
        expected: {
            dist: 2
        }
    },

    {
        a: 'word', b: '1word',
        expected: {
            dist: 1
        }
    },

    {
        a: 'word', b: '12word',
        expected: {
            dist: 2
        }
    },

    {
        a: 'word', b: 'word12',
        expected: {
            dist: 2
        }
    },

    {
        a: 'word', b: 'word1',
        expected: {
            dist: 1
        }
    },

    {
        a: 'word', b: 'wor',
        expected: {
            dist: 1
        }
    },

    {
        a: 'word', b: 'wo',
        expected: {
            dist: 2
        }
    },

    {
        a: 'word', b: 'aword',
        expected: {
            dist: 1
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
