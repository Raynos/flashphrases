var h = require('hyperscript');
var Hash = require('./hash');

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

var style = Hash.get('style') || 'light';
var styleLink = document.head.appendChild(
    h('link', {
        rel: 'stylesheet',
        type: 'text/css',
        href: 'style-' + style + '.css'
    }));

function changeStyle(name) {
    styleLink.href = 'style-' + name + '.css';
    Hash.set('style', name);
    style = name;
}

////

var PhraseData = require('./data');
var Engine = require('../lib/engine');

var PhrasePrompt = require('./phrase_prompt');

var eng = new Engine({
    base: 10,
    perLevel: 10,
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
    inputTime: 5000,
    repromptDelay: 200,
    complexity: eng.complexity,
    scoreResult: eng.scoreResult.bind(eng)
});

var StartStop = require('./start_stop');
var ss = new StartStop();
ss.contentElement.appendChild(prompt.element);
document.body.appendChild(ss.element);

var lightsOut = document.body.appendChild(h(
    'div.lightsOut', {
        onclick: function() {
            changeStyle(style === 'light' ? 'dark' : 'light');
            lightsOut.innerHTML = style === 'light' ? 'Lights Out' : 'Lights On';
        }
    }, style === 'light' ? 'Lights Out' : 'Lights On'
));

prompt.on('stopkey', function(event) {
    if (event.keyCode === 0x1b) ss.stop();
});
ss.on('start', function() {
    lightsOut.style.display = 'none';
    prompt.start();
});
ss.on('stop', function() {
    lightsOut.style.display = '';
    prompt.stop();
});
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
eng.on('setTimeout', function(kind, val) {
    prompt[kind + 'Time'] = val;
});
