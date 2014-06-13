var EE = require('events').EventEmitter;
var inherits = require('inherits');

function PhrasePrompt(options) {
    if (!this instanceof PhrasePrompt) {
        return new PhrasePrompt(options);
    }
    // TODO: ick
    options = options || {};
    if (!options.evaluate) throw new Error('missing evaluate option');
    if (!options.complexity) throw new Error('missing complexity option');

    this.evaluate = options.evaluate;
    this.inputTime = options.inputTime || 10000;
    this.complexity = options.complexity;
}

inherits(PhrasePrompt, EE);

PhrasePrompt.prototype.showInput = function() {
    this.emit('showinput');
    if (this.timer) {
        clearTimeout(this.timer);
        delete this.timer;
    }
    this.timer = setTimeout(this.evaluate.bind(this, true), this.inputTime);
    this.emit('settimeout', 'input', this.inputTime);
};

module.exports = PhrasePrompt;
