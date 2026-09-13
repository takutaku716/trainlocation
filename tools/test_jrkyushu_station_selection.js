"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const routes = require("../js/jrkyushu_doredore_routes.js");

function selectableStationNames(html) {
	return Array.from(String(html).matchAll(/<div\b(?=[^>]*data-station-selectable="1")[^>]*>([^<]*)<\/div>/g), function(match) {
		return match[1].trim();
	}).filter(Boolean);
}

for (const route of routes) {
	const routePath = path.join(__dirname, "..", "rosen", "rosen_" + route.rosen + ".html");
	const names = selectableStationNames(fs.readFileSync(routePath, "utf8"));
	assert.ok(names.length > 0, route.rosen + " has no selectable stations");
	assert.deepStrictEqual(
		names.filter(function(name) { return /(?:信号場|操車場|貨物|電留)$/.test(name); }),
		[],
		route.rosen + " contains an operational facility"
	);
}

const kagoshima = selectableStationNames(fs.readFileSync(path.join(__dirname, "..", "rosen", "rosen_122.html"), "utf8"));
assert.ok(kagoshima.includes("小森江"));
assert.ok(kagoshima.includes("門司"));
assert.ok(!kagoshima.includes("北九州貨物ターミナル"));
assert.ok(!kagoshima.includes("東小倉"));
assert.ok(!kagoshima.includes("千早操車場"));
assert.ok(!kagoshima.includes("吉塚電留"));
assert.ok(!kagoshima.includes("太宰府信号場"));

console.log("JR Kyushu station selection tests passed");
