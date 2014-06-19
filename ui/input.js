var EE = require('events').EventEmitter;
var h = require('hyperscript');
var inherits = require('inherits');
var debounce = require('../lib/debounce');

function Input() {
    if (!this instanceof Input) {
        return new Input();
    }
    this.element = h('input', {
        type: 'text',
        onkeydown: this.onKeyDown.bind(this),
        onkeypress: this.onKeyPress.bind(this),
        onchange: this.update.bind(this, true),
        onblur: this.update.bind(this, true)
    });
    this.update = debounce(200, this.update);
    this.updateNow = this.update.immedCaller;
}

inherits(Input, EE);

Input.prototype.update = function(force) {
    force = Boolean(force);
    this.emit('data', this.element.value, force);
};

Input.prototype.onKeyDown = function(event) {
    if (event.keyCode  <  0x20 &&
        event.keyCode !== 0x0a &&
        event.keyCode !== 0x0d) {
        event.preventDefault();
        event.stopPropagation();
        this.emit('stop', event);
    }
};

Input.prototype.onKeyPress = function(event) {
    if (event.keyCode === 0x0a ||
        event.keyCode === 0x0d) {
        this.updateNow(true);
    } else {
        this.update();
    }
};

module.exports = Input;
