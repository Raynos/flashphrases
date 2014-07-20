var d3 = require('d3');
var h = require('hyperscript');
var editdist = require('../lib/editdist');
var inherits = require('inherits');
var ResultsBase = require('./results_base');

function Results() {
    this.element = h('div.results');
    ResultsBase.call(this);
}

inherits(Results, ResultsBase);

var ops = {};
ops[editdist.SAME] = 'same';
ops[editdist.CHANGE] = 'change';
ops[editdist.DELETE] = 'delete';
ops[editdist.INSERT] = 'insert';

function groupby(key, a) {
    var r = [], g = null;
    for (var i=0, n=a.length; i<n; i++) {
        var item = a[i];
        var keyval = key(item, i, a);
        if (!g || g.key !== keyval) r.push(g = {key: keyval, items: []});
        g.items.push(item);
    }
    return r;
}

Results.prototype.update = function() {
    var results = this.session.results
        .filter(function(result) {
            if (!result.session || !result.session.done) return false;
            switch (result.session.done.name) {
                case 'abandon':
                case 'abort':
                    return false;
            }
            return true;
        })
        .reverse()
        ;

    var resultsByLevel = groupby(function(result) {return result.level;}, results);

    var levels = d3
        .select(this.element)
        .selectAll('fieldset.level')
        .data(resultsByLevel)
        ;
    levels.exit()
        .remove()
        ;
    var enter = levels.enter()
        .append('fieldset')
        .attr('class', 'level')
        ;
    enter.append('legend');
    enter.append('ul');
    levels
        .select('legend')
        .text(function(g) {return 'Level ' + g.key;})
        ;

    var sel = levels
        .select('ul')
        .selectAll('li.result')
        .data(function(g) {return g.items;})
        ;

    sel.exit()
        .remove()
        ;

    enter = sel.enter()
        .append('li')
        .attr('class', 'result')
        ;

    enter
        .append('div')
        .attr('class', 'score')
        ;

    enter
        .append('div')
        .attr('class', 'phrase')
        ;

    sel
        .select('.score')
        .attr('class', function(result) {
            var value = result.score.value;
            var v = Math.max(0, Math.min(1, value / 20 + 0.5));
            var vc = 'v' + Math.round(v * 10).toString(16).toUpperCase();
            return 'score ' + vc;
        })
        .text(function(result) {
            var value = result.score.value;
            return (value < 0 ? '-' : '+') + Math.abs(value);
        })
        ;

    sel
        .select('.phrase')
        .html(function(result) {
            var a = result.phrase, b = result.got;
            if (a && b) {
                return editdist.trace(a, b)
                    .edit
                    .map(function(step) {

                        // switch (step[0]) {
                        //     case editdist.INSERT: return b[step[2]] + '\u0302';
                        //     case editdist.CHANGE: return a[step[1]] + '\u0358' + b[step[2]];
                        //     case editdist.DELETE: return a[step[1]] + '\u0338';
                        //     default:              return a[step[1]];
                        // }

                        if (step[0] === editdist.SAME) return a[step[1]];
                        var c = step[0] === editdist.INSERT ? b[step[2]] : a[step[1]];
                        return '<span class="edit ' + ops[step[0]] + '">' + c + '</span>';

                    })
                    .join('')
                    ;
            }
        })
        ;

};

module.exports = Results;
