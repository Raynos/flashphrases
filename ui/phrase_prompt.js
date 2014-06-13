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
    if (!options.input) throw new Error('missing input');
    if (!options.display) throw new Error('missing display');

    this.scoreResult = options.scoreResult;
    this.displayTime = options.displayTime || 1000;
    this.inputTime = options.inputTime || 10000;
    this.input = options.input;
    this.displayElement = options.display;
    this.inputing = null;
    this.complexity = options.complexity;

    this.on('showdisplay', this.onDisplay.bind(this));
    this.on('settimeout', this.onSetTimeout.bind(this));
    this.on('showinput', this.onShowInput.bind(this));
}

inherits(PhrasePrompt, EE);

PhrasePrompt.prototype.display = function(text) {
    this.displayElement.innerHTML = text;
    this.input.element.value = '';
    this.input.element.size = text.length + 2;
    this.evaluate();
    if (this.timer) {
        clearTimeout(this.timer);
        delete this.timer;
    }
    this.timer = setTimeout(this.showInput.bind(this), this.displayTime);
    this.emit('settimeout', 'display', this.displayTime);
    this.showDisplay(text);
    this.emit('display');
};

PhrasePrompt.prototype.showDisplay = function() {
    if (this.inputing !== false) {
        this.inputing = false;
        this.emit('showdisplay');
    }
};

PhrasePrompt.prototype.showInput = function() {
    if (this.inputing !== true) {
        this.inputing = true;
        this.emit('showinput');
        this.input.element.disabled = false;
        this.input.element.focus();
    }

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

PhrasePrompt.prototype.onSetTimeout = function(kind, time) {
    if (this.record) this.record.timeout[kind] = time;
};

PhrasePrompt.prototype.onDisplay = function() {
    if (this.record) this.record.displayedAt = Date.now();
};

PhrasePrompt.prototype.onShowInput = function() {
    if (this.record) this.record.inputShownAt = Date.now();
};

module.exports = PhrasePrompt;
