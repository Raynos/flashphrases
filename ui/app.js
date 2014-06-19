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
var Input = require('./input');
var Mode = require('./mode');
var PhraseData = require('./data');
var Timeout = require('./timeout');

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
    generate: PhraseData.generatePhrase,
    maxErrorRate: 0.3
});

var input = new Input();

var mode = new Mode({
    initial: 'loading',
    modes: {
        error: h('div.error', ''),
        loading: h('div.loading', 'Loading...'),
        pause: h('div.pause', 'press <enter> to start'),
        display: h('div.display'),
        input: h('div.input', input.element),
        limbo: h('div.limbo')
    }
});
document.body.appendChild(mode.element);

var repromptDelay = 200;

var record = null;
function newRecord() {
    record = {
        displayedAt: NaN,
        inputShownAt: NaN,
        doneAt: NaN,
        elapsed: {
            display: NaN,
            input: NaN,
        },
        timeout: {
            display: NaN,
            input: NaN,
        },
        expected: null,
        got: null
    };
}

var displayTime = 1500;
var inputTime = 5000;
var timeout = new Timeout();

function evaluate(force) {
    if (record.finished) return record.true;
    var done = eng.scoreResult(record, force);
    if (done) {
        timeout.clear();
        eng.onResult(record);
        mode.setMode('limbo', 'input');
    }
    return done;
}

var lightsOut = document.body.appendChild(h(
    'div.lightsOut', {
        onclick: function() {
            changeStyle(style === 'light' ? 'dark' : 'light');
            lightsOut.innerHTML = style === 'light' ? 'Lights Out' : 'Lights On';
        }
    }, style === 'light' ? 'Lights Out' : 'Lights On'
));

input.on('data', function(got, force) {
    record.got = got;
    evaluate(force);
});

input.on('stop', function(event) {
    if (event.keyCode === 0x1b) {
        mode.setMode('pause', ['display', 'input']);
    }
});

mode.on('change', function(newMode) {
    switch(newMode) {
        case 'pause':
            lightsOut.style.display = '';
            if (record && record.expected !== null) evaluate(true);
            break;
        case 'display':
            lightsOut.style.display = 'none';
            doDisplay();
            break;
        case 'input':
            showInput();
            break;
        case 'limbo':
            timeout.set(mode.setMode.bind(mode, 'display', 'limbo'), repromptDelay);
            break;
    }
});

function doDisplay() {
    newRecord();
    record.expected = eng.generate();
    record.displayedAt = Date.now();
    mode.panes.display.innerHTML = record.expected;
    record.timeout.display = displayTime;
    if (!evaluate()) timeout.set(mode.setMode.bind(mode, 'input', 'display'), displayTime);
}

function showInput() {
    input.element.value = '';
    input.element.size = record.expected.length + 2;
    input.element.focus();
    record.got = '';
    record.inputShownAt = Date.now();
    record.timeout.input = inputTime;
    timeout.set(evaluate.bind(null, true), inputTime);
}

window.addEventListener('keydown', function(event) {
    if (event.keyCode === 0x1b) { // <esc>
        event.preventDefault();
        event.stopPropagation();
        mode.setMode('pause', ['display', 'input', 'limbo']);
    }
});

window.addEventListener('keypress', function(event) {
    switch(event.charCode) {
        case 0x0a: // nl
        case 0x0d: // cr
        case 0x20: // <space>
            mode.setMode('display', 'pause');
            break;
        default:
            if (mode.mode === 'display') {
                var char = String.fromCharCode(event.charCode);
                if (char !== record.expected[0]) return;
                event.stopPropagation();
                event.preventDefault();
                mode.setMode('input');
                input.element.value = char;
                input.updateNow();
            }
    }
});

window.addEventListener('blur', function() {
    mode.setMode('pause', ['display', 'input', 'limbo']);
});

eng.on('ready', function() {
    mode.setMode('pause', 'loading');
});
eng.on('error', function(err) {
    mode.setMode('error');
    mode.panes.error.innerHTML = String(err);
    console.error(err);
});
eng.on('idle', mode.setMode.bind(mode, 'pause', ['display', 'input']));
eng.on('setTimeout', function(kind, val) {
    switch (kind) {
        case 'display':
            displayTime = val;
            break;
        case 'input':
            inputTime = val;
            break;
    }
});
