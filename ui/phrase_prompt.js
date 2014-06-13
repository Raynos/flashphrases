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
    this.complexity = options.complexity;
}

inherits(PhrasePrompt, EE);

module.exports = PhrasePrompt;
