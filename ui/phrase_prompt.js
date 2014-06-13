var EE = require('events').EventEmitter;
var inherits = require('inherits');

function PhrasePrompt(options) {
    if (!this instanceof PhrasePrompt) {
        return new PhrasePrompt(options);
    }
    // TODO: ick
    options = options || {};
    if (!options.scoreResult) throw new Error('missing scoreResult option');
    if (!options.complexity) throw new Error('missing complexity option');
    if (!options.display) throw new Error('missing display');

    this.scoreResult = options.scoreResult;
    this.displayTime = options.displayTime || 1000;
    this.inputTime = options.inputTime || 10000;
    this.displayElement = options.display;
    this.complexity = options.complexity;
}

inherits(PhrasePrompt, EE);

PhrasePrompt.prototype.display = function(text) {
    this.displayElement.innerHTML = text;
    this.evaluate();
    if (this.timer) {
        clearTimeout(this.timer);
        delete this.timer;
    }
    this.timer = setTimeout(this.showInput.bind(this), this.displayTime);
    this.emit('settimeout', 'display', this.displayTime);
    this.emit('display');
};

PhrasePrompt.prototype.showInput = function() {
    this.emit('showinput');
    if (this.timer) {
        clearTimeout(this.timer);
        delete this.timer;
    }
    this.timer = setTimeout(this.evaluate.bind(this, true), this.inputTime);
    this.emit('settimeout', 'input', this.inputTime);
};

PhrasePrompt.prototype.evaluate = function(force) {
    if (this.record) this.scoreResult(this.record, force);
    if (force || this.record && this.record.finished) {
        if (this.timer) {
            clearTimeout(this.timer);
            delete this.timer;
        }
        this.emit('finished');
    }
};

module.exports = PhrasePrompt;
