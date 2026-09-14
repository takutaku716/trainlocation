import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {LOCAL_LINES,convertLocalLine} from '../functions/api/tokyu/local-lines.js';
import {createMinatomiraiSource} from '../functions/api/tokyu/minatomirai.js';
const require=createRequire(import.meta.url),adapter=require('../js/tokyu_location_adapter');
const encode=v=>Array.isArray(v)?{arrayValue:{values:v.map(encode)}}:v&&typeof v==='object'?{mapValue:{fields:Object.fromEntries(Object.entries(v).map(([k,x])=>[k,encode(x)]))}}:typeof v==='number'?{integerValue:String(v)}:{stringValue:v};
for(const [key,line] of Object.entries(LOCAL_LINES)){
  const rows=Array.from({length:line.stations.length*2-1},(_,index)=>{
    const n=Math.floor(index/2),id=i=>line.prefix+'-'+line.slugs[i];
    return {index,position_id:index%2?id(n)+'_'+id(n+1):id(n),type:index%2?'SECTION':'STATION',trains:['UP','DOWN'].map(direction=>({tid_operation_number:index+100,direction,kind:'LOCAL',destination:'',number_of_cars:'',delay_time:2,affiliated_line_id:line.prefix}))};
  });
  const trains=convertLocalLine(rows,key),route=adapter.routeFor(key);
  assert.equal(trains.length,rows.length*2);assert.equal(trains[0].destination,'');assert.equal(trains[0].train_number,undefined);
  const result=adapter.normalize({data:{trains},fetchedAt:Date.now()},route.rosen);
  assert.equal(result.trains.length,trains.length);
  const html=fs.readFileSync('rosen/rosen_'+route.rosen+'.html','utf8');
  for(const t of result.trains){assert.ok(html.includes(t.pos));assert.equal(t.chien,2);assert.equal(t.shuEkiName,'行先不明');}
  assert.deepEqual(convertLocalLine(rows.map(r=>({...r,trains:[]})),key),[]);
  assert.throws(()=>convertLocalLine(rows.slice(1),key));
  assert.throws(()=>convertLocalLine([{...rows[0],position_id:'wrong'},...rows.slice(1)],key));
  const client=createMinatomiraiSource({refreshToken:'fixture',fetchImpl:async url=>{
    assert.ok(!url.includes('w-tid'));
    if(url.includes('securetoken'))return Response.json({id_token:'fixture',expires_in:3600});
    assert.ok(url.includes('/'+line.prefix+'/trackings'));
    return Response.json({documents:rows.map(r=>({fields:encode(r).mapValue.fields}))});
  }});
  assert.deepEqual((await client.load(key)).trains,trains);
}
assert.ok(!fs.readFileSync('functions/api/tokyu/[[path]].js','utf8').includes('https://w-tid'));
console.log('Three local lines: all station/section positions, both directions, empty fields, strict mapping and Firestore-only retrieval passed.');
