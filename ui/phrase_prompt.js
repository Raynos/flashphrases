var debounce = require('debounce');
var inherits = require('inherits');
var nextTick = require('next-tick');

var editdist = require('../lib/editdist');
var GenerativePrompt = require('./generative_prompt');

function PhrasePrompt(options) {
    if (!this instanceof PhrasePrompt) {
        return new PhrasePrompt(options);
    }
    options = options || {};
    this.maxErrorPerWord = options.maxErrorPerWord || 2;

    GenerativePrompt.call(this, options);

    this.on('expire', this.onPhraseExpired.bind(this));
    this.on('input', debounce(this.onInput.bind(this), 100));
    this.on('showdisplay', this.onDisplay.bind(this));
    this.on('showinput', this.onShowInput.bind(this));
}

inherits(PhrasePrompt, GenerativePrompt);

PhrasePrompt.prototype.emitRecord = function() {
    if (this.record) {
        this.emit('result', this.record);
        this.record = null;
    }
};

PhrasePrompt.prototype.finishRecord = function(force) {
    if (!this.record) return;
    var now = Date.now();
    var maxErrorPerWord = this.maxErrorPerWord;
    this.record.maxErrors = this.record.expected.split(/ +/)
        .map(function(word) {return Math.min(maxErrorPerWord, word.length);})
        .reduce(function(a, b) {return a + b;})
        ;
    this.record.correct = this.record.dist <= this.record.maxErrors;
    if (force || this.record.correct) {
        if (this.record.inputShownAt) {
            if (!this.record.elapsed.input) {
                this.record.elapsed.input = now - this.record.inputShownAt;
            }
            delete this.record.inputShownAt;
        }
    }
};

PhrasePrompt.prototype.prompt = function() {
    this.record = {
        elapsed: {}
    };
    GenerativePrompt.prototype.prompt.call(this);
    this.record.expected = this.expected;
    this.record.got = this.got;
    this.record.dist = editdist(this.got, this.expected);
};

PhrasePrompt.prototype.onDisplay = function() {
    if (this.record && !this.record.displayedAt) {
        this.record.displayedAt = Date.now();
    }
};

PhrasePrompt.prototype.onShowInput = function() {
    this.record.inputShownAt = Date.now();
    if (this.record.displayedAt) {
        if (!this.record.elapsed.display) {
            this.record.elapsed.display = this.record.inputShownAt - this.record.displayedAt;
        }
        delete this.record.displayedAt;
    }
};

PhrasePrompt.prototype.onPhraseExpired = function() {
    if (this.record) {
        this.finishRecord(true);
        this.record.expired = true;
        this.emitRecord();
    }
};

PhrasePrompt.prototype.onInput = function() {
    if (this.record) {
        this.record.got = this.got;
        this.record.dist = editdist(this.got, this.expected);
        this.finishRecord(false);
        if (this.record.correct) {
            this.emitRecord();
            this.clearTimer();
            nextTick(this.prompt.bind(this));
        }
    }
};

module.exports = PhrasePrompt;
