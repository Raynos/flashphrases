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

////

var PhraseData = require('./data');
var Engine = require('./engine');

var PhrasePrompt = require('./phrase_prompt');
var prompt = new PhrasePrompt({
    generatePhrase: PhraseData.generatePhrase,
    displayTime: 1500,
    inputTime: 10000,
    maxErrorPerWord: 1,
    repromptDelay: 200,
    complexity: {
        initial: [2, 10],
        step: [1, 5],
        lo: [2, 10],
        hi: [10, 50]
    }
});

var eng = new Engine({
    complexity: prompt.complexity
});

var PromptLoop = require('./prompt_loop');
var loop = new PromptLoop(prompt);

var StartStop = require('./start_stop');
var ss = new StartStop();
ss.contentElement.appendChild(prompt.element);
document.body.appendChild(ss.element);

prompt.on('stopkey', function(event) {
    if (event.keyCode === 0x1b) ss.stop();
});
ss.on('start', loop.start.bind(loop));
ss.on('stop', loop.stop.bind(loop));
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
