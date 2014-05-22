var test = require('tape');

var flashphrase = require('../index.js');

test('flashphrase is a function', function (assert) {
    assert.strictEqual(typeof flashphrase, 'function');
    assert.end();
});
