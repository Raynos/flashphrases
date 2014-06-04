var h = require('hyperscript');

// XXX require('global/mumble')
var window = global.window;
var document = global.document;

document.title = 'Flash Phrases';
document.head.appendChild(
    h('link', {
        rel: 'stylesheet',
        type: 'text/css',
        href: 'style.css'
    }));

// XXX use a module for this
function loadHash() {
    var hash = window.location.hash;
    if (hash && hash[0] === '#') hash = hash.slice(1);
    var parts = hash.split(';');
    var out = {};
    parts.forEach(function(part) {
        var i = part.indexOf('=');
        if (i === -1) {
            out[part] = true;
        } else {
            var key = part.slice(0, i);
            var val = part.slice(i + 1);
            out[key] = val;
        }
    });
    return out;
}

var Hash = loadHash();

var style = Hash.style || 'light';
document.head.appendChild(
    h('link', {
        rel: 'stylesheet',
        type: 'text/css',
        href: 'style-' + style + '.css'
    }));

////

var PhraseData = require('./data');
var Engine = require('../lib/engine');

var PhrasePrompt = require('./phrase_prompt');

var eng = new Engine({
    complexity: {
        initial: [2, 10],
        step: [1, 5],
        lo: [2, 10],
        hi: [10, 50]
    },
    maxErrorRate: 0.3
});

var prompt = new PhrasePrompt({
    generatePhrase: PhraseData.generatePhrase,
    displayTime: 1500,
    inputTime: 10000,
    repromptDelay: 200,
    complexity: eng.complexity,
    scoreResult: eng.scoreResult.bind(eng)
});

var StartStop = require('./start_stop');
var ss = new StartStop();
ss.contentElement.appendChild(prompt.element);
document.body.appendChild(ss.element);

prompt.on('stopkey', function(event) {
    if (event.keyCode === 0x1b) ss.stop();
});
ss.on('start', prompt.start.bind(prompt));
ss.on('stop', prompt.stop.bind(prompt));
ss.on('keypress', function(event) {
    if (prompt.inputing) return;
    var char = String.fromCharCode(event.charCode);
    if (char !== prompt.expected[0]) return;
    event.stopPropagation();
    event.preventDefault();
    prompt.showInput();
    prompt.inputElement.value = char;
    prompt.updateInput();
});
ss.addListeners(window);

prompt.on('result', eng.onResult.bind(eng));
eng.on('idle', ss.stop.bind(ss));
