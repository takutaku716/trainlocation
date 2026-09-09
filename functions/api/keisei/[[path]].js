export async function onRequestGet({ request }) {
  const path = new URL(request.url).pathname.replace(/^\/api\/keisei\//, "");
  if (!/^(traffic_info|matsudo_date|matsudo_train_info|matsudo_status)\.json$|^diainf(?:_SK)?\/[A-Za-z0-9-]{1,24}\.json$/.test(path)) return new Response("Not found", { status: 404 });
  try {
    const response = await fetch("https://zaisen.tid-keisei.jp/data/" + path + "?ts=" + Date.now(), { headers: { accept: "application/json" }, signal: AbortSignal.timeout(12000), redirect: "manual" });
    if (!response.ok) throw new Error("upstream");
    return Response.json(await response.json(), { headers: { "cache-control": "no-store" } });
  } catch (_) { return Response.json({ error: "Keisei data unavailable" }, { status: 502, headers: { "cache-control": "no-store" } }); }
}
