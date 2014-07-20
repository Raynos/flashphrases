function ResultsBase() {
    this.boundOnChange = this.onChange.bind(this);
}

ResultsBase.prototype.freeze = function() {
    this.frozen = true;
    this.changed = false;
};

ResultsBase.prototype.thaw = function() {
    this.frozen = false;
    if (this.changed) {
        this.changed = false;
        this.update();
    }
};

ResultsBase.prototype.setSession = function(session) {
    if (this.session) {
        this.session.removeListener(this.boundOnChange);
        this.session = null;
    }
    if (session) {
        this.session = session;
        this.session.on('change', this.boundOnChange);
    }
    this.update();
};

ResultsBase.prototype.onChange = function() {
    if (this.frozen) {
        this.changed = true;
    } else {
        this.update();
    }
};

module.exports = ResultsBase;
