export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const suffix = url.pathname.replace(/^\/api\/keikyu\//, "");
  let path;
  if (suffix === "location") path = "train";
  else if (/^timetable\/(8201|8401|8301|8601|8501)-[01]-[a-z0-9-]{1,24}$/i.test(suffix)) path = suffix.replace("timetable/", "locationTimetable/");
  else return new Response("Not found", { status: 404 });
  try {
    const upstreamUrl = "https://app-kq.net/api/" + path;
    let upstream = await fetch(upstreamUrl, {
      headers: { accept: "application/json", "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36", referer: "https://app-kq.net/web/jp/html/zaisen.html" }, signal: AbortSignal.timeout(12000),
      redirect: "manual", cf: { cacheTtl: suffix === "location" ? 15 : 60, cacheEverything: true }
    });
    if (upstream.status === 403) {
      upstream = await fetch("https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=" + encodeURIComponent(upstreamUrl), {
        signal: AbortSignal.timeout(12000), redirect: "manual",
        cf: { cacheTtl: suffix === "location" ? 15 : 60, cacheEverything: true }
      });
    }
    if (!upstream.ok) throw Object.assign(new Error("upstream"), { upstreamStatus: upstream.status });
    const data = await upstream.json();
    if (suffix === "location" ? !Array.isArray(data) : !data.info || !Array.isArray(data.stations)) throw new Error("format");
    return Response.json(data, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return Response.json({ error: "Keikyu data temporarily unavailable", upstreamStatus: error.upstreamStatus || null }, { status: 502 });
  }
}
