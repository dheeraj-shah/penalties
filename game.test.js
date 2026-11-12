import test from 'node:test';import assert from 'node:assert/strict';import {defaults,validatePatch,takeShot,describePatch} from './game.js';
test('ten attempts and standard shot by default',()=>{assert.equal(defaults().attempts,10);assert.deepEqual(defaults().shots,['standard']);});
test('allows bounded settings',()=>{assert.deepEqual(validatePatch({ballColor:'pink',attempts:5,shots:['standard','chip']}),{ballColor:'pink',attempts:5,shots:['standard','chip']});assert.equal(describePatch({ballColor:'pink'}),'Ball: pink');});
test('rejects code, unknown keys, missing standard, out-of-range values',()=>{for(const p of [{code:'alert(1)'},{ballColor:'url(evil)'},{attempts:0},{attempts:21},{attempts:3.5},{shots:['chip']},{shots:['standard','evil']},{powerSpeed:99},{showStreak:'yes'},null,[]])assert.throws(()=>validatePatch(p));});
test('prototype key rejected',()=>assert.throws(()=>validatePatch(JSON.parse('{"__proto__":{"polluted":true}}'))));
test('miss, save and goal paths',()=>{const rng=values=>()=>values.shift();assert.equal(takeShot('standard','left','normal',rng([0,.01])).result,'miss');assert.equal(takeShot('standard','left','normal',rng([0,.9,.1])).result,'save');assert.equal(takeShot('standard','right','normal',rng([0,.9])).result,'goal');});
test('validates shot inputs',()=>assert.throws(()=>takeShot('laser','left','normal')));
