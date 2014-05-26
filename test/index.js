var test = require('tape');

var flashphrase = require('../index.js');

test('flashphrase is a function', function (assert) {
    assert.strictEqual(typeof flashphrase, 'function');
    assert.end();
});

require('./lib/markov');
require('./lib/stream/match');
require('./lib/editdist');
require('./lib/extract');
