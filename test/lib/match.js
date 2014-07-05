var test = require('tape');
var util = require('util');

var Match = require('../../lib/match');

test('Any', function(assert) {
    var a = {name: 'a', data: 'abc123'};
    assert.deepEqual(Match.Any([a], 0), [a, 1], 'Any matcher matches');
    assert.deepEqual(Match.exec(Match.Any, [a]), {
        start: 0,
        end: 1,
        data: a
    }, 'Any matcher matches under match');
    assert.end();
});

var TestData = {
    a: {name: 'a', data: 'abc123'},
    b: {name: 'b', data: 'def456'}
};

test('Pred', function(assert) {
    var pat = Match.Pred(function(d) {return d.name === 'a';});
    assert.deepEqual(Match.exec(pat, [TestData.a]), {
        data: TestData.a,
        start: 0,
        end: 1
    }, 'name pred matches a');
    assert.deepEqual(Match.exec(pat, [TestData.b]), null, 'name pred doesn\'t matches b');
    assert.deepEqual(Match.exec(pat, [TestData.b, TestData.a]), {
        data: TestData.a,
        start: 1,
        end: 2
    }, 'name pred matches a with prefix');
    assert.end();
});

var named = function(name) {
    var o = {};
    o.name = name;
    return Match.ObjectWith(o);
};

test('ObjectWith', function(assert) {
    var na = named('a');
    var nb = named('b');
    assert.deepEqual(Match.exec(na, [TestData.a]), {data: TestData.a, start: 0, end: 1}, 'named a matches a');
    assert.deepEqual(Match.exec(nb, [TestData.b]), {data: TestData.b, start: 0, end: 1}, 'named b matches b');
    assert.deepEqual(Match.exec(na, [TestData.b]), null, 'named a doesn\'t match b');
    assert.deepEqual(Match.exec(nb, [TestData.a]), null, 'named b doesn\'t match a');
    assert.end();
});

function unit(val) {
    return function() {return val;};
}
unit.funcOr = function funcOrUnit(arg) {
    return typeof arg === 'function' ? arg : unit(arg);
};
unit.withArgs = function withUnitArgs(func) {
    return function() {
        var n = arguments.length;
        var args = new Array(n);
        for (var i=0; i<n; i++) args[i] = unit.funcOr(arguments[i]);
        return func.apply(this, args);
    };
};

test('Full', function(assert) {
    [
        {
            desc: 'a b* (c|d)+ e',
            pat: Match.compile(['seq',
                named('a'),
                ['star', named('b')],
                ['plus', ['alt',
                    named('c'),
                    named('d')
                ]],
                named('e')
            ]),
            expectations: [
                {
                    cases: [
                        [{name: 'a'}, {name: 'c'}, {name: 'e'}],
                        [{name: 'a'}, {name: 'd'}, {name: 'e'}],
                        [{name: 'a'}, {name: 'b'}, {name: 'c'}, {name: 'e'}],
                        [{name: 'a'}, {name: 'b'}, {name: 'd'}, {name: 'e'}],
                        [{name: 'a'}, {name: 'c'}, {name: 'c'}, {name: 'e'}],
                        [{name: 'a'}, {name: 'd'}, {name: 'c'}, {name: 'e'}],
                        [{name: 'a'}, {name: 'b'}, {name: 'c'}, {name: 'c'}, {name: 'e'}],
                        [{name: 'a'}, {name: 'b'}, {name: 'd'}, {name: 'c'}, {name: 'e'}],
                    ],
                    expect: function(data, expect) {
                        for (var i=0, n=data.length; i<n; i++)
                            expect(data.slice(0, i), null);
                        expect(data, {
                            start: 0,
                            end: data.length,
                            data: data
                        });
                    }
                },
                {
                    cases: [
                        [{name: 'a'}, {name: 'a'}, {name: 'c'}, {name: 'e'}],
                        [{name: 'a'}, {name: 'a'}, {name: 'd'}, {name: 'e'}],
                        [{name: 'a'}, {name: 'a'}, {name: 'b'}, {name: 'c'}, {name: 'e'}],
                        [{name: 'a'}, {name: 'a'}, {name: 'b'}, {name: 'd'}, {name: 'e'}],
                        [{name: 'x'}, {name: 'a'}, {name: 'c'}, {name: 'e'}],
                        [{name: 'x'}, {name: 'a'}, {name: 'd'}, {name: 'e'}],
                        [{name: 'x'}, {name: 'a'}, {name: 'b'}, {name: 'c'}, {name: 'e'}],
                        [{name: 'x'}, {name: 'a'}, {name: 'b'}, {name: 'd'}, {name: 'e'}],
                    ],
                    expect: function(data, expect) {
                        for (var i=0, n=data.length; i<n; i++)
                            expect(data.slice(0, i), null);
                        expect(data, {
                            start: 1,
                            end: data.length,
                            data: data.slice(1)
                        });
                    }
                }
            ]
        },
        {
            desc: 'a ( b* ) ( (c|d)+ ) e',
            pat: Match.compile(['seq',
                named('a'),
                ['group', ['star', named('b')]],
                ['group', ['plus', ['alt',
                    named('c'),
                    named('d')
                ]]],
                named('e')
            ]),
            expectations: [

                {
                    case: [{name: 'a'}, {name: 'c'}, {name: 'e'}],
                    expected: {start: 0, end: 3, data: [
                        {name: 'a'},
                        [],
                        [ {name: 'c'} ],
                        {name: 'e'},
                    ]}
                },
                {
                    case: [{name: 'a'}, {name: 'd'}, {name: 'c'}, {name: 'e'}],
                    expected: {start: 0, end: 4, data: [
                        {name: 'a'},
                        [],
                        [ {name: 'd'}, {name: 'c'} ],
                        {name: 'e'},
                    ]}
                },
                {
                    case: [{name: 'a'}, {name: 'b'}, {name: 'c'}, {name: 'e'}],
                    expected: {start: 0, end: 4, data: [
                        {name: 'a'},
                        [ {name: 'b'} ],
                        [ {name: 'c'} ],
                        {name: 'e'},
                    ]}
                },
                {
                    case: [{name: 'a'}, {name: 'b'}, {name: 'd'}, {name: 'c'}, {name: 'e'}],
                    expected: {start: 0, end: 5, data: [
                        {name: 'a'},
                        [ {name: 'b'} ],
                        [ {name: 'd'}, {name: 'c'} ],
                        {name: 'e'},
                    ]}
                }
            ]
        }
    ].forEach(function(testPat) {
        testPat.expectations.forEach(function(expectation) {
            function defaultExpect(data, expect) {
                expect(data, expectation.expected);
            }
            (expectation.cases || [expectation['case']]).forEach(function(testData) {
                (expectation.expect || defaultExpect)(testData, function(data, expected) {
                    var does = expected ? 'matches' : 'doesn\'t match';
                    var desc = util.format('/%s/ %s %s', testPat.desc, does, data.map(function(o){return o.name;}));
                    var got = Match.exec(testPat.pat, data);
                    assert.deepEqual(got, expected, desc);
                });
            });
        });
    });
    assert.end();
});

test('execRight', function(assert) {
    [
        {
            desc: 'a ( b* ) ( (c|d)+ ) e',
            pat: Match.compile(['seq',
                named('a'),
                ['star', named('b')],
                ['plus', ['alt', named('c'), named('d')]],
                named('e')
            ]),
            expectations: [
                {
                    case: [ {name: 'a'}, {name: 'c'}, {name: 'e'},
                            {name: 'a'}, {name: 'd'}, {name: 'e'} ],
                    expected: {start: 3, end: 6, data: [{name: 'a'}, {name: 'd'}, {name: 'e'}]}
                },
                {
                    case: [ {name: 'a'}, {name: 'c'}, {name: 'e'},
                            {name: 'a'}, {name: 'd'}, {name: 'e'},
                            {name: 'x'},
                            {name: 'a'}, {name: 'd'},
                            {name: 'x'},
                            {name: 'd'}, {name: 'e'},
                            {name: 'x'},
                          ],
                    expected: {start: 3, end: 6, data: [{name: 'a'}, {name: 'd'}, {name: 'e'}]}
                },
                {
                    case: [ {name: 'a'}, {name: 'c'}, {name: 'e'},
                            {name: 'a'}, {name: 'd'}, {name: 'e'},
                            {name: 'x'},
                            {name: 'a'}, {name: 'd'},
                            {name: 'd'}, {name: 'e'},
                            {name: 'x'},
                          ],
                    expected: {start: 7, end: 11, data: [{name: 'a'}, {name: 'd'}, {name: 'd'}, {name: 'e'}]}
                }
            ]
        }
    ].forEach(function(testPat) {
        testPat.expectations.forEach(function(expectation) {
            function defaultExpect(data, expect) {
                expect(data, expectation.expected);
            }
            (expectation.cases || [expectation['case']]).forEach(function(testData) {
                (expectation.expect || defaultExpect)(testData, function(data, expected) {
                    var does = expected ? 'matches' : 'doesn\'t match';
                    var desc = util.format('/%s/ %s %s', testPat.desc, does, data.map(function(o){return o.name;}));
                    var got = Match.execRight(testPat.pat, data);
                    assert.deepEqual(got, expected, desc);
                });
            });
        });
    });
    assert.end();
});

test('named groups', function(assert) {
    [
        {
            desc: 'a ( b* ) ( (c|d)+ ) e',
            pat: Match.compile(['merge',
                ['group', named('a'), 'a'],
                ['group', ['star', named('b')], 'b'],
                ['group', ['opt', named('c')], 'c'],
            ]),
            expectations: [
                {
                    case: [ {name: 'a'} ],
                    expected: {start: 0, end: 1, data: {
                        a: {name: 'a'},
                        b: [],
                        c: null
                    }}
                },
                {
                    case: [ {name: 'a'}, {name: 'b'} ],
                    expected: {start: 0, end: 2, data: {
                        a: {name: 'a'},
                        b: [{name: 'b'}],
                        c: null
                    }}
                },
                {
                    case: [ {name: 'a'}, {name: 'c'} ],
                    expected: {start: 0, end: 2, data: {
                        a: {name: 'a'},
                        b: [],
                        c: {name: 'c'}
                    }}
                },
                {
                    case: [ {name: 'a'}, {name: 'b'}, {name: 'c'} ],
                    expected: {start: 0, end: 3, data: {
                        a: {name: 'a'},
                        b: [{name: 'b'}],
                        c: {name: 'c'}
                    }}
                },
                {
                    case: [ {name: 'a'}, {name: 'b'}, {name: 'b'} ],
                    expected: {start: 0, end: 3, data: {
                        a: {name: 'a'},
                        b: [{name: 'b'}, {name: 'b'}],
                        c: null
                    }}
                },
                {
                    case: [ {name: 'a'}, {name: 'b'}, {name: 'b'}, {name: 'c'} ],
                    expected: {start: 0, end: 4, data: {
                        a: {name: 'a'},
                        b: [{name: 'b'}, {name: 'b'}],
                        c: {name: 'c'}
                    }}
                }
            ]
        }
    ].forEach(function(testPat) {
        testPat.expectations.forEach(function(expectation) {
            function defaultExpect(data, expect) {
                expect(data, expectation.expected);
            }
            (expectation.cases || [expectation['case']]).forEach(function(testData) {
                (expectation.expect || defaultExpect)(testData, function(data, expected) {
                    var does = expected ? 'matches' : 'doesn\'t match';
                    var desc = util.format('/%s/ %s %s', testPat.desc, does, data.map(function(o){return o.name;}));
                    var got = Match.exec(testPat.pat, data);
                    assert.deepEqual(got, expected, desc);
                });
            });
        });
    });
    assert.end();
});
