var sortMergeInto = require('./sortMerge').into;

// TODO: support more than single token window
// TODO: transition frequencies

function Markov(tokens) {
    if (!(this instanceof Markov)) return new Markov(tokens);
    this.counts = {};
    this.transitions = {};
    this.start = '__START_TOKEN__';
    this.transitions[this.start] = [];
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
    var last = this.start;
    for (var i=0, n=tokens.length; i<n; i++) {
        var token = tokens[i];
        if (this.counts.hasOwnProperty(token)) {
            this.counts[token] += 1;
        } else {
            this.counts[token] = 1;
        }
        this.addTransition(last, token);
        last = token;
    }
    if (last !== this.start) this.addTransition(last, null);
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
    state = state || this.start;
    var chain = [];
    while (chain.length < maxLength) {
        var token = this.choose(state, rand);
        if (token === null) break;
        chain.push(token);
        state = token;
    }
    return chain;
};

module.exports = Markov;
