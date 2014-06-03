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

var extract = require('../lib/extract');
var extractStream = extract.bind(null, {
    stateSize: argv['state-size']
});
var loadDone = function(err, markovs) {
    if (argv.verbose) console.error('merging');
    var markov = markovs.reduce(function(markov, other) {
        return markov ? markov.merge(other) : other;
    }, null);
    if (markov) process.stdout.write(JSON.stringify(markov.save()));
};

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
