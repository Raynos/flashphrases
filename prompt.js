var debounce = require('debounce');
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
        onkeypress: debounce(this.updateInput.bind(this), 200),
        onchange: this.updateInput.bind(this)
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

Prompt.prototype.updateInput = function() {
    if (this.inputing) {
        this.got = this.inputElement.value;
        this.emit('input');
    }
};

module.exports = Prompt;
