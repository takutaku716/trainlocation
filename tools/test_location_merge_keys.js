"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const source = fs.readFileSync(path.join(__dirname, "..", "js", "location.js"), "utf8");

function extractFunction(name) {
	const start = source.indexOf("function " + name + "(");
	assert.notStrictEqual(start, -1, name + " was not found");
	const bodyStart = source.indexOf("{", start);
	let depth = 0;
	for (let index = bodyStart; index < source.length; index += 1) {
		if (source[index] === "{") depth += 1;
		if (source[index] === "}") depth -= 1;
		if (depth === 0) return source.slice(start, index + 1);
	}
	throw new Error(name + " has an unterminated body");
}

const sandbox = {
	Map: Map,
	get_location_now_time_info: function() { return null; }
};
vm.createContext(sandbox);
vm.runInContext([
	extractFunction("get_location_train_merge_key"),
	extractFunction("merge_location_now_data")
].join("\n"), sandbox);

const actual = {
	cbango: "3101M",
	pos: "JSY09D",
	jrShikoku: { isForecastWindow: false }
};
const forecast = {
	cbango: "3101M",
	pos: "JSYF246",
	jrShikoku: { isForecastWindow: true }
};
const merged = sandbox.merge_location_now_data([
	{ nowData: { trains: [forecast] } },
	{ nowData: { trains: [actual] } }
]);

assert.deepStrictEqual(
	Array.from(merged.trains, function(row) { return [row.cbango, row.pos]; }),
	[["3101M", "JSYF246"], ["3101M", "JSY09D"]],
	"JR Shikoku forecast and actual rows with the same train number must coexist"
);

console.log("Location merge key tests passed.");
