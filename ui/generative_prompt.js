var EE = require('events').EventEmitter;
var inherits = require('inherits');

function GenerativePrompt(options) {
    if (!this instanceof GenerativePrompt) {
        return new GenerativePrompt(options);
    }
    options = options || {};

    // TODO: ick
    if (!options.generatePhrase) throw new Error('missing generatePhrase option');
    if (!options.complexity) throw new Error('missing complexity option');
    if (!options.input) throw new Error('missing input');
    if (!options.display) throw new Error('missing display');

    this.displayTime = options.displayTime || 1000;
    this.inputTime = options.inputTime || 10000;
    this.input = options.input;
    this.displayElement = options.display;
    this.expected = '';
    this.got = '';
    this.inputing = null;
    this.generatePhrase = options.generatePhrase;
    this.complexity = options.complexity;

    var self = this;
    this.input.on('stop', function(event) {
        self.emit('stopkey', event);
    });
    this.input.on('data', function(got, force) {
        self.got = got;
        self.emit('input', force);
    });
}

inherits(GenerativePrompt, EE);

GenerativePrompt.prototype.prompt = function() {
    var text = this.generatePhrase.apply(this, this.complexity.value);
    this.expected = text;
    this.got = '';
    this.display(text);
    this.setTimer();
};

GenerativePrompt.prototype.display = function(text) {
    this.displayElement.innerHTML = text;
    this.got = this.input.element.value = '';
    this.input.element.size = text.length + 2;
    this.showDisplay(text);
    this.emit('display');
};

GenerativePrompt.prototype.showDisplay = function() {
    if (this.inputing !== false) {
        this.inputing = false;
        this.emit('showdisplay');
    }
};

GenerativePrompt.prototype.showInput = function() {
    this.clearTimer();
    if (this.inputing !== true) {
        this.inputing = true;
        this.emit('showinput');
        this.input.element.disabled = false;
        this.input.element.focus();
    }
    this.setTimer();
};

GenerativePrompt.prototype.setTimer = function() {
    this.clearTimer();
    if (this.inputing) {
        this.timer = setTimeout(function() {
            if (this.inputing) this.expireInput();
        }.bind(this), this.inputTime);
        this.emit('settimeout', 'input', this.inputTime);
    } else {
        this.timer = setTimeout(function() {
            if (!this.inputing) this.showInput();
        }.bind(this), this.displayTime);
        this.emit('settimeout', 'display', this.displayTime);
    }
};

GenerativePrompt.prototype.clearTimer = function() {
    if (this.timer) {
        clearTimeout(this.timer);
        delete this.timer;
    }
};

GenerativePrompt.prototype.expireInput = function() {
    this.clearTimer();
    this.input.element.disabled = true;
    this.emit('expire');
};

module.exports = GenerativePrompt;
