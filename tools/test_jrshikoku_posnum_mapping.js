"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const adapter = require("../js/jrshikoku_location_adapter.js");
const positionMap = require("../js/jrshikoku_position_map.js");

const csvPath = path.join(__dirname, "..", "original", "SikokuPos", "jrshikoku_gui_collector", "Pos_PosNum_Direction_Line.csv");
const rows = fs.readFileSync(csvPath, "utf8").trim().split(/\r?\n/).slice(1).map(function(line) {
	const columns = line.split(",");
	return { pos: columns[0], posNum: columns[1], direction: columns[2], line: columns[3] };
});

const namesByKey = new Map();
rows.forEach(function(row) {
	const key = row.line + ":" + row.posNum;
	if (!namesByKey.has(key)) namesByKey.set(key, new Set());
	namesByKey.get(key).add(row.pos);
});
assert.strictEqual(namesByKey.size, 644);
namesByKey.forEach(function(names, key) {
	assert.strictEqual(names.size, 1, key + " must identify exactly one Pos name");
	assert.ok(positionMap.records[key], key + " must exist in the generated map");
});

function normalize(row, senku, lineId) {
	return adapter.normalize([
		{ GetDateTime: "2026/08/20 12:00:00" },
		Object.assign({ TrainNum: "9000D", Direction: 0, Type: "normal", delay: 0 }, row)
	], [], { senku: senku, lineId: lineId });
}

// Pos is deliberately wrong: the projection must still be selected only by Line + PosNum.
const wrongPos = normalize({ Line: "yosan", PosNum: 296, Pos: "存在しない地点名" }, "73", "yosan");
assert.strictEqual(wrongPos.trains.length, 1);
assert.strictEqual(wrongPos.trains[0].pos, "JSP_yosan_296");
assert.strictEqual(wrongPos.trains[0].posName, "鬼無");
assert.strictEqual(wrongPos.trains[0].jrShikoku.renderPosition, "JSYY02U");
assert.strictEqual(wrongPos.trains[0].jrShikoku.rawPosition, "存在しない地点名");

assert.notStrictEqual(
	adapter.buildSourcePositionKey("yosan", 101),
	adapter.buildSourcePositionKey("uwajima", 101),
	"PosNum alone must not identify a location"
);

const sharedUwajima = normalize({ Line: "uwajima", PosNum: 33, Pos: "unused" }, "76", "uwajima").trains[0];
const sharedIyonada = normalize({ Line: "uwajima", PosNum: 33, Pos: "unused" }, "77", "uwajima2").trains[0];
assert.strictEqual(sharedUwajima.pos, sharedIyonada.pos);
assert.strictEqual(sharedUwajima.jrShikoku.renderPosition, "JSUDEPOT33U");
assert.strictEqual(sharedIyonada.jrShikoku.renderPosition, "JSSDEPOT33U");

const matsuyama250 = normalize({ Line: "uwajima", PosNum: 250 }, "76", "uwajima").trains[0];
const matsuyama252 = normalize({ Line: "uwajima", PosNum: 252 }, "76", "uwajima").trains[0];
assert.notStrictEqual(matsuyama250.pos, matsuyama252.pos);
assert.strictEqual(matsuyama250.jrShikoku.renderPosition, matsuyama252.jrShikoku.renderPosition);

const iyoWaka92 = normalize({ Line: "uwajima", PosNum: 92 }, "77", "uwajima2").trains[0];
const iyoWaka213 = normalize({ Line: "uwajima", PosNum: 213 }, "77", "uwajima2").trains[0];
assert.strictEqual(iyoWaka92.jrShikoku.renderPosition, "JSSIYOWAKA92U");
assert.strictEqual(iyoWaka213.jrShikoku.renderPosition, "JSSIYOWAKA213U");

assert.strictEqual(normalize({ Line: "tokushima", PosNum: 668 }, "81", "tokushima").trains.length, 0);
assert.strictEqual(normalize({ Line: "yosan", PosNum: 233 }, "64", "seto").trains.length, 0);
assert.strictEqual(normalize({ Line: "yosan", PosNum: 235 }, "64", "seto").trains.length, 0);

[
	["uwajima", 184, "76", "uwajima", "JSUYODO184U"],
	["dosan", 178, "78", "dosan", "JSDNAHARI178U"],
	["dosan", 199, "78", "dosan", "JSDKDEPOT199U"],
	["yosan", 295, "73", "yosan", "JSYV295"],
	["yosan", 346, "73", "yosan", "JSYFT346"],
	["dosan", 70, "81", "tokushima", "JSBB23_B24U"]
].forEach(function(testCase) {
	const train = normalize({ Line: testCase[0], PosNum: testCase[1] }, testCase[2], testCase[3]).trains[0];
	assert.ok(train, testCase.slice(0, 2).join(":"));
	assert.strictEqual(train.jrShikoku.renderPosition, testCase[4]);
});

console.log("JR Shikoku Line + PosNum mapping tests passed.");
