import assert from 'node:assert/strict';
import adapter from '../js/tokyu_location_adapter.js';
let clock=Date.now(), calls=0;
const source=adapter.createClient({now:()=>clock,fetchImpl:async (url,options)=>{
  calls++;assert.equal(options.credentials,'omit');assert.equal(url,'https://train-info.tokyuapp.com/lines/26003/trains/3/directions/up');
  return Response.json({unit_number:'002134',cars:Array.from({length:10},(_,i)=>({number:i+1}))});
}});
const load=(operation,direction)=>source.loadDentoFormation({operation,direction});
const results=await Promise.all([load(3,'up'),load(3,'up')]);
assert.deepEqual(results[0],{formation:'2134F',cars:10});assert.equal(calls,1);
clock+=60001;await load(3,'up');assert.equal(calls,2);
assert.equal(await load('../3','up'),null);assert.equal(await load(3,'sideways'),null);assert.equal(calls,2);
for(const body of [{},{unit_number:'000000'},{unit_number:'<script>'}]){
  const empty=adapter.createClient({fetchImpl:async()=>Response.json(body)});
  assert.equal(await empty.loadDentoFormation({operation:3,direction:'up'}),null);
}
for(const response of [()=>new Response('',{status:503}),()=>new Response('bad json'),()=>{throw new TypeError('network');}]) {
  let attempts=0;
  const broken=adapter.createClient({now:()=>clock,fetchImpl:async()=>{attempts++;return response();}});
  const request={operation:3,direction:'up'};
  assert.equal(await broken.loadDentoFormation(request),null);
  assert.equal(await broken.loadDentoFormation(request),null);assert.equal(attempts,1);
  clock+=15001;assert.equal(await broken.loadDentoFormation(request),null);assert.equal(attempts,2);
}
const other=adapter.createClient({fetchImpl:async url=>{
  assert.equal(url,'https://train-info.tokyuapp.com/lines/26003/trains/3/directions/down');
  return Response.json({unit_number:'123456'});
}});
assert.deepEqual(await other.loadDentoFormation({operation:3,direction:'down'}),{formation:'123456',cars:0});
console.log('Dento formation: direct URL, formatting, cache, deduplication, invalid/empty/error responses passed.');
