var Markov = require('./markov');

var sentenceStream = require('./stream/sentence');

function extract(stream, callback) {
    var ss = sentenceStream(stream);
    var markov = new Markov();
    ss.on('data', function(sentence) {
        if (sentence.length > markov.stateSize) markov.addTokens(sentence);
    });
    ss.on('error', callback);
    ss.on('end', function() {
        callback(null, markov);
    });
}

module.exports = extract;
