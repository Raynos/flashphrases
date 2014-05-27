var async = require('async');
var fs = require('fs');

var argv = require('minimist')(process.argv.slice(2));

var extract = require('../lib/extract');
var extractQ = async.queue(extract, 32);

async.parallel(
    argv._.map(function(path) {
        return function(callback) {
            var stream = fs.createReadStream(path, {
                encoding: 'utf8'
            });
            extractQ.push(stream, callback);
        };
    }),
    function loadDone(err, markovs) {
        var markov = markovs.shift();
        markovs.forEach(markov.merge.bind(markov));
        process.stdout.write(JSON.stringify(markov.save()));
    });
