var Session = require('../lib/session');

module.exports = tagLegacy;

tagLegacy.sessionType = Session.Legacy;

function tagLegacy(session) {
    return session;
}
