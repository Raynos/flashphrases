var EE = require('events').EventEmitter;
var inherits = require('inherits');

function Prompt(options) {
    if (!this instanceof Prompt) {
        return new Prompt(options);
    }
    if (!options.input) throw new Error('missing input');
    if (!options.display) throw new Error('missing display');
    this.input = options.input;
    this.displayElement = options.display;
    this.expected = '';
    this.got = '';
    this.inputing = null;
    var self = this;
    this.input.on('stop', function(event) {
        self.emit('stopkey', event);
    });
    this.input.on('data', function(got, force) {
        self.got = got;
        self.emit('input', force);
    });
}

inherits(Prompt, EE);

Prompt.prototype.prompt = function(text) {
    this.expected = text;
    this.got = '';
    this.display(text);
};

Prompt.prototype.display = function(text) {
    this.displayElement.innerHTML = text;
    this.got = this.input.element.value = '';
    this.input.element.size = text.length + 2;
    this.showDisplay(text);
    this.emit('display');
};

Prompt.prototype.showDisplay = function() {
    if (this.inputing !== false) {
        this.inputing = false;
        this.emit('showdisplay');
    }
};

Prompt.prototype.showInput = function() {
    if (this.inputing !== true) {
        this.inputing = true;
        this.emit('showinput');
        this.input.element.disabled = false;
        this.input.element.focus();
    }
};

module.exports = Prompt;
