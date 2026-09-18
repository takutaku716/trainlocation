export async function onRequestGet({ request }) {
  const path = new URL(request.url).pathname.replace(/^\/api\/tx\//, "");
  if (!/^(tid\/trains\.json|status\.json|stop_stations\/\d{4}-\d{2}-\d{2}\/\d{1,12}\.json)$/.test(path)) return new Response("Not found", { status: 404 });
  try {
    const url = "https://external-data.tx-app.com/" + path + (path === "status.json" ? "" : "?" + Date.now());
    const upstream = await fetch(url, { signal: AbortSignal.timeout(12000), redirect: "manual", headers: { accept: "application/json" } });
    if (!upstream.ok) throw new Error("upstream");
    const data = await upstream.json();
    const valid = path === "tid/trains.json" ? data && Array.isArray(data.trains) && Number.isFinite(data.updated_at) :
      path === "status.json" ? data && typeof data.message === "string" : Array.isArray(data);
    if (!valid) throw new Error("format");
    return Response.json(data, { headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" } });
  } catch (_) {
    return Response.json({ error: "TX data temporarily unavailable" }, { status: 502, headers: { "cache-control": "no-store" } });
  }
}
