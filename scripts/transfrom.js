var Session = require('../lib/session');
var SessionStore = require('../server/session_store');

function toAsync(transform) {
    return function(session, done) {
        done(null, transform(session));
    };
}

function withCopiedSession(transform) {
    return function(session, done) {
        session = new Session(session.getData());
        transform(session, done);
    };
}

function maybeReturns(transform) {
    return function(session, done) {
        transform(session, function(err, r) {
            if (r) session = r;
            done(err, session);
        });
    };
}

function savedTo(store, transform) {
    if (typeof store === 'string') store = new SessionStore(store);
    return function(session, done) {
        transform(session, function(err, session) {
            if (err) return done(err);
            store.save(session, done);
        });
    };
}

var async = require('async');
var path = require('path');
var config = require('../server/config');

var argv = require('minimist')(process.argv.slice(2), {
    alias: {
        i: 'input',
        o: 'output'
    },
    default: {
        input: path.join(config.var, 'sessions')
    }
});
var input = new SessionStore(argv.input);
var output = argv.output ? argv.output : input;
var transforms = argv._.map(function(transform) {
    return require(path.join(process.cwd(), transform));
});

var steps = transforms.map(function(trans) {
    var transform = trans;
    if (!trans.async) transform = toAsync(transform);
    if (!trans.alwaysReturns) transform = maybeReturns(transform);
    return transform;
});

var transform = savedTo(output, withCopiedSession(function transform(session, done) {
    async.series(steps.map(function(step) {
        return step.bind(this, session);
    }), done);
}));

input.keys(function(err, keys) {
    if (err) return allDone(err);
    async.each(keys, function(key, keyDone) {
        input.load(key, function(err, session) {
            if (err) return keyDone(err);
            transform(session, keyDone);
        });
    }, allDone);
});

function allDone(err) {
    if (err) return console.error(err);
}
