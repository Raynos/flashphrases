var Session = require('../lib/session');
var SessionStore = require('../server/session_store');

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

function doTransform(src, dst, transform, done) {
    transform = savedTo(dst, transform);
    src.keys(function(err, keys) {
        if (err) return done(err);
        async.each(keys, function(key, keyDone) {
            src.load(key, function(err, session) {
                if (err) return keyDone(err);
                transform(session, keyDone);
            });
        }, done);
    });
}

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

doTransform(input, output, function(session, done) {
    session = new Session(session.getData());
    for (var n=transforms.length, i=0; i<n; i++) {
        var r = transforms[i](session);
        if (r) session = r;
    }
    done(null, session);
}, allDone);

function allDone(err) {
    if (err) return console.error(err);
}
