var Markov = require('../lib/markov');

function loadMarkovMap(data) {
    var markovMap = {};
    if (data.transitions) {
        var markov = Markov.load(data);
        markovMap[markov.stateSize] = markov;
    } else {
        Object.keys(data).forEach(function(key) {
            markovMap[key] = Markov.load(data[key]);
        });
    }
    return markovMap;
}

var markovMap = null;

/* global XMLHttpRequest */
var xhr = new XMLHttpRequest();
xhr.open('GET', '/markov_source.json');
xhr.onreadystatechange = function() {
    if (this.readyState !== XMLHttpRequest.DONE) return;
    var data = JSON.parse(this.responseText);
    markovMap = loadMarkovMap(data);
};
xhr.send(null);

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
