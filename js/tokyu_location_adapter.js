(function(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./tokyu_routes.js'));
  else root.TokyuLocationAdapter = factory(root.TokyuRoutes);
}(typeof self !== 'undefined' ? self : this, function(master) {
  'use strict';
  const types = {'普':['普通','普'],'Ｇ':['普通','普'],'急':['急行','急'],'特':['特急','特'],'通':['通勤特急','通特'],'準':['準急','準急'],'回':['回送','回'],'Ｓ':['S-TRAIN','S'],'Ｆ':['Fライナー','F']};
  const kindCodes = {2:'普',3:'Ｓ',4:'急',5:'特',6:'回',7:'Ｆ',8:'Ｇ',10:'準',11:'通'};
  function routeFor(id) { return master.routes.find(r => [r.rosen,r.key,r.tidLineId,r.internalLineId].includes(String(id))); }
  function positionFor(train, route) {
    if (!train || typeof train.up !== 'boolean') return null;
    const direction = train.up ? 'U' : 'D';
    if (train.station_id != null) {
      const station = route.stations.find(s => s.id === String(train.station_id));
      return station ? {key:`TOKYU${route.rosen}P${station.index}${direction}`, name:station.name} : null;
    }
    const section = route.sections[String(train.section_id)];
    if (!section) return null;
    const from = route.stations[section.from - 1], to = route.stations[section.to - 1];
    return {key:`TOKYU${route.rosen}P${section.from}_${section.to}${direction}`,name:(train.up ? `${to.name}→${from.name}` : `${from.name}→${to.name}`) + ' 間'};
  }
  function destinationFor(train, route) {
    if (typeof train.destination === 'string' && train.destination.trim()) return train.destination.trim();
    const group = ['toyoko','meguro','shinyokohama'].includes(route.key) ? 'tymg' : 'dtom';
    return master.destinations[group][String(train.destination_station_code)] || '行先不明';
  }
  function operationLabel(value, lineId) {
    if (value == null || value === '') return '';
    const number = Number(value), line = String(lineId);
    if (!Number.isInteger(number) || number < 0 || number > 999) return '';
    if (['26005','26006'].includes(line)) return String(number).padStart(2,'0').slice(-2);
    if (number === 999) return '999';
    if (['26001','26002','26009','26010'].includes(line)) {
      const suffix = ['K','M','K','S','T','M','G','S','T','G'][Math.floor(number/100)];
      return String(number%100).padStart(2,'0') + suffix;
    }
    if (line === '26003' && number < 100) return String(number).padStart(2,'0') + (number < 50 ? 'K' : number%2 === 0 ? 'T' : 'S');
    return String(number);
  }
  function normalize(envelope, id) {
    const route = routeFor(id);
    if (!route) throw new Error('データソース未設定');
    if (!envelope || !Array.isArray(envelope.data?.trains) || !Number.isFinite(envelope.fetchedAt) || envelope.fetchedAt <= 0) throw new Error('在線JSON形式不正');
    const seen = new Set(), trains = [];
    let inputCount = 0, unmapped = 0;
    for (const row of envelope.data.trains) {
      if (!row || String(row.line_id) !== route.tidLineId) continue;
      inputCount++;
      const pos = positionFor(row, route);
      const number = row.train_number != null && String(row.train_number) ? String(row.train_number) : String(row.operation_number ?? '');
      if (!pos || !/^[A-Za-z0-9-]{1,24}$/.test(number)) { unmapped++; continue; }
      const identity = [number, row.operation_serial_number, row.up, row.train_line_id, pos.key].join(':');
      if (seen.has(identity)) continue;
      seen.add(identity);
      const type = types[row.kind] || types[kindCodes[row.train_kind]] || ['種別不明','？'];
      const destination = destinationFor(row, route);
      const cars = Number(row.num_of_cars);
      trains.push({cbango:number, displayTrainNumber:number, iconTrainNumber:operationLabel(row.operation_number,row.train_line_id ?? row.line_id), type:'3', typeLabel:type[0], name:type[0] + (type[0].endsWith('ライナー') || type[0] === 'S-TRAIN' ? '' : '列車'),
        pos:pos.key,posName:pos.name,chien:Math.max(0,Math.floor(Number(row.delay_time)||0)),
        shuEkiSimple:destination === '行先不明' ? '？' : Array.from(destination)[0],shuEkiName:destination,shuEkiKey:'',
        ryosu:Number.isInteger(cars) && cars > 0 && cars < 99 ? cars : 0,status:'1',statusDetail:'',senku:route.rosen,source:'tokyu',sourceRosen:route.rosen,
        tokyu:{typeSimple:type[1],operationNumber:row.operation_number,trainLineId:row.train_line_id,trackNumber:row.track_number}});
    }
    const text = new Date(envelope.fetchedAt + 9*3600000).toISOString().slice(0,19).replace(/-/g,'/').replace('T',' ') + ' 現在';
    return {trains,time:Object.fromEntries(['ja','en','tc','sc','kr'].map(l=>[l,text])),sourceTimes:[{rosen:route.rosen,timestamp:envelope.fetchedAt,text}],
      tokyu:{source:route.source,file:route.file,fetchedAt:envelope.fetchedAt,inputCount,count:trains.length,unmapped,error:''}};
  }
  function apiUrl(id) {
    const route = routeFor(id);
    if (!route) throw new Error('データソース未設定');
    const local = typeof location !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    return (local ? '' : 'https://trainlocation-tokyu-proxy.densha716.workers.dev') + '/api/tokyu/' + route.key;
  }
  function createClient({fetchImpl=(...args)=>fetch(...args), now=()=>Date.now(), timeoutMs=50000}={}) {
    const cache = new Map(), lastSuccess = new Map();
    async function request(route) {
      const response = await fetchImpl(apiUrl(route.rosen),{cache:'no-store',signal:AbortSignal.timeout(timeoutMs)});
      let data;
      try { data = await response.json(); } catch { throw new Error('在線JSON形式不正'); }
      if (!response.ok || data.error) throw new Error(data.error || `HTTP ${response.status}`);
      return data;
    }
    async function load(id) {
      const route = routeFor(id);
      if (!route) throw new Error('データソース未設定');
      const ttl = route.source === 'w-tid' ? 60000 : 15000;
      try {
        let entry = cache.get(route.file);
        if (!entry || entry.expires <= now()) {
          entry = {expires:Infinity,promise:null};
          entry.promise = request(route).then(data => {entry.expires=data.fetchedAt+ttl;return data;},error=>{entry.expires=now()+ttl;throw error;});
          cache.set(route.file,entry);
        }
        const data = await entry.promise;
        if (now() - data.fetchedAt > 120000 || data.fetchedAt - now() > 60000) throw new Error('取得データの日時が古いか不正です');
        const result = normalize(data,route.rosen);
        lastSuccess.set(route.rosen,data.fetchedAt);
        return result;
      } catch (error) {
        return {trains:[],time:{},tokyu:{source:route.source,file:route.file,fetchedAt:lastSuccess.get(route.rosen)||null,inputCount:0,count:0,unmapped:0,
          error:['TimeoutError','AbortError'].includes(error.name)?'取得タイムアウト':error instanceof TypeError?'通信エラー':error.message}};
      }
    }
    return {load};
  }
  function statusText(data) {
    const s = data.tokyu;
    const time = s.fetchedAt ? new Date(s.fetchedAt).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo',hour12:false}) : '未取得';
    return `${s.source === 'w-tid' ? 'w-tid取得（第三者配信）' : '署名付きJSON'} / ${s.file}　最終取得: ${time}　列車: ${s.count}件` +
      (s.unmapped ? `（位置未対応: ${s.unmapped}件）` : '') + (s.error ? `　エラー: ${s.error}` : s.inputCount === 0 ? '　在線なし' : '');
  }
  return {routeFor,positionFor,destinationFor,operationLabel,normalize,apiUrl,createClient,statusText,...createClient()};
}));
