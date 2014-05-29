function Complexity(options) {
    if (!this instanceof Complexity) {
        return new Complexity(options);
    }
    options = options || {};

    // TODO: ick
    if (!options.initial)
        throw new Error('missing initial option');
    if (!Array.isArray(options.initial))
        throw new Error('invalid initial option');
    if (!options.step)
        throw new Error('missing step option');
    if (!Array.isArray(options.step))
        throw new Error('invalid step option');
    this.initial = options.initial;
    this.step = options.step;
    this.value = this.initial;
}

module.exports = Complexity;
