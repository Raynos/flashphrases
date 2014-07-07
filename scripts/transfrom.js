var resolveData = require('../lib/data').resolveData;
var Session = require('../lib/session');
var SessionStore = require('../server/session_store');

function toAsync(transform) {
    return function(session, done) {
        done(null, transform(session));
    };
}

function withCopiedSession(transform) {
    return function(session, done) {
        session = Session(resolveData(session));
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
        o: 'output',
        t: 'tmp'
    },
    boolean: ['tmp'],
    default: {
        input: path.join(config.var, 'sessions')
    }
});
var input = new SessionStore(argv.input);
var tmpBase = argv.output ? argv.output : argv.input;
var output = argv.output ? argv.output : input;
var transforms = argv._.map(function(transform) {
    return require(path.join(process.cwd(), transform));
});
if (transforms[0].sessionType) {
    input.sessionType = transforms[0].sessionType;
}

var steps = transforms.map(function(trans, i) {
    var transform = trans;
    var name = argv._[i].replace(/\W+/g, '_').replace(/^_|_$/g, '');
    if (!trans.async) transform = toAsync(transform);
    if (!trans.alwaysReturns) transform = maybeReturns(transform);
    if (!trans.inplace) transform = withCopiedSession(transform);
    if (i === argv._.length - 1) {
        transform = savedTo(output, transform);
    } else if (argv.tmp) {
        transform = savedTo(tmpBase + '.tmp_' + name, transform);
    }
    return transform;
});

input.keys(function(err, keys) {
    if (err) return allDone(err);
    async.each(keys, function(key, keyDone) {
        input.load(key, function(err, session) {
            if (err) return keyDone(err);
            async.series(steps.map(function(step) {
                return step.bind(this, session);
            }), keyDone);
        });
    }, allDone);
});

function allDone(err) {
    if (err) return console.error(err);
}
