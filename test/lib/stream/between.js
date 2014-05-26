var Readable = require('stream').Readable;
var test = require('tape');
var util = require('util');

var BetweenStream = require('../../../lib/stream/between');

test('BetweenStream', function(assert) {
    var rs = new Readable();
    rs.push('bla bla\nbla\nSTART a thing\nhmm\n');
    rs.push('yada yada\nyada\n');
    rs.push('yada\nEND that thing\netc\net al\n');
    rs.push(null);

    var expectations = [
        'hmm\n',
        'yada yada\nyada\n',
        'yada\n'
    ];

    var bs = new BetweenStream({
        matchStart: /^START.*$\n/m,
        matchEnd: /^END.*$/m
    });

    var i = 0;
    bs.on('data', function(chunk) {
        var data = String(chunk);
        var j = i++;
        var expected = expectations[j];
        if (expected === undefined) {
            assert.fail(util.format('unexpected data[%j]: %j', j, data));
        } else {
            assert.equal(data, expected, util.format('expected data[%j]', j));
        }
    });
    bs.on('end', function() {
        assert.equal(i, expectations.length, 'got number of expected chunks');
        assert.end();
    });

    rs.pipe(bs);
});
