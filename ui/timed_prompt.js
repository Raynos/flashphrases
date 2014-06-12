var EE = require('events').EventEmitter;
var inherits = require('inherits');

function TimedPrompt(options) {
    if (!this instanceof TimedPrompt) {
        return new TimedPrompt(options);
    }
    options = options || {};
    if (!options.input) throw new Error('missing input');
    if (!options.display) throw new Error('missing display');
    this.displayTime = options.displayTime || 1000;
    this.inputTime = options.inputTime || 10000;
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

inherits(TimedPrompt, EE);

TimedPrompt.prototype.prompt = function(text) {
    this.expected = text;
    this.got = '';
    this.display(text);
    this.setTimer();
};

TimedPrompt.prototype.display = function(text) {
    this.displayElement.innerHTML = text;
    this.got = this.input.element.value = '';
    this.input.element.size = text.length + 2;
    this.showDisplay(text);
    this.emit('display');
};

TimedPrompt.prototype.showDisplay = function() {
    if (this.inputing !== false) {
        this.inputing = false;
        this.emit('showdisplay');
    }
};

TimedPrompt.prototype.showInput = function() {
    this.clearTimer();
    if (this.inputing !== true) {
        this.inputing = true;
        this.emit('showinput');
        this.input.element.disabled = false;
        this.input.element.focus();
    }
    this.setTimer();
};

TimedPrompt.prototype.setTimer = function() {
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

TimedPrompt.prototype.clearTimer = function() {
    if (this.timer) {
        clearTimeout(this.timer);
        delete this.timer;
    }
};

TimedPrompt.prototype.expireInput = function() {
    this.clearTimer();
    this.input.element.disabled = true;
    this.emit('expire');
};

module.exports = TimedPrompt;
