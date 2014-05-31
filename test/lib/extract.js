var fs = require('fs');
var test = require('tape');
var util = require('util');

var extract = require('../../lib/extract');

test('extract', function(assert) {
    extract(
        fs.createReadStream(__dirname + '/extract.txt', {
            encoding:'utf8'
        }),
        function(err, markov) {
            assert.ifError(err, "didn't fail");

            'Lorem ipsum dolor sit amet consectetur adipiscing elit'
                .split(' ')
                .forEach(function(word, i, ar) {
                    if (i > 0) {
                        var last = ar[i-1];
                        var trans = markov.transitions[last] || [];
                        assert.ok(trans.indexOf(word) !== -1,
                            util.format('transition %j -> %j exists', last, word));

                    }
                });

            assert.ok(Object.keys(markov.counts).length > 1, 'must have extracted some tokens');
            assert.ok(markov.transitions.__START_TOKEN__.length > 1, 'must have extracted some starting tokens');
            assert.ok(markov.chain().length > 0, 'can generate a non-empty chain');
            assert.end();
        });
});
