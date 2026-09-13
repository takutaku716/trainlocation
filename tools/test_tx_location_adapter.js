const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const adapter = require('../js/tx_location_adapter.js');
const fixture = name => JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/tx', name + '.json'), 'utf8'));
async function main() {
  const raw = fixture('trains');
  const rows = adapter.normalize(raw).trains;
  assert.equal(rows.length, 4);
  assert.deepEqual(rows.map(r => r.tx.fleet), ['TX-1000系', 'TX-2000系（増備車）', 'TX-3000系', 'TX-2000系']);
  assert.deepEqual(rows.map(r => r.typeLabel), ['普通', '区間快速', '快速', '通勤快速']);
  assert.deepEqual(rows.map(r => r.tx.labelColor), ['', '3', '2', '2']);
  assert.deepEqual(rows.map(r => r.tx.typeSimple), ['普', '区快', '快', '通快']);
  assert.deepEqual(rows.map(r => r.chien), [0, 1, 2, 0]);
  assert.deepEqual(rows.map(r => r.pos), ['TX151P3U', 'TX151P14_15U', 'TX151P3_4D', 'TX151P15D']);
  assert.equal(rows[1].posName, '守谷→柏たなか 間');
  assert.equal(rows[2].posName, '浅草→南千住 間');
  assert.equal(rows[0].shuEkiName, '秋葉原');
  for (const n of [1,14]) assert.equal(adapter.fleet(n).style, 'tx1000');
  for (const n of [67,68,69,70,72,73]) assert.equal(adapter.fleet(n).style, 'tx2000-zoubi');
  for (const n of [81,85]) assert.equal(adapter.fleet(n).style, 'tx3000');
  for (const n of [0,15,66,71,74,80,86,null]) assert.equal(adapter.fleet(n).style, 'tx2000');
  for (let id = 1; id <= 15; id++) assert.notEqual(adapter.normalize({...raw, trains:[{...raw.trains[0], train_kind_id:id}]}).trains[0].typeLabel, '種別不明');
  assert.equal(adapter.dateFor(Date.parse('2026-09-08T15:00:00Z') / 1000), '2026-09-09');
  assert.equal(adapter.dateFor(Date.parse('2026-09-08T14:59:59Z') / 1000), '2026-09-08');
  assert.throws(() => adapter.normalize({trains:[],updated_at:null}));
  assert.throws(() => adapter.normalize({}));
  assert.equal(adapter.normalize({...raw,trains:[]}).trains.length, 0);
  assert.equal(adapter.normalize({...raw,trains:[null,{}, {...raw.trains[0],direction:'bad'}, {...raw.trains[0],station_id:999}]}).tx.unmapped, 4);
  assert.equal(adapter.normalize({...raw,trains:[raw.trains[0],raw.trains[0]]}).trains.length, 1);
  const html = fs.readFileSync(path.join(__dirname,'../rosen/rosen_151.html'),'utf8');
  for (const station of adapter.stations) for (const direction of ['up','down']) {
    const train = {...raw.trains[0], station_id:station.id, direction};
    assert.ok(html.includes(adapter.positionFor(train).key));
    const next = station.id + (direction === 'up' ? -1 : 1);
    if (next >= 11 && next <= 30) assert.ok(html.includes(adapter.positionFor({...train,next_station_id:next}).key));
  }
  const stops = adapter.normalizeDetail(fixture('stops'));
  assert.equal(stops[2].planDeparture, '00:06');
  assert.equal(stops[2].planArrival, '');
  assert.equal(stops.at(-1).planArrival, '00:23');
  assert.equal(stops.at(-1).planDeparture, '');
  assert.throws(() => adapter.normalizeDetail({}));
  assert.throws(() => adapter.apiUrl('../secret'));
  const realFetch = global.fetch;
  const requests = [];
  global.fetch = async url => {
    const upstream = new URL(url).searchParams.get('url');
    requests.push(upstream);
    const value = upstream.includes('/tid/') ? raw : upstream.includes('status.json') ? fixture('status') : fixture('stops');
    return Response.json(value);
  };
  try {
    const [loaded, sameLoad] = await Promise.all([adapter.load(), adapter.load()]);
    assert.equal(loaded, sameLoad);
    assert.equal(requests.filter(url => url.includes('/tid/')).length, 1);
    assert.equal(adapter.getOperationNotice(), null);
    const [a,b] = await Promise.all([adapter.loadDetail('5398'),adapter.loadDetail('5398')]);
    assert.deepEqual(a,b);
    assert.equal(requests.filter(url => url.includes('stop_stations')).length, 1);
    assert.ok(requests[2].includes('/stop_stations/2026-09-08/5398.json?'));
    await assert.rejects(adapter.loadDetail('99999'));
    global.fetch = async url => String(url).includes('status.json') ? Response.json({...fixture('status'),category:1,status:'遅延',message:'遅れが発生しています。'}) : Response.json(raw);
    await adapter.load();
    assert.equal(adapter.getOperationNotice().status, '遅延');
    global.fetch = async url => String(url).includes('status.json') ? new Response('',{status:503}) : Response.json(raw);
    assert.equal((await adapter.load()).trains.length,4);
    assert.equal(adapter.getOperationNotice(), null);
    global.fetch = async () => new Response('',{status:503});
    await assert.rejects(adapter.load());
    await assert.rejects(adapter.loadDetail('5398'));
  } finally { global.fetch = realFetch; }
  console.log('TX fixture tests passed: fleet, direction, interval, kinds, delay, JST date, cache, failures, route anchors.');
  if (process.argv.includes('--live')) {
    global.fetch = (url, options = {}) => realFetch(url, {...options, headers:{Origin:'https://takutaku716.github.io'}});
    try {
      const data = await adapter.load();
      console.log('Live trains:', data.trains.length, 'notice:', adapter.getOperationNotice());
      console.log('Fleets:', [...new Set(data.trains.map(r => r.tx.fleet))]);
      assert.equal(data.tx.unmapped,0);
      for (const train of data.trains.slice(0,2)) {
        const stops = await adapter.loadDetail(train.cbango);
        assert.ok(stops.length);
        console.log(train.cbango, train.tx.fleet, train.posName, 'stops:', stops.length, stops[0], stops.at(-1));
      }
    } finally { global.fetch = realFetch; }
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
