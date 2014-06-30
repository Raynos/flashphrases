var test = require('tape');
var util = require('util');

var editdist = require('../../lib/editdist');

var DistTests = [
    ['', '', 0],
    ['a', 'a', 0],
    ['a', 'b', 1],
    ['b', 'a', 1],
    ['doge', 'dog', 1],
    ['dog', 'doge', 1],
    ['cat', 'cab', 1],
    ['kitten', 'sitting', 3],
    ['stop', 'tops', 2],
    ['rosettacode', 'raisethysword', 8],
];

test('editdist', function(assert) {
    DistTests.forEach(function(testCase) {
        var desc = util.format('d(%j, %j) = %j', testCase[0], testCase[1], testCase[2]);
        var got = editdist(testCase[0], testCase[1]);
        assert.equal(got, testCase[2], desc);
    });
    assert.end();
});
