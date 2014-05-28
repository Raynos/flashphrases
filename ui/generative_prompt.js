var inherits = require('inherits');

var TimedPrompt = require('./timed_prompt');

function GenerativePrompt(options) {
    if (!this instanceof GenerativePrompt) {
        return new GenerativePrompt(options);
    }
    options = options || {};

    // TODO: ick
    if (!options.generatePhrase)
        throw new Error('missing generatePhrase option');
    if (!options.complexity)
        throw new Error('missing complexity option');
    if (!options.complexity.initial)
        throw new Error('missing complexity.initial option');
    if (!Array.isArray(options.complexity.initial))
        throw new Error('invalid complexity.initial option');
    if (!options.complexity.step)
        throw new Error('missing complexity.step option');
    if (!Array.isArray(options.complexity.step))
        throw new Error('invalid complexity.step option');

    TimedPrompt.call(this, options);

    this.generatePhrase = options.generatePhrase;
    this.initialComplexity = options.complexity.initial;
    this.complexityStep = options.complexity.step;
    this.complexity = this.initialComplexity;

}

inherits(GenerativePrompt, TimedPrompt);

GenerativePrompt.prototype.prompt = function() {
    var phrase = this.generatePhrase.apply(this, this.complexity);
    TimedPrompt.prototype.prompt.call(this, phrase);
};

module.exports = GenerativePrompt;
