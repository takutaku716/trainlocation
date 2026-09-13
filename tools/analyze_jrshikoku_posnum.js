"use strict";

const fs = require("fs");
const path = require("path");
const adapter = require("../js/jrshikoku_location_adapter.js");

const ROOT = path.resolve(__dirname, "..");
const CSV_PATH = path.join(ROOT, "original", "SikokuPos", "jrshikoku_gui_collector", "Pos_PosNum_Direction_Line.csv");
const ROUTES = [
	["64", "seto"], ["73", "yosan"], ["76", "uwajima"],
	["77", "uwajima2"], ["78", "dosan"], ["79", "kubokawa"],
	["80", "koutoku"], ["81", "tokushima"], ["82", "naruto"]
];

const rows = fs.readFileSync(CSV_PATH, "utf8").trim().split(/\r?\n/).slice(1).map(function(line) {
	const columns = line.split(",");
	return {
		Pos: columns[0],
		PosNum: columns[1],
		Direction: Number(columns[2]),
		Line: columns[3],
		TrainNum: "POSNUM-TEST",
		Type: "normal",
		delay: 0
	};
});

const uniquePositions = new Map();
rows.forEach(function(row) {
	uniquePositions.set(row.Line + "|" + row.PosNum, row);
});

const unmapped = [];
const missingSlots = [];
const multipleRoutes = [];

uniquePositions.forEach(function(row, sourceKey) {
	const hits = [];
	ROUTES.forEach(function(route) {
		const senku = route[0];
		const lineId = route[1];
		const normalized = adapter.normalize([
			{ GetDateTime: "2026/08/20 12:00:00" },
			row
		], [], { senku: senku, lineId: lineId });
		if (normalized.trains.length === 0) return;
		const renderPosition = normalized.trains[0].pos;
		hits.push({ senku: senku, lineId: lineId, renderPosition: renderPosition });
		const html = fs.readFileSync(path.join(ROOT, "rosen", "rosen_" + senku + ".html"), "utf8");
		const classPattern = new RegExp("(?:^|[\\s\"'])" + renderPosition.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?:[\\s\"']|$)");
		if (!classPattern.test(html)) {
			missingSlots.push(sourceKey + " " + row.Pos + " => " + senku + ":" + renderPosition);
		}
	});
	if (hits.length === 0) unmapped.push(sourceKey + " " + row.Pos);
	if (hits.length > 1) {
		multipleRoutes.push(sourceKey + " " + row.Pos + " => " + hits.map(function(hit) {
			return hit.senku + ":" + hit.lineId + ":" + hit.renderPosition;
		}).join(", "));
	}
});

console.log("Unique Line+PosNum:", uniquePositions.size);
console.log("Unmapped:", unmapped.length);
console.log("Missing render slots:", missingSlots.length);
console.log("Shared by multiple pages:", multipleRoutes.length);
console.log("\n--- Unmapped ---\n" + unmapped.join("\n"));
console.log("\n--- Missing render slots ---\n" + missingSlots.join("\n"));
console.log("\n--- Multiple pages ---\n" + multipleRoutes.join("\n"));
