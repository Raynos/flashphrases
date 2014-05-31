var Markov = require('./markov');
var MatchStream = require('./stream/match');

// TODO: use a markdown parser to skip code blocks entirely

function extract(stream, callback) {
    var markov = new Markov();
    var buffer = [];
    var ms = new MatchStream({
        regex: /(\w+)|([.!?;:]\s+)|([^\s^\w]+)/g
    });
    ms.on('data', function(match) {
        if (match[1]) {
            var token = match[1];
            if (token[0] === '_') {
                buffer = null;
            } else if (buffer) {
                buffer.push(token);
            }
        } else if(match[2]) {
            if (buffer) markov.addTokens(buffer);
            buffer = [];
        } else {
            buffer = null;
        }
    });
    ms.on('error', callback);
    ms.on('end', function() {
        callback(null, markov);
    });
    stream.pipe(ms);
}

module.exports = extract;
