import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const css=fs.readFileSync(new URL('./style.css',import.meta.url),'utf8');
test('pitch intrinsic bitmap cannot enlarge flexible layout',()=>{assert.match(css,/#pitch\{position:absolute;inset:0;width:100%;height:100%;object-fit:contain\}/);assert.match(css,/\.arena\{flex:1 1 0;min-height:0;contain:size\}/);});
test('dynamic viewport and safe bottom space keep normal controls on screen',()=>{assert.match(css,/height:100dvh;min-height:0;display:grid/);assert.match(css,/padding-bottom:max\(24px,env\(safe-area-inset-bottom\)\)/);});
test('extremely short panes scroll rather than hide essential controls',()=>{assert.match(css,/@media\(max-height:420px\)/);assert.match(css,/\.game-panel,\.chat-panel\{overflow-y:auto;overscroll-behavior:contain\}/);});
test('desktop Dock overlay gets explicit reserve without relying on viewport resize',()=>{assert.match(css,/@media\(min-width:781px\)\{main\{padding-bottom:max\(110px,env\(safe-area-inset-bottom\)\)\}\}/);assert.match(css,/@media\(max-height:530px\) and \(min-width:781px\)/);});
