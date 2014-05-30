var EE = require('events').EventEmitter;
var h = require('hyperscript');
var inherits = require('inherits');

function Prompt(options) {
    if (!this instanceof Prompt) {
        return new Prompt(options);
    }
    this.element = h('div.prompt');
    this.displayElement = this.element.appendChild(h('span'));
    this.inputElement = this.element.appendChild(h('input', {
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
    }
};

Prompt.prototype.onInputKeyPress = function(event) {
    switch (event.charCode) {
        case 0x0a: // nl
        case 0x0d: // cr
            this.emit('submit');
            break;
        default:
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
