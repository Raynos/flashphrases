module.exports = rescore;

var Engine = require('../lib/engine');

var eng = new Engine({
    base: 10,
    perLevel: 10,
    complexity: {
        initial: [2, 10],
        step: [1, 5],
        lo: [2, 10],
        hi: [10, 50]
    },
    generate: function() {},
    goalDistProp: 0.3
});

function rescore(session) {
  session.results = session.results
    .map(function(result) {
      result.score = eng.calcScore(result);
      return result;
    })
    ;
}
