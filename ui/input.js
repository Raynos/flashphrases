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
        onchange: this.update.bind(this, true),
        onblur: this.update.bind(this, true)
    });
}

inherits(Input, EE);

Input.prototype.update = function(force) {
    force = Boolean(force);
    if (this.updateTimer) {
        clearTimeout(this.updateTimer);
        delete this.updateTimer;
    }
    if (!this.element.disabled) {
        this.element.disabled = force;
        this.emit('data', this.element.value, force);
    }
};

Input.prototype.eventuallyUpdate = function(force) {
    if (this.updateTImer) clearTimeout(this.updateTImer);
    var self = this;
    this.updateTImer = setTimeout(function() {
        delete self.updateTImer;
        self.update(force);
    }, 200);
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
        this.update(true);
    } else {
        this.eventuallyUpdate();
    }
};

module.exports = Input;
