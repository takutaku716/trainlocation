import assert from 'node:assert/strict';
import {createTokyuSource,onRequestGet} from '../functions/api/tokyu/[[path]].js';
import worker from '../workers/tokyu_proxy.js';
const signedUrl = file => `https://external-data-user.s3.ap-northeast-1.amazonaws.com/${file}?X-Amz-Signature=fixture`;
for (const key of ['toyoko','meguro','dento','oimachi','shinyokohama']) {
  const calls=[];
  const source=createTokyuSource({fetchImpl:async(url,opts)=>{
    calls.push(url); assert.equal(opts.redirect,'manual'); assert.ok(opts.signal);
    if(url.includes('external-data-url')) {assert.equal(opts.headers.origin,'https://tokyu-tid.s3.amazonaws.com');return Response.json({url:signedUrl(key+'.json')});}
    assert.equal(url,signedUrl(key+'.json'));return Response.json({trains:[]});
  }});
  const data=await source.load(key);
  assert.equal(data.file,key+'.json');assert.equal(data.source,'signed');assert.equal(calls.length,2);
}
let attempts=0, issued=0;
const retry=createTokyuSource({fetchImpl:async url=>{
  if(url.includes('external-data-url')){issued++;return Response.json({url:signedUrl('toyoko.json')});}
  attempts++;return attempts===1?new Response('',{status:403}):Response.json({trains:[]});
}});
await retry.load('toyoko');assert.equal(attempts,2);assert.equal(issued,2);
attempts=0;
const denied=createTokyuSource({fetchImpl:async url=>url.includes('external-data-url')?Response.json({url:signedUrl('toyoko.json')}):(attempts++,new Response('',{status:403}))});
await assert.rejects(denied.load('toyoko'),/403/);assert.equal(attempts,2);
for(const bad of ['https://evil.test/toyoko.json','https://prod-hitachi-tid-in-house.s3.ap-northeast-1.amazonaws.com/toyoko.json','http://external-data-user.s3.ap-northeast-1.amazonaws.com/toyoko.json',signedUrl('meguro.json')]){
  let n=0;const source=createTokyuSource({fetchImpl:async()=>{n++;return Response.json({url:bad});}});
  await assert.rejects(source.load('toyoko'),/許可/);assert.equal(n,1);
}
for(const body of ['not-json','{}','{"error":"CORS error: origin not allowed."}']){
  const source=createTokyuSource({fetchImpl:async()=>new Response(body)});
  await assert.rejects(source.load('ikegami'));
}
let clock=1,calls=0;
const cached=createTokyuSource({now:()=>clock,fetchImpl:async url=>{calls++;assert.equal(url,'https://w-tid.jp/tokyu/iketama.json');return Response.json({trains:[]});}});
await Promise.all([cached.load('ikegami'),cached.load('tamagawa')]);assert.equal(calls,1);
clock+=59999;await cached.load('ikegami');assert.equal(calls,1);
clock+=2;await cached.load('tamagawa');assert.equal(calls,2);
await assert.rejects(cached.load('kodomo'),/未設定/);assert.equal(calls,2);
const timeout=createTokyuSource({timeoutMs:5,fetchImpl:async(url,{signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(new Error('aborted'))))});
await assert.rejects(timeout.load('setagaya'),/タイムアウト/);
assert.equal((await onRequestGet({request:new Request('https://test/api/tokyu/kodomo')})).status,400);
assert.equal((await onRequestGet({request:new Request('https://test/api/tokyu/toyoko?url=evil')})).status,400);
assert.equal((await worker.fetch(new Request('https://test/api/tokyu/toyoko'),{},{})).status,403);
const preflight=await worker.fetch(new Request('https://test/api/tokyu/toyoko',{method:'OPTIONS',headers:{origin:'https://takutaku716.github.io'}}),{},{});
assert.equal(preflight.status,204);assert.equal(preflight.headers.get('access-control-allow-origin'),'https://takutaku716.github.io');
console.log('Tokyu proxy: exact sources, lowercase Origin, signed URL validation, one expiry retry, cache, timeout, malformed JSON, and CORS passed.');
