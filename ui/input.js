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
        onchange: this.finish.bind(this),
        onblur: this.finish.bind(this)
    });
    this.update = debounce(200, this.update);
    this.updateNow = this.update.immedCaller;
}

inherits(Input, EE);

Input.prototype.reset = function(expected) {
    this.element.value = '';
    this.element.size = expected.length + 2;
    this.element.focus();
};

Input.prototype.update = function() {
    this.emit('data', this.element.value, false);
};

Input.prototype.finish = function() {
    this.emit('data', this.element.value, true);
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
        this.finish();
    } else {
        this.update();
    }
};

module.exports = Input;
