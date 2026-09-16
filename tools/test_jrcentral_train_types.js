"use strict";

const assert = require("assert");
const adapter = require("../js/jrcentral_location_adapter.js");

const cases = [
	["普通", "3", "普通", "普", "local", ""],
	["特急", "1", "特急", "特", "limited_express", ""],
	["HL", "6", "ホームライナー", "ラ", "liner", ""],
	["臨時", "7", "臨時", "臨", "special", ""],
	["区間快速", "9", "区間快速", "区快", "section_rapid", "section_rapid"],
	["快速", "8", "快速", "快", "rapid", "rapid"],
	["新快速", "8", "新快速", "新快", "new_rapid", "new_rapid"],
	["特別快速", "8", "特別快速", "特快", "special_rapid", "special_rapid"],
	["快速みえ", "8", "快速みえ", "みえ", "rapid_mie", "rapid_mie"]
];

cases.forEach(function(testCase) {
	const result = adapter.mapTrainType(testCase[0]);
	assert.deepStrictEqual(
		[result.type, result.label, result.simple, result.semanticType, result.iconCode],
		testCase.slice(1),
		testCase[0]
	);
});

console.log("JR Central train type tests passed.");
