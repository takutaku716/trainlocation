import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {convertMinatomirai,mergeMinatomirai,collectDestinations,createMinatomiraiSource} from '../functions/api/tokyu/minatomirai.js';
import {createTokyuSource} from '../functions/api/tokyu/[[path]].js';
const require=createRequire(import.meta.url),adapter=require('../js/tokyu_location_adapter');
const fixture=JSON.parse(fs.readFileSync('testdata/tokyu/minatomirai.json','utf8'));
function encode(v){
  if(Array.isArray(v))return {arrayValue:{values:v.map(encode)}};
  if(v&&typeof v==='object')return {mapValue:{fields:Object.fromEntries(Object.entries(v).map(([k,x])=>[k,encode(x)]))}};
  return typeof v==='number'?{integerValue:String(v)}:{stringValue:v};
}
const documents=fixture.positions.map(([index,position_id,type])=>({fields:encode({index,position_id,type,trains:[{...fixture.train,tid_train_number:String(1000+index),direction:index%2?'DOWN':'UP'}]}).mapValue.fields}));
const extra=convertMinatomirai(documents);
assert.equal(extra.length,10);
assert.equal(extra[0].section_id,71);assert.equal(extra[9].station_id,931);
assert.equal(extra[0].up,false);assert.equal(extra[1].up,true);
assert.equal(extra[0].kind,'通');assert.equal(extra[0].num_of_cars,10);
assert.equal(extra[0].affiliation,'副');assert.equal(extra[0].delay_time,2);
const outside=[40,51].map(index=>({fields:encode({index,trains:[fixture.train]}).mapValue.fields}));
assert.equal(convertMinatomirai(outside).length,0);
const html=fs.readFileSync('rosen/rosen_159.html','utf8');
const normalized=adapter.normalize({data:{trains:extra},fetchedAt:Date.now()},159);
for(const train of normalized.trains)assert.ok(html.includes(train.pos));
assert.equal(normalized.trains[0].pos,'TOKYU159P21_22D');
assert.equal(normalized.trains[9].pos,'TOKYU159P26U');
const base={trains:[{...extra[0],station_id:5},{train_number:'1',up:true}]};
assert.equal(mergeMinatomirai(base,extra).trains.length,11);
const destDoc=(trains,convergences=[])=>({fields:encode({index:20,trains,convergences}).mapValue.fields});
const destinations=collectDestinations([destDoc([
  {...fixture.train,tid_train_number:'0001',destination:' 和光市 '},
  {...fixture.train,tid_train_number:'0002',destination:'   '},
  {...fixture.train,tid_train_number:'0003',destination:'渋谷'},
  {...fixture.train,tid_train_number:'0003',destination:'和光市'}
],[{trains:[{...fixture.train,tid_train_number:'0004',destination:'元町・中華街'}]}])]);
const original={trains:['0001','0002','0003','0004','0005'].map(train_number=>({train_number,up:true,line_id:26001,station_id:26,kind:'普',destination_station_code:78,delay_time:2,num_of_cars:8}))};
const enriched=mergeMinatomirai(original,[],destinations);
assert.deepEqual(enriched.trains[0],{...original.trains[0],destination:'和光市'});
assert.equal(original.trains[0].destination,undefined);
for(const i of [1,2,4])assert.deepEqual(enriched.trains[i],original.trains[i]);
assert.equal(enriched.trains[3].destination,'元町・中華街');
assert.equal(mergeMinatomirai({trains:[{...original.trains[0],up:false}]},[],destinations).trains[0].destination,undefined);
assert.equal(adapter.destinationFor(enriched.trains[0],adapter.routeFor(159)),'和光市');
assert.equal(adapter.destinationFor(enriched.trains[1],adapter.routeFor(159)),'渋谷');
let authCalls=0,reads=0,clock=0;
const client=createMinatomiraiSource({refreshToken:'fixture',now:()=>clock,fetchImpl:async(url,opts)=>{
  assert.ok(opts.signal);
  if(url.includes('securetoken')){authCalls++;return Response.json({id_token:'token',expires_in:3600});}
  assert.ok(url.includes('/ty/trackings'));assert.equal(opts.headers.authorization,'Bearer token');reads++;return Response.json({documents});
}});
await Promise.all([client.load(),client.load()]);assert.equal(authCalls,1);assert.equal(reads,1);
clock=3600000;await client.load();assert.equal(authCalls,2);
const signed=async url=>url.includes('external-data-url')?Response.json({url:'https://external-data-user.s3.ap-northeast-1.amazonaws.com/toyoko.json?X-Amz-Signature=x'}):Response.json(base);
const success=createTokyuSource({fetchImpl:signed,minatomirai:client});
assert.equal((await success.load('toyoko')).data.trains.length,11);
const failed=createTokyuSource({fetchImpl:signed,minatomirai:{load:async()=>{throw Error('failure');}}});
const fallback=await failed.load('toyoko');assert.equal(fallback.minatomirai.ok,false);assert.deepEqual(fallback.data,base);
// Identical numbers on parallel lines must keep their own destinations.
const sharedDocs=[{fields:encode({index:52,station:{line_id:'dt'},trains:[{...fixture.train,tid_train_number:'0001',affiliated_line_id:'dt',destination:'中央林間'}],convergences:[{line_id:'om',trains:[{...fixture.train,tid_train_number:'0001',affiliated_line_id:'om',destination:'大井町'}]}]}).mapValue.fields}];
const shared=collectDestinations(sharedDocs);
for(const [line,destination] of [[26003,'中央林間'],[26004,'大井町']]){
  const train={train_number:'0001',up:true,line_id:26003,train_line_id:line,destination_station_code:78,station_id:70,kind:'普',num_of_cars:10};
  assert.deepEqual(mergeMinatomirai({trains:[train]},[],shared).trains[0],{...train,destination});
}
assert.equal(mergeMinatomirai({trains:[{train_number:'0001',up:true,train_line_id:26002}]},[],shared).trains[0].destination,undefined);
for(const [key,collection,line,parallel,parallelLine] of [
  ['toyoko','ty',26001,'mg',26002],['meguro','mg',26002,'ty',26001],
  ['shinyokohama','sh',26002,'ty',26001],['dento','dt',26003,'om',26004],['oimachi','om',26004,'dt',26003]
]){
  const affiliation={26001:'ty',26002:'mg',26003:'dt',26004:'om'}[line];
  const docs=[...documents,{fields:encode({index:0,station:{line_id:affiliation},trains:[{...fixture.train,tid_train_number:'00992110',affiliated_line_id:affiliation,destination:'本線行先'}],convergences:[{line_id:parallel,trains:[{...fixture.train,tid_train_number:'00992110',affiliated_line_id:parallel,destination:'併走行先'}]}]}).mapValue.fields}];
  let requests=0;
  const upstream=createMinatomiraiSource({refreshToken:'fixture',fetchImpl:async url=>{
    if(url.includes('securetoken'))return Response.json({id_token:'fixture',expires_in:3600});
    requests++;assert.ok(url.includes('/'+collection+'/trackings'));return Response.json({documents:docs});
  }});
  const original={trains:[line,parallelLine].map(train_line_id=>({train_number:'00992110',up:true,line_id:line,train_line_id,destination_station_code:78,station_id:5}))};
  const fetchImpl=async url=>url.includes('external-data-url')?Response.json({url:'https://external-data-user.s3.ap-northeast-1.amazonaws.com/'+key+'.json?X-Amz-Signature=x'}):Response.json(original);
  const service=createTokyuSource({fetchImpl,minatomirai:upstream});
  const result=await service.load(key);await service.load(key);assert.equal(requests,1);
  assert.deepEqual(result.data.trains[0],{...original.trains[0],destination:'本線行先'});
  assert.deepEqual(result.data.trains[1],{...original.trains[1],destination:'併走行先'});
  if(key!=='toyoko')assert.equal(result.data.trains.length,2);
  const failedService=createTokyuSource({fetchImpl,minatomirai:{load:async()=>{throw Error('offline');}}});
  assert.deepEqual((await failedService.load(key)).data,original);
}
console.log('Minatomirai: ten positions, boundaries, conversion, shared auth, merge, anchors and partial failure passed.');
const omitted={train_number:'04452220',up:true,line_id:26001,train_line_id:26002,destination_station_code:54};
const meguroDoc={fields:encode({index:0,trains:[{...fixture.train,affiliated_line_id:'mg',tid_train_number:omitted.train_number,destination:'西高島平'}]}).mapValue.fields};
let fallbackReads=0,primaryReads=0;
const crossLine=createMinatomiraiSource({refreshToken:'fixture',fetchImpl:async url=>{
  if(url.includes('securetoken'))return Response.json({id_token:'fixture',expires_in:3600});
  if(url.includes('/ty/')){primaryReads++;return Response.json({documents});}
  assert.ok(url.includes('/mg/'));fallbackReads++;return Response.json({documents:[meguroDoc]});
}});
const supplemented=await crossLine.load('toyoko',[omitted]);
assert.deepEqual(mergeMinatomirai({trains:[omitted]},[],supplemented.destinations).trains[0],{...omitted,destination:'西高島平'});
await crossLine.load('toyoko',[omitted]);await crossLine.load('meguro',[omitted]);
assert.equal(fallbackReads,1);assert.equal(primaryReads,1);
const partial=createMinatomiraiSource({refreshToken:'fixture',fetchImpl:async url=>{
  if(url.includes('securetoken'))return Response.json({id_token:'fixture',expires_in:3600});
  if(url.includes('/ty/'))return Response.json({documents});
  return new Response('',{status:503});
}});
const unchanged=await partial.load('toyoko',[omitted]);
assert.equal(unchanged.trains.length,10);
assert.deepEqual(mergeMinatomirai({trains:[omitted]},[],unchanged.destinations).trains[0],omitted);
console.log('Parallel-line fallback: omitted Meguro train, code preservation, shared cache and isolated failures passed.');
let tyCalls=0,mgCalls=0;
const fullTy=createMinatomiraiSource({refreshToken:'fixture',fetchImpl:async url=>{
  if(url.includes('securetoken'))return Response.json({id_token:'fixture',expires_in:3600});
  if(url.includes('/tymm/'))throw Error('Unexpected tymm fetch');
  if(url.includes('/ty/')){tyCalls++;return Response.json({documents:[...documents,meguroDoc]});}
  mgCalls++;return new Response('',{status:503});
}});
const full=await fullTy.load('toyoko',[omitted]);
assert.equal(full.trains.length,10);
assert.equal(mergeMinatomirai({trains:[omitted]},[],full.destinations).trains[0].destination,'西高島平');
await fullTy.load('toyoko',[omitted]);assert.equal(tyCalls,1);assert.equal(mgCalls,0);
console.log('Toyoko uses one ty snapshot for Minatomirai positions and all destinations, including Meguro.');
