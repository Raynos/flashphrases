var sortMergeInto = require('./sortMerge').into;

var START = '__START_TOKEN__';
var END = '__END_TOKEN__';

// TODO: support more than single token window
// TODO: transition frequencies

function Markov(tokens) {
    if (!(this instanceof Markov)) return new Markov(tokens);
    this.counts = {};
    this.transitions = {};
    this.transitions[START] = [];
    this.buffer = [];
    if (tokens) this.addTokens(tokens);
}

Markov.prototype.save = function() {
    return {
        counts: this.counts,
        transitions: this.transitions,
    };
};

Markov.load = function(data) {
    return (new Markov()).load(data);
};

Markov.prototype.load = function(data) {
    this.counts = data.counts;
    this.transitions = data.transitions;
    return this;
};

Markov.prototype.addTransition = function addTransition(state, next) {
    if (next === undefined) {
        next = state;
        state = this.buffer[this.buffer.length-1];
    }
    var trans;
    if (this.transitions.hasOwnProperty(state)) {
        trans = this.transitions[state];
    } else {
        trans = this.transitions[state] = [];
    }

    // TODO: insort (binary search insertion)
    if (trans.indexOf(next) === -1) {
        trans.push(next);
        trans.sort();
    }
};

Markov.prototype.addTokens = function addTokens(tokens) {
    for (var i=0, n=tokens.length; i<n; i++) {
        var token = tokens[i];
        if (token === null) return this.flush();
        if (this.counts.hasOwnProperty(token)) {
            this.counts[token] += 1;
        } else {
            this.counts[token] = 1;
        }
        if (!this.buffer.length) {
            this.addTransition(START, token);
        } else {
            this.addTransition(token);
        }
        this.buffer.push(token);
    }
    this.flush();
};

Markov.prototype.flush = function token() {
    if (this.buffer.length) {
        this.addTransition(END);
        this.buffer = [];
    }
};

Markov.prototype.merge = function merge(other) {
    var self = this;
    Object.keys(other.counts).forEach(function(token) {
        if (self.counts.hasOwnProperty(token)) {
            self.counts[token] += other.counts[token];
        } else {
            self.counts[token] = other.counts[token];
        }
    });
    Object.keys(other.transitions).forEach(function(state) {
        var a = self.transitions.hasOwnProperty(state) && self.transitions[state];
        var b = other.transitions.hasOwnProperty(state) && other.transitions[state];
        if (!a) {
            self.transitions[state] = b;
            return;
        }
        // self.transitions[state] = sortMerge(a, b);
        sortMergeInto(a, b);
    });
    return self;
};

Markov.prototype.choose = function merge(state, rand) {
    rand = rand || Math.random;
    var trans = this.transitions[state];
    if (!trans) return null;
    return trans[Math.floor(rand() * trans.length)];
};

Markov.prototype.chain = function merge(maxLength, state, rand) {
    maxLength = maxLength || Infinity;
    rand = rand || Math.random;
    state = state || START;
    var chain = [];
    while (chain.length < maxLength) {
        var token = this.choose(state, rand);
        if (token === END) break;
        chain.push(token);
        state = token;
    }
    return chain;
};

module.exports = Markov;
