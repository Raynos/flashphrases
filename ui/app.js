// var h = require('hyperscript');
var mercury = require('mercury');
var h = mercury.h;
var querystring = require('querystring/');
var extend = require('xtend');
var window = require('global/window');
var document = require('global/document');

var Engine = require('../lib/engine');
var Mode = require('./mode');
var PhraseData = require('./data');
var PhrasePrompt = require('./phrase_prompt');

// hack the title
document.title = 'Flash Phrases';

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

prompt.on('stopkey', function(event) {
    if (event.keyCode === 0x1b) {
        mode.setMode('pause', 'play');
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
            prompt.inputElement.value = char;
            prompt.updateInput();
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

// Mercury stuff*

function createApp(initialState) {
    var events = mercury.input(['toggleStyle']);
    var state = mercury.struct({
        hash: mercury.struct({
            style: mercury.value(initialState.style || 'light')
        }),
        lightsOutVisible: mercury.value(true),
        events: events
    });

    events.toggleStyle(function () {
        var curr = state.hash.style();
        state.hash.style.set(curr === 'light' ? 'dark': 'light');
    });

    return { state: state };
}

var hash = (window.location.hash || '').slice(1);
var initialState = querystring.parse(hash);

var state = createApp(initialState).state;

mode.on('change', function(mode) {
    switch(mode) {
        case 'play':
            state.lightsOutVisible.set(false);
            prompt.start();
            break;
        case 'pause':
            state.lightsOutVisible.set(true);
            prompt.stop();
            break;
    }
});

state.hash(function (hashState) {
    hashState = extend(hashState);
    delete hashState._diff;
    window.location.hash =
        '#' + querystring.stringify(hashState);
});

function render(state) {
    var events = state.events;
    var lightsOutText = state.hash.style === 'light' ?
        'Lights Out' : 'Lights On';

    return h('div', [
        h('.links', [
            h('link', {
                rel: 'stylesheet',
                type: 'text/css',
                href: 'style.css'
            }),
            h('link', {
                rel: 'stylesheet',
                type: 'text/css',
                href: 'style-' + state.hash.style + '.css'
            })
        ]),
        h('div.lightsOut', {
            'ev-click': mercury.event(events.toggleStyle),
            hidden: !state.lightsOutVisible
        }, lightsOutText)
    ]);
}

mercury.app(document.body, state, render);

////
