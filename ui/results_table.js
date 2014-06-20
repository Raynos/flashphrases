var h = require('hyperscript');

function ResultsTable() {
    this.element = h('table', {
        cellSpacing: 0,
        cellPadding: 0,
        border: 0
    },
        h('thead',
            h('tr',
                h('th.title', {
                    colSpan: this.fields.length
                }, 'Results')
            ),
            h('tr', this.fields.map(function(field) {
                return h('th.field.' + field, field);
            }))
        ),
        this.body = h('tbody')
    );
}

ResultsTable.prototype.fields = [
    'level',
    'correct',
    'score',
    'displayFactor',
    'inputFactor',
    'errorFactor',
    'expected',
    // 'got',
    // 'dist',
    'errorRate',
    // TODO: support sub fields
    // 'elapsed.display',
    // 'timeout.display',
    // 'elapsed.input',
    // 'timeout.input',
];

function maybeRender(render) {
    return function(field, result) {
        if (result[field] === undefined) return '';
        if (result[field] === null) return '';
        return render(field, result);
    };
}

function renderString(field, result) {
    return '' + result[field];
}

var renderPct = maybeRender(function(field, result) {
    var value = result[field];
    return (value * 100).toFixed(1) + '%';
});

var renderFactor = maybeRender(function(field, result) {
    var value = result[field];
    return (value).toFixed(1) + 'x';
});

var defaultRender = maybeRender(renderString);

ResultsTable.prototype.renderField = {
    errorRate: renderPct,
    displayFactor: renderFactor,
    inputFactor: renderFactor,
    errorFactor: renderFactor

};

ResultsTable.prototype.renderResult = function(result) {
    var self = this;
    return h('tr', this.fields.map(function(field) {
        var render = self.renderField[field] || defaultRender;
        return h('td.field.' + field, render.call(self, field, result));
    }));
};

ResultsTable.prototype.addResult = function(result) {
    var row = this.renderResult(result);
    this.body.insertBefore(row, this.body.rows[0]);
};

module.exports = ResultsTable;
