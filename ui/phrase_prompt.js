var inherits = require('inherits');

var editdist = require('../lib/editdist');
var GenerativePrompt = require('./generative_prompt');

function PhrasePrompt(options) {
    if (!this instanceof PhrasePrompt) {
        return new PhrasePrompt(options);
    }
    options = options || {};
    this.running = false;
    this.maxErrorPerWord = options.maxErrorPerWord || 1;
    this.repromptDelay = options.repromptDelay || 100;

    GenerativePrompt.call(this, options);

    this.on('expire', this.onPhraseExpired.bind(this));
    this.on('input', this.onInput.bind(this));
    this.on('showdisplay', this.onDisplay.bind(this));
    this.on('settimeout', this.onSetTimeout.bind(this));
    this.on('showinput', this.onShowInput.bind(this));
    this.on('expire', this.onPromptExpire.bind(this));
}

inherits(PhrasePrompt, GenerativePrompt);

PhrasePrompt.prototype.start = function() {
    if (!this.running) {
        this.running = true;
        this.prompt();
    }
};

PhrasePrompt.prototype.stop = function() {
    if (this.running) {
        this.running = false;
        this.expireInput();
    }
};

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
    this.record.finished = this.record.forced || this.record.correct;
    if (this.record.finished) {
        this.record.forced = force;
        if (this.record.inputShownAt) {
            if (!this.record.elapsed.input) {
                this.record.elapsed.input = now - this.record.inputShownAt;
            }
        }
    }
};

PhrasePrompt.prototype.prompt = function() {
    this.record = {
        elapsed: {},
        timeout: {}
    };
    GenerativePrompt.prototype.prompt.call(this);
    this.record.expected = this.expected;
    this.record.got = this.got;
    this.record.dist = editdist.lossy(this.got, this.expected);
};

PhrasePrompt.prototype.reprompt = function() {
    if (this.inputing) {
        this.inputElement.disabled = true;
    }
    setTimeout(this.prompt.bind(this), this.repromptDelay);
};

PhrasePrompt.prototype.onSetTimeout = function(kind, time) {
    if (this.record) {
        this.record.timeout[kind] = time;
    }
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
    }
};

PhrasePrompt.prototype.onPhraseExpired = function() {
    if (this.record) {
        this.finishRecord(true);
        this.record.expired = true;
        this.emitRecord();
    }
};

PhrasePrompt.prototype.onInput = function(force) {
    if (this.record) {
        this.record.got = this.got;
        this.record.dist = editdist(this.got, this.expected);
        this.finishRecord(force);
        if (this.record.finished) {
            this.clearTimer();
            this.emitRecord();
            this.reprompt();
        }
    }
};

PhrasePrompt.prototype.onPromptExpire = function() {
    if (this.running) this.reprompt();
};

module.exports = PhrasePrompt;
