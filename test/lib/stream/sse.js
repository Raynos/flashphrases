var test = require('tape');

var SSEStream = require('../../../lib/stream/sse');

test('SSEStream', function(assert) {
    var stream = new SSEStream({
        hello: 'wat'
    });

    [
        ['hello', null, [':wat', '', '']],
        ['5s retry', {retry: 5000}, ['retry: 5000', '', '']],
        ['comment', {comment: 'lol'}, [':lol', '', '']],
        ['simple event', {data: 'hi'}, ['data: hi', '', '']],
        ['named event', {name: 'nom', data: 'hi'}, ['name: nom', 'data: hi', '', '']],
        ['named ided event', {id: 42, name: 'nom', data: 'hi'}, ['id: 42', 'name: nom', 'data: hi', '', '']],
        ['ided event', {id: 42, data: 'hi'}, ['id: 42', 'data: hi', '', '']],
        ['multi-line event', {data: 'hi\nthere'}, ['data: hi', 'data: there', '', '']],
    ].forEach(function(testCase) {
        var write = testCase[1];
        var expected = testCase[2];
        if (write) stream.write(write);
        var got = String(stream.read()).split('\n');
        assert.deepEqual(got, expected, 'expected ' + testCase[0]);
    });

    assert.end();
});

test('SSEStream keepalive', function(assert) {
    var stream = new SSEStream({
        keepalive: 10
    });
    setTimeout(function() {
        var got = String(stream.read()).split('\n');
        assert.deepEqual(got, [
            ':keepalive', '',
            ':keepalive', '',
            ':keepalive', '', ''
        ], 'expected 3 keepalives');
        assert.end();
    }, 30);
});
