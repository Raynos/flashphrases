var Readable = require('stream').Readable;
var test = require('tape');
var util = require('util');

var AccumStream = require('../../../lib/stream/accum');

test('AccumStream', function(assert) {
    var rs = new Readable({
        objectMode: true
    });

    var yada  = 0;
    var end   = 1;
    var kill  = 2;
    var start = 3;

    [
        yada, end,
        start, yada, end,
        start, yada, yada,
        start, yada, end,
        yada, kill, yada, end,
        null
    ].forEach(function(n) {rs.push(n);});

    var expectations = [
        [yada],
        [start, yada],
        [start, yada, yada],
        [start, yada]
    ];

    var as = new AccumStream({
        classifier: function(n) {
            switch (n % 4) {
                case 0:
                    return n;
                case 1:
                    this.emitBuffer();
                    break;
                case 2:
                    this.kill();
                    break;
                case 3:
                    this.emitBuffer();
                    return n;
            }
        }
    });

    var i = 0;
    as.on('data', function(data) {
        var j = i++;
        var expected = expectations[j];
        if (expected === undefined) {
            assert.fail(util.format('unexpected data[%j]: %j', j, data));
        } else {
            assert.deepEqual(data, expected, util.format('expected data[%j]', j));
        }
    });
    as.on('end', function() {
        assert.equal(i, expectations.length, 'got number of expected datums');
        assert.end();
    });

    rs.pipe(as);
});
