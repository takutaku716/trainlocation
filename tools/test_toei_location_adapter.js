const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const adapter = require("../js/toei_location_adapter.js");
const { routes } = require("../js/toei_routes.js");
const now = Date.parse("2026-09-07T12:00:00Z");
const root = path.resolve(__dirname, "..");
function train(route, from, to, ascending = true, extra = {}) {
	return {
		"odpt:operator": "odpt.Operator:Toei", "odpt:railway": route.railway,
		"odpt:trainNumber": "1201", "owl:sameAs": route.railway + ".1201",
		"odpt:railDirection": ascending ? route.ascending : route.descending,
		"odpt:fromStation": from.id, "odpt:toStation": to ? to.id : null,
		"odpt:trainType": "odpt.TrainType:Toei.Local", "odpt:delay": 125,
		"odpt:destinationStation": [route.stations.at(-1).id],
		"dc:date": "2026-09-07T21:00:00+09:00", "dct:valid": "2026-09-07T21:05:00+09:00", ...extra
	};
}
let cases = 0;
for (const route of routes) {
	const html = fs.readFileSync(path.join(root, "rosen", `rosen_${route.rosen}.html`), "utf8");
	const slots = [...html.matchAll(/class="ressha-icon ([^"]+)"/g)].map(m => m[1]);
	assert.equal(slots.length, new Set(slots).size, "duplicate position slots");
	for (let i = 0; i < route.stations.length; i++) {
		for (const ascending of [true, false]) {
			for (const to of [null, route.stations[i + (ascending ? 1 : -1)]].filter(v => v !== undefined)) {
				const row = train(route, route.stations[i], to, ascending);
				const result = adapter.normalize([row], { rosen: route.rosen, now });
				assert.equal(result.trains.length, 1);
				const output = result.trains[0];
				assert.ok(slots.includes(output.pos), `${route.name}: missing ${output.pos}`);
				assert.ok(output.pos.endsWith(ascending ? "D" : "U"));
				assert.equal(output.chien, 2, "ODPT seconds must become minutes");
				assert.equal(output.typeLabel, "普通");
				cases++;
			}
		}
	}
	const master = JSON.parse(fs.readFileSync(path.join(root, "master/rosen_name_master.json"), "utf8"));
	assert.equal(master.filter(r => r.rosen === route.rosen).length, 1);
	for (const page of ["index.html", "location.html"]) {
		assert.ok(fs.readFileSync(path.join(root, page), "utf8").includes(`value="${route.rosen}"`));
	}
}
const route = routes[0], row = train(route, route.stations[0], route.stations[1]);
const normalize = (rows, opts = {}) => adapter.normalize(rows, { rosen: route.rosen, now, ...opts });
assert.equal(normalize([row, row]).trains.length, 1);
assert.equal(normalize([row], { now: now + 301000 }).trains.length, 0);
assert.equal(normalize([{ ...row, "dct:valid": "2026-09-07T20:59:00+09:00" }]).toei.expired, 1);
assert.equal(normalize([{ ...row, "dc:date": "invalid" }]).trains.length, 0);
assert.equal(normalize([{ ...row, "odpt:railway": routes[1].railway }]).trains.length, 0);
assert.equal(normalize([{ ...row, "odpt:railDirection": "unknown" }]).toei.unmapped, 1);
assert.equal(normalize([{ ...row, "odpt:toStation": route.stations[5].id }]).trains.length, 0);
assert.equal(normalize([{ ...row, "odpt:fromStation": "unknown" }]).trains.length, 0);
assert.throws(() => normalize({ error: "failure" }), /Invalid ODPT/);
assert.throws(() => normalize("not json"));
assert.equal(normalize([]).time.ja, "");
assert.equal(normalize([{ ...row, "odpt:delay": undefined }]).trains[0].toei.delayKnown, false);
assert.equal(normalize([{ ...row, "odpt:delay": -60 }]).trains[0].chien, 0);
assert.equal(normalize([{ ...row, "odpt:destinationStation": ["odpt.Station:Keikyu.Airport.HanedaAirportTerminal1and2"] }]).trains[0].shuEkiName, "羽田空港第1・第2ターミナル");
assert.equal(normalize([{ ...row, "odpt:destinationStation": ["unknown"] }]).trains[0].shuEkiName, "行先取得不可");
assert.equal(normalize([{ ...row, "odpt:trainType": "odpt.TrainType:Toei.AirportRapidLimitedExpress" }]).trains[0].typeLabel, "エアポート快特");
assert.equal(adapter.stationPosition(routes[3], routes[3].stations[0], "D"), "TOEI143P29D");
async function main() {
	const originalFetch = global.fetch;
	let calls = 0;
	global.fetch = async () => { calls++; throw new Error("network unavailable"); };
	assert.equal((await adapter.load("145")).toei.live, false);
	assert.equal(calls, 0, "unsupported route must not request an empty feed");
	await assert.rejects(adapter.load("140"), /network unavailable/);
	global.fetch = async () => ({ ok: false, status: 503 });
	await assert.rejects(adapter.load("140"), /503/);
	global.fetch = originalFetch;
	console.log(`Toei: ${cases} station/direction/section cases and edge cases passed.`);
	if (process.argv.includes("--live")) {
		for (const route of routes) {
			const result = await adapter.load(route.rosen);
			const html = fs.readFileSync(path.join(root, "rosen", `rosen_${route.rosen}.html`), "utf8");
			for (const t of result.trains) assert.ok(html.includes(`ressha-icon ${t.pos}"`), t.pos);
			assert.equal(result.toei.unmapped, 0, route.name + " has unmapped live trains");
			console.log(`${route.name}: ${result.trains.length} trains; expired=${result.toei.expired}; live=${result.toei.live}`);
		}
	}
}
main().catch(error => { console.error(error); process.exitCode = 1; });
