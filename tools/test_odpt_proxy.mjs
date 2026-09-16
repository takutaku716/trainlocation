import assert from 'node:assert/strict';
import worker, { LICENSE_END } from '../workers/odpt_proxy.js';
const endpoint = 'https://example.test/api/keikyu/location';
const request = (path = endpoint, opts = {}) => new Request(path, { headers: { origin: 'http://127.0.0.1:8765' }, ...opts });
const env = { ODPT_ACCESS_TOKEN_2026: 'test-secret' };
const originalFetch = globalThis.fetch;
let calls = 0;
globalThis.fetch = async (url, opts) => {
  calls++;
  const target = new URL(url);
  assert.equal(target.origin, 'https://api-challenge.odpt.org');
  assert.equal(target.searchParams.get('acl:consumerKey'), env.ODPT_ACCESS_TOKEN_2026);
  assert.equal(opts.redirect, 'manual');
  return Response.json([{ 'odpt:operator': 'odpt.Operator:Keikyu', 'odpt:trainNumber': '123', private: 'hidden' }]);
};
try {
  assert.equal((await worker.fetch(request(endpoint, { headers: {} }), env, {})).status, 403);
  assert.equal((await worker.fetch(request(endpoint + '?url=https://evil.test'), env, {})).status, 400);
  assert.equal((await worker.fetch(request(endpoint, { method: 'POST' }), env, {})).status, 405);
  assert.equal((await worker.fetch(request('https://example.test/nope'), env, {})).status, 404);
  assert.equal((await worker.fetch(request(), {}, {})).status, 503);
  assert.equal(calls, 0);
  const response = await worker.fetch(request(), env, {});
  assert.equal(response.status, 200);
  const body = await response.text();
  assert.ok(!body.includes('test-secret') && !body.includes('hidden'));
  assert.equal(response.headers.get('cache-control'), 'no-store');
  globalThis.fetch = async () => new Response('test-secret', { status: 403 });
  const rejected = await worker.fetch(request(), env, {});
  assert.equal(rejected.status, 502);
  assert.ok(!(await rejected.text()).includes('test-secret'));
  globalThis.fetch = async () => new Response('not-json');
  assert.equal((await worker.fetch(request(), env, {})).status, 502);
  const originalNow = Date.now;
  try { Date.now = () => LICENSE_END; assert.equal((await worker.fetch(request(), env, {})).status, 410); }
  finally { Date.now = originalNow; }
  console.log('ODPT gateway: origin, method, URL allowlist, secret isolation, error, expiry tests passed.');
} finally { globalThis.fetch = originalFetch; }
