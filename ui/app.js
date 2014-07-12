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
var Markov = require('../lib/markov');
var Mode = require('./mode');
var ResultsTable = require('./results_table');
var Timeout = require('./timeout');
var varData = require('../lib/var_data');

var markovMap = null;
varData.get('gutenberg-upper-upto5', function(err, data) {
    if (err) return console.error(err);
    if (data) markovMap = Markov.makeMap(data);
});

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
    generate: function generatePhrase(numPhrases, minLength) {
        if (!markovMap) throw new Error('unable to get a markov for ' + numPhrases + '-phrases');
        var phrase = markovMap.generatePhrase(numPhrases, minLength);
        return phrase.toLowerCase();
    },
    maxErrorRate: 0.3
});

var input = new Input();

var results = new ResultsTable();

var mode = new Mode({
    initial: 'loading',
    modes: {
        error: h('div.error', ''),
        loading: h('div.loading', 'Loading...'),
        pause: h('div.pause', [
            h('p', 'press <enter> to start'),
            h('div.results', results.element),
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

function createResult() {
    clearResult();
    result = {
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

function clearResult() {
    if (!result) return;
    result = null;
}

function evaluate(force) {
    if (result.finished) return result.true;
    var done = eng.scoreResult(result, force);
    if (done) finishResult();
    return done;
}

function finishResult() {
    if (result.finished) {
        timeout.clear();
        eng.onResult(result);
        mode.setMode('limbo', 'input');
        clearResult();
    }
}

var eventuallyEvaluate = debounce(200, evaluate);

var lightsOut = document.body.appendChild(h(
    'div.lightsOut', {
        onclick: function() {
            changeStyle(style === 'light' ? 'dark' : 'light');
            lightsOut.innerHTML = style === 'light' ? 'Lights Out' : 'Lights On';
        }
    }, style === 'light' ? 'Lights Out' : 'Lights On'
));

input.on('data', function(got) {
    result.got = got;
    eventuallyEvaluate();
});

input.on('done', function(got) {
    result.got = got;
    evaluate(true);
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
            if (result && result.expected !== null) evaluate(true);
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
    createResult();
    result.expected = eng.generate();
    result.displayedAt = Date.now();
    mode.panes.display.innerHTML = result.expected;
    result.timeout.display = displayTime;
    if (!evaluate()) timeout.set(mode.setMode.bind(mode, 'input', 'display'), displayTime);
}

function showInput() {
    result.got = '';
    result.inputShownAt = Date.now();
    result.timeout.input = inputTime;
    timeout.set(evaluate.bind(null, true), inputTime);
    input.reset(result.expected);
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
                if (char !== result.expected[0]) return;
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
    eng.session.results.forEach(results.addResult, results);
    eng.session.on('resultAdd', results.addResult.bind(results));
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
