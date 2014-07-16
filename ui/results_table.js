/* globals document */

var h = require('hyperscript');
var inherits = require('inherits');
var FlexTable = require('./flex_table');
var np = require('nested-property');

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
            this.fieldsRow = h('tr', this.fields.map(function(field) {
                var title = this.titles[field] || field;
                return h('th.field.' + field, title);
            }, this))
        ),
        this.body = h('tbody')
    );
    FlexTable.call(this);
}

inherits(ResultsTable, FlexTable);

ResultsTable.prototype.fields = [
    'level',
    'phrase',
    'score.displayValue',
    'score.promptValue',
    'score.distValue',
    'score.value',
];

ResultsTable.prototype.titles = {
    'score.value': 'score',
    'score.displayValue': 'display',
    'score.promptValue': 'prompt',
    'score.distValue': 'error',
};

var Render = {};

Render.maybe = function maybeRender(render) {
    return function(field, result) {
        var value = np.get(result, field);
        if (value === undefined) return '';
        if (value === null) return '';
        return render(field, result);
    };
};

Render.string = function renderString(field, result) {
    var value = np.get(result, field);
    return '' + value;
};

Render.default = Render.maybe(Render.string);

Render.inc = Render.maybe(function(field, result) {
    var value = np.get(result, field);
    return (value < 0 ? '-' : '+') + ' ' + Math.abs(value);
});

Render.pct = Render.maybe(function(field, result) {
    var value = np.get(result, field);
    return (value * 100).toFixed(1) + '%';
});

Render.factor = Render.maybe(function(field, result) {
    var value = np.get(result, field);
    return (value).toFixed(1) + 'x';
});

ResultsTable.prototype.renderField = {
    'score.value': function(field, result) {
        return '= ' + result.score.value;
    },
    'score.promptValue': Render.inc,
    'score.distValue': Render.inc,
};

ResultsTable.prototype.renderResult = function(result) {
    var contents = this.resultRowContents(result);
    return h('tr', this.fields.map(function(field, i) {
        return h('td.field.' + field, contents[i]);
    }, this));
};

ResultsTable.prototype.updateResultRow = function(row, result) {
    this.resultRowContents(result).forEach(function(content, i) {
        var cell = row.cells[i];
        while (cell.firstChild) cell.removeChild(cell.firstChild);
        if (content) cell.appendChild(document.createTextNode(content));
    }, this);
};

ResultsTable.prototype.resultRowContents = function(result) {
    return this.fields.map(function(field) {
        var render = this.renderField[field] || Render.default;
        return render(field, result);
    }, this);
};

ResultsTable.prototype.addResult = function(result) {
    var row = this.renderResult(result);
    this.body.insertBefore(row, this.body.rows[0]);
    result.on('change', this.updateResultRow.bind(this, row, result));
};

module.exports = ResultsTable;
