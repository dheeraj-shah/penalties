import test from 'node:test';import assert from 'node:assert/strict';import {timingText} from './timing.js';
test('timer reports measured end-to-end response and apply totals',()=>{assert.deepEqual(timingText('ready',1200,800),{headline:'Ready in 1.2s ⚡',detail:'AI response: 0.8s · Applied: 1.2s'});assert.equal(timingText('generating',400).headline,'Generating… 0.4s');});
test('failed changes never say ready',()=>{assert.equal(timingText('failed',1400,900).headline,'Not applied · 1.4s');assert.equal(timingText('failed',1400).detail,'Previous game kept.');});
