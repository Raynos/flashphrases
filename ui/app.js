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
        href: 'ui/style.css'
    }));

var style = Hash.get('style') || 'light';
var styleLink = document.head.appendChild(
    h('link', {
        rel: 'stylesheet',
        type: 'text/css',
        href: 'ui/style-' + style + '.css'
    }));

function changeStyle(name) {
    styleLink.href = 'ui/style-' + name + '.css';
    Hash.set('style', name);
    style = name;
}

////

var Engine = require('../lib/engine');
var Mode = require('./mode');
var PhraseData = require('./data');
var PhrasePrompt = require('./phrase_prompt');

var eng = new Engine({
    sessionCookie: 'session-key',
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

var mode = new Mode({
    initial: 'loading',
    modes: {
        error: h('div.error', ''),
        loading: h('div.loading', 'Loading...'),
        pause: h('div.pause', 'press <enter> to start'),
        play: h('div.play')
    }
});
mode.panes.play.appendChild(prompt.element);
document.body.appendChild(mode.element);

var lightsOut = document.body.appendChild(h(
    'div.lightsOut', {
        onclick: function() {
            changeStyle(style === 'light' ? 'dark' : 'light');
            lightsOut.innerHTML = style === 'light' ? 'Lights Out' : 'Lights On';
        }
    }, style === 'light' ? 'Lights Out' : 'Lights On'
));

prompt.on('stopkey', function(event) {
    if (event.keyCode === 0x1b) {
        mode.setMode('pause', 'play');
    }
});
mode.on('change', function(mode) {
    switch(mode) {
        case 'play':
            lightsOut.style.display = 'none';
            prompt.start();
            break;
        case 'pause':
            lightsOut.style.display = '';
            prompt.stop();
            break;
    }
});

window.addEventListener('keydown', function(event) {
    if (event.keyCode === 0x1b) { // <esc>
        event.preventDefault();
        event.stopPropagation();
        mode.setMode('pause', 'play');
    }
});

window.addEventListener('keypress', function(event) {
    switch(event.charCode) {
        case 0x0a: // nl
        case 0x0d: // cr
        case 0x20: // <space>
            mode.setMode('play', 'pause');
            break;
        default:
            if (prompt.inputing) return;
            var char = String.fromCharCode(event.charCode);
            if (char !== prompt.expected[0]) return;
            event.stopPropagation();
            event.preventDefault();
            prompt.showInput();
            prompt.input.element.value = char;
            prompt.input.update();
    }
});

window.addEventListener('blur', function() {
    mode.setMode('pause', 'play');
});

prompt.on('result', eng.onResult.bind(eng));
eng.on('ready', function() {
    mode.setMode('pause', 'loading');
});
eng.on('error', function(err) {
    mode.setMode('error');
    mode.panes.error.innerHTML = String(err);
    console.error(err);
});
eng.on('idle', mode.setMode.bind(mode, 'pause', 'play'));
eng.on('setTimeout', function(kind, val) {
    prompt[kind + 'Time'] = val;
});
