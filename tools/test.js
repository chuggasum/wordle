// Run: node tools/test.js
const fs = require('fs'), path = require('path'), assert = require('assert');
global.window = {}; require('../public/words.js');
const A = window.ANSWERS, X = window.EXTRA_GUESSES, all = new Set([...A, ...X]);

// word lists
for (const w of [...A, ...X]) assert(/^[a-z]{5}$/.test(w), 'bad word ' + w);
assert.strictEqual(new Set(A).size, A.length, 'duplicate answers');
assert(A.every(w => all.has(w)), 'answer missing from valid set');
assert(X.every(w => !A.includes(w)), 'extra overlaps answers');

// scoring: pulls the real function out of game.js
const src = fs.readFileSync(path.join(__dirname, '..', 'public', 'game.js'), 'utf8');
const start = src.indexOf('function score(guess, answer)');
const body = src.slice(start, src.indexOf('return res;', start) + 'return res;'.length) + '}';
const run = (g, a) => new Function('COLS', body + '; return score(' + JSON.stringify(g) + ',' + JSON.stringify(a) + ')')(5).map(s => s[0]).join('');
const cases = [['crane', 'crane', 'ccccc'], ['allee', 'apple', 'cpaac'], ['speed', 'abide', 'aapap'], ['llama', 'hello', 'ppaaa'], ['eerie', 'there', 'papac'], ['grass', 'class', 'aacc' + 'c']];
for (const [g, a, want] of cases) assert.strictEqual(run(g, a), want, `${g} vs ${a}`);
console.log('answers', A.length, 'valid', all.size, '- all tests passed');
