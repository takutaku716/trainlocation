"use strict";

const assert = require("assert");
const adapter = require("../js/jrkyushu_doredore_location_adapter.js");

function expectType(trainNumber, code, label, locationType) {
	assert.deepStrictEqual(
		adapter.classifyTrainType(trainNumber, locationType || { code: "3", label: "普通" }),
		{ code: code, label: label },
		trainNumber
	);
}

expectType("3220M", "1", "特急", { code: "1", label: "特急" });
expectType("構85M", "7", "入替車両", { code: "1", label: "特急" });

[
	"3120M", "3161M", "3198M", "3199M",
	"4120M", "4198M", "4199M",
	"4320M", "4398M", "4399M",
	"4220D", "4299D"
].forEach(function(trainNumber) {
	expectType(trainNumber, "9", "区間快速");
});

[
	"1320M", "1321M", "1399M",
	"3220M", "3299M", "4220M", "4299M",
	"1320C", "1350C", "1399C",
	"1620C", "1670C", "1680C", "1699C",
	"4620H", "4699H",
	"3220D", "3270D", "3271D", "3299D",
	"3320D", "3399D", "3530D", "3531D", "3550D", "3599D",
	"3920D", "3950D", "3999D"
].forEach(function(trainNumber) {
	expectType(trainNumber, "2", "快速");
});

[
	"120M", "920D", "2500M", "4000D",
	"3119M", "3200M", "4119M", "4200M", "4319M", "4400M",
	"1319C", "1400C", "1619C", "1700C",
	"4619H", "4700H", "3531M", "3920M",
	"3120D", "4220C", "1320H", "8014", "UNKNOWN"
].forEach(function(trainNumber) {
	expectType(trainNumber, "3", "普通");
});

console.log("JR Kyushu train type tests passed");
