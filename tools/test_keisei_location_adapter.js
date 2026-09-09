"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const adapter = require("../js/keisei_location_adapter.js");
const master = require("../js/keisei_master.js");
const raw = require("../testdata/keisei/traffic_info.json");
const dt = raw.UP[0].dt[0];
const now = Date.parse(`${dt.yy}-${dt.mt}-${dt.dy}T${dt.hh}:${dt.mm}:${dt.ss}+09:00`);
assert.equal(master.routes.length, 7);
for (const route of master.routes) {
  const html = fs.readFileSync(`rosen/rosen_${route.rosen}.html`, "utf8");
  for (const pos of Object.values(route.positions)) assert.ok(html.includes(pos.key), pos.key);
  for (const station of route.stations) assert.ok(html.includes(station.name));
  const data = adapter.normalize(raw, route.rosen, now);
  for (const train of data.trains) {
    assert.ok(html.includes(train.pos));
    assert.equal(train.source, "keisei");
  }
  assert.equal(adapter.normalize(raw, route.rosen, now + 301000).trains.length, 0);
}
const main = adapter.normalize(raw, "152", now).trains;
assert.ok(main.some(t => t.cbango === "24B19" && t.pos === "KEISEI152P4_5D"));
assert.ok(main.some(t => t.cbango === "23A13" && t.typeLabel === "快速" && t.keisei.typeSimple === "快"));
const fixture = { UP: raw.UP, TS: [{ id: "E027", tr: [{ no: "fixture", hk: "1", bs: "3", ik: "41", sy: "0", dl: "0", sr: "8" }] }], EK: [] };
for (const [code, short] of [["0", "？"], ["1", "？"], ["2", "？"], ["16", "？"], ["6", "普"], ["4", "特"], ["5", "急"], ["10", "快"], ["13", "快特"], ["3", "通特"], ["17", "ア特"], ["999", "？"]]) {
  fixture.TS[0].tr[0].sy = code;
  const train = adapter.normalize(fixture, "152", now).trains[0];
  assert.equal(train.keisei.typeSimple, short);
  assert.equal(train.keisei.pendingIcon, short === "？");
}
const matsudo = adapter.normalizeMatsudo(require("../testdata/keisei/matsudo_train_info.json"), require("../testdata/keisei/matsudo_date.json"), { st: "0" }, now);
assert.ok(matsudo.trains.some(t => t.cbango === "508" && t.pos.endsWith("U")));
assert.ok(matsudo.trains.some(t => t.cbango === "725" && t.pos.endsWith("D")));
assert.throws(() => adapter.normalize({ ...raw, UP: [{ st: "1", dt: [dt] }] }, "152", now));
const timetable = adapter.normalizeDetail({ dy: [
  { st: "1", ht: "24:21", tt: "-", pa: "0" },
  { st: "3", ht: "24:25", tt: "24:24", pa: "0" },
  { st: "4", ht: "24:27", tt: "24:27", pa: "1" },
  { st: "11", ht: "-", tt: "24:41", pa: "0" }
] });
assert.equal(timetable.length, 3);
assert.equal(timetable[0].planDeparture, "24:21");
assert.equal(timetable.at(-1).planArrival, "24:41");
assert.equal(timetable.at(-1).planDeparture, "");
const css = fs.readFileSync("css/keikyu_train_icons.css", "utf8");
assert.equal(css.match(/data-source="keisei"/g).length, 7);
assert.ok(css.includes('data-ressha_type_name="快速特急"'));
for (const file of ["index.html", "location.html"]) {
  const html = fs.readFileSync(file, "utf8");
  for (const route of master.routes) assert.ok(html.includes(`value="${route.rosen}"`));
}
console.log("Keisei: seven routes, anchors, freshness, directions, pending icons, timetables, shared styles passed.");
