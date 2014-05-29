var Complexity = require('../lib/complexity');
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

    TimedPrompt.call(this, options);

    this.generatePhrase = options.generatePhrase;
    this.complexity = new Complexity(options.complexity);
}

inherits(GenerativePrompt, TimedPrompt);

GenerativePrompt.prototype.prompt = function() {
    var phrase = this.generatePhrase.apply(this, this.complexity.value);
    TimedPrompt.prototype.prompt.call(this, phrase);
};

module.exports = GenerativePrompt;
