function editdist(a, b) {
    // TODO: could be faster and more memory efficient

    var m = a.length;
    var n = b.length;
    var d = [];
    var i, j;

    if (!m) return n;
    if (!n) return m;

    for (i = 0; i <= m; i++) d[i] = [i];
    for (j = 0; j <= n; j++) d[0][j] = j;

    for (j = 1; j <= n; j++) {
        for (i = 1; i <= m; i++) {
            if (a[i-1] === b[j-1]) d[i][j] = d[i - 1][j - 1];
            else d[i][j] = Math.min(d[i-1][j], d[i][j-1], d[i-1][j-1]) + 1;
        }
    }
    return d[m][n];
}

editdist.lossy = function lossy(a, b) {
    a = a.toLowerCase().replace(/\s+/g, '');
    b = b.toLowerCase().replace(/\s+/g, '');
    return editdist(a, b);
};

module.exports = editdist;
