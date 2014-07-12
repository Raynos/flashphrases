var EE = require('events').EventEmitter;
var h = require('hyperscript');
var inherits = require('inherits');

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
    this.done = false;
}

inherits(Input, EE);

Input.prototype.reset = function(expected) {
    this.done = false;
    this.element.value = '';
    this.element.size = expected.length + 2;
    this.element.focus();
};

Input.prototype.update = function() {
    if (this.done) return;
    this.emit('data', this.element.value);
};

Input.prototype.finish = function() {
    if (this.done) return;
    this.done = true;
    this.emit('done', this.element.value);
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
