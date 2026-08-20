"use strict";

const assert = require("assert");
const adapter = require("../js/jrshikoku_location_adapter.js");

function normalize(row, senku, lineId) {
	return adapter.normalize([
		{ GetDateTime: "2026/08/18 08:00:00" },
		Object.assign({
			TrainNum: "9000D",
			Direction: 0,
			Type: "normal:",
			delay: "0"
		}, row)
	], [], { senku: senku, lineId: lineId });
}

const yosan = normalize({ Pos: "鬼無予告窓", PosNum: 293, Line: "yosan" }, "73", "yosan");
assert.strictEqual(yosan.trains.length, 1);
assert.strictEqual(yosan.trains[0].pos, "JSP_yosan_293");
assert.strictEqual(yosan.trains[0].jrShikoku.renderPosition, "JSYF293");
assert.strictEqual(yosan.trains[0].posName, "鬼無予告窓①");
assert.strictEqual(yosan.trains[0].jrShikoku.isForecastWindow, true);
assert.strictEqual(yosan.trains[0].jrShikoku.rawDirection, 0);

const seto = normalize({ Pos: "児島予告窓", PosNum: 93, Line: "yosan" }, "64", "seto");
assert.strictEqual(seto.trains.length, 1);
assert.strictEqual(seto.trains[0].pos, "JSP_yosan_93");
assert.strictEqual(seto.trains[0].jrShikoku.renderPosition, "JSYF93");

const tokushima = normalize({ Pos: "佃予告窓", PosNum: 669, Line: "tokushima" }, "81", "tokushima");
assert.strictEqual(tokushima.trains.length, 1);
assert.strictEqual(tokushima.trains[0].pos, "JSP_tokushima_669");

const dosan = normalize({ Pos: "佃予告窓", PosNum: 68, Line: "dosan" }, "78", "dosan");
assert.strictEqual(dosan.trains.length, 1);
assert.strictEqual(dosan.trains[0].pos, "JSP_dosan_68");

const uwajima = normalize({ Pos: "北宇和島～宮野下方予告窓", PosNum: 185, Line: "uwajima" }, "76", "uwajima");
assert.strictEqual(uwajima.trains.length, 1);
assert.strictEqual(uwajima.trains[0].pos, "JSP_uwajima_185");

const mitsuhama = normalize({ Pos: "", PosNum: 227, Line: "uwajima", Direction: 1 }, "73", "yosan");
assert.strictEqual(mitsuhama.trains.length, 1);
assert.strictEqual(mitsuhama.trains[0].pos, "JSP_uwajima_227");
assert.strictEqual(mitsuhama.trains[0].posName, "三津浜予告窓①");

const kitaiyo = normalize({ Pos: "", PosNum: 35, Line: "uwajima", Direction: 0 }, "76", "uwajima");
assert.strictEqual(kitaiyo.trains.length, 1);
assert.strictEqual(kitaiyo.trains[0].pos, "JSP_uwajima_35");
assert.strictEqual(kitaiyo.trains[0].posName, "北伊予予告窓②");

const kitaiyoIyonada = normalize({ Pos: "", PosNum: 34, Line: "uwajima", Direction: 0 }, "77", "uwajima2");
assert.strictEqual(kitaiyoIyonada.trains.length, 1);
assert.strictEqual(kitaiyoIyonada.trains[0].pos, "JSP_uwajima_34");

const kitauwajimaIyonada = normalize({ Pos: "北宇和島～宮野下方予告窓", PosNum: 185, Line: "uwajima", Direction: 1 }, "77", "uwajima2");
assert.strictEqual(kitauwajimaIyonada.trains.length, 1);
assert.strictEqual(kitauwajimaIyonada.trains[0].pos, "JSP_uwajima_185");

const unknown = normalize({ Pos: "未登録予告窓", PosNum: 999, Line: "yosan" }, "73", "yosan");
assert.strictEqual(unknown.trains.length, 0);

const forecastDefinitions = new Map(adapter.forecastPositions.filter(function(row) {
	return row.rosen !== "77";
}).map(function(row) {
	return [row.positionNumber, row];
}));
assert.strictEqual(forecastDefinitions.get("246").side, "right");
assert.strictEqual(forecastDefinitions.get("45").side, "left");
assert.strictEqual(forecastDefinitions.get("669").side, "left");
assert.strictEqual(forecastDefinitions.get("227").hostStationCode, "Y54");
assert.strictEqual(forecastDefinitions.get("227").side, "right");
assert.strictEqual(forecastDefinitions.get("34").hostStationCode, "UDEPOT");
assert.strictEqual(forecastDefinitions.get("34").side, "left");

const iyonadaDefinitions = adapter.forecastPositions.filter(function(row) {
	return row.rosen === "77";
});
assert.deepStrictEqual(iyonadaDefinitions.map(function(row) { return row.positionNumber; }).sort(), ["185", "34", "35"]);
assert.strictEqual(iyonadaDefinitions.find(function(row) { return row.positionNumber === "34"; }).hostStationCode, "UDEPOT");
assert.strictEqual(iyonadaDefinitions.find(function(row) { return row.positionNumber === "185"; }).hostStationCode, "GYODO");

console.log("JR Shikoku forecast position tests passed.");
