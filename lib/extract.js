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

module.exports = extract;
