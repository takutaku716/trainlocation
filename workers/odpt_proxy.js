// Application-only ODPT gateway. Never forward a caller-supplied URL or token.
import { onRequestGet as keikyuWeb } from "../functions/api/keikyu/[[path]].js";
const BASE = "https://api-challenge.odpt.org/api/v4/";
const OPERATOR = "odpt.Operator:Keikyu";
const LINES = ["Main", "Airport", "Daishi", "Zushi", "Kurihama"];
const ORIGINS = new Set(["https://trainlocation.pages.dev", "https://takutaku716.github.io", "http://127.0.0.1:8765", "http://localhost:8765", "http://127.0.0.1:8766", "http://localhost:8766"]);
export const LICENSE_END = Date.parse("2027-03-13T00:00:00+09:00");
function response(value, status, origin) {
  return new Response(JSON.stringify(value), { status, headers: {
    "content-type": "application/json; charset=utf-8", "cache-control": "no-store",
    "access-control-allow-origin": origin, "vary": "Origin", "x-content-type-options": "nosniff"
  }});
}
async function upstream(type, env) {
  const url = new URL(BASE + "odpt:" + type);
  url.searchParams.set("odpt:operator", OPERATOR);
  url.searchParams.set("acl:consumerKey", env.ODPT_ACCESS_TOKEN_2026);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  let result;
  try { result = await fetch(url.toString(), { signal: controller.signal, redirect: "manual" }); }
  catch (_) { throw new Error("transport"); }
  finally { clearTimeout(timeout); }
  if (!result.ok) throw Object.assign(new Error("upstream"), { upstreamStatus: result.status });
  let data;
  try { data = await result.json(); } catch (_) { throw new Error("json"); }
  if (!Array.isArray(data)) throw new Error("format");
  return data;
}
export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("origin") || "";
    if (!ORIGINS.has(origin)) return response({ error: "Forbidden origin" }, 403, "null");
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: {
      "access-control-allow-origin": origin, "access-control-allow-methods": "GET, OPTIONS", "vary": "Origin"
    }});
    if (request.method !== "GET") return response({ error: "Method not allowed" }, 405, origin);
    const url = new URL(request.url);
    if (url.search) return response({ error: "Unsupported query" }, 400, origin);
    if (url.pathname.startsWith("/api/keikyu/web/")) {
      url.pathname = url.pathname.replace("/api/keikyu/web/", "/api/keikyu/");
      const result = await keikyuWeb({ request: new Request(url.toString()) });
      const headers = new Headers(result.headers);
      headers.set("access-control-allow-origin", origin);
      headers.set("vary", "Origin");
      return new Response(result.body, { status: result.status, headers });
    }
    if (!["/api/keikyu/catalog", "/api/keikyu/location"].includes(url.pathname)) return response({ error: "Not found" }, 404, origin);
    if (Date.now() >= LICENSE_END) return response({ error: "Challenge license expired" }, 410, origin);
    if (!env.ODPT_ACCESS_TOKEN_2026) return response({ error: "ODPT configuration unavailable" }, 503, origin);
    try {
      // Cache is internal only; browser responses remain no-store. Tokens are never cache keys.
      const cache = typeof caches !== "undefined" ? caches.default : null;
      const key = new Request(url.origin + url.pathname);
      const hit = cache && await cache.match(key);
      if (hit) return response(await hit.json(), 200, origin);
      let payload;
      if (url.pathname.endsWith("catalog")) {
        const [railways, types] = await Promise.all([upstream("Railway", env), upstream("TrainType", env)]);
        payload = { routes: LINES.map((line, index) => {
          const railway = "odpt.Railway:Keikyu." + line;
          const r = railways.find(row => row["owl:sameAs"] === railway);
          if (!r) throw new Error("missing railway");
          return { rosen: String(146 + index), railway, name: r["odpt:railwayTitle"]?.ja || r["dc:title"],
            color: "#e60012", code: "KK", live: true, ascending: r["odpt:ascendingRailDirection"], descending: r["odpt:descendingRailDirection"],
            stations: r["odpt:stationOrder"].filter(s => !s["odpt:station"].endsWith(".Sengakuji")).map((s, i) => ({
              id: s["odpt:station"], name: s["odpt:stationTitle"]?.ja, index: i + 1
            })) };
        }), types: Object.fromEntries(types.map(t => [t["owl:sameAs"], t["odpt:trainTypeTitle"]?.ja || t["dc:title"]])) };
      } else {
        const rows = await upstream("Train", env);
        // Only fields needed by the application's renderer; no raw JSON-LD export.
        payload = { updatedAt: Date.now(), trains: rows.filter(r => r["odpt:operator"] === OPERATOR).map(r => ({
          railway: r["odpt:railway"], number: r["odpt:trainNumber"], direction: r["odpt:railDirection"],
          from: r["odpt:fromStation"], to: r["odpt:toStation"], type: r["odpt:trainType"],
          destination: r["odpt:destinationStation"], delay: r["odpt:delay"], cars: r["odpt:carComposition"],
          date: r["dc:date"], valid: r["dct:valid"]
        })) };
      }
      if (cache) ctx.waitUntil(cache.put(key, new Response(JSON.stringify(payload), { headers: {
        "content-type": "application/json", "cache-control": url.pathname.endsWith("catalog") ? "max-age=3600" : "max-age=15"
      }})));
      return response(payload, 200, origin);
    } catch (error) { return response({ error: "ODPT data temporarily unavailable", reason: ["transport", "json", "format", "missing railway", "upstream"].includes(error.message) ? error.message : "processing", upstreamStatus: error.upstreamStatus || null }, 502, origin); }
  }
};
