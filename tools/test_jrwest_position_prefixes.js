const assert = require("assert");
const fs = require("fs");
const path = require("path");

const adapter = require("../js/jrwest_location_adapter.js");

const ROOT = path.resolve(__dirname, "..");
const PREFIX = "JW61";

const stationJson = {
	stations: [
		{ info: { code: "0382", name: "米原", notDisplayType: 0 } },
		{ info: { code: "0384", name: "彦根", notDisplayType: 0 } }
	]
};

const options = {
	senku: "61",
	lineId: "hokurikubiwako",
	positionPrefix: PREFIX,
	stationCodes: ["0382", "0384"]
};

function normalizeTrain(pos, direction) {
	return adapter.normalize(
		{
			update: "2026-08-13T12:00:00+09:00",
			trains: [{
				no: "TEST1M",
				pos,
				direction,
				type: "04",
				dest: { text: "京都", code: "0402" }
			}]
		},
		stationJson,
		{},
		"2026-08-13T12:00:00+09:00",
		options
	).trains[0];
}

assert.strictEqual(normalizeTrain("0382", 1).pos, "JW610382D");
assert.strictEqual(normalizeTrain("0382", 0).pos, "JW610382U");
assert.strictEqual(normalizeTrain("0382_0384", 1).pos, "JW610382_0384D");
assert.strictEqual(normalizeTrain("0382_0384", 0).pos, "JW610382_0384U");

const html = fs.readFileSync(path.join(ROOT, "rosen", "rosen_61.html"), "utf8");
assert(html.includes("JW610382D"), "rosen_61 is missing the dedicated Miibara position key");
assert(!/\bJW0\d/.test(html), "rosen_61 still contains a shared generic JR West position key");

const locationMaster = JSON.parse(
	fs.readFileSync(path.join(ROOT, "original", "location_master.json"), "utf8")
);
assert.strictEqual(locationMaster.JW610382D, "米原");
assert.strictEqual(locationMaster.JW610382U, "米原");
assert.strictEqual(locationMaster.JW610382_0384D, "米原→彦根 間");
assert.strictEqual(locationMaster.JW610382_0384U, "彦根→米原 間");

console.log("JR West page 61 position prefixes: OK");
