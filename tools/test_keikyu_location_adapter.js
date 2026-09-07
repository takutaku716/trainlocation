const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const adapter = require('../js/keikyu_location_adapter.js');
const { routes } = require('../js/keikyu_routes.js');
const now = Date.parse('2026-09-08T00:00:00+09:00');
const root = path.resolve(__dirname, '..');
const train = (route, index, step, stopped = false) => ({ railway: route.railway, number: '123A',
  direction: step === 1 ? route.ascending : route.descending,
  from: route.stations[index].id, to: stopped ? null : route.stations[index + step].id,
  date: new Date(now).toISOString(), valid: new Date(now + 300000).toISOString(), type: 'odpt.TrainType:Keikyu.Local' });
let cases = 0;
for (const route of routes) {
  const html = fs.readFileSync(path.join(root, 'rosen', `rosen_${route.rosen}.html`), 'utf8');
  const slots = [...html.matchAll(/class="ressha-icon ([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(slots).size, slots.length);
  for (let i = 0; i < route.stations.length; i++) for (const step of [-1, 1]) for (const stopped of [true, false]) {
    if (!stopped && !route.stations[i + step]) continue;
    const result = adapter.normalize({ trains: [train(route, i, step, stopped)] }, { rosen: route.rosen, now });
    assert.equal(result.trains.length, 1);
    assert.ok(slots.includes(result.trains[0].pos));
    assert.equal(result.trains[0].typeLabel, '普通');
    assert.equal(result.trains[0].keikyu.delayKnown, false);
    cases++;
  }
  const master = JSON.parse(fs.readFileSync(path.join(root, 'master/rosen_name_master.json'), 'utf8'));
  assert.equal(master.filter(r => r.rosen === route.rosen).length, 1);
  for (const page of ['index.html', 'location.html']) assert.ok(fs.readFileSync(path.join(root, page), 'utf8').includes(`value="${route.rosen}"`));
}
const route = routes[0], row = train(route, 0, 1);
const normalize = (rows, opts = {}) => adapter.normalize({ trains: rows }, { rosen: route.rosen, now, ...opts });
assert.equal(normalize([row, row]).trains.length, 1);
assert.equal(normalize([row], { now: now + 300001 }).keikyu.expired, 1);
assert.equal(normalize([{ ...row, date: 'invalid' }]).trains.length, 0);
assert.equal(normalize([{ ...row, date: new Date(now + 61000).toISOString() }]).trains.length, 0);
assert.equal(normalize([{ ...row, direction: 'unknown' }]).keikyu.unmapped, 1);
assert.equal(normalize([{ ...row, to: route.stations[5].id }]).trains.length, 0);
assert.equal(normalize([{ ...row, from: 'odpt.Station:Keikyu.Main.Sengakuji' }]).trains.length, 0);
assert.equal(normalize([{ ...row, delay: 125 }]).trains[0].chien, 2);
assert.equal(normalize([{ ...row, number: '<script>' }]).trains.length, 0);
assert.equal(normalize([]).time.ja, '');
assert.throws(() => adapter.normalize({}, { rosen: '146' }), /Invalid/);
async function main() {
  const originalFetch = global.fetch;
  try {
    global.fetch = async () => { throw new Error('offline'); };
    await assert.rejects(adapter.load('146'), /offline/);
    global.fetch = async () => ({ ok: false, status: 502 });
    await assert.rejects(adapter.load('146'), /502/);
  } finally { global.fetch = originalFetch; }
  console.log(`Keikyu: ${cases} station/section/direction cases plus edge cases passed.`);
  if (process.argv.includes('--live')) {
    const response = await fetch('https://trainlocation-odpt-proxy.densha716.workers.dev/api/keikyu/location', { headers: { Origin: 'http://127.0.0.1:8765' } });
    assert.ok(response.ok);
    const payload = await response.json();
    for (const route of routes) {
      const result = adapter.normalize(payload, { rosen: route.rosen });
      const html = fs.readFileSync(path.join(root, 'rosen', `rosen_${route.rosen}.html`), 'utf8');
      assert.equal(result.keikyu.unmapped, 0, route.name);
      for (const t of result.trains) assert.ok(html.includes(`ressha-icon ${t.pos}"`));
      console.log(`${route.name}: ${result.trains.length} live trains, expired=${result.keikyu.expired}`);
    }
  }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
