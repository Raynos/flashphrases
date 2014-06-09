var EE = require('events').EventEmitter;
var mercury = require('mercury');
var hyperscript = require('hyperscript');
var h = mercury.h;
var inherits = require('inherits');

var focusHook = require('./lib/do-mutable-focus.js');

Prompt.prompt = prompt;
Prompt.promptRender = promptRender;

function prompt() {
    var events = mercury.input(['stopkey']);
    var state = mercury.struct({
        expected: mercury.value(''),
        got: mercury.value(''),
        inputing: mercury.value(false)
    });

    return { state: state, events: events };
}

function promptRender(state) {
    var events = state.events;

    return h('div.prompt', [
        h('span', {
            style: { display: state.inputing ? 'none': '' }
        }, state.expected),
        h('input', {
            style: { display: state.inputing ? '' : 'none' },
            type: 'text',
            value: state.got,
            disabled: false,
            'data-focus': state.inputing ? focusHook() : null,
            size: state.expected.length + 2,
            'ev-keydown': mercury(events.keydown),
            'ev-keypress': mercury(events.keypress),
            'ev-change': mercury(events.change),
            'ev-blur': mercury(events.blur)
        })
    ]);
}


function Prompt(options) {
    if (!this instanceof Prompt) {
        return new Prompt(options);
    }
    this.element = hyperscript('div.prompt');
    this.displayElement = this.element.appendChild(hyperscript('span'));
    this.inputElement = this.element.appendChild(hyperscript('input', {
        style: {display: 'none'},
        type: 'text',
        onkeydown: this.onInputKeyDown.bind(this),
        onkeypress: this.onInputKeyPress.bind(this),
        onchange: this.updateInput.bind(this, true),
        onblur: this.updateInput.bind(this, true)
    }));
    this.expected = '';
    this.got = '';
    this.inputing = null;
}

inherits(Prompt, EE);

Prompt.prototype.prompt = function(text) {
    this.expected = text;
    this.got = '';
    this.display(text);
};

Prompt.prototype.display = function(text) {
    this.displayElement.innerHTML = text;
    this.got = this.inputElement.value = '';
    this.inputElement.size = text.length + 2;
    this.showDisplay(text);
    this.emit('display');
};

Prompt.prototype.showDisplay = function() {
    if (this.inputing !== false) {
        this.inputing = false;
        this.displayElement.style.display = '';
        this.inputElement.style.display = 'none';
        this.emit('showdisplay');
    }
};

Prompt.prototype.showInput = function() {
    if (this.inputing !== true) {
        this.inputing = true;
        this.displayElement.style.display = 'none';
        this.inputElement.style.display = '';
        this.inputElement.disabled = false;
        this.inputElement.focus();
        this.emit('showinput');
    }
};

Prompt.prototype.onInputKeyDown = function(event) {
    if (event.keyCode  <  0x20 &&
        event.keyCode !== 0x0a &&
        event.keyCode !== 0x0d) {
        event.preventDefault();
        event.stopPropagation();
        this.emit('stopkey', event);
    }
};

Prompt.prototype.onInputKeyPress = function(event) {
    if (event.keyCode === 0x0a ||
        event.keyCode === 0x0d) {
        this.updateInput(true);
    } else {
        this.eventuallyUpdateInput();
    }
};

Prompt.prototype.eventuallyUpdateInput = function(force) {
    if (this.inputUpdateTimer) {
        clearTimeout(this.inputUpdateTimer);
    }
    var self = this;
    this.inputUpdateTimer = setTimeout(function() {
        delete self.inputUpdateTimer;
        self.updateInput(force);
    }, 200);
};

Prompt.prototype.updateInput = function(force) {
    if (this.inputUpdateTimer) {
        clearTimeout(this.inputUpdateTimer);
        delete this.inputUpdateTimer;
    }
    if (this.inputing && !this.inputElement.disabled) {
        this.got = this.inputElement.value;
        if (force) this.inputElement.disabled = true;
        this.emit('input', Boolean(force));
    }
};

module.exports = Prompt;
