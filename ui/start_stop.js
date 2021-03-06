var EE = require('events').EventEmitter;
var h = require('hyperscript');
var inherits = require('inherits');

function StartStop(options) {
    if (!this instanceof StartStop) {
        return new StartStop(options);
    }
    this.element = h('div.startstop');
    this.startElement = this.element.appendChild(
        h('div.start', {
            onclick: this.onStartClick.bind(this)
        }, [
            'Click or press <enter> to start'
        ]));
    this.contentElement = this.element.appendChild(h('div', {
        style: {display: 'none'},
    }));
    this.started = false;
}

inherits(StartStop, EE);

StartStop.prototype.onStartClick = function() {
    this.start();
};

StartStop.prototype.addListeners = function(element) {
    element.addEventListener('keydown', this.onKeyDown.bind(this));
    element.addEventListener('keypress', this.onKeyPress.bind(this));
    element.addEventListener('blur', this.stop.bind(this));
};

StartStop.prototype.onKeyDown = function(event) {
    if (event.keyCode === 0x1b) { // <esc>
        event.preventDefault();
        event.stopPropagation();
        this.stop();
    }
};

StartStop.prototype.onKeyPress = function(event) {
    switch(event.charCode) {
        case 0x0a: // nl
        case 0x0d: // cr
        case 0x20: // <space>
            this.start();
            break;
        default:
            this.emit('keypress', event);
    }
};

StartStop.prototype.start = function() {
    if (!this.started) {
        this.started = true;
        this.showContent();
        this.emit('start');
    }
};

StartStop.prototype.stop = function() {
    if (!this.stopped) {
        this.started = false;
        this.hideContent();
        this.emit('stop');
    }
};

StartStop.prototype.showContent = function() {
    this.startElement.style.display = 'none';
    this.contentElement.style.display = '';
};

StartStop.prototype.hideContent = function() {
    this.contentElement.style.display = 'none';
    this.startElement.style.display = '';
};

module.exports = StartStop;
