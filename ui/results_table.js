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

var hyperscript = require('hyperscript');
var mercury = require('mercury');
var h = mercury.h;
var inherits = require('inherits');
// var FlexTable = require('./flex_table');
var np = require('nested-property');
var ResultsBase = require('./results_base');
var util = require('util');

function ResultsTable() {
    this.element = hyperscript('div');
    ResultsBase.call(this);

    this.state = mercury.struct({
        results: mercury.array([], createResult)
    });

    mercury.app(this.element, this.state, render);

    function createResult(result) {
        return mercury.struct({
            level: mercury.value(result.level),
            session: mercury.struct({
                done: mercury.struct({
                    name: mercury.value(
                        result.session &&
                        result.session.done &&
                        result.session.done.name)
                })
            }),
            score: mercury.struct({
                value: mercury.value(result.score.value)
            }),
            phrase: mercury.value(result.phrase),
            got: mercury.value(result.got)
        });
    }
}

var fields = [
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
var titles = {
    'score.value': 'score',
    'score.displayValue': 'display',
    'score.promptValue': 'prompt',
    'score.distValue': 'error',
    'session.done.name': 'finalState',
};
var renderField = {
    'score.value': function(field, value) {return '= ' + value;},
    'score.promptValue': Render.inc,
    'score.distValue': Render.inc,
    'levelScore': Render.maybe(function(field, value, result) {
        return util.format('%s -> %s', value, value + result.score.value);
    })
};

function render(state) {
    return h('table.resultsTable', {
        cellSpacing: 0,
        cellPadding: 0,
        border: 0
    }, [
        h('thead', [
            h('tr', [
                h('th.title', {
                    colSpan: fields.length
                }, 'Results')
            ]),
            h('tr', fields.map(function(field) {
                var title = titles[field] || field;
                return h('th.field.' + field, title);
            }))
        ]),
        h('tbody', state.results.map(renderRow).reverse())
    ]);

    function renderRow(result) {
        var row = fields.map(function (field) {
            var value = np.get(result, field);
            var render = renderField[field] || Render.default;
            return render(field, value, result);
        });

        return h('tr', row.map(function (rowItem, index) {
            return h('td', {
                className: 'field ' + fields[index]
            }, rowItem);
        }));
    }
}

inherits(ResultsTable, ResultsBase);

ResultsTable.prototype.setState = function (session) {
    this.state.results.set(session.results);
};

ResultsTable.prototype.update = function () {
    this.setState(this.session);
};

module.exports = ResultsTable;
