const assert=require('node:assert/strict');
const fs=require('node:fs');
const adapter=require('../js/sotetsu_location_adapter');
const master=require('../js/sotetsu_routes');
const fixture=require('../testdata/sotetsu_trains.json');
(async()=>{
  const normalized=Object.fromEntries(master.routes.map(r=>[r.rosen,adapter.normalize(fixture,r.rosen)]));
  assert.equal(normalized[167].trains[0].typeLabel,'特急');
  assert.equal(normalized[167].trains[0].chien,2);
  assert.equal(normalized[167].trains[0].ryosu,10);
  assert.equal(normalized[167].trains[0].shuEkiName,'新宿');
  assert.equal(normalized[168].trains[0].pos,'SOTETSU168P1_2D');
  assert.equal(normalized[168].trains[1].pos,'SOTETSU168P1_2U');
  assert.equal(normalized[169].trains[0].pos,'SOTETSU169P1_2U');
  assert.equal(normalized[169].trains[1].pos,'SOTETSU169P2_3D');
  const placeholder=normalized[169].trains.find(t=>t.cbango==='K334');
  assert.equal(placeholder.displayTrainNumber,'34S');
  assert.equal(placeholder.iconTrainNumber,'34S');
  assert.equal(placeholder.pos,'SOTETSU169P1D');
  for(const patch of [{station_id:28},{next_station_id:28,station_id:null},{train_number:'K1000'},{line_id:301}]){
    assert.equal(adapter.normalize({...fixture,trains:[{...fixture.trains.at(-1),...patch}]},169).trains.length,0);
  }
  for(const r of master.routes){
    const html=fs.readFileSync(`rosen/rosen_${r.rosen}.html`,'utf8');
    for(const t of normalized[r.rosen].trains)assert.ok(html.includes(t.pos),t.pos);
    assert.ok(!normalized[r.rosen].trains.some(t=>t.cbango==='9999'));
    assert.ok(!html.includes('新綱島')&&!html.includes('相模国分'));
  }
  assert.equal(adapter.normalize({...fixture,trains:[]},167).trains.length,0);
  assert.throws(()=>adapter.normalize({},167));
  let time=fixture.updated_at*1000,calls=0;
  const client=adapter.createClient({now:()=>time,fetchImpl:async(url,options)=>{
    calls++;assert.ok(url.startsWith('https://external-data.sotetsuapp.com/tid/trains.json?'));
    assert.equal(options.credentials,'omit');return {ok:true,json:async()=>fixture};
  }});
  await Promise.all(master.routes.map(r=>client.load(r.rosen)));assert.equal(calls,1);
  time+=15001;await client.load(167);assert.equal(calls,2);
  for(const response of [{ok:false,status:500},{ok:true,json:async()=>({})},{ok:true,json:async()=>{throw Error('JSON');}}]){
    const bad=adapter.createClient({now:()=>time,fetchImpl:async()=>response});
    assert.equal((await bad.load(167)).sotetsu.error,true);
  }
  const stale=adapter.createClient({now:()=>time+180001,fetchImpl:async()=>({ok:true,json:async()=>fixture})});
  assert.equal((await stale.load(167)).sotetsu.error,true);
  console.log('Sotetsu adapter: route boundaries, directions, details, cache and errors passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
