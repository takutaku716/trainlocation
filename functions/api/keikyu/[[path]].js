export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const suffix = url.pathname.replace(/^\/api\/keikyu\//, "");
  let path;
  if (suffix === "location") path = "train";
  else if (/^timetable\/(8201|8401|8301|8601|8501)-[01]-[a-z0-9-]{1,24}$/i.test(suffix)) path = suffix.replace("timetable/", "locationTimetable/");
  else return new Response("Not found", { status: 404 });
  try {
    const upstream = await fetch("https://app-kq.net/api/" + path, {
      headers: { accept: "application/json", "user-agent": "Mozilla/5.0", referer: "https://app-kq.net/web/jp/html/zaisen.html" }, signal: AbortSignal.timeout(12000),
      redirect: "error", cf: { cacheTtl: suffix === "location" ? 15 : 60, cacheEverything: true }
    });
    if (!upstream.ok) throw new Error("upstream");
    const data = await upstream.json();
    if (suffix === "location" ? !Array.isArray(data) : !data.info || !Array.isArray(data.stations)) throw new Error("format");
    return Response.json(data, { headers: { "cache-control": "no-store" } });
  } catch (_) {
    return Response.json({ error: "Keikyu data temporarily unavailable" }, { status: 502 });
  }
}
