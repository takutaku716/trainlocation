"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const adapter = require("../js/keikyu_location_adapter.js");
const positions = require("../js/keikyu_position_map.js");
const { routes } = require("../js/keikyu_routes.js");
const rows = require("../apk解析/keikyu_web_assets/api_train.json");
const now = Date.parse("2026-09-08T11:58:00+09:00");
const normalize = (data, rosen = "146") => adapter.normalize(data, { rosen, now });
for (const route of routes) {
  const result = normalize(rows, route.rosen);
  assert.ok(result.trains.length > 0, route.name);
  assert.equal(result.keikyu.expired, 0);
  assert.equal(result.keikyu.unmapped, 0);
  const html = fs.readFileSync(path.join(__dirname, "../rosen/rosen_" + route.rosen + ".html"), "utf8");
  for (const [key, record] of Object.entries(positions)) {
    if (!record.projections[route.rosen]) continue;
    for (const direction of ["0", "1", "2"]) {
      const result = normalize([{ ...rows[0], position: key, direction }], route.rosen);
      assert.equal(result.trains.length, 1, key);
      assert.ok(html.includes(result.trains[0].pos), route.name + ": " + key + " -> " + result.trains[0].pos);
    }
  }
}
const airport = normalize([{ ...rows.find(t => t.train_no === "1054K"), position: "D012" }], "147").trains[0];
assert.equal(airport.keikyu.detailKey, "8401-0-1054K");
assert.equal(airport.typeLabel, "特急");
const alerted = normalize(rows).trains.find(t => t.cbango === "1146");
assert.equal(alerted.keikyu.detailKey, "8201-0-1146");
assert.equal(alerted.keikyu.isAlert, true);
assert.equal(airport.keikyu.isAlert, false);
assert.equal(normalize([{ ...rows[1], is_alert: "1" }]).trains[0].keikyu.isAlert, true);
assert.equal(normalize([{ ...rows[0], direction: "0", train_no: "0" }], "150").trains[0].keikyu.detailKey, "");
assert.equal(normalize([{ ...rows[1], position: "unknown" }]).keikyu.unmapped, 1);
assert.equal(adapter.normalize(rows, { rosen: "146", now: now + 600000 }).trains.length, 0);
assert.throws(() => normalize({ trains: [] }), /Invalid Keikyu/);
const detailRaw = JSON.parse(fs.readFileSync(path.join(__dirname, "../apk解析/keikyu_web_assets/locationTimetable_8401-0-1054K.json"), "utf8"));
const detail = adapter.normalizeDetail(detailRaw);
assert.ok(detail.destination.includes("羽田"));
assert.ok(detail.cars.includes("両"));
assert.ok(detail.timetable.some(s => s.planArrival || s.planDeparture));
assert.equal(adapter.normalizeDetail({ info: {}, stations: [{ stationName: "通過", isSkip: 1 }] }).timetable.length, 0);
async function testRequests() {
  const saved = global.fetch;
  let calls = 0;
  global.fetch = async url => {
    calls++;
    assert.equal(url, "/api/keikyu/timetable/8401-0-1054K");
    return Response.json(detailRaw);
  };
  try {
    await Promise.all([adapter.loadDetail("8401-0-1054K"), adapter.loadDetail("8401-0-1054K")]);
    assert.equal(calls, 1);
    assert.equal(await adapter.loadDetail("../other"), null);
  } finally { global.fetch = saved; }
  console.log("Keikyu official web: all routes, placement IDs, stale data, alerts, timetables and request cache passed.");
}
testRequests().catch(error => { console.error(error); process.exitCode = 1; });
