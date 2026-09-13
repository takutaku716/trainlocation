import assert from 'node:assert/strict';
import fs from 'node:fs';
const source = fs.readFileSync(new URL('../functions/api/tx/[[path]].js', import.meta.url),'utf8');
const { onRequestGet } = await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const original = globalThis.fetch;
const run = path => onRequestGet({request:new Request('https://local.test/api/tx/'+path)});
try {
  let calls = 0;
  globalThis.fetch = async url => { calls++; assert.ok(url.startsWith('https://external-data.tx-app.com/')); return Response.json({trains:[],updated_at:1788877436}); };
  assert.equal((await run('tid/trains.json')).status,200);
  assert.equal((await run('https://evil.test/')).status,404);
  assert.equal((await run('stop_stations/2026-09-08/abc.json')).status,404);
  assert.equal(calls,1);
  globalThis.fetch = async () => Response.json([]);
  assert.equal((await run('stop_stations/2026-09-08/5398.json')).status,200);
  assert.equal((await run('tid/trains.json')).status,502);
  globalThis.fetch = async () => Response.json({message:'平常'});
  assert.equal((await run('status.json')).status,200);
  globalThis.fetch = async () => new Response('',{status:503});
  assert.equal((await run('tid/trains.json')).status,502);
  globalThis.fetch = async () => {throw new Error('timeout');};
  assert.equal((await run('status.json')).status,502);
  console.log('TX proxy tests passed.');
} finally { globalThis.fetch = original; }
