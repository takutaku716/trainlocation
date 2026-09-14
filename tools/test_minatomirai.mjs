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
  assert.ok(url.includes('/tymm/trackings'));assert.equal(opts.headers.authorization,'Bearer token');reads++;return Response.json({documents});
}});
await Promise.all([client.load(),client.load()]);assert.equal(authCalls,1);assert.equal(reads,2);
clock=3600000;await client.load();assert.equal(authCalls,2);
const signed=async url=>url.includes('external-data-url')?Response.json({url:'https://external-data-user.s3.ap-northeast-1.amazonaws.com/toyoko.json?X-Amz-Signature=x'}):Response.json(base);
const success=createTokyuSource({fetchImpl:signed,minatomirai:client});
assert.equal((await success.load('toyoko')).data.trains.length,11);
const failed=createTokyuSource({fetchImpl:signed,minatomirai:{load:async()=>{throw Error('failure');}}});
const fallback=await failed.load('toyoko');assert.equal(fallback.minatomirai.ok,false);assert.deepEqual(fallback.data,base);
console.log('Minatomirai: ten positions, boundaries, conversion, shared auth, merge, anchors and partial failure passed.');
