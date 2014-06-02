var extend = require('xtend/mutable');

var test = require('tape');
var util = require('util');

var Markov = require('../../lib/Markov');

test('Markov addTokens', function(assert) {
    var markov = new Markov();

    function expect(counts, trans, mess) {
        assert.deepEqual(markov.counts, counts, 'expected counts ' + mess);
        assert.deepEqual(markov.transitions, trans, 'expected transitions ' + mess);
    }

    var expectedCounts = {};
    var expectedTransitions = {
        __START_TOKEN__: [],
    };
    expect(expectedCounts, expectedTransitions, 'initially');

    [
        ['this is a testing sentence', {
            this: 1,
            is: 1,
            a: 1,
            testing: 1,
            sentence: 1,
        }, {
            __START_TOKEN__: ['this'],
            this: ['is'],
            is: ['a'],
            a: ['testing'],
            testing: ['sentence'],
            sentence: ['__END_TOKEN__'],
        } ],
        ['here is another testing sentence', {
            here: 1,
            is: 2,
            another: 1,
            testing: 2,
            sentence: 2,
        }, {
            __START_TOKEN__: ['here', 'this'],
            here: ['is'],
            is: ['a', 'another'],
            another: ['testing'],
            testing: ['sentence'],
        } ],
    ].forEach(function(state) {
        var tokens = state[0].split(' ');
        var counts = state[1];
        var trans = state[2];
        var mess = util.format('after tokens %j', tokens);
        markov.addTokens(tokens);
        extend(expectedCounts, counts);
        extend(expectedTransitions, trans);
        expect(expectedCounts, expectedTransitions, mess);
    });

    assert.end();
});

test('Markov special keywords', function(assert) {
    var markov = new Markov();

    function expect(counts, trans, mess) {
        assert.deepEqual(markov.counts, counts, 'expected counts ' + mess);
        assert.deepEqual(markov.transitions, trans, 'expected transitions ' + mess);
    }

    var expectedCounts = {};
    var expectedTransitions = {
        __START_TOKEN__: [],
    };
    expect(expectedCounts, expectedTransitions, 'initially');

    [
        ['the token constructor is special', {
            the: 1,
            token: 1,
            constructor: 1,
            is: 1,
            special: 1,
        }, {
            __START_TOKEN__: ['the'],
            the: ['token'],
            token: ['constructor'],
            constructor: ['is'],
            is: ['special'],
            special: ['__END_TOKEN__']
        } ],
    ].forEach(function(state) {
        var tokens = state[0].split(' ');
        var counts = state[1];
        var trans = state[2];
        var mess = util.format('after tokens %j', tokens);
        markov.addTokens(tokens);
        extend(expectedCounts, counts);
        extend(expectedTransitions, trans);
        expect(expectedCounts, expectedTransitions, mess);
    });

    assert.end();
});

test('Markov save/load', function(assert) {
    var markov = new Markov();
    markov.addTokens('a b c'.split(' '));
    markov.addTokens('a b d'.split(' '));
    markov.addTokens('c e g'.split(' '));

    var expectedCounts = {
        a: 2,
        b: 2,
        c: 2,
        d: 1,
        e: 1,
        g: 1,
    };
    var expectedTrans = {
        __START_TOKEN__: ['a', 'c'],
        a: ['b'],
        b: ['c', 'd'],
        c: ['__END_TOKEN__', 'e'],
        d: ['__END_TOKEN__'],
        e: ['g'],
        g: ['__END_TOKEN__'],
    };

    var data = markov.save();
    assert.deepEqual(data, {
        counts: expectedCounts,
        transitions: expectedTrans
    }, 'saved data matches');

    var copy = Markov.load(data);
    assert.deepEqual(copy.counts, expectedCounts, 'loaded counts');
    assert.deepEqual(copy.transitions, expectedTrans, 'loaded transitions');

    assert.end();
});

test('Markov merge', function(assert) {
    function expect(markov, counts, trans, mess) {
        assert.deepEqual(markov.counts, counts, 'expected counts ' + mess);
        assert.deepEqual(markov.transitions, trans, 'expected transitions ' + mess);
    }

    var markova = new Markov(['this', 'is', 'a', 'testing', 'sentence', null]);
    var markovb = new Markov(['here', 'is', 'another', 'testing', 'sentence', null]);

    expect(markova, {
        this: 1,
        is: 1,
        a: 1,
        testing: 1,
        sentence: 1,
    }, {
        __START_TOKEN__: ['this'],
        this: ['is'],
        is: ['a'],
        a: ['testing'],
        testing: ['sentence'],
        sentence: ['__END_TOKEN__'],
    }, 'markova');

    expect(markovb, {
        here: 1,
        is: 1,
        another: 1,
        testing: 1,
        sentence: 1,
    }, {
        __START_TOKEN__: ['here'],
        here: ['is'],
        is: ['another'],
        another: ['testing'],
        testing: ['sentence'],
        sentence: ['__END_TOKEN__'],
    }, 'markovb');

    markova.merge(markovb);
    expect(markova, {
        this: 1,
        here: 1,
        is: 2,
        a: 1,
        another: 1,
        testing: 2,
        sentence: 2,
    }, {
        __START_TOKEN__: ['here', 'this'],
        this: ['is'],
        here: ['is'],
        is: ['a', 'another'],
        a: ['testing'],
        another: ['testing'],
        testing: ['sentence'],
        sentence: ['__END_TOKEN__'],
    }, 'markova + markovb');

    assert.end();
});

var Corpus = {
    vimLicense: [
        'there are no restrictions on distributing unmodified copies of vim except that they must include this license text',
        'you can also distribute unmodified parts of vim likewise unrestricted except that they must include this license text',
        'you are also allowed to include executables that you made from the unmodified vim sources plus your own usage examples and vim scripts',
        'it is allowed to distribute a modified version of vim including executables and source code when the following four conditions are met',
        'this license text must be included unmodified',
        'the modified vim must be distributed in one of the following five ways',
        'if you make changes to vim yourself you must clearly describe in the distribution how to contact you',
        'when the maintainer asks you  for a copy of the modified vim you distributed you must make your changes including source code available to the maintainer without fee',
        'the maintainer reserves the right to include your changes in the official version of vim',
        'what the maintainer will do with your changes and under what license they will be distributed is negotiable',
        'if there has been no negotiation then this license or a later version also applies to your changes',
        'the current maintainer is bram moolenaar',
        'if this changes it will be announced in appropriate places',
        'when it is completely impossible to contact the maintainer the obligation to send him your changes ceases',
        'once the maintainer has confirmed that he has received your changes they will not have to be sent again',
        'if you have received a modified vim that was distributed as mentioned under',
        'you are allowed to further distribute it unmodified as mentioned at',
        'if you make additional changes the text under a applies to those changes',
        'provide all the changes including source code with every copy of the modified vim you distribute',
        'this may be done in the form of a context diff',
        'you can choose what license to use for new code you add',
        'the changes and their license must not restrict others from making their own changes to the official version of vim',
        'when you have a modified vim which includes changes as mentioned under',
        'you can distribute it without the source code for the changes if the following three conditions are met',
        'the license that applies to the changes permits you to distribute the changes to the vim maintainer without fee or restriction and permits the vim maintainer to include the changes in the official version of vim without fee or restriction',
        'you keep the changes for at least three years after last distributing the corresponding modified vim',
        'when the maintainer or someone who you distributed the modified vim to asks you for the changes within this period you must make them available to him',
        'you clearly describe in the distribution how to contact you',
        'this contact information must remain valid for at least three years after last distributing the corresponding modified vim or as long as possible',
        'when the gnu general public license applies to the changes you can distribute the modified vim under the gnu gpl version 2 or any later version',
        'a message must be added at least in the output of the version command and in the intro screen such that the user of the modified vim is able to see that it was modified',
        'if you distribute a modified version of vim you are encouraged to use the vim license for your changes and make them available to the maintainer including the source code',
        'the preferred way to do this is by email or by uploading the files to a server and emailing the url',
        'if the number of changes is small emailing a context diff will do',
        'it is not allowed to remove this license from the distribution of the vim sources parts of it or from a modified version',
        'you may use this license for previous vim releases instead of the license that they came with at your option',
    ]
};

function rotatingSequence(seq) {
    var i = 0;
    var self = function() {
        var r = seq[i];
        i = (i + 1) % seq.length;
        return r;
    };
    self.reset = function() {
        i = 0;
    };
    self.set = function(j) {
        i = j;
    };
    return self;
}

test('Markov chain', function(assert) {
    var seq = rotatingSequence([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);

    var markov = new Markov();
    Corpus.vimLicense.forEach(function(sentence) {
        markov.addTokens(sentence.split(/\s+/));
    });

    assert.equal(
        markov.chain(5, null, seq).join(' '),
        'if the gnu general public'
    );
    seq.reset();

    assert.equal(
        markov.chain(10, null, seq).join(' '),
        'if the gnu general public license that was modified'
    );
    seq.reset();

    seq.set(4);
    assert.equal(
        markov.chain(10, null, seq).join(' '),
        'the output of vim you add'
    );
    seq.reset();

    assert.equal(
        markov.chain(10, 'what', seq).join(' '),
        'license for at least three years after last distributing the'
    );
    seq.reset();

    assert.end();
});
