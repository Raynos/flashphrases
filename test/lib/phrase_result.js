var copy = require('deepcopy');
var test = require('tape');
var util = require('util');
var PhraseResult = require('../../lib/phrase_result');

function testResult(desc, options, expected, steps) {
    test(desc, function(assert) {
        var result = new PhraseResult(options);
        function expect(desc) {
            assert.deepEqual(result.session, expected.session, '.session ' + desc);
            Object.keys(expected.score).forEach(function(prop) {
                assert.deepEqual(result.score[prop], expected.score[prop], '.score.' + prop + ' ' + desc);
            });
        }
        expect(desc + ' initial');
        steps.forEach(function(step) {
            var event = step[0], func = step[1];
            func(event, expected = copy(expected));
            result.addEvent(event);
            expect(util.format('%s after %s event', desc, event.name));
        });
        assert.end();
    });
}

testResult('2-phrase', {
    level: 2,
    phrase: 'watch out',
    baseValue: 10,
    maxDistProp: 0.2
}, {
    session: null,
    score: {
        expected: 'WATCHOUT',
        got: '',
        value: 0
    },
}, [
    [{name: "display", now: 0, timeout: 1500}, function(disp, expect) {
        expect.session = {};
        expect.session.display = disp;
        expect.session.done = null;
    }],
    [{name: "prompt", now: 750, timeout: 5000}, function(prmpt, expect) {
        expect.session.prompt = prmpt;
        expect.session.input = [];
        expect.score.displayValue = 5;
        expect.score.distValue = -30;
        expect.score.value = -25;
    }],
    [{name: "input", now: 850, got: "w"}, function(input, expect) {
        expect.session.input.push(input);
        expect.score.got = 'W';
    }],
    [{name: "input", now: 950, got: "wa"}, function(input, expect) {
        expect.session.input.push(input);
        expect.score.got = 'WA';
        expect.score.distValue = -27;
        expect.score.value = -22;
    }],
    [{name: "input", now: 1050, got: "wat"}, function(input, expect) {
        expect.session.input.push(input);
        expect.score.got = 'WAT';
        expect.score.distValue = -21;
        expect.score.value = -16;
    }],
    [{name: "input", now: 1150, got: "wath"}, function(input, expect) {
        expect.session.input.push(input);
        expect.score.got = 'WATH';
        expect.score.distValue = -15;
        expect.score.value = -10;
    }],
    [{name: "input", now: 1250, got: "wathc"}, function(input, expect) {
        expect.session.input.push(input);
        expect.score.got = 'WATHC';
        expect.score.distValue = -15;
        expect.score.value = -10;
    }],
    [{name: "input", now: 1300, got: "wathc "}, function(input, expect) {
        expect.session.input.push(input);
        expect.score.got = 'WATHC';
        expect.score.distValue = -15;
        expect.score.value = -10;
    }],
    [{name: "input", now: 1400, got: "wathc o"}, function(input, expect) {
        expect.session.input.push(input);
        expect.score.got = 'WATHCO';
        expect.score.distValue = -15;
        expect.score.value = -10;
    }],
    [{name: "input", now: 1500, got: "wathc ot"}, function(input, expect) {
        expect.session.input.push(input);
        expect.score.got = 'WATHCOT';
        expect.score.distValue = -8;
        expect.score.value = -3;
    }],
    [{name: "submit", now: 3251}, function(done, expect) {
        expect.session.done = done;
        expect.score.got = 'WATHCOT';
        expect.score.distValue = -8;
        expect.score.promptValue = 9;
        expect.score.value = 6;
    }]
]);
