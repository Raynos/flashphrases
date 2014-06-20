var inherits = require('inherits');
var nextTick = require('next-tick');
var Flex = require('./flex');

function FlexTable() {
    Flex.call(this);
}

inherits(FlexTable, Flex);

FlexTable.prototype.resize = function() {
    var win = this.body.ownerDocument.defaultView;
    var style = win.getComputedStyle(this.body, null);
    if (style.display !== 'block') return;
    this.clearWidths();
    nextTick(this.resetWidths.bind(this));
};

FlexTable.prototype.clearWidths = function() {
    var rows, nrows, i, cells, ncells, j;
    for (cells=this.fieldsRow.cells, ncells=cells.length, i=0; i<ncells; i++)
        cells[i].width = '';
    for (rows=this.body.rows, nrows=rows.length, i=0; i<nrows; i++)
        for (cells=rows[i].cells, ncells=cells.length, j=0; j<ncells; j++)
            cells[j].width = '';
};

FlexTable.prototype.collectWidths = function() {
    this.widths = new Array(this.fieldsRow.cells.length);
    var rows, nrows, i, cells, ncells, j;
    for (cells=this.fieldsRow.cells, ncells=cells.length, i=0; i<ncells; i++)
        this.widths[i] = cells[i].clientWidth;
    for (rows=this.body.rows, nrows=rows.length, i=0; i<nrows; i++)
        for (cells=rows[i].cells, ncells=cells.length, j=0; j<ncells; j++)
            this.widths[j] = Math.max(this.widths[j], cells[j].clientWidth);
};

FlexTable.prototype.resetWidths = function() {
    this.collectWidths();
    var rows, nrows, i, cells, ncells, j;
    for (cells=this.fieldsRow.cells, ncells=cells.length, i=0; i<ncells; i++)
    for (cells=this.fieldsRow.cells, ncells=cells.length, i=0; i<ncells; i++)
        cells[i].width = this.widths[i];
    for (rows=this.body.rows, nrows=rows.length, i=0; i<nrows; i++)
        for (cells=rows[i].cells, ncells=cells.length, j=0; j<ncells; j++)
            cells[j].width = this.widths[j];
};

module.exports = FlexTable;
