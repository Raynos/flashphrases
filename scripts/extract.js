var async = require('async');
var fs = require('fs');
var util = require('util');

var argv = require('minimist')(process.argv.slice(2), {
    alias: {
        t: 'transform'
    }
});
if (argv.transform && ! Array.isArray(argv.transform))
    argv.transform = [argv.transform];

var extract = require('../lib/extract');
var extractQ = async.queue(extract, 32);

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

async.parallel(
    argv._.map(function(path) {
        return function(callback) {
            var stream = fs.createReadStream(path, {
                encoding: 'utf8'
            });
            if (transforms)
                transforms.forEach(function(transform) {stream = transform(stream);});
            extractQ.push(stream, callback);
        };
    }),
    function loadDone(err, markovs) {
        var markov = markovs.reduce(function(markov, other) {
            return markov ? markov.merge(other) : other;
        }, null);
        if (markov) process.stdout.write(JSON.stringify(markov.save()));
    });
