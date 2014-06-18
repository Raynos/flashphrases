var extend = require('xtend/mutable');

/*
 * TODO:
 * - batch limits
 * - time/rate limits
 *   - at least every X
 *   - other?
 */

var defaults = {
    renew    : true,
    time     : 0,
    setTimer : setTimer,
    finish   : finish
};

function debounce(options, func) {
    options = setOptions(options, func);
    extend(self, defaults, options);
    function self() {
        self.handle(this, arguments);
        if (self.timer) {
            if (!self.renew) return;
            clearTimeout(self.timer);
            delete self.timer;
        }
        self.timer = self.setTimer();
    }
    return self;
}

function setOptions(options, func) {
    if (func === undefined && typeof options === 'function') {
        options = {func: options};
    }
    if (typeof options === 'number') {
        options = {time: options};
    }
    if (typeof func === 'function') options.func = func;
    if (typeof options.func !== 'function') throw new Error('invalid function');
    return options;
}

function withFixedOptinos(fixed) {
    return function(options, func) {
        options = setOptions(options, func);
        options = extend(options, fixed);
        return debounce(options, func);
    };
}

function setTimer() {
    return setTimeout(this.finish.bind(this), this.time);
}

function finish() {
    delete this.timer;
    this.future();
    delete this.future;
}

var handle = {};

handle.rising  =
handle.leading = function(that, args) {
    if (!this.future) {
        this.future = function() {};
        this.func.apply(that, args);
    }
};

handle.falling  =
handle.trailing = function(that, args) {
    if (!this.future) {
        var func = this.func;
        this.future = function() {return func.apply(that, args);};
    }
};

handle.defer =
handle.batch = function(that, args) {
    if (!this.future) {
        this.buffer = [];
        this.future = function() {
            this.func.call(this, this.buffer);
            delete this.buffer;
        };
    }
    this.buffer.push([that, Array.prototype.slice.call(args)]);
};

defaults.handle = handle.trailing;

module.exports          = debounce;
module.exports.defaults = defaults;
module.exports.finish   = finish;
module.exports.handle   = handle;

Object.keys(handle).forEach(function(key) {
    module.exports[key] = withFixedOptinos({handle: handle[key]});
});
