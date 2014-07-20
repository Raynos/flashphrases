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

var debounce = require('../lib/debounce');
var Engine = require('../lib/engine');
var Input = require('./input');
var Mode = require('./mode');
var Results = require('./results');
var ResultsTable = require('./results_table');
var Timeout = require('./timeout');
require('../lib/phrase_session');

var eng = new Engine({
    sessionCookie: 'session-key',
    session: {
        type: 'phrase_session',
        base: 10,
        perLevel: 10,
        goalDistProp: 0.3,
        complexity: {
            lo: [2, 10],
            step: [1, 5],
            hi: [10, 50],
            initial: [2, 10]
        },
        corpus: 'gutenberg-upper-upto5'
    }
});

var input = new Input();

var results = new Results();
var resultsTable = new ResultsTable();

var mode = new Mode({
    initial: 'loading',
    modes: {
        error: h('div.error', ''),
        loading: h('div.loading', 'Loading...'),
        pause: h('div.pause', [
            h('p', 'press <enter> to start'),
            results.element,
            resultsTable.element
        ]),
        display: h('div.display'),
        input: h('div.input', input.element),
        limbo: h('div.limbo')
    }
});
document.body.appendChild(mode.element);

var repromptDelay = 200;

var result = null;
var timeout = new Timeout();

function addResult(options) {
    clearResult();
    result = eng.session.addResult(options);
}

function clearResult() {
    if (!result) return;
    if (!result.session.done) result.addEvent('abandon');
    result = null;
}

var judgeResult = debounce(200, function() {
    if (!result) return;
    if (!result.session.done && result.score.distValue > 0) {
        result.addEvent('judge', {timeout: judgeResult.time});
    }
    finishResult();
});

function finishResult() {
    judgeResult.clear();
    if (result.session.done) {
        timeout.clear();
        mode.setMode('limbo', 'input');
        clearResult();
    }
}

var lightsOut = document.body.appendChild(h(
    'div.lightsOut', {
        onclick: function() {
            changeStyle(style === 'light' ? 'dark' : 'light');
            lightsOut.innerHTML = style === 'light' ? 'Lights Out' : 'Lights On';
        }
    }, style === 'light' ? 'Lights Out' : 'Lights On'
));

input.on('data', function(got) {
    if (!result) return;
    result.addEvent('input', {got: got});
    judgeResult();
});

input.on('done', function(got) {
    if (!result) return;
    var last = result.session.input && result.session.input[result.session.input.length-1];
    if (!last || last.got !== got) result.addEvent('input', {got: got});
    result.addEvent('submit');
    finishResult();
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
            if (result) {
                result.addEvent('abort');
                finishResult();
            }
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
    addResult();
    var event = result.addEvent('display', {timeout: eng.session.timeout.display});
    mode.panes.display.innerHTML = result.phrase;
    timeout.set(mode.setMode.bind(mode, 'input', 'display'), event.timeout);
}

function showInput() {
    var event = result.addEvent('prompt', {timeout: eng.session.timeout.prompt});
    timeout.set(function() {
        result.addEvent('expire');
        finishResult();
    }, event.timeout);
    input.reset(result.phrase);
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
                if (char !== result.phrase[0]) return;
                event.stopPropagation();
                event.preventDefault();
                mode.setMode('input');
                input.element.value = char;
                input.update();
            }
    }
});

window.addEventListener('blur', function() {
    mode.setMode('pause', ['display', 'input', 'limbo']);
});

eng.on('ready', function() {
    mode.setMode('pause', 'loading');
    results.setSession(eng.session);
    resultsTable.setSession(eng.session);
});
eng.on('error', function(err) {
    mode.setMode('error');
    mode.panes.error.innerHTML = String(err);
    console.error(err);
});
eng.on('idle', mode.setMode.bind(mode, 'pause', ['display', 'input']));
