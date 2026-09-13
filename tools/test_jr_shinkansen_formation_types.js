"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const adapterPath = path.join(__dirname, "..", "js", "jr_shinkansen_location_adapter.js");
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(adapterPath, "utf8"), sandbox, { filename: adapterPath });
const classify = sandbox.window.JrShinkansenLocationAdapter.getCentralFormationType;

function eightCar(car4, car6) {
	const cars = Array.from({ length: 8 }, () => ({ carKind: 1, formationIconList: [] }));
	cars[3] = car4;
	cars[5] = car6;
	return { carCount: 8, carInfo: 99, formationIconInfo: cars };
}

const cases = [
	[{ carCount: 16, carInfo: 1 }, "N700S(J/H\u7de8\u6210)"],
	[{ carCount: 16, carInfo: 2 }, "N700A(G/F\u7de8\u6210)"],
	[{ carCount: 16, carInfo: 3 }, "N700a(X/K\u7de8\u6210)"],
	[eightCar(
		{ carKind: 1, formationIconList: [9] },
		{ carKind: 1, formationIconList: [3, 6, 9] }
	), "500\u7cfb/700\u7cfb"],
	[eightCar(
		{ carKind: 1, formationIconList: [3, 6, 9] },
		{ carKind: 1, formationIconList: [9] }
	), "N700a(P\u7de8\u6210)"],
	[eightCar(
		{ carKind: 1, formationIconList: [3, 6, 9] },
		{ carKind: 3, formationIconList: [3, 6, 9] }
	), "N700\u7cfb(S/R\u7de8\u6210)"],
	[{ carCount: 6, carInfo: 0 }, "800\u7cfb"],
	[eightCar(
		{ carKind: 1, formationIconList: [] },
		{ carKind: 1, formationIconList: [] }
	), "\u305d\u306e\u4ed6\uff088\u4e21\uff09"],
	[{ carCount: 12, carInfo: 42 }, "\u305d\u306e\u4ed6"],
	[null, "\u4e0d\u660e"]
];

cases.forEach(([input, expected]) => {
	assert.strictEqual(classify(input), expected, JSON.stringify(input));
});

console.log("JR Shinkansen formation type tests passed.");
