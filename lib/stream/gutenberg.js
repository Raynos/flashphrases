var BetweenStream = require('./between');
var util = require('util');

function GutenbergStream(options) {
    options = options || {};
    options.matchStart = /^\*\*\* START OF THIS PROJECT GUTENBERG EBOOK.*$/m;
    options.matchEnd   = /^\*\*\* END OF THIS PROJECT GUTENBERG EBOOK.*$|^\s*THE END.*$/m;
    BetweenStream.call(this, options);
}

util.inherits(GutenbergStream, BetweenStream);

module.exports = GutenbergStream;
