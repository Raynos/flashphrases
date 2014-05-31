var MatchStream = require('./match');
var AccumStream = require('./accum');

function sentenceStream(stream) {
    var ms = new MatchStream({
        regex: /(\w+)|([\.!?;:]\s+)|(,)|([^\s^\w]+)/g
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
            } else if(match[3]) {
                return;
            } else {
                this.kill();
            }
        }
    });
    stream.pipe(ms);
    ms.pipe(ss);
    return ss;
}

module.exports = sentenceStream;
