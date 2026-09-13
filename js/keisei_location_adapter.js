(function(root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./keisei_master.js"));
  else root.KeiseiLocationAdapter = factory(root.KeiseiMaster);
}(typeof self !== "undefined" ? self : this, function(master) {
  "use strict";
  const shorts = { "普通": "普", "急行": "急", "特急": "特", "快速": "快", "快速特急": "快特", "通勤特急": "通特", "アクセス特急": "ア特", "スカイライナー": "S", "モーニングライナー": "M", "イブニングライナー": "E", "シティライナー": "C" };
  const pending = new Map(), detailCache = new Map();
  function routeFor(id) { return master.routes.find(r => r.rosen === String(id)); }
  function destination(code) { return master.destinations.find(d => String(d.code) === String(code)); }
  function stop(code) { return master.stops.find(d => String(d.code) === String(code)); }
  function positionFor(route, id, train) {
    if (!route || !["0", "1"].includes(String(train.hk))) return null;
    if (!id.startsWith("E")) return route.positions[id] || null;
    const prefix = id + "_" + (String(train.hk) === "0" ? "U" : "D") + train.bs + "_";
    const key = Object.keys(route.positions).find(p => p.startsWith(prefix));
    return key ? route.positions[key] : null;
  }
  function normalize(raw, id, now = Date.now()) {
    const route = routeFor(id);
    const dt = raw?.UP?.[0]?.dt?.[0];
    if (!route || !dt || raw.UP[0].st !== "0" || !Array.isArray(raw.TS) || !Array.isArray(raw.EK)) throw new Error("Invalid Keisei data");
    const date = `${dt.yy}-${dt.mt}-${dt.dy}`;
    const timestamp = Date.parse(`${date}T${dt.hh}:${dt.mm}:${dt.ss}+09:00`);
    if (!Number.isFinite(timestamp)) throw new Error("Invalid Keisei timestamp");
    const text = `${dt.yy}/${dt.mt}/${dt.dy} ${dt.hh}:${dt.mm}:${dt.ss} 現在`;
    const trains = [], seen = new Set();
    const expired = now - timestamp > 300000 || timestamp - now > 60000;
    for (const block of [...raw.TS, ...raw.EK]) for (const train of block.tr || []) {
      const pos = positionFor(route, block.id, train);
      const number = String(train.no || "");
      if (!pos || !/^[A-Za-z0-9-]{1,24}$/.test(number) || expired) continue;
      const unique = number + ":" + pos.key;
      if (seen.has(unique)) continue;
      seen.add(unique);
      const kind = master.types.find(t => String(t.code) === String(train.sy));
      const label = kind?.name || "種別不明";
      const dest = destination(train.ik);
      trains.push({ cbango: number, displayTrainNumber: number, type: "3", typeLabel: label,
        name: label.endsWith("ライナー") ? label : label + "列車", pos: pos.key, posName: pos.name,
        chien: Math.max(0, Number(train.dl) || 0), ryosu: Math.max(0, Number(train.sr) || 0),
        shuEkiSimple: dest?.name ? Array.from(dest.name)[0] : "？", shuEkiName: dest?.name || "行先不明", shuEkiKey: "",
        status: "1", statusDetail: "", senku: route.rosen, source: "keisei", sourceRosen: route.rosen,
        keisei: { typeSimple: shorts[label] || "？", pendingIcon: !shorts[label], date: date.replace(/-/g, ""), line: route.line } });
    }
    return { trains, time: Object.fromEntries(["ja", "en", "tc", "sc", "kr"].map(l => [l, text])),
      sourceTimes: [{ rosen: route.rosen, timestamp, text }], keisei: { expired } };
  }
  function normalizeMatsudo(rows, date, status, now) {
    const clock = date?.[0]?.trainPositionUpdatePK;
    if (!Array.isArray(rows) || !clock || status?.st !== "0") throw new Error("Invalid Matsudo data");
    const raw = { UP: [{ st: "0", dt: [{ yy: clock.currentdate.slice(0,4), mt: clock.currentdate.slice(4,6), dy: clock.currentdate.slice(6,8), hh: clock.currenttime.slice(0,2), mm: clock.currenttime.slice(2,4), ss: clock.currenttime.slice(4,6) }] }], TS: [], EK: [] };
    for (const row of rows) {
      const mapping = master.matsudo.find(m => Number(m.sectionid) === Number(row.trainPositionInfoPK?.sectionid));
      const dest = master.destinations.find(d => d.name === row.laststop);
      if (!mapping || !dest || (mapping.id.startsWith("E") && destination(Number(mapping.id.slice(1)))?.name === dest.name)) continue;
      const hk = mapping.hk === "99" ? (Number(row.trainno) % 2 === 0 ? "0" : "1") : mapping.hk;
      raw[mapping.id.startsWith("E") ? "TS" : "EK"].push({ id: mapping.id, tr: [{ no: row.trainno, bs: mapping.bs, hk, sy: "6", ik: dest.code, dl: row.delayminute, sr: "6" }] });
    }
    return normalize(raw, "158", now);
  }
  function apiUrl(path) {
    if (!/^(traffic_info|matsudo_date|matsudo_train_info|matsudo_status)\.json$|^diainf(?:_SK)?\/[A-Za-z0-9-]{1,24}\.json$/.test(path)) throw new Error("Invalid Keisei path");
    if (typeof location !== "undefined" && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return "/api/keisei/" + path;
    return "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=" + encodeURIComponent("https://zaisen.tid-keisei.jp/data/" + path + "?ts=" + Date.now());
  }
  async function json(path) {
    const response = await fetch(apiUrl(path), { cache: "no-store", signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error("Keisei HTTP " + response.status);
    return response.json();
  }
  function load(id) {
    const route = routeFor(id);
    if (!route) return Promise.reject(new Error("Invalid Keisei route"));
    if (!pending.has(route.rosen)) pending.set(route.rosen, (async () => {
      if (route.line !== "7") return normalize(await json("traffic_info.json"), id);
      const rows = await json("matsudo_train_info.json");
      const date = await json("matsudo_date.json");
      return normalizeMatsudo(rows, date, await json("matsudo_status.json"));
    })().finally(() => pending.delete(route.rosen)));
    return pending.get(route.rosen);
  }
  function normalizeDetail(raw) {
    if (!Array.isArray(raw?.dy)) throw new Error("Invalid Keisei timetable");
    const rows = raw.dy.filter(r => String(r.pa) === "0" && stop(r.st)?.name);
    const time = t => /^\d{1,2}:\d{2}$/.test(t || "") ? t : "";
    return rows.map((r, i) => ({ stationName: stop(r.st).name.normalize("NFKC"),
      planDeparture: i < rows.length - 1 ? time(r.ht) : "", planArrival: i === rows.length - 1 ? time(r.tt) : "" }));
  }
  function loadDetail(number, id, date) {
    const route = routeFor(id);
    if (!route || !/^[A-Za-z0-9-]{1,24}$/.test(number)) return Promise.reject(new Error("Invalid train"));
    const path = (route.line === "7" ? "diainf_SK/" : "diainf/") + number + ".json";
    const key = date + ":" + path;
    const cached = detailCache.get(key);
    if (cached && cached.expires > Date.now()) return cached.promise;
    const entry = { expires: Infinity, promise: null };
    entry.promise = json(path).then(normalizeDetail).then(rows => { entry.expires = Date.now() + 60000; return rows; }, error => { detailCache.delete(key); throw error; });
    detailCache.set(key, entry);
    if (detailCache.size > 200) detailCache.delete(detailCache.keys().next().value);
    return entry.promise;
  }
  return { routeFor, positionFor, normalize, normalizeMatsudo, normalizeDetail, load, loadDetail, apiUrl };
}));
