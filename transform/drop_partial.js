module.exports = dropPartial;

function dropPartial(session) {
  session.results = session.results
    .filter(function(result) {
      if (result.correct === undefined) return false;
      if (result.correct === null) return false;
      if (!result.timeout) return false;
      if (!result.timeout.display) return false;
      if (!result.timeout.input) return false;
      return true;
    })
    ;
}
