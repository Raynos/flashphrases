var cc = require('config-chain');
var path = require('path');

module.exports = cc(
    path.join(__dirname, 'config.json')
).store;
