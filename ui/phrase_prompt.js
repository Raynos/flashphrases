var EE = require('events').EventEmitter;
var inherits = require('inherits');

function PhrasePrompt(options) {
    if (!this instanceof PhrasePrompt) {
        return new PhrasePrompt(options);
    }
    // TODO: ick
    options = options || {};
    if (!options.scoreResult) throw new Error('missing scoreResult option');
    if (!options.generatePhrase) throw new Error('missing generatePhrase option');
    if (!options.complexity) throw new Error('missing complexity option');
    if (!options.input) throw new Error('missing input');
    if (!options.display) throw new Error('missing display');

    this.running = false;
    this.repromptDelay = options.repromptDelay || 100;
    this.scoreResult = options.scoreResult;
    this.displayTime = options.displayTime || 1000;
    this.inputTime = options.inputTime || 10000;
    this.input = options.input;
    this.displayElement = options.display;
    this.expected = '';
    this.inputing = null;
    this.generatePhrase = options.generatePhrase;
    this.complexity = options.complexity;

    this.input.on('data', this.onInput.bind(this));
    this.on('showdisplay', this.onDisplay.bind(this));
    this.on('settimeout', this.onSetTimeout.bind(this));
    this.on('showinput', this.onShowInput.bind(this));
}

inherits(PhrasePrompt, EE);

PhrasePrompt.prototype.prompt = function() {
    this.record = {
        elapsed: {},
        timeout: {}
    };
    var text = this.generatePhrase.apply(this, this.complexity.value);
    this.expected = text;
    this.display(text);
    this.setTimer();
    this.record.expected = this.expected;
    this.onInput('');
};

PhrasePrompt.prototype.display = function(text) {
    this.displayElement.innerHTML = text;
    this.input.element.value = '';
    this.input.element.size = text.length + 2;
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
    this.clearTimer();
    if (this.inputing !== true) {
        this.inputing = true;
        this.emit('showinput');
        this.input.element.disabled = false;
        this.input.element.focus();
    }
    this.setTimer();
};

PhrasePrompt.prototype.setTimer = function() {
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

PhrasePrompt.prototype.clearTimer = function() {
    if (this.timer) {
        clearTimeout(this.timer);
        delete this.timer;
    }
};

PhrasePrompt.prototype.expireInput = function() {
    this.emitRecord(true);
};

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

PhrasePrompt.prototype.emitRecord = function(force) {
    if (this.record) {
        if (this.record.inputShownAt) {
            this.record.elapsed.input = Date.now() - this.record.inputShownAt;
        }
        this.record.forced = force;
        this.scoreResult(this.record, force);
    }
    if (force || this.record && this.record.finished) {
        if (this.record) {
            this.emit('result', this.record);
            this.record = null;
        }
        this.reprompt();
    }
};

PhrasePrompt.prototype.reprompt = function() {
    this.clearTimer();
    if (this.inputing) {
        this.input.element.disabled = true;
    }
    if (this.running) {
        setTimeout(this.prompt.bind(this), this.repromptDelay);
    }
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

PhrasePrompt.prototype.onInput = function(got, force) {
    if (this.record) this.record.got = got;
    this.emitRecord(force);
};

module.exports = PhrasePrompt;
