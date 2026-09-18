const assert = require('node:assert/strict');
const fs = require('node:fs');
const adapter = require('../js/tokyu_location_adapter');
const master = JSON.parse(fs.readFileSync('original/tokyu_formation.json','utf8'));
const base = {line_id:26001,train_line_id:26001,num_of_cars:8,affiliation:'急',train_orchestration_number:'01'};
for (const [line,number,expected] of [[26001,38,'5118F'],[26001,39,'5119F'],[26002,38,'5188F'],[26002,39,'5189F']]) {
  const row={...base,train_line_id:line,train_orchestration_number:number};
  assert.equal(adapter.formationFor(row,master),expected);
  assert.equal(adapter.formationFor({...row,train_line_id:String(line),train_orchestration_number:String(number)},master),expected);
  // A Meguro train displayed on the Toyoko map must retain the Meguro formation.
  const normalized=adapter.normalize({fetchedAt:Date.now(),data:{trains:[{...row,station_id:914,up:true,train_number:'1234'}]}},159,master);
  assert.equal(normalized.trains[0].tokyu.formation,expected);
}
for (const operation of [500,501,599,'550']) {
  assert.equal(adapter.formationFor({...base,train_line_id:26002,affiliation:'南',num_of_cars:6,operation_number:operation},master),'2101F');
}
for (const override of [{operation_number:499},{operation_number:600},{operation_number:500.5},{operation_number:'unknown'}]) {
  assert.equal(adapter.formationFor({...base,train_line_id:26002,affiliation:'南',num_of_cars:6,operation_number:501,...override},master),'9101F');
}
assert.equal(adapter.formationFor({...base,train_line_id:26002,affiliation:'南',num_of_cars:6,operation_number:501,train_orchestration_number:99},master),'');
assert.equal(adapter.formationFor({...base,train_line_id:26002,affiliation:'南',num_of_cars:8,operation_number:501,train_orchestration_number:9},master),master.meguro_systems['8南']['09']);
assert.equal(master.tokyu_systems,undefined);
assert.equal(master.line_systems,undefined);
for(const [line,system] of [[26001,master.toyoko_systems],[26002,master.meguro_systems]]) {
for (const [prefix, group] of Object.entries(system)) {
  const [,cars,affiliation] = prefix.match(/^(\d+)(.+)$/);
  // The supplied reference always selects the 10-car table for Tobu/Seibu.
  if (['東','西'].includes(affiliation) && cars !== '10') continue;
  for (const [number,expected] of Object.entries(group)) {
    assert.equal(adapter.formationFor({...base,train_line_id:line,num_of_cars:cars,affiliation,train_orchestration_number:number},master),expected);
  }
}
}
assert.equal(adapter.formationFor(base,master),'');
assert.equal(adapter.formationFor({...base,train_line_id:26002},master),'3101F');
for(const line of [26001,26002,26009]) for(const number of [88,89]) assert.equal(adapter.formationFor({...base,train_line_id:line,train_orchestration_number:number},master),'');
assert.equal(adapter.formationFor({...base,train_line_id:26001,affiliation:'南',num_of_cars:6,operation_number:501},master),'');
assert.equal(adapter.formationFor({...base,num_of_cars:10},master),'4101F');
assert.equal(adapter.formationFor({...base,affiliation:'み',num_of_cars:10,train_orchestration_number:81},master),'Y511F');
assert.equal(adapter.formationFor({...base,affiliation:'東',train_orchestration_number:2},master),'9102F');
for (const override of [{affiliation:'不明'},{train_orchestration_number:null},{train_orchestration_number:''},{train_orchestration_number:101},{train_orchestration_number:99},{train_line_id:26003}]) assert.equal(adapter.formationFor({...base,...override},master),'');
assert.equal(adapter.formationFor(base,null),'');
const oimachi = {...base,line_id:26004,train_line_id:26004,affiliation:''};
for (const [cars,group] of Object.entries(master.oimachi_systems)) {
  for (const [number,expected] of Object.entries(group)) {
    assert.equal(adapter.formationFor({...oimachi,num_of_cars:cars,train_orchestration_number:number},master),expected);
    assert.equal(adapter.formationFor({...oimachi,num_of_cars:Number(cars),train_orchestration_number:Number(number)},master),expected);
  }
}
assert.equal(adapter.formationFor({...oimachi,num_of_cars:5},master),'9001F');
assert.equal(adapter.formationFor({...oimachi,num_of_cars:7},master),'6121F');
for (const [cars,number] of [[7,4],[5,16],[5,50],[5,71],[8,1],[0,1],[5,null]]) {
  assert.equal(adapter.formationFor({...oimachi,num_of_cars:cars,train_orchestration_number:number},master),'');
}
const now = Date.now();
const raw = {trains:[{...base,train_orchestration_number:38,station_id:26,up:true,kind:'普',operation_number:1,train_number:'00012310'}]};
assert.equal(adapter.normalize({data:raw,fetchedAt:now},159,master).trains[0].tokyu.formation,'5118F');
for (const [route,line,station] of [[160,26002,914],[163,26009,983]]) {
  const train = {...raw.trains[0],line_id:line,station_id:station};
  assert.equal(adapter.normalize({data:{trains:[train]},fetchedAt:now},route,master).trains[0].tokyu.formation,'5118F');
  assert.equal(adapter.normalize({data:{trains:[{...train,train_line_id:26002}]},fetchedAt:now},route,master).trains[0].tokyu.formation,'5188F');
  assert.equal(adapter.normalize({data:{trains:[{...train,train_line_id:26009}]},fetchedAt:now},route,master).trains[0].tokyu.formation,'');
}
async function run() {
  const row = {...oimachi,num_of_cars:5,station_id:adapter.routeFor(162).stations[0].id,up:true,train_number:'00012310',operation_number:1};
  const oimachiClient=adapter.createClient({fetchImpl:async url=>Response.json(url.includes('tokyu_formation') ? master : {data:{trains:[row]},fetchedAt:now})});
  assert.equal((await oimachiClient.load(162)).trains[0].tokyu.formation,'9001F');
  const sharedRow = {...row,line_id:26003,station_id:adapter.routeFor(161).stations[0].id};
  const dentoRow = {...sharedRow,train_line_id:26003,train_number:'00022310',num_of_cars:10};
  let sharedReads=0;
  const mixedClient=adapter.createClient({fetchImpl:async url=>{
    if(url.includes('tokyu_formation')) {sharedReads++;return Response.json(master);}
    return Response.json({data:{trains:[sharedRow,dentoRow]},fetchedAt:now});
  }});
  const mixed=await mixedClient.load(161);
  assert.equal(sharedReads,1);
  assert.equal(mixed.trains[0].tokyu.formation,'9001F');
  assert.equal(mixed.trains[0].tokyu.dentoRequest,null);
  assert.equal(mixed.trains[1].tokyu.formation,'');
  assert.deepEqual(mixed.trains[1].tokyu.dentoRequest,{operation:1,direction:'up'});
  const onlyDento=adapter.createClient({fetchImpl:async url=>{
    assert.ok(!url.includes('tokyu_formation'));
    return Response.json({data:{trains:[dentoRow]},fetchedAt:now});
  }});
  assert.deepEqual((await onlyDento.load(161)).trains[0].tokyu.dentoRequest,{operation:1,direction:'up'});
  let count=0;
  const client=adapter.createClient({fetchImpl:async url=>{
    if (url.includes('tokyu_formation')) {count++;return Response.json(master);}
    return Response.json({data:raw,fetchedAt:now});
  }});
  const results=await Promise.all([client.load(159),client.load(159)]);
  assert.equal(count,1);assert.equal(results[0].trains[0].tokyu.formation,'5118F');
  let clock=now, attempts=0;
  const degraded=adapter.createClient({now:()=>clock,fetchImpl:async url=>{
    if(url.includes('tokyu_formation')) {attempts++;return new Response('',{status:404});}
    return Response.json({data:raw,fetchedAt:clock});
  }});
  assert.equal((await degraded.load(159)).trains.length,1);
  assert.equal((await degraded.load(159)).trains[0].tokyu.formation,'');
  assert.equal(attempts,1);
  clock+=61000;await degraded.load(159);assert.equal(attempts,2);
  console.log('Tokyu formation: complete master, overrides, unknowns, preserved location, cache and retry passed.');
}
run().catch(e=>{console.error(e);process.exitCode=1;});
