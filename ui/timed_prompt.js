var inherits = require('inherits');

var Prompt = require('./prompt');

function TimedPrompt(options) {
    if (!this instanceof TimedPrompt) {
        return new TimedPrompt(options);
    }
    options = options || {};
    this.displayTime = options.displayTime || 1000;
    this.inputTime = options.inputTime || 10000;
    Prompt.call(this, options);
}

inherits(TimedPrompt, Prompt);

TimedPrompt.prototype.prompt = function(text) {
    Prompt.prototype.prompt.call(this, text);
    this.setTimer(this.displayTime);
};

TimedPrompt.prototype.setTimer = function(time) {
    this.clearTimer();
    this.timer = setTimeout(function() {
        if (this.inputing) {
            this.expireInput();
        } else {
            this.showInput();
            this.setTimer(this.inputTime);
        }
    }.bind(this), time);
};

TimedPrompt.prototype.clearTimer = function() {
    if (this.timer) {
        clearTimeout(this.timer);
        delete this.timer;
    }
};

Prompt.prototype.expireInput = function() {
    this.clearTimer();
    this.inputElement.disabled = true;
    this.emit('expire');
};

module.exports = TimedPrompt;
