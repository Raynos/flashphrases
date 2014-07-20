function ResultsBase() {
    this.boundOnChange = this.onChange.bind(this);
}

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
    this.update();
};

module.exports = ResultsBase;
