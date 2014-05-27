var async = require('async');
var fs = require('fs');

var extract = require('../lib/extract');
var extractQ = async.queue(extract, 32);

async.parallel(
    process.argv.slice(2).map(function(path) {
        return function(callback) {
            extractQ.push(fs.createReadStream(path, {
                encoding: 'utf8'
            }), callback);
        };
    }),
    function loadDone(err, markovs) {
        var markov = markovs.shift();
        markovs.forEach(markov.merge.bind(markov));
        process.stdout.write(JSON.stringify(markov.save()));
    });
