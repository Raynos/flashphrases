// TODO: sort out the timing jank

function Flex() {
    this.element.ownerDocument.defaultView.addEventListener('resize', this.resize.bind(this));
    setTimeout(this.resize.bind(this), 10);
    // nextTick(this.resize.bind(this));
}

Flex.prototype.fudge = 0;
Flex.prototype.fudgeLimit = 10;

Flex.prototype.fudgeResize = function() {
    if (++this.fudge > this.fudgeLimit) return;
    setTimeout(this.resize.bind(this), 10);
};

Flex.prototype.resize = function() {
    this.fudge = 0;
};

module.exports = Flex;
