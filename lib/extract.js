var Markov = require('./markov');
var MatchStream = require('./stream/match');
var AccumStream = require('./stream/accum');

function sentenceStream(stream) {
    var ms = new MatchStream({
        regex: /(\w+)|([.!?;:]\s+)|([^\s^\w]+)/g
    });
    var ss = new AccumStream({
        classifier: function classifyMatch(match) {
            if (match[1]) {
                var token = match[1];
                if (token[0] === '_') {
                    this.kill();
                } else {
                    return token;
                }
            } else if(match[2]) {
                this.emitBuffer();
            } else {
                this.kill();
            }
        }
    });
    stream.pipe(ms);
    ms.pipe(ss);
    return ss;
}

function extract(stream, callback) {
    var ss = sentenceStream(stream);
    var markov = new Markov();
    ss.on('data', function(sentence) {
        markov.addTokens(sentence);
    });
    ss.on('error', callback);
    ss.on('end', function() {
        callback(null, markov);
    });
}

module.exports = extract;
