var async = require('async');
var fs = require('fs');

var argv = require('minimist')(process.argv.slice(2), {
    alias: {
        k: 'state-size',
        p: 'paragraphs',
        r: 'recase',
        s: 'sentences'
    },
    default: {
        paragraphs: 1,
        sentences: 5
    }
});

var Markov = require('../lib/markov');

var loadQ = async.queue(function load(path, done) {
    fs.readFile(path, function(err, str) {
        if (err) return done(err);
        var data;
        try {
            data = JSON.parse(str);
        } catch(err) {
            return done(err);
        }
        if (data.transitions) {
            var markov = Markov.load(data);
            data = {};
            data[markov.stateSize] = markov;
        } else {
            Object.keys(data).forEach(function(key) {
                data[key] = Markov.load(data[key]);
            });
        }
        done(null, data);
    });
}, 32);

function recase(word, i) {
    if (i === 0) {
        return word[0].toUpperCase() + word.slice(1).toLowerCase();
    } else {
        return word.toLowerCase();
    }
}

async.parallel(
    argv._.map(function(path) {
        return function(callback) {
            loadQ.push(path, callback);
        };
    }),
    function loadDone(err, markovMaps) {
        var markovMap = markovMaps.reduce(function(map, other) {
            if (!map) return other;
            Object.keys(other).forEach(function(key) {
                if (map[key]) {
                    map[key].merge(other[key]);
                } else {
                    map[key] = other[key];
                }
            });
        }, null);

        if (!markovMap) {
            process.stderr.write('no markov data loaded\n');
            process.exit(1);
        }

        var markov;
        if (argv['state-size']) {
            markov = markovMap[argv['state-size']];
        } else {
            var k = Object.keys(markovMap).reduce(function(max, s) {
                var n = parseInt(s);
                return n > max ? n : max;
            }, 0);
            markov = markovMap[k];
        }
        if (!markov) throw new Error('no usable markov?');

        for (var i=0; i<argv.paragraphs; i++) {
            if (i > 0) process.stdout.write('\n');
            for (var j=0; j<argv.sentences; j++) {
                var sentence = markov.chain();
                if (argv.recase) sentence = sentence.map(recase);
                sentence = sentence.join(' ');
                process.stdout.write((j > 0 ? ' ' : '') + sentence + '.');
            }
            process.stdout.write('\n');
        }

    });
