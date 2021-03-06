var inherits = require('inherits');

var GenerativePrompt = require('./generative_prompt');

function PhrasePrompt(options) {
    if (!this instanceof PhrasePrompt) {
        return new PhrasePrompt(options);
    }
    options = options || {};
    if (!options.scoreResult) throw new Error('missing scoreResult option');

    this.running = false;
    this.repromptDelay = options.repromptDelay || 100;
    this.scoreResult = options.scoreResult;

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
    if (this.record.inputShownAt) {
        this.record.elapsed.input = Date.now() - this.record.inputShownAt;
    }
    this.record.forced = force;
    this.scoreResult(this.record, force);
};

PhrasePrompt.prototype.prompt = function() {
    this.record = {
        elapsed: {},
        timeout: {}
    };
    GenerativePrompt.prototype.prompt.call(this);
    this.record.expected = this.expected;
    this.record.got = this.got;
    this.finishRecord();
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
