var fs = require('fs');
var test = require('tape');

var extract = require('../../lib/extract');

test('extract', function(assert) {
    extract(
        fs.createReadStream(__dirname + '/../../README.md', {
            encoding:'utf8'
        }),
        function(err, markov) {
            assert.ifError(err, "didn't fail");
            assert.ok(markov.chain().length > 0, 'can generate a non-empty chain');
            assert.end();
        });
});
