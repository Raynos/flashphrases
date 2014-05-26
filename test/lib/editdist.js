var test = require('tape');
var util = require('util');

var editdist = require('../../lib/editdist');

test('editdist', function(assert) {
    [
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
    ].forEach(function(testCase) {
        var a = testCase[0];
        var b = testCase[1];
        var d = testCase[2];
        assert.equal(editdist(a,b), d, util.format('d(%j, %j) = %j', a, b, d));
    });
    assert.end();
});
