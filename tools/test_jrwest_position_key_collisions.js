"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const adapter = require("../js/jrwest_location_adapter.js");
const ROOT = path.resolve(__dirname, "..");
const ROSEN_DIR = path.join(ROOT, "rosen");
const JRWEST_PAGES = new Set([
	"61", "62", "63", "64", "65", "66", "67", "68", "69", "70", "71", "72",
	...Array.from({ length: 26 }, (_, index) => String(96 + index))
]);
const JRWEST_PREFIXES = ["JWH", "JWO", "JWG", "JWS", "JWT", "JWF", "JW"];

assert.strictEqual(adapter.scopePositionPrefix("", "67"), "JW67");
assert.strictEqual(adapter.scopePositionPrefix("JWO", "64"), "JWO64");
assert.strictEqual(adapter.scopePositionPrefix("JW61", "61"), "JW61");

const positions = new Map();
const renderedPositionKeys = new Set();
for (const page of JRWEST_PAGES) {
	const filePath = path.join(ROSEN_DIR, `rosen_${page}.html`);
	const html = fs.readFileSync(filePath, "utf8");
	for (const classMatch of html.matchAll(/class="([^"]*\bressha-icon\b[^"]*)"/g)) {
		for (const className of classMatch[1].split(/\s+/)) {
			const prefix = JRWEST_PREFIXES.find((candidate) => className.startsWith(candidate));
			if (!prefix || !/[UD]$/.test(className)) continue;
			assert(
				className.startsWith(prefix + page),
				`page ${page} has an unscoped JR West position key: ${className}`
			);
			renderedPositionKeys.add(className);
		}
	}
	const stationPattern = /<div key="([^"]+)"[^>]*>([^<]+)<\/div>[\s\S]{0,1800}?<div class="ressha-contents"><div class="ressha-icon ([A-Za-z0-9_]+?)[UD]"><\/div>/g;
	for (const match of html.matchAll(stationPattern)) {
		const positionKey = match[3];
		const stationName = match[2].trim();
		if (!/^(?:JWH|JWO|JWG|JWS|JWT|JWF|JW)/.test(positionKey)) continue;
		assert(
			positionKey.includes(page),
			`page ${page} has an unscoped JR West position key: ${positionKey}`
		);
		if (!positions.has(positionKey)) positions.set(positionKey, []);
		positions.get(positionKey).push({ page, stationName });
	}
}

const conflicts = [];
for (const [positionKey, rows] of positions) {
	const names = [...new Set(rows.map((row) => row.stationName))];
	if (names.length > 1) conflicts.push({ positionKey, rows });
}
assert.deepStrictEqual(conflicts, [], `JR West position key collisions: ${JSON.stringify(conflicts)}`);

const locationMaster = JSON.parse(fs.readFileSync(path.join(ROOT, "original", "location_master.json"), "utf8"));
for (const positionKey of renderedPositionKeys) {
	assert(locationMaster[positionKey], `location_master is missing ${positionKey}`);
}
assert.strictEqual(locationMaster.JW670416U, "\u5927\u962a");
assert.strictEqual(locationMaster.JW700415U, "\u65b0\u5927\u962a");
assert.strictEqual(locationMaster.JW0416U, undefined);
assert.strictEqual(locationMaster.JW0415U, undefined);

console.log(`JR West scoped position keys: OK (${positions.size} station keys, ${renderedPositionKeys.size} rendered slots)`);
