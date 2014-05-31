var test = require('tape');

var flashphrase = require('../index.js');

test('flashphrase is a function', function (assert) {
    assert.strictEqual(typeof flashphrase, 'function');
    assert.end();
});

require('./lib/markov');
require('./lib/stream/accum');
require('./lib/stream/between');
require('./lib/stream/match');
require('./lib/stream/sentence');
require('./lib/complexity');
require('./lib/editdist');
require('./lib/extract');
