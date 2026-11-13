import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('anonymous visitor tracking and privacy route are removed',()=>{
const worker=fs.readFileSync(new URL('./worker.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
assert.doesNotMatch(worker,/browserTelemetry|telemetryPrivacy|browser_visits|__Secure-penalties_browser/);
assert.doesNotMatch(html,/\/penalties\/privacy|privacy-note/);
assert.match(worker,/await authGate\(request,env\)/);
assert.match(worker,/SELECT count\(\*\) FROM requests/);
assert.equal(fs.existsSync(new URL('./telemetry.js',import.meta.url)),false);
});
