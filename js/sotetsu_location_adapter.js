(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./sotetsu_routes.js'),require('./tokyu_location_adapter.js'));
  else root.SotetsuLocationAdapter=factory(root.SotetsuRoutes,root.TokyuLocationAdapter);
}(typeof self!=='undefined'?self:this,function(master,tokyu){
  'use strict';
  function routeFor(id){return master.routes.find(r=>r.rosen===String(id));}
  function positionFor(train,route){
    if(!train||!route||!['up','down'].includes(train.direction)||![1,2,3].includes(train.line_id)||train.source)return null;
    const dir=train.direction==='up'?'U':'D',ss=route.stations;
    if(train.next_station_id===null){
      const s=ss.find(s=>s.id===train.station_id);
      return s?{key:`SOTETSU${route.rosen}P${s.index}${dir}`,name:s.name}:null;
    }
    if(train.line_id!==route.lineId)return null;
    const next=ss.findIndex(s=>s.id===train.next_station_id);
    const from=next+(dir==='U'?1:-1);
    if(next<0||from<0||from>=ss.length)return null;
    return {key:`SOTETSU${route.rosen}P${Math.min(next,from)+1}_${Math.max(next,from)+1}${dir}`,name:ss[from].name+'→'+ss[next].name+' 間'};
  }
  function normalize(raw,id){
    const route=routeFor(id);
    if(!route)throw Error('Unknown Sotetsu route');
    if(!raw||!Array.isArray(raw.trains)||!Number.isFinite(raw.updated_at)||raw.updated_at<=0)throw Error('Invalid Sotetsu data');
    const trains=[],seen=new Set();
    for(const train of raw.trains){
      const pos=positionFor(train,route),number=String(train?.train_number??'');
      const operation=route.lineId===3&&train?.station_id===29&&train.next_station_id===null?number.match(/^K(\d{1,3})$/):null;
      const operationLabel=operation?tokyu.operationLabel(operation[1],'26009'):'';
      if(!pos||(!/^\d{1,8}$/.test(number)&&!operationLabel)||seen.has(number))continue;
      seen.add(number);
      const kind=master.kinds[train.train_kind_id]||['種別不明','？'];
      const destination=master.destinations[train.destination_station_id]||'行先不明';
      trains.push({cbango:number,displayTrainNumber:operationLabel||number,iconTrainNumber:operationLabel||number,type:'3',typeLabel:kind[0],name:kind[0],pos:pos.key,posName:pos.name,
        chien:Math.max(0,Math.floor(Number(train.delay)||0)),shuEkiSimple:destination==='行先不明'?'？':Array.from(destination)[0],shuEkiName:destination,shuEkiKey:'',
        ryosu:Number.isInteger(train.train_length_id)&&train.train_length_id>0&&train.train_length_id<=20?train.train_length_id:0,
        status:'1',statusDetail:'',senku:route.rosen,source:'sotetsu',sourceRosen:route.rosen,sotetsu:{typeSimple:kind[1],position:train.position}});
    }
    const timestamp=raw.updated_at*1000;
    const text=new Date(timestamp+9*3600000).toISOString().slice(0,19).replace('T',' ')+' 現在';
    return {trains,time:Object.fromEntries(['ja','en','tc','sc','kr'].map(l=>[l,text])),sourceTimes:[{rosen:route.rosen,timestamp,text}],sotetsu:{error:false}};
  }
  function createClient({fetchImpl=(...args)=>fetch(...args),now=()=>Date.now()}={}){
    let cached;
    async function load(id){
      try{
        if(!cached||cached.expires<=now()){
          const entry={expires:Infinity,promise:null};
          entry.promise=(async()=>{
            const response=await fetchImpl('https://external-data.sotetsuapp.com/tid/trains.json?'+now(),{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(15000)});
            if(!response.ok)throw Error('Sotetsu HTTP '+response.status);
            return response.json();
          })().finally(()=>{entry.expires=now()+15000;});
          cached=entry;
        }
        const raw=await cached.promise;
        if(!Number.isFinite(raw?.updated_at)||now()-raw.updated_at*1000>180000||raw.updated_at*1000-now()>60000)throw Error('Stale Sotetsu data');
        return normalize(raw,id);
      }catch(_){return {trains:[],time:{},sotetsu:{error:true}};}
    }
    return {load};
  }
  return {routeFor,positionFor,normalize,createClient,...createClient()};
}));
