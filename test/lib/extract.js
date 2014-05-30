var fs = require('fs');
var test = require('tape');

var extract = require('../../lib/extract');

test('extract', function(assert) {
    extract(
        fs.createReadStream(__dirname + '/extract.txt', {
            encoding:'utf8'
        }),
        function(err, markov) {
            assert.ifError(err, "didn't fail");
            assert.ok(Object.keys(markov.counts).length > 1, 'must have extracted some tokens');
            assert.ok(markov.transitions.__START_TOKEN__.length > 1, 'must have extracted some starting tokens');
            assert.ok(markov.chain().length > 0, 'can generate a non-empty chain');
            assert.end();
        });
});
