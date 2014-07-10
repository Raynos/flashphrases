var Markov = require('../lib/markov');
var varData = require('../lib/var_data');

var markovMap = null;

varData.get('gutenberg-upper-upto5', function(err, data) {
    if (err) return console.error(err);
    if (data) markovMap = Markov.makeMap(data);
});

function getMarkov(k) {
    if (!markovMap) return null;
    if (markovMap[k]) return markovMap[k];
    var best = null;
    Object.keys(markovMap).forEach(function(key) {
        var markov = markovMap[key];
        if (!best ||
            (markov.stateSize <= k && markov.stateSize > best.stateSize)
        ) best = markov;
    });
    if (best) markovMap[k] = best;
    return best;
}

function generatePhrase(numPhrases, minLength) {
    var markov = getMarkov(numPhrases);
    if (!markov) throw new Error('unable to get a markov for ' + numPhrases + '-phrases');
    var phrase = '';
    while (phrase.length < minLength) {
        phrase = markov.chain(numPhrases).join(' ');
    }
    return phrase.toLowerCase();
}

module.exports.getMarkov = getMarkov;
module.exports.generatePhrase = generatePhrase;
