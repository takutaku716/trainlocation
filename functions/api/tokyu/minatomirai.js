const API_KEY = 'AIzaSyDzceIXYf7HP3vrQA5BHGHJpbVM_ZgA_HU';
const ENDPOINT = 'https://firestore.googleapis.com/v1/projects/rabbit-uh-prod/databases/(default)/documents/running/versions/v2.1/tymm/trackings?pageSize=100';
const POSITIONS = [
  ['tymm-yokohama_tymm-shintakashima','section_id',71],
  ['tymm-shintakashima','station_id',927],
  ['tymm-shintakashima_tymm-minatomirai','section_id',72],
  ['tymm-minatomirai','station_id',928],
  ['tymm-minatomirai_tymm-bashamichi','section_id',73],
  ['tymm-bashamichi','station_id',929],
  ['tymm-bashamichi_tymm-nihonoodoori','section_id',74],
  ['tymm-nihonoodoori','station_id',930],
  ['tymm-nihonoodoori_tymm-motomomachichukagai','section_id',75],
  ['tymm-motomomachichukagai','station_id',931]
];
const KINDS = {LOCAL:'普',EXPRESS:'急',LIMITED_EXPRESS:'特',COMMUTERS_LIMITED_EXPRESS:'通',F_LINER:'Ｆ',S_TRAIN:'Ｓ',OUT_OF_SERVICE:'回'};
function decode(value) {
  if(value.mapValue)return Object.fromEntries(Object.entries(value.mapValue.fields||{}).map(([k,v])=>[k,decode(v)]));
  if(value.arrayValue)return (value.arrayValue.values||[]).map(decode);
  if(value.integerValue!==undefined)return Number(value.integerValue);
  if(value.doubleValue!==undefined)return value.doubleValue;
  if(value.stringValue!==undefined)return value.stringValue;
  if(value.booleanValue!==undefined)return value.booleanValue;
  return null;
}
export function convertMinatomirai(documents) {
  const trains=[],seen=new Set();
  for(const document of documents){
    const row=decode({mapValue:{fields:document.fields||{}}});
    if(!Number.isInteger(row.index)||row.index<41||row.index>50)continue;
    const [position,field,id]=POSITIONS[row.index-41];
    if(row.position_id!==position||row.type!==(field==='station_id'?'STATION':'SECTION'))throw Error('Minatomirai position mismatch');
    const entries=[...(row.trains||[]),...(row.convergences||[]).flatMap(c=>c.trains||[])];
    for(const t of entries){
      const number=String(t.tid_train_number??'');
      if(!/^\d{1,12}$/.test(number)||!['UP','DOWN'].includes(t.direction))continue;
      const identity=number+':'+t.direction;
      if(seen.has(identity))continue;
      seen.add(identity);
      trains.push({line_id:26001,train_line_id:26001,source_line_id:'tymm',source_index:row.index,
        train_number:number,operation_number:t.tid_operation_number,up:t.direction==='UP',
        [field]:id,kind:KINDS[t.kind]||'',destination:t.destination||'',delay_time:Math.max(0,Number(t.delay_time)||0),
        num_of_cars:Number(t.number_of_cars)||0,affiliation:t.tid_affiliation||'',train_orchestration_number:t.tid_orchestration_number||''});
    }
  }
  return trains;
}
export function mergeMinatomirai(base, extra) {
  const identities=new Set(extra.map(t=>t.train_number+':'+t.up));
  return {...base,trains:[...base.trains.filter(t=>!identities.has(String(t.train_number)+':'+t.up)),...extra]};
}
export function createMinatomiraiSource({refreshToken,fetchImpl=(...args)=>fetch(...args),now=()=>Date.now(),timeoutMs=12000}={}) {
  let token=null,pending=null;
  async function request(url,options={}){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
    try{
      const response=await fetchImpl(url,{...options,redirect:'manual',signal:controller.signal});
      if(!response.ok)throw Object.assign(Error('Minatomirai request failed'),{status:response.status});
      return await response.json();
    }catch(error){error.stage=url===ENDPOINT?'data':'auth';throw error;}
    finally{clearTimeout(timer);}
  }
  async function idToken(){
    if(token&&token.expires>now())return token.value;
    if(!pending)pending=(async()=>{
      if(!refreshToken)throw Error('Minatomirai authentication not configured');
      const data=await request('https://securetoken.googleapis.com/v1/token?key='+API_KEY,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',refresh_token:refreshToken.trim()}).toString()});
      if(!data.id_token||!(Number(data.expires_in)>60))throw Error('Invalid Minatomirai authentication');
      token={value:data.id_token,expires:now()+(Number(data.expires_in)-60)*1000};
      return token.value;
    })().finally(()=>{pending=null;});
    return pending;
  }
  async function load(){
    for(let attempt=0;attempt<2;attempt++){
      try{
        const data=await request(ENDPOINT,{headers:{authorization:'Bearer '+await idToken()}});
        if(!Array.isArray(data.documents)||data.nextPageToken)throw Error('Incomplete Minatomirai positions');
        const indexes=new Set(data.documents.map(d=>Number(d.fields?.index?.integerValue)).filter(i=>i>=41&&i<=50));
        if(indexes.size!==10)throw Error('Incomplete Minatomirai positions');
        return convertMinatomirai(data.documents);
      }catch(error){if(error.status!==401||attempt===1)throw error;token=null;}
    }
  }
  return {load};
}
