var Markov = require('../lib/markov');
var varData = require('../lib/var_data');

var markovMap = null;

varData.get('gutenberg-upper-upto5', function(err, data) {
    if (err) return console.error(err);
    if (data) markovMap = Markov.makeMap(data);
});

function generatePhrase(numPhrases, minLength) {
    if (!markovMap) throw new Error('unable to get a markov for ' + numPhrases + '-phrases');
    var markov = markovMap.get(numPhrases);
    if (!markov) throw new Error('no markov available for ' + numPhrases + '-phrases');
    var phrase = '';
    while (phrase.length < minLength) {
        phrase = markov.chain(numPhrases).join(' ');
    }
    return phrase.toLowerCase();
}

module.exports.generatePhrase = generatePhrase;
