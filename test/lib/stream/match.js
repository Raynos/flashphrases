var Readable = require('stream').Readable;
var test = require('tape');
var util = require('util');

var MatchStream = require('../../../lib/stream/match');

test('MatchStream', function(assert) {
    var rs = new Readable();
    rs.push('Now is the time for all good me');
    rs.push('n to come to the aid of their ');
    rs.push('country.  The quick brown fox ju');
    rs.push('mps over the lazy hound.');
    rs.push(null);

    var expectations = [
        { word: 'Now' }, { space: ' ' }, { word: 'is' }, { space: ' ' },
        { word: 'the' }, { space: ' ' }, { word: 'time' }, { space: ' ' },
        { word: 'for' }, { space: ' ' }, { word: 'all' }, { space: ' ' },
        { word: 'good' }, { space: ' ' }, { word: 'men' }, { space: ' ' },
        { word: 'to' }, { space: ' ' }, { word: 'come' }, { space: ' ' },
        { word: 'to' }, { space: ' ' }, { word: 'the' }, { space: ' ' },
        { word: 'aid' }, { space: ' ' }, { word: 'of' }, { space: ' ' },
        { word: 'their' }, { space: ' ' }, { word: 'country' }, { punct: '.' },
        { space: '  ' }, { word: 'The' }, { space: ' ' }, { word: 'quick' },
        { space: ' ' }, { word: 'brown' }, { space: ' ' }, { word: 'fox' },
        { space: ' ' }, { word: 'jumps' }, { space: ' ' }, { word: 'over' },
        { space: ' ' }, { word: 'the' }, { space: ' ' }, { word: 'lazy' },
        { space: ' ' }, { word: 'hound' }, { punct: '.' }
    ];

    var ms = new MatchStream({
        regex: /(\w+)|(\s+)|([^\s^\w]+)/g,
    });
    var i = 0;
    ms.on('data', function(match) {
        var j = i++;
        var expected = expectations[j];
        if (expected === undefined) {
            assert.fail(util.format('unexpected match[%j]: %j', j, match));
        } else {
            var got;
            if      (match[1]) got = {word: match[1]};
            else if (match[2]) got = {space: match[2]};
            else if (match[3]) got = {punct: match[3]};
            else               got = {invalid: match};
            assert.deepEqual(got, expected, util.format('expected data[%j]', j));

        }
    });
    ms.on('end', function() {
        assert.equal(i, expectations.length, 'got number of expected matches');
        assert.end();
    });

    rs.pipe(ms);
});
