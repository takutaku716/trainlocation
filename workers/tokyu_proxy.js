import { onRequestGet } from '../functions/api/tokyu/[[path]].js';
const ORIGINS = new Set(['https://takutaku716.github.io','https://trainlocation.pages.dev']);
export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('origin') || '';
    if (!ORIGINS.has(origin)) return new Response('Forbidden origin', {status:403});
    const headers = {'access-control-allow-origin':origin,'vary':'Origin','access-control-allow-methods':'GET, OPTIONS'};
    if (request.method === 'OPTIONS') return new Response(null, {status:204,headers});
    if (request.method !== 'GET') return new Response('Method not allowed', {status:405,headers});
    const result = await onRequestGet({request, waitUntil:p=>ctx.waitUntil(p)});
    const merged = new Headers(result.headers);
    for (const [key,value] of Object.entries(headers)) merged.set(key,value);
    return new Response(result.body,{status:result.status,headers:merged});
  }
};
