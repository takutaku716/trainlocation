const assert = require('node:assert/strict');
const adapter = require('../js/toei_timetable_adapter.js');
const { routes } = require('../js/toei_routes.js');
const request = { rosen: '140', number: '679K', date: '2026-09-09T07:15:00+09:00', direction: routes[0].ascending };
const row = { 'odpt:operator': 'odpt.Operator:Toei', 'odpt:railway': routes[0].railway, 'odpt:calendar': 'odpt.Calendar:Weekday', 'odpt:trainNumber': '679K', 'odpt:railDirection': request.direction,
  'odpt:trainTimetableObject': [
    { 'odpt:departureStation': routes[0].stations[0].id, 'odpt:departureTime': '23:58' },
    { 'odpt:arrivalStation': routes[0].stations[1].id, 'odpt:arrivalTime': '00:01', 'odpt:departureStation': routes[0].stations[1].id, 'odpt:departureTime': '00:02' },
    { 'odpt:arrivalStation': 'odpt.Station:Keikyu.Main.Shinagawa', 'odpt:arrivalTime': '00:20' }
  ] };
const normalize = data => adapter.normalize(data, request);
assert.equal(normalize([row]).rows.length, 2);
assert.equal(normalize([row]).rows[1].planArrival, '00:01');
assert.equal(normalize([row]).rows[1].planDeparture, '00:02');
assert.equal(normalize([row, row]).rows.length, 0);
assert.equal(normalize([{ ...row, 'odpt:calendar': 'odpt.Calendar:SaturdayHoliday' }]).rows.length, 0);
assert.equal(normalize([{ ...row, 'odpt:railDirection': 'wrong' }]).rows.length, 0);
assert.equal(normalize([{ ...row, 'odpt:trainNumber': 'other' }]).rows.length, 0);
assert.equal(normalize([{ ...row, 'dct:issued': '2026-10-01' }]).rows.length, 0);
assert.equal(adapter.serviceCalendar('2026-09-21T10:00:00+09:00', routes[0]).id, 'odpt.Calendar:SaturdayHoliday');
assert.equal(adapter.serviceCalendar('2026-09-22T10:00:00+09:00', routes[0]).id, 'odpt.Calendar:SaturdayHoliday');
assert.equal(adapter.serviceCalendar('2026-09-12T00:40:00+09:00', routes[0]).id, 'odpt.Calendar:Weekday');
assert.equal(adapter.serviceCalendar('2026-09-12T10:00:00+09:00', routes[4]).id, 'odpt.Calendar:Saturday');
assert.equal(adapter.serviceCalendar('2026-12-30T10:00:00+09:00', routes[0]), null);
assert.equal(adapter.serviceCalendar('2028-01-10T10:00:00+09:00', routes[0]), null);
assert.equal(adapter.numberFor('1001A1', routes[3]), '1001A');
assert.equal(adapter.numberFor('1001A1', routes[0]), '1001A1');
assert.throws(() => normalize({}), /Invalid/);
async function main() {
  const original = global.fetch;
  let calls = 0;
  try {
    global.fetch = async url => { calls++; assert.equal(new URL(url).searchParams.get('odpt:trainNumber'), '679K'); return Response.json([row]); };
    assert.equal((await adapter.load(request)).rows.length, 2);
    await adapter.load(request); assert.equal(calls, 1);
    const badRequest = { ...request, number: 'error' };
    global.fetch = async () => { calls++; return new Response('failure', { status: 503 }); };
    await assert.rejects(adapter.load(badRequest), /503/);
    await assert.rejects(adapter.load(badRequest), /503/);
    assert.equal(calls, 3, 'errors must be retried');
    assert.equal((await adapter.load({ ...request, rosen: '144', number: '8801' })).rows.length, 0);
  } finally { global.fetch = original; }
  console.log('Toei timetable: matching, calendar/holidays/midnight, Oedo numbering, arrival/departure, cache/retry tests passed.');
  if (process.argv.includes('--live')) {
    for (const route of routes.slice(0, 4)) {
      const trains = await (await fetch('https://api-public.odpt.org/api/v4/odpt:Train?odpt:railway=' + encodeURIComponent(route.railway))).json();
      let matched = 0, total = 0;
      for (const train of trains.slice(0, 3)) {
        const result = await adapter.load({ rosen: route.rosen, number: train['odpt:trainNumber'], direction: train['odpt:railDirection'], date: train['dc:date'] });
        total++; if (result.rows.length) matched++;
      }
      console.log(`${route.name}: ${matched}/${total} sampled live trains matched`);
      if (total) assert.ok(matched > 0, route.name);
    }
  }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
