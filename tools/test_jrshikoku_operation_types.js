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
	{ Index: "10", TrainNum: "101A", Pos: "高松", Direction: 0, Type: "normal:", Line: "yosan", delay: "0" },
	{ Index: "11", TrainNum: "", Pos: "鬼無", Direction: 1, Type: "normal:", Line: "yosan", delay: "0" }
], [], { senku: "73", lineId: "yosan" });

assert.strictEqual(normalized.trains.length, 2);
assert.strictEqual(normalized.trains[0].typeLabel, "回送");
assert.strictEqual(normalized.trains[0].displayTrainNumber, "101A");
assert.strictEqual(normalized.trains[1].typeLabel, "貨物");
assert.strictEqual(normalized.trains[1].displayTrainNumber, "");
assert.match(normalized.trains[1].cbango, /^JRSHIKOKU-FREIGHT-/);

console.log("JR Shikoku operation type tests passed.");
