import {createMinatomiraiSource,mergeMinatomirai} from './minatomirai.js';
const ISSUER = 'https://fp5owad3w3.execute-api.ap-northeast-1.amazonaws.com/prod/external-data-url';
const SIGNED_HOST = 'external-data-user.s3.ap-northeast-1.amazonaws.com';
const SOURCES = Object.freeze({toyoko:'toyoko.json',meguro:'meguro.json',dento:'dento.json',oimachi:'oimachi.json',shinyokohama:'shinyokohama.json',ikegami:'iketama.json',tamagawa:'iketama.json',setagaya:'setagaya.json'});
const THIRD_PARTY = new Set(['iketama.json','setagaya.json']);
export function createTokyuSource({ fetchImpl = (...args) => fetch(...args), now = () => Date.now(), timeoutMs = 12000, minatomirai = null } = {}) {
  const cache = new Map();
  async function request(url, headers = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, {headers, signal:controller.signal, redirect:'manual', cache:'no-store'});
      const text = await response.text();
      if (!response.ok) throw Object.assign(new Error(`HTTP ${response.status}`), {status:response.status});
      let data;
      try { data = JSON.parse(text); } catch { throw new Error('JSON形式不正'); }
      if (data && data.error) throw new Error(String(data.error).includes('origin') ? '署名URL発行API: Originが許可されていません' : '配信元がエラーを返しました');
      return data;
    } catch (error) {
      if (controller.signal.aborted) throw new Error('取得タイムアウト');
      if (error instanceof TypeError) throw new Error('通信エラー');
      throw error;
    } finally { clearTimeout(timer); }
  }
  async function signed(file) {
    for (let attempt = 0; attempt < 2; attempt++) {
      // API Gateway's handler requires the lowercase header name used by the Web client.
      const issued = await request(ISSUER + '?key=' + file, {origin:'https://tokyu-tid.s3.amazonaws.com'});
      let url;
      try { url = new URL(issued.url); } catch { throw new Error('署名URL形式不正'); }
      if (url.protocol !== 'https:' || url.hostname !== SIGNED_HOST || url.port || url.username || url.password || url.pathname !== '/' + file || !url.searchParams.has('X-Amz-Signature')) throw new Error('許可されていない署名URL');
      try { return await request(url.href); }
      catch (error) { if (error.status !== 403 || attempt === 1) throw error; }
    }
  }
  function load(key) {
    const file = SOURCES[key];
    if (!file) return Promise.reject(new Error('データソース未設定'));
    const cached = cache.get(file);
    if (cached && cached.expires > now()) return cached.promise;
    const thirdParty = THIRD_PARTY.has(file), ttl = thirdParty ? 60000 : 15000;
    const entry = {expires:Infinity, promise:null};
    entry.promise = (async () => {
      let data = thirdParty ? await request('https://w-tid.jp/tokyu/' + file) : await signed(file);
      if (!data || !Array.isArray(data.trains)) throw new Error('在線JSON形式不正');
      let extension;
      if (!thirdParty && minatomirai) {
        try {
          const extra = await minatomirai.load(key,data.trains);
          data = mergeMinatomirai(data, extra.trains, extra.destinations);
          extension = {ok:true,count:extra.trains.length,fetchedAt:now()};
        } catch (error) {
          const known=['Minatomirai position mismatch','Incomplete Minatomirai positions','Invalid Minatomirai authentication','Minatomirai authentication not configured'];
          extension = {ok:false,error:known.includes(error.message)?error.message:'Minatomirai unavailable',...(error.stage?{stage:error.stage,status:error.status}:{})};
        }
      }
      const fetchedAt = now();
      entry.expires = fetchedAt + ttl;
      return {data, fetchedAt, source:thirdParty ? 'w-tid' : 'signed', file, ...(extension ? {[key==='toyoko'?'minatomirai':'destinationSupplement']:extension} : {})};
    })().catch(error => {
      // Negative cache avoids hammering an unavailable feed, without serving stale trains.
      entry.expires = now() + ttl;
      throw error;
    });
    cache.set(file, entry);
    return entry.promise;
  }
  return {load};
}
const source = createTokyuSource();
let configuredSource,configuredToken;
export async function onRequestGet({request, env = {}, cacheStorage = globalThis.caches?.default, waitUntil}) {
  const token=env.TOKYU_FIREBASE_REFRESH_TOKEN;
  if(token&&token!==configuredToken){
    configuredSource=createTokyuSource({minatomirai:createMinatomiraiSource({refreshToken:token})});
    configuredToken=token;
  }
  const url = new URL(request.url), key = url.pathname.replace(/^\/api\/tokyu\//, '');
  const headers = {'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
  if (url.search || !Object.hasOwn(SOURCES,key)) return Response.json({error:'データソース未設定'}, {status:400, headers});
  // The cache key contains only a fixed public filename, never a signed URL.
  const cacheKey = new Request(url.origin + '/tokyu-cache-v2/' + (token?'mm/':'base/') + SOURCES[key]);
  if (cacheStorage) {
    const hit = await cacheStorage.match(cacheKey);
    if (hit) return new Response(hit.body, {status:hit.status, headers});
  }
  try {
    const payload = await (token?configuredSource:source).load(key);
    if (cacheStorage) {
      const put = cacheStorage.put(cacheKey, Response.json(payload, {headers:{'cache-control':THIRD_PARTY.has(payload.file)?'max-age=60':'max-age=15'}}));
      if (waitUntil) waitUntil(put); else await put;
    }
    return Response.json(payload, {headers});
  } catch (error) { return Response.json({error:error.message}, {status:502, headers}); }
}
