const assert = require('node:assert/strict');
const fs = require('node:fs');
const adapter = require('../js/tokyu_location_adapter');
const master = require('../js/tokyu_routes');
const now = Date.now();
for (const route of master.routes) {
  const raw = JSON.parse(fs.readFileSync(`testdata/tokyu/${route.file}`));
  const data = adapter.normalize({data:raw,fetchedAt:now},route.rosen);
  assert.equal(data.tokyu.unmapped,0,route.name);
  assert.ok(data.trains.length > 0,route.name);
  const html = fs.readFileSync(`rosen/rosen_${route.rosen}.html`,'utf8');
  for (const t of data.trains) assert.ok(html.includes(t.pos),t.pos);
  for (const station of route.stations) for (const up of [true,false]) {
    const pos = adapter.positionFor({station_id:station.id,up},route);
    assert.equal(pos.name,station.name);
    assert.ok(pos.key.endsWith(up?'U':'D'));
    assert.ok(html.includes(pos.key));
  }
  for (const section_id of Object.keys(route.sections)) for (const up of [true,false]) {
    const pos = adapter.positionFor({section_id,up},route);
    assert.ok(html.includes(pos.key),pos.key);
    assert.ok(pos.name.endsWith(' 間'));
  }
  assert.equal(adapter.normalize({data:{trains:[]},fetchedAt:now},route.rosen).trains.length,0);
  for (const file of ['index.html','location.html']) assert.ok(fs.readFileSync(file,'utf8').includes(`value="${route.rosen}"`));
}
assert.equal(master.routes.length,8);
const ty = adapter.routeFor('toyoko'), dt = adapter.routeFor('dento'), sh = adapter.routeFor('sh');
assert.equal(sh.tidLineId,'26009');
assert.equal(sh.file,'shinyokohama.json');
assert.equal(adapter.destinationFor({destination_station_code:78},ty),'渋谷');
assert.equal(adapter.destinationFor({destination_station_code:78},dt),'鷺沼');
assert.equal(adapter.destinationFor({destination_station_code:33},ty),'副都心線直通');
assert.equal(adapter.destinationFor({destination:'横浜',destination_station_code:33},ty),'横浜');
assert.equal(adapter.destinationFor({},ty),'行先不明');
assert.equal(adapter.operationLabel(441,26002),'41T');
assert.equal(adapter.operationLabel(1,26001),'01K');
assert.equal(adapter.operationLabel(51,26003),'51S');
assert.equal(adapter.operationLabel(52,26003),'52T');
assert.equal(adapter.operationLabel(1,26005),'01');
assert.equal(adapter.operationLabel(999,26001),'999');
assert.equal(adapter.operationLabel(null,26001),'');
const numbered = adapter.normalize({data:{trains:[{operation_number:441,train_number:'04412120',line_id:26001,train_line_id:26002,station_id:26,up:true}]},fetchedAt:now},159).trains[0];
assert.equal(numbered.cbango,'04412120');
assert.equal(numbered.displayTrainNumber,'441-212');
assert.equal(adapter.trainNumberLabel('09942310'),'994-231');
assert.equal(adapter.trainNumberLabel('00012310'),'001-231');
assert.equal(adapter.trainNumberLabel('19942310'),'19942310');
assert.equal(adapter.trainNumberLabel('09942311'),'09942311');
assert.equal(adapter.trainNumberLabel('12'),'12');
assert.equal(numbered.iconTrainNumber,'41T');
assert.equal(adapter.positionFor({station_id:982,up:false},sh).name,'新綱島');
assert.equal(adapter.positionFor({section_id:265,up:false},sh).name,'日吉→新綱島 間');
assert.throws(()=>adapter.normalize({data:{},fetchedAt:now},159),/形式不正/);
assert.throws(()=>adapter.apiUrl('kodomo'),/未設定/);
assert.equal(adapter.positionFor({station_id:26,up:'false'},ty),null);
const train = {operation_number:1,line_id:26001,station_id:26,up:true,kind:'通',delay_time:3,destination_station_code:78};
const t = adapter.normalize({data:{trains:[train]},fetchedAt:now},159).trains[0];
assert.equal(t.typeLabel,'通勤特急'); assert.equal(t.chien,3); assert.equal(t.shuEkiName,'渋谷');
async function testClient() {
  let clock = now, calls = 0;
  const raw = JSON.parse(fs.readFileSync('testdata/tokyu/iketama.json'));
  const client = adapter.createClient({now:()=>clock,fetchImpl:async()=>{calls++;return Response.json({data:raw,fetchedAt:clock});}});
  await Promise.all([client.load('ikegami'),client.load('tamagawa'),client.load('ikegami')]);
  assert.equal(calls,1);
  clock += 59000; await client.load('tamagawa'); assert.equal(calls,1);
  clock += 1001; await client.load('ikegami'); assert.equal(calls,2);
  const failed = adapter.createClient({fetchImpl:async()=>Response.json({error:'HTTP 403'},{status:502})});
  const error = await failed.load('toyoko');
  assert.equal(error.trains.length,0); assert.equal(error.tokyu.error,'HTTP 403');
  assert.equal(adapter.statusText(error),'');
  assert.ok(adapter.statusText(await client.load('ikegami')).includes('w-tid取得（第三者配信）'));
  const bad = adapter.createClient({fetchImpl:async()=>new Response('<html>')});
  assert.match((await bad.load('toyoko')).tokyu.error,/形式不正/);
  const stale = adapter.createClient({now:()=>now,fetchImpl:async()=>Response.json({data:{trains:[]},fetchedAt:now-130000})});
  assert.ok((await stale.load('toyoko')).tokyu.error);
}
testClient().then(()=>console.log('Tokyu: eight routes, all station/section anchors, directions, scoped destinations, kinds, delays, errors and shared client cache passed.')).catch(e=>{console.error(e);process.exitCode=1;});
