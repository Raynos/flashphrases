var test = require('tape');

var Sample = require('../../lib/sample');

test('Sample', function(assert) {
    var S = new Sample();

    function isNaNArray(n, a) {
        var r = Array.isArray(a) && a.length === n;
        for (var i=0; i<n; i++ ) r = r && isNaN(a[i]);
        return r;
    }

    assert.equal(S.values.length, 0, 'initially empty');
    assert.ok(isNaN(S.median), 'NaN median initially');
    assert.ok(isNaN(S.iqr), 'NaN iqr initially');
    assert.ok(isNaN(S.lo), 'NaN lo initially');
    assert.ok(isNaN(S.hi), 'NaN hi initially');
    assert.ok(isNaNArray(3, S.range), 'NaN range initially');

    [
        {value: 5, values: [5], median: 5},
        {value: 4, values: [4, 5], median: (4+5)/2},
    ].forEach(function (testCase, i) {
        var n = i + 1;
        var desc = n + ' value(s)';
        S.add(testCase.value);
        assert.deepEqual(S.values, testCase.values, desc);
        assert.equal(S.median, testCase.median, 'correct median with ' + desc);
        assert.ok(isNaN(S.iqr), 'NaN iqr with ' + desc);
        assert.ok(isNaN(S.lo), 'NaN lo with ' + desc);
        assert.ok(isNaN(S.hi), 'NaN hi with ' + desc);
        assert.ok(isNaNArray(3, S.range), 'NaN range with ' + desc);
    });

    [
        {value: 6, values: [4, 5, 6], median: 5, iqr: 1, lo: 3, hi: 7, range: [3, 5, 7]},
        {value: 3, values: [3, 4, 5, 6], median: (4+5)/2, iqr: 2, lo: 0.5, hi: 8.5, range: [0.5, 4.5, 8.5]},
        {value: 7, values: [3, 4, 5, 6, 7], median: 5, iqr: 2, lo: 1, hi: 9, range: [1, 5, 9]},
        {value: 8, values: [3, 4, 5, 6, 7, 8], median: (5 + 6)/2,
            iqr: (6 + 7)/2 - (4 + 5)/2,
            lo: 1.5,
            hi: 9.5,
            range: [1.5, 5.5, 9.5]
        },
    ].forEach(function (testCase, i) {
        var n = i + 3;
        var desc = n + ' value(s)';
        S.add(testCase.value);
        assert.deepEqual(S.values, testCase.values, desc);
        assert.equal(S.median, testCase.median, 'correct median with ' + desc);
        assert.equal(S.iqr, testCase.iqr, 'correct iqr with ' + desc);
        assert.equal(S.lo, testCase.lo, 'correct lo with ' + desc);
        assert.equal(S.hi, testCase.hi, 'correct hi with ' + desc);
        assert.deepEqual(S.range, testCase.range, 'correct range with ' + desc);
    });

    assert.end();
});
