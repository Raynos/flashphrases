var fs = require('fs');
var test = require('tape');
var util = require('util');

var sentenceStream = require('../../../lib/stream/sentence');

test('extract', function(assert) {
    var rs = fs.createReadStream(__dirname + '/../extract.txt', {
        encoding:'utf8'
    });
    var ss = sentenceStream(rs);

    var expectations = [
        'Lorem ipsum dolor sit amet consectetur adipiscing elit',
        'Proin malesuada sem sit amet felis egestas eget laoreet tellus consequat',
        'Nunc vitae justo id magna blandit sagittis ac id massa',
        'Cras elementum nisl ac felis facilisis interdum',
        'Nullam ut feugiat lorem vitae dictum mauris',
        'Vestibulum lobortis porta sollicitudin',
        'Maecenas id elit elementum tempus nulla ac malesuada elit',
        'Praesent ultricies sem nec tortor venenatis pretium',
        'Curabitur sollicitudin ipsum eget felis tristique sit amet ornare dolor rutrum',
        'Duis sit amet egestas mauris',
        'Sed quis rutrum lectus vitae sollicitudin risus',
        'Ut eu condimentum ligula',
        'Quisque dictum gravida tortor sit amet euismod',
        'Aenean non hendrerit arcu',
        'Integer nec turpis elit',
        'Aenean aliquet malesuada rhoncus',
        'Cras molestie congue porttitor',
        'Cras lacinia nisi in ullamcorper accumsan',
        'Curabitur pellentesque dapibus facilisis',
        'Curabitur faucibus dolor vel lectus tempus elementum',
        'Donec fringilla lectus ligula non ultrices dolor pellentesque id',
        'Cras id gravida neque',
        'Morbi auctor pellentesque quam et lacinia leo dignissim et',
        'Vestibulum elementum quis risus a suscipit',
        'Ut non posuere eros',
        'Mauris vel ipsum vulputate fringilla lacus vitae varius massa',
        'Fusce aliquet elit massa vitae mollis lacus accumsan a',
        'Nullam imperdiet faucibus rutrum',
        'Donec blandit leo at facilisis fermentum ante nibh scelerisque libero nec suscipit lacus sem vitae velit',
        'Pellentesque feugiat mattis ipsum eget auctor',
        'Aenean suscipit convallis quam nec semper nisl',
        'Proin et mattis ipsum sed consequat enim',
        'Suspendisse potenti',
        'Interdum et malesuada fames ac ante ipsum primis in faucibus',
        'Ut in mauris auctor sodales est in commodo elit',
        'Donec sit amet nulla vel nibh pellentesque scelerisque',
        'Morbi sodales tempus dignissim',
        'Quisque rhoncus elit vitae sagittis adipiscing',
        'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas',
        'Fusce dignissim ut mi ut tincidunt',
        'Quisque varius urna eu adipiscing pulvinar metus lectus hendrerit tortor gravida mattis magna urna sit amet tellus',
        'Nam velit turpis vulputate sit amet risus quis eleifend luctus nulla',
        'Etiam aliquet blandit rhoncus',
        'Vivamus vitae ligula eu elit posuere pellentesque',
        'Etiam tempus mi id lacus commodo vehicula',
        'Nunc id tortor non dolor ornare eleifend',
        'In semper lorem ut viverra ullamcorper urna ante faucibus eros interdum rhoncus nisl quam sit amet ipsum',
        'Donec eget massa fringilla consequat leo sed suscipit urna'
    ].map(function(s) {return s.split(' ');});

    var i = 0;
    ss.on('data', function(sentence) {
        var j = i++;
        var expected = expectations[j];
        if (expected === undefined) {
            assert.fail(util.format('unexpected sentence[%j]: %j', j, sentence));
        } else {
            assert.deepEqual(sentence, expected, util.format('expected sentence[%j]', j));
        }
    });
    ss.on('end', function() {
        assert.equal(i, expectations.length, 'got number of expected sentences');
        assert.end();
    });
});
