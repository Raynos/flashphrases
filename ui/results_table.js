var Render = {};

Render.maybe = function maybeRender(render) {
    return function(field, value, result) {
        if (value === undefined) return '';
        if (value === null) return '';
        return render(field, value, result);
    };
};

Render.string = function renderString(field, value) {
    return '' + value;
};

Render.default = Render.maybe(Render.string);

Render.inc = Render.maybe(function(field, value) {
    return (value < 0 ? '-' : '+') + ' ' + Math.abs(value);
});

Render.pct = Render.maybe(function(field, value) {
    return (value * 100).toFixed(1) + '%';
});

Render.factor = Render.maybe(function(field, value) {
    return (value).toFixed(1) + 'x';
});

Render.chain = function(f, g) {
    return function(field, value, result) {
        value = f(field, value, result);
        return g(field, value, result);
    };
};

var d3 = require('d3');
var h = require('hyperscript');
var inherits = require('inherits');
var FlexTable = require('./flex_table');
var np = require('nested-property');
var ResultsBase = require('./results_base');
var util = require('util');

function ResultsTable() {
    this.element = h('table.resultsTable', {
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
    ResultsBase.call(this);
    FlexTable.call(this);
}

inherits(ResultsTable, FlexTable);
for (var prop in ResultsBase.prototype)
    if (ResultsBase.prototype[prop] !== Object.prototype[prop])
        ResultsTable.prototype[prop] = ResultsBase.prototype[prop];

ResultsTable.prototype.fields = [
    'level',
    'phrase',
    'session.done.name',
    'score.displayValue',
    'score.promptValue',
    'score.distValue',
    'score.value',
    'levelScore',
    'levelGoal',
];

ResultsTable.prototype.titles = {
    'score.value': 'score',
    'score.displayValue': 'display',
    'score.promptValue': 'prompt',
    'score.distValue': 'error',
    'session.done.name': 'finalState',
};

ResultsTable.prototype.renderField = {
    'score.value': function(field, value) {return '= ' + value;},
    'score.promptValue': Render.inc,
    'score.distValue': Render.inc,
    'levelScore': Render.maybe(function(field, value, result) {
        return util.format('%s -> %s', value, value + result.score.value);
    })
};

ResultsTable.prototype.update = function() {
    var self = this;

    var rows = d3
        .select(this.body)
        .selectAll('tr')
        .data([].concat(this.session.results).reverse())
        ;
    rows.exit().remove();
    var cells = rows.enter()
        .append('tr')
        .selectAll('td')
        .data(function(result) {
            return self.fields.map(function(field) {
                var value = np.get(result, field);
                var render = self.renderField[field] || Render.default;
                return render(field, value, result);
            });
        })
        ;
    cells.exit().remove();
    cells.enter().append('td').attr('class', function(d, i, j) {
        return 'field ' + self.fields[j];
    });
    cells.text(function(d) {return d;});
};

module.exports = ResultsTable;
