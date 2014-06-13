function Timeout() {
}

Timeout.prototype.clear = function() {
    if (this.timer) {
        clearTimeout(this.timer);
        delete this.timer;
    }
};

Timeout.prototype.set = function(func, time) {
    this.clear();
    this.timer = setTimeout(func, time);
};

module.exports = Timeout;
