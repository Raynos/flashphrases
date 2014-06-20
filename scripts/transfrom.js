var async = require('async');

function doTransform(src, dst, transform, done) {
  src.keys(function(err, keys) {
    if (err) return done(err);
    async.each(keys, function(key, keyDone) {
      src.load(key, function(err, session) {
        if (err) return keyDone(err);
        session = transform(session);
        dst.save(session, keyDone);
      });
    }, done);
  });
}

module.exports.doTransform = doTransform;

if (require.main === module) {
  var path = require('path');
  var config = require('../server/config');
  var Session = require('../lib/session');
  var SessionStore = require('../server/session_store');

  var argv = require('minimist')(process.argv.slice(2), {
      alias: {
          i: 'input',
          o: 'output'
      },
      default: {
        input: path.join(config.var, 'sessions')
      }
  });

  var transforms = argv._.map(function(transform) {
    return require(path.join(process.cwd(), transform));
  });

  var input = new SessionStore(path.resolve(argv.input));
  var output = argv.output ? new SessionStore(path.resolve(argv.output)) : input;

  doTransform(input, output, function(session) {
    session = new Session(session.getData());
    for (var n=transforms.length, i=0; i<n; i++) {
      transforms[i](session);
    }
    return session;
  }, function(err) {
    if (err) return console.error(err);
  });
}
