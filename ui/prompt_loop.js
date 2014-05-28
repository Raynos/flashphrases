var EE = require('events').EventEmitter;
var inherits = require('inherits');
var nextTick = require('next-tick');

function PromptLoop(prompt) {
    this.prompt = prompt;
    this.running = false;
    this.prompt.on('expire', this.onPromptExpire.bind(this));
}

inherits(PromptLoop, EE);

PromptLoop.prototype.onPromptExpire = function() {
    if (this.running) {
        nextTick(this.prompt.prompt.bind(this.prompt));
    }
};

PromptLoop.prototype.start = function() {
    if (!this.running) {
        this.running = true;
        this.prompt.prompt();
        this.emit('start');
    }
};

PromptLoop.prototype.stop = function() {
    if (this.running) {
        this.running = false;
        this.prompt.expireInput();
        this.emit('stop');
    }
};

module.exports = PromptLoop;
