(function(root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.TxLocationAdapter = factory();
}(typeof self !== "undefined" ? self : this, function() {
  "use strict";
  const stations = ["秋葉原", "新御徒町", "浅草", "南千住", "北千住", "青井", "六町", "八潮", "三郷中央", "南流山", "流山セントラルパーク", "流山おおたかの森", "柏の葉キャンパス", "柏たなか", "守谷", "みらい平", "みどりの", "万博記念公園", "研究学園", "つくば"].map((name, i) => ({ id: i + 11, index: i + 1, name }));
  const route = { rosen: "151", name: "つくばエクスプレス", stations };
  const kinds = { 1: ["普通", "普"], 2: ["区間快速", "区快"], 3: ["区間快速", "区快"], 4: ["快速", "快"], 5: ["快速", "快"], 6: ["新快速", "新快"], 7: ["特別快速", "特快"], 8: ["特別快速", "特快"], 9: ["団体", "団"], 10: ["回送", "回"], 11: ["回送", "回"], 12: ["試運転", "試"], 13: ["通勤快速", "通快"], 14: ["通勤快速", "通快"], 15: ["通勤快速", "通快"] };
  const PROXY = "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=";
  let current = null;
  let pendingLoad = null;
  let operationStatus = null;
  const detailCache = new Map();
  function routeFor(id) { return String(id) === route.rosen ? route : null; }
  function stationName(id) { return stations.find(s => s.id === Number(id))?.name || "行先不明"; }
  function fleet(number) {
    const n = Number(number);
    if (n >= 1 && n <= 14) return { name: "TX-1000系", style: "tx1000" };
    if ((n >= 67 && n <= 70) || (n >= 72 && n <= 73)) return { name: "TX-2000系（増備車）", style: "tx2000-zoubi" };
    if (n >= 81 && n <= 85) return { name: "TX-3000系", style: "tx3000" };
    return { name: "TX-2000系", style: "tx2000" };
  }
  function dateFor(updatedAt) {
    if (updatedAt == null || !Number.isFinite(Number(updatedAt)) || Number(updatedAt) <= 0) throw new Error("TX更新日時が不正です。");
    return new Date(Number(updatedAt) * 1000 + 9 * 3600000).toISOString().slice(0, 10);
  }
  function positionFor(train) {
    if (!train || !["up", "down"].includes(train.direction)) return null;
    const dir = train.direction === "up" ? "U" : "D";
    const station = stations.find(s => s.id === Number(train.station_id));
    if (!station) return null;
    if (train.next_station_id === null) return { key: "TX151P" + station.index + dir, name: station.name };
    if (train.next_station_id == null) return null;
    // Official sift belongs to the interval immediately before its reference station.
    const reference = Number(train.next_station_id) + (dir === "U" ? 1 : 0);
    const upper = stations.find(s => s.id === reference - 1);
    const lower = stations.find(s => s.id === reference);
    if (!upper || !lower) return null;
    return { key: "TX151P" + upper.index + "_" + lower.index + dir,
      name: (dir === "U" ? lower.name + "→" + upper.name : upper.name + "→" + lower.name) + " 間" };
  }
  function normalize(raw) {
    if (!raw || !Array.isArray(raw.trains)) throw new Error("TX在線データの形式が不正です。");
    const date = dateFor(raw.updated_at);
    const seen = new Set();
    let unmapped = 0;
    const trains = raw.trains.flatMap(train => {
      const pos = positionFor(train);
      const number = String(train?.train_number || "");
      if (!pos || !/^\d{1,12}$/.test(number)) { unmapped++; return []; }
      if (seen.has(number)) return [];
      seen.add(number);
      const type = kinds[train.train_kind_id] || ["種別不明", "？"];
      const labelColor = type[0] === "区間快速" ? "3" : ["快速", "通勤快速"].includes(type[0]) ? "2" : "";
      const vehicle = fleet(train.train_orchestration_number);
      const destination = stationName(train.destination_station_id);
      return [{ cbango: number, displayTrainNumber: number, type: "3", typeLabel: type[0], name: type[0] + "列車",
        pos: pos.key, posName: pos.name, chien: Math.max(0, Math.floor(Number(train.delay) / 60) || 0),
        shuEkiSimple: destination === "行先不明" ? "？" : Array.from(destination)[0], shuEkiName: destination, shuEkiKey: "",
        ryosu: Math.max(0, Number(train.train_length_id) || 0), status: "1", statusDetail: "", senku: route.rosen, source: "tx", sourceRosen: route.rosen,
        tx: { typeSimple: type[1], labelColor, fleet: vehicle.name, style: vehicle.style, date, position: train.position } }];
    });
    const text = new Date(Number(raw.updated_at) * 1000 + 9 * 3600000).toISOString().slice(0, 19).replace("T", " ") + " 現在";
    return { trains, time: Object.fromEntries(["ja", "en", "tc", "sc", "kr"].map(lang => [lang, text])),
      sourceTimes: [{ rosen: route.rosen, text, timestamp: Number(raw.updated_at) * 1000 }], tx: { unmapped } };
  }
  function apiUrl(path) {
    const allowed = /^(tid\/trains\.json|status\.json|stop_stations\/\d{4}-\d{2}-\d{2}\/\d{1,12}\.json)$/;
    if (!allowed.test(path)) throw new Error("Invalid TX path");
    // GitHub Pages has no server functions; reuse the existing production CORS proxy.
    if (typeof location !== "undefined" && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return "/api/tx/" + path;
    return PROXY + encodeURIComponent("https://external-data.tx-app.com/" + path + (path === "status.json" ? "" : "?" + Date.now()));
  }
  async function getJson(path) {
    const response = await fetch(apiUrl(path), { signal: AbortSignal.timeout(15000), cache: "no-store" });
    if (!response.ok) throw new Error("TXデータを取得できませんでした（" + response.status + "）。");
    return response.json();
  }
  function load() {
    if (!pendingLoad) pendingLoad = loadFresh().finally(() => { pendingLoad = null; });
    return pendingLoad;
  }
  async function loadFresh() {
    try {
      const raw = await getJson("tid/trains.json");
      const data = normalize(raw);
      current = raw;
      try {
        const status = await getJson("status.json");
        if (!status || status.error || typeof status.message !== "string") throw new Error("Invalid TX status");
        operationStatus = status;
      } catch (_) { operationStatus = null; }
      return data;
    } catch (error) { current = null; operationStatus = null; throw error; }
  }
  function normalizeDetail(raw) {
    if (!Array.isArray(raw)) throw new Error("TX時刻表の形式が不正です。");
    return raw.filter(row => row && typeof row.name === "string").map((row, index, rows) => ({
      stationName: row.name.replace(/[（〔][^）〕]*[）〕]/g, "").trim(),
      planArrival: index === rows.length - 1 && typeof row.arrival === "string" ? row.arrival : "",
      planDeparture: index !== rows.length - 1 && typeof row.departure === "string" ? row.departure : ""
    }));
  }
  async function loadDetail(number) {
    const train = current?.trains.find(row => row && String(row.train_number) === String(number));
    if (!train) throw new Error("現在の在線データに列車がありません。再取得してください。");
    const key = dateFor(current.updated_at) + "/" + train.train_number;
    const cached = detailCache.get(key);
    if (cached && cached.expires > Date.now()) return cached.promise;
    const promise = getJson("stop_stations/" + key + ".json").then(normalizeDetail).catch(error => { detailCache.delete(key); throw error; });
    detailCache.set(key, { promise, expires: Date.now() + 60000 });
    for (const [k, value] of detailCache) if (value.expires <= Date.now()) detailCache.delete(k);
    return promise;
  }
  function getOperationNotice() {
    if (!operationStatus || operationStatus.error || Number(operationStatus.category) === 0 || operationStatus.status === "平常") return null;
    return operationStatus;
  }
  return { stations, routeFor, fleet, positionFor, dateFor, normalize, normalizeDetail, load, loadDetail, apiUrl, getOperationNotice };
}));
