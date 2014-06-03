var Markov = require('./markov');

var sentenceStream = require('./stream/sentence');

function extract(options, stream, callback) {
    if (typeof stream === 'function') {
        callback = stream;
        stream = options;
        options = null;
    }
    var ss = sentenceStream(stream);
    var markov = new Markov(options);
    ss.on('data', function(sentence) {
        if (sentence.length > markov.stateSize) markov.addTokens(sentence);
    });
    ss.on('error', callback);
    ss.on('end', function() {
        callback(null, markov);
    });
}

extract.many = function(manyOptions, stream, callback) {
    var ss = sentenceStream(stream);
    var n = manyOptions.length;
    var markovs = new Array(n);
    for (var i=0; i<n; i++) markovs[i] = new Markov(manyOptions[i]);
    ss.on('data', function(sentence) {
        for (var i=0; i<n; i++) {
            var markov = markovs[i];
            if (sentence.length > markov.stateSize) markov.addTokens(sentence);
        }
    });
    ss.on('error', callback);
    ss.on('end', function() {
        callback(null, markovs);
    });
};

module.exports = extract;
