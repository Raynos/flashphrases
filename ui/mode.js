var EE = require('events').EventEmitter;
var h = require('hyperscript');
var inherits = require('inherits');

function Mode(options) {
    if (!this instanceof Mode) {
        return new Mode(options);
    }
    this.element = h('div.mode');
    this.panes = {};
    var self = this;
    var minMode = null;
    var modes = options.modes;
    if (Array.isArray(modes)) {
        modes.forEach(function(mode) {
            var el = h('div.' + mode);
            el.style.display = 'none';
            self.panes[mode] = self.element.appendChild(el);
            if (!minMode || mode < minMode) minMode = mode;
        });
    } else {
        Object.keys(modes).forEach(function(mode) {
            var el = modes[mode];
            el.style.display = 'none';
            self.panes[mode] = self.element.appendChild(el);
            if (!minMode || mode < minMode) minMode = mode;
        });
    }
    this.setMode(options.initial || minMode);
}

inherits(Mode, EE);

Mode.prototype.setMode = function setMode(mode, expected) {
    if (this.mode === mode) return;
    if (expected) {
        if (Array.isArray(expected)) {
            if (!~expected.indexOf(this.mode)) return;
        } else {
            if (this.mode !== expected) return;
        }
    }
    if (this.mode) this.panes[this.mode].style.display = 'none';
    this.panes[mode].style.display = '';
    this.mode = mode;
    this.emit('change', mode);
};

module.exports = Mode;
