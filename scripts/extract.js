var async = require('async');
var fs = require('fs');
var util = require('util');

var argv = require('minimist')(process.argv.slice(2), {
    alias: {
        v: 'verbose',
        t: 'transform',
        n: 'state-size'
    },
    boolean: 'verbose'
});
if (argv.transform && ! Array.isArray(argv.transform))
    argv.transform = [argv.transform];

var stateSize = argv['state-size'];
if (typeof stateSize === 'string') {
    stateSize = stateSize
        .split(',')
        .map(function(s) {return parseInt(s);});
    if (!stateSize.length ||
        stateSize
            .map(function(n) {return isNaN(n) || n <= 0 || n !== Math.floor(n);})
            .reduce(function(any, bool) {return any || bool;}, false)
        ) {
        throw new Error('invalid state-size option');
    }
} else if (typeof stateSize !== 'number') {
    throw new Error('invalid state-size option');
}

var extract = require('../lib/extract');
var extractStream;
var loadDone;
if (Array.isArray(stateSize)) {
    extractStream = extract.many.bind(null,
        stateSize.map(function(n) {return {stateSize: n};})
    );
    loadDone = function(err, markovs) {
        if (argv.verbose) console.error('merging');
        var out = {};
        markovs
            .reduce(function(a1, a2) {return a1.concat(a2);})
            .forEach(function(markov) {
                var n = markov.stateSize;
                if (!out[n]) {
                    out[n] = markov;
                } else {
                    out[n].merge(markov);
                }
            });

        if (markovs.length) {
            Object.keys(out).forEach(function(k) {
                out[k] = out[k].save();
            });
            process.stdout.write(JSON.stringify(out));
        }
    };
} else {
    extractStream = extract.bind(null, {
        stateSize: stateSize
    });
    loadDone = function(err, markovs) {
        if (argv.verbose) console.error('merging');
        var markov = markovs.reduce(function(markov, other) {
            return markov ? markov.merge(other) : other;
        }, null);
        if (markov) process.stdout.write(JSON.stringify(markov.save()));
    };
}

var transforms = argv.transform && argv.transform.map(function(spec) {
    // jshint evil:true, unused:false
    var match = /^(\w+)(\(.*\))?$/.exec(spec);
    if (!match) throw new Error(util.format('invalid transform %j', spec));
    var Transform = require('../lib/stream/' + match[1] );
    var create = new Function(['Transform'], 'return new Transform' + (match[2] || '()') + ';');
    return function(stream) {
        var transform = create(Transform);
        stream.pipe(transform);
        return transform;
    };
});

var loadQ = async.queue(function load(path, done) {
    var stream = fs.createReadStream(path, {
        encoding: 'utf8'
    });
    if (argv.verbose) console.error('extracting', path);
    if (transforms)
        transforms.forEach(function(transform) {stream = transform(stream);});
    if (argv.verbose) stream.on('end', function() {
        console.error('extracted', path);
    });
    extractStream(stream, done);
}, 32);

async.parallel(
    argv._.map(function(path) {
        return loadQ.push.bind(loadQ, path);
    }), loadDone);
