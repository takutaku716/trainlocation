"use strict";

const assert = require("assert");
const adapter = require("../js/jrshikoku_location_adapter.js");

[
	["123A", "回送", "回"],
	["123B", "回送", "回"],
	["123R", "回送", "回"],
	["123E", "回送", "回"],
	["123H", "試運転", "試"],
	["123T", "単機", "単"],
	["3078", "貨物", "貨"],
	["", "貨物", "貨"]
].forEach(function(testCase) {
	const result = adapter.mapShikokuTrainType(testCase[0], "rapid:");
	assert.strictEqual(result.type, "3");
	assert.strictEqual(result.label, testCase[1]);
	assert.strictEqual(result.simple, testCase[2]);
});

const passenger = adapter.mapShikokuTrainType("123D", "rapid:");
assert.strictEqual(passenger.type, "8");
assert.strictEqual(passenger.label, "快速");

const normalized = adapter.normalize([
	{ GetDateTime: "2026/08/12 12:00:00" },
	{ Index: "10", TrainNum: "101A", Pos: "高松", PosNum: 279, Direction: 0, Type: "normal:", Line: "yosan", delay: "0" },
	{ Index: "11", TrainNum: "", Pos: "鬼無", PosNum: 296, Direction: 1, Type: "normal:", Line: "yosan", delay: "0" },
	{ Index: "12", TrainNum: "3078", Pos: "本山～観音寺", PosNum: 63, Direction: 0, Type: "normal", Line: "yosan", delay: "0" },
	{ Index: "41", TrainNum: "3072", Pos: "鬼無～高松（タ）", PosNum: 346, Direction: 0, Type: "normal", Line: "yosan", delay: "0" }
], [], { senku: "73", lineId: "yosan" });

assert.strictEqual(normalized.trains.length, 4);
assert.strictEqual(normalized.trains[0].typeLabel, "回送");
assert.strictEqual(normalized.trains[0].displayTrainNumber, "101A");
assert.strictEqual(normalized.trains[1].typeLabel, "貨物");
assert.strictEqual(normalized.trains[1].displayTrainNumber, "");
assert.match(normalized.trains[1].cbango, /^JRSHIKOKU-FREIGHT-/);
assert.strictEqual(normalized.trains[2].typeLabel, "貨物");
assert.strictEqual(normalized.trains[2].displayTrainNumber, "3078");
assert.strictEqual(normalized.trains[3].typeLabel, "貨物");
assert.strictEqual(normalized.trains[3].pos, "JSP_yosan_346_U");
assert.strictEqual(normalized.trains[3].jrShikoku.renderPosition, "JSYFT346U");
assert.strictEqual(normalized.trains[3].posName, "鬼無～高松（タ）");

const tokushimaDirection = adapter.normalize([
	{ GetDateTime: "2026/08/13 21:45:00" },
	{ TrainNum: "1001D", Pos: "徳島", PosNum: 501, Direction: 0, Type: "normal:", Line: "tokushima", delay: "0" },
	{ TrainNum: "1002D", Pos: "佐古", PosNum: 495, Direction: 1, Type: "normal:", Line: "tokushima", delay: "0" },
	{ TrainNum: "1004D", Pos: "佐古～蔵本", PosNum: 604, Direction: 0, Type: "normal:", Line: "tokushima", delay: "0" },
	{ TrainNum: "9495D", Pos: "徳島", PosNum: 501, Direction: 0, Type: "normal:", Line: "tokushima", delay: "入線" },
	{ TrainNum: "9998D", Pos: "佐古", PosNum: 495, Direction: 0, Type: "normal:", Line: "tokushima", delay: "2" }
], [
	{ "1001D": "徳島,発,21:52#佐古,発,21:56#蔵本,着,21:59#" },
	{ "1002D": "蔵本,発,21:40#佐古,発,21:44#徳島,着,21:46#" }
], { senku: "81", lineId: "tokushima" });

assert.strictEqual(tokushimaDirection.trains[0].jrShikoku.renderPosition, "JSBT00D");
assert.strictEqual(tokushimaDirection.trains[1].jrShikoku.renderPosition, "JSBB01U");
assert.strictEqual(tokushimaDirection.trains[2].jrShikoku.renderPosition, "JSBB01_B02U");
assert.strictEqual(tokushimaDirection.trains[3].jrShikoku.renderPosition, "JSBT00D");
assert.strictEqual(tokushimaDirection.trains[4].jrShikoku.renderPosition, "JSBB01D");

console.log("JR Shikoku operation type tests passed.");
