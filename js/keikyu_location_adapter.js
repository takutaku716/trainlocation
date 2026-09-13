(function(root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./keikyu_routes.js"), require("./keikyu_position_map.js"));
  else root.KeikyuLocationAdapter = factory(root.KeikyuRoutes, root.KeikyuPositionMap);
}(typeof self !== "undefined" ? self : this, function(catalog, positions) {
  "use strict";
  const API = typeof location !== "undefined" && location.hostname.endsWith("github.io")
    ? "https://trainlocation-odpt-proxy.densha716.workers.dev/api/keikyu/web/" : "/api/keikyu/";
  // Use the public web client's lookup, including its line_code assignments.
  const PREFIXES = ["9999", "8201", "8401", "8301", "8601", "8501"];
  const TYPES = { 1: "快特", 2: "特急", 3: "急行", 4: "普通", 6: "エアポート快特", 12: "ウィング" };
  const SHORT = { 1: "快特", 2: "特", 3: "急", 4: "普", 6: "エ快", 12: "W" };
  const detailCache = new Map();
  const detailQueue = [];
  let activeDetails = 0;
  function destinationShort(name) {
    const text = String(name || "").normalize("NFKC");
    const names = { "羽田空港第1・第2ターミナル": "羽", "羽田空港第3ターミナル": "羽",
      "京急久里浜": "久", "京急川崎": "川", "金沢文庫": "文", "金沢八景": "八",
      "神奈川新町": "新", "三崎口": "三", "三浦海岸": "海", "逗子・葉山": "逗",
      "京成高砂": "高", "京成成田": "成", "成田空港": "空", "印旛日本医大": "医", "印西牧の原": "牧" };
    return names[text] || Array.from(text)[0] || "？";
  }
  function getCachedDetail(key) {
    const entry = detailCache.get(key);
    return entry && entry.expires > Date.now() ? entry.value : null;
  }
  function routeFor(rosen) { return catalog.routes.find(r => r.rosen === String(rosen)); }
  function positionFor(row, route) {
    const record = positions[row.position];
    const projection = record && record.projections[route.rosen];
    if (!projection) return null;
    const direction = projection.direction || (String(row.direction) === "1" ? "D" : String(row.direction) === "2" ? "U" : record.side === 0 ? "U" : "D");
    return { key: projection.base + direction, name: projection.name, record };
  }
  function normalize(raw, options) {
    const settings = options || {};
    const route = routeFor(settings.rosen);
    if (!route) throw new Error("Unknown Keikyu railway");
    const rows = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(rows)) throw new Error("Invalid Keikyu train response");
    const now = settings.now == null ? Date.now() : Number(settings.now);
    let expired = 0, unmapped = 0;
    const timestamps = [], trains = [];
    const seen = new Set();
    for (const row of rows) {
      if (!row || typeof row !== "object") continue;
      if (!positions[row.position]) { unmapped++; continue; }
      const position = positionFor(row, route);
      if (!position) continue;
      const timestamp = Date.parse(String(row.receive_datetime || "").replace(" ", "T") + "+09:00");
      if (!Number.isFinite(timestamp) || now - timestamp > 300000 || timestamp > now + 60000) { expired++; continue; }
      timestamps.push(timestamp);
      const number = String(row.train_no || "");
      if (!/^[a-z0-9-]{1,24}$/i.test(number)) continue;
      const id = [row.position, number, row.direction, row.platform].join(":");
      if (seen.has(id)) continue;
      seen.add(id);
      const typeLabel = TYPES[row.train_kind] || "種別不明";
      const detailKey = ["1", "2"].includes(String(row.direction)) && number !== "0"
        ? PREFIXES[position.record.line_code] + "-" + (Number(row.direction) - 1) + "-" + number : "";
      const detail = getCachedDetail(detailKey);
      trains.push({ cbango: number, displayTrainNumber: number === "0" ? "" : number,
        type: "3", typeLabel, name: typeLabel === "普通" ? "普通列車" : typeLabel,
        pos: position.key, posName: position.name, chien: Math.max(0, Number(row.late_minutes) || 0),
        shuEkiSimple: detail && detail.destination ? destinationShort(detail.destination) : "？",
        shuEkiName: detail && detail.destination || "行先取得不可", shuEkiKey: "", ryosu: detail ? parseInt(detail.cars.normalize("NFKC"), 10) || "" : "",
        status: "1", statusDetail: "", senku: route.rosen, source: "keikyu", sourceRosen: route.rosen,
        keikyu: { id, detailKey, platform: String(row.platform || ""), delayKnown: row.late_minutes != null,
          typeSimple: SHORT[row.train_kind] || "？", isAlert: Number(row.is_alert) === 1 }
      });
    }
    const result = { trains, time: { ja: "", en: "", tc: "", sc: "", kr: "" }, keikyu: { expired, unmapped, live: true } };
    if (timestamps.length) {
      const timestamp = Math.min(...timestamps);
      const date = new Date(timestamp + 9 * 3600000).toISOString();
      const text = date.slice(0, 10).replace(/-/g, "/") + " " + date.slice(11, 19) + " 現在";
      result.time = { ja: text, en: text, tc: text, sc: text, kr: text };
      result.sourceTimes = [{ rosen: route.rosen, text, timestamp }];
    }
    return result;
  }
  async function request(path) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(API + path, { signal: controller.signal, cache: "no-store" });
      if (!response.ok) throw new Error("Keikyu HTTP " + response.status);
      return await response.json();
    } finally { clearTimeout(timeout); }
  }
  async function load(rosen) { return normalize(await request("location"), { rosen }); }
  function normalizeDetail(raw) {
    if (!raw || !raw.info || !Array.isArray(raw.stations)) throw new Error("Invalid Keikyu timetable response");
    const stops = raw.stations.filter(s => s && Number(s.isSkip) !== 1);
    const car = stops.find(s => s.numberOfCars);
    return { destination: String(raw.info.to || ""), cars: car ? String(car.numberOfCars) : "",
      timetable: stops.map(s => ({ stationName: String(s.stationName || ""),
        planArrival: String(s.arrival || ""), planDeparture: String(s.departure || "") })) };
  }
  async function loadDetail(key) {
    if (!/^(8201|8401|8301|8601|8501)-[01]-[a-z0-9-]{1,24}$/i.test(key)) return null;
    const cached = detailCache.get(key);
    if (cached && cached.expires > Date.now()) return cached.promise;
    for (const [oldKey, entry] of detailCache) {
      if (entry.expires <= Date.now()) detailCache.delete(oldKey);
    }
    const entry = { expires: Infinity, value: null, promise: null };
    entry.promise = new Promise(resolve => detailQueue.push({ key, entry, resolve }));
    detailCache.set(key, entry);
    drainDetails();
    return entry.promise;
  }
  function drainDetails() {
    while (activeDetails < 3 && detailQueue.length) {
      const { key, entry, resolve } = detailQueue.shift();
      activeDetails++;
      request("timetable/" + encodeURIComponent(key)).then(normalizeDetail).catch(() => null).then(detail => {
        entry.value = detail;
        entry.expires = Date.now() + (detail ? 60000 : 30000);
        resolve(detail);
      }).finally(() => { activeDetails--; drainDetails(); });
    }
  }
  return { routeFor, positionFor, normalize, load, normalizeDetail, loadDetail, getCachedDetail, destinationShort };
}));
