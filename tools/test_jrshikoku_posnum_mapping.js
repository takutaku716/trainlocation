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
assert.strictEqual(wrongPos.trains[0].pos, "JSP_yosan_296_U");
assert.strictEqual(wrongPos.trains[0].posName, "鬼無");
assert.strictEqual(wrongPos.trains[0].jrShikoku.renderPosition, "JSYY02U");
assert.strictEqual(wrongPos.trains[0].jrShikoku.rawPosition, "存在しない地点名");

assert.notStrictEqual(
	adapter.buildSourcePositionKey("yosan", 101, "U"),
	adapter.buildSourcePositionKey("uwajima", 101, "U"),
	"PosNum alone must not identify a location"
);

const sharedUwajima = normalize({ Line: "uwajima", PosNum: 33, Pos: "unused" }, "76", "uwajima").trains[0];
const sharedIyonada = normalize({ Line: "uwajima", PosNum: 33, Pos: "unused" }, "77", "uwajima2").trains[0];
assert.strictEqual(sharedUwajima.pos, sharedIyonada.pos);
assert.strictEqual(sharedUwajima.jrShikoku.renderPosition, "JSUDEPOT33U");
assert.strictEqual(sharedIyonada.jrShikoku.renderPosition, "JSSDEPOT33U");

[
	[30, 0, "76", "uwajima", "JSUDEPOT30U"],
	[30, 0, "77", "uwajima2", "JSSDEPOT30U"],
	[31, 0, "76", "uwajima", "JSUDEPOT31U"],
	[31, 1, "76", "uwajima", "JSUDEPOT31D"],
	[31, 0, "77", "uwajima2", "JSSDEPOT31U"],
	[31, 1, "77", "uwajima2", "JSSDEPOT31D"],
	[32, 0, "76", "uwajima", "JSUDEPOT32"],
	[32, 1, "76", "uwajima", "JSUDEPOT32"],
	[32, 0, "77", "uwajima2", "JSSDEPOT32"],
	[32, 1, "77", "uwajima2", "JSSDEPOT32"]
].forEach(function(testCase) {
	const train = normalize({ Line: "uwajima", PosNum: testCase[0], Direction: testCase[1] }, testCase[2], testCase[3]).trains[0];
	assert.ok(train, "uwajima:" + testCase[0] + " route " + testCase[2]);
	assert.strictEqual(train.jrShikoku.renderPosition, testCase[4]);
});

const matsuyama250 = normalize({ Line: "uwajima", PosNum: 250 }, "76", "uwajima").trains[0];
const matsuyama252 = normalize({ Line: "uwajima", PosNum: 252 }, "76", "uwajima").trains[0];
assert.notStrictEqual(matsuyama250.pos, matsuyama252.pos);
assert.strictEqual(matsuyama250.jrShikoku.renderPosition, matsuyama252.jrShikoku.renderPosition);

[
	[87, "76", "uwajima", "JSUWAKA87U"],
	[92, "76", "uwajima", "JSUWAKA92U"],
	[92, "77", "uwajima2", "JSSWAKA92U"],
	[213, "77", "uwajima2", "JSSWAKA213U"]
].forEach(function(testCase) {
	const train = normalize({ Line: "uwajima", PosNum: testCase[0] }, testCase[1], testCase[2]).trains[0];
	assert.ok(train, "uwajima:" + testCase[0] + " route " + testCase[1]);
	assert.strictEqual(train.jrShikoku.renderPosition, testCase[3]);
});
assert.strictEqual(normalize({ Line: "uwajima", PosNum: 87 }, "77", "uwajima2").trains.length, 0);

const tokushimaOutbound = normalize({ Line: "tokushima", PosNum: 497, Direction: 0 }, "81", "tokushima").trains[0];
const tokushimaInbound = normalize({ Line: "tokushima", PosNum: 497, Direction: 1 }, "81", "tokushima").trains[0];
assert.strictEqual(tokushimaOutbound.jrShikoku.renderPosition, "JSBT00_B01D");
assert.strictEqual(tokushimaInbound.jrShikoku.renderPosition, "JSBT00_B01U");
assert.strictEqual(normalize({ Line: "koutoku", PosNum: 496, Direction: 1 }, "81", "tokushima").trains[0].jrShikoku.renderPosition, "JSBT00_B01U");
assert.strictEqual(normalize({ Line: "tokushima", PosNum: 497, Direction: 0 }, "80", "koutoku").trains[0].jrShikoku.renderPosition, "JSTT01_T00U");
assert.strictEqual(normalize({ Line: "tokushima", PosNum: 497, Direction: 0 }, "82", "naruto").trains[0].jrShikoku.renderPosition, "JSNT01_T00U");

const duplicateSharedTrain = adapter.normalize([
	{ GetDateTime: "2026/08/20 12:00:00" },
	{ TrainNum: "487D", Line: "koutoku", PosNum: 495, Pos: "佐古", Direction: 0, Type: "normal", delay: 0 },
	{ TrainNum: "487D", Line: "tokushima", PosNum: 495, Pos: "佐古", Direction: 0, Type: "normal", delay: 0 }
], [{ "487D": "徳島,発,11:00#佐古,発,11:05#穴吹,着,12:00#" }], { senku: "81", lineId: "tokushima" });
assert.strictEqual(duplicateSharedTrain.trains.length, 1);
assert.strictEqual(duplicateSharedTrain.trains[0].jrShikoku.sourceLine, "tokushima");

const duplicateKoutokuYosanTrain = adapter.normalize([
	{ GetDateTime: "2026/08/20 12:00:00" },
	{ TrainNum: "3033D", Line: "yosan", PosNum: 410, Pos: "屋島", Direction: 1, Type: "express", delay: 0 },
	{ TrainNum: "3033D", Line: "koutoku", PosNum: 420, Pos: "木太町～屋島", Direction: 1, Type: "express", delay: 0 }
], [{ "3033D": "高松,発,11:00#屋島,発,11:15#徳島,着,12:10#" }], { senku: "80", lineId: "koutoku" });
assert.strictEqual(duplicateKoutokuYosanTrain.trains.length, 1);
assert.strictEqual(duplicateKoutokuYosanTrain.trains[0].jrShikoku.sourceLine, "koutoku");

const locationMaster = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "original", "location_master.json"), "utf8"));
Object.keys(positionMap.records).forEach(function(key) {
	const record = positionMap.records[key];
	["U", "D"].forEach(function(direction) {
		assert.ok(locationMaster[adapter.buildSourcePositionKey(record.line, record.posNum, direction)], "location_master " + key + " " + direction);
	});
});
assert.strictEqual(locationMaster.JSP_uwajima_87_D, "新谷→伊予若宮 間");
assert.strictEqual(locationMaster.JSP_uwajima_87_U, "伊予若宮→新谷 間");
assert.strictEqual(locationMaster.JSP_uwajima_92_D, "伊予若宮→伊予大洲 間");
assert.strictEqual(locationMaster.JSP_uwajima_92_U, "伊予大洲→伊予若宮 間");
assert.strictEqual(locationMaster.JSP_uwajima_213_D, "伊予白滝→伊予若宮 間");
assert.strictEqual(locationMaster.JSP_uwajima_213_U, "伊予若宮→伊予白滝 間");
assert.strictEqual(locationMaster.JSP_uwajima_33_U, "松山運転所→北伊予 入出区線 間");
assert.strictEqual(locationMaster.JSP_uwajima_33_D, "北伊予 入出区線→松山運転所 間");
assert.strictEqual(locationMaster.JSP_uwajima_184_U, "北宇和島→宮野下方 間");
assert.strictEqual(locationMaster.JSP_uwajima_184_D, "宮野下方→北宇和島 間");
assert.strictEqual(locationMaster.JSP_dosan_178_U, "後免→なはり方 間");
assert.strictEqual(locationMaster.JSP_dosan_178_D, "なはり方→後免 間");
assert.strictEqual(locationMaster.JSP_dosan_199_U, "土佐一宮→運転所方 間");
assert.strictEqual(locationMaster.JSP_dosan_199_D, "運転所方→土佐一宮 間");
assert.strictEqual(locationMaster.JSP_yosan_295_U, "鬼無仮想窓");
assert.strictEqual(locationMaster.JSP_yosan_295_D, "鬼無仮想窓");
assert.strictEqual(locationMaster.JSP_yosan_346_U, "鬼無→高松（タ） 間");
assert.strictEqual(locationMaster.JSP_yosan_346_D, "高松（タ）→鬼無 間");

assert.strictEqual(normalize({ Line: "tokushima", PosNum: 668 }, "81", "tokushima").trains.length, 0);
assert.strictEqual(normalize({ Line: "yosan", PosNum: 233 }, "64", "seto").trains.length, 0);
assert.strictEqual(normalize({ Line: "yosan", PosNum: 235 }, "64", "seto").trains.length, 0);

[
	["uwajima", 184, "76", "uwajima", "JSUYODO184U"],
	["dosan", 178, "78", "dosan", "JSDNAHARI178U"],
	["dosan", 199, "78", "dosan", "JSDKDEPOT199U"],
	["yosan", 295, "73", "yosan", "JSYV295D"],
	["yosan", 346, "73", "yosan", "JSYFT346U"],
	["dosan", 70, "81", "tokushima", "JSBB23_B24U"]
].forEach(function(testCase) {
	const train = normalize({ Line: testCase[0], PosNum: testCase[1] }, testCase[2], testCase[3]).trains[0];
	assert.ok(train, testCase.slice(0, 2).join(":"));
	assert.strictEqual(train.jrShikoku.renderPosition, testCase[4]);
});

assert.strictEqual(
	normalize({ Line: "yosan", PosNum: 346, Direction: 1 }, "73", "yosan").trains[0].jrShikoku.renderPosition,
	"JSYFT346D"
);
assert.strictEqual(
	normalize({ Line: "dosan", PosNum: 199, Direction: 1 }, "78", "dosan").trains[0].jrShikoku.renderPosition,
	"JSDKDEPOT199D"
);

console.log("JR Shikoku Line + PosNum mapping tests passed.");
