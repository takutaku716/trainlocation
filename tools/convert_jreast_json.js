#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const adapter = require("../js/jreast_location_adapter.js");

const args = process.argv.slice(2);
const inputPath = args.find(function(arg) {
	return !arg.startsWith("--");
});
const summaryMode = args.includes("--summary");
const daiyaMode = args.includes("--daiya");
const outIndex = args.indexOf("--out");
const outputPath = outIndex >= 0 ? args[outIndex + 1] : "";
const ekiMasterIndex = args.indexOf("--eki-master");
const ekiMasterPath = ekiMasterIndex >= 0 ? args[ekiMasterIndex + 1] : "";
const daiyaOutIndex = args.indexOf("--daiya-out");
const daiyaOutputPath = daiyaOutIndex >= 0 ? args[daiyaOutIndex + 1] : "";

if (!inputPath) {
	console.error("Usage: node tools/convert_jreast_json.js <input-json> [--summary] [--out <output-json>] [--daiya --eki-master <eki-master-json> --daiya-out <output-json>]");
	process.exit(1);
}

main().catch(function(error) {
	console.error(error && error.message ? error.message : error);
	process.exit(1);
});

async function main() {
	const rawJson = await loadJson(inputPath);
	const normalized = adapter.normalize(rawJson);

	if (outputPath) {
		fs.writeFileSync(path.resolve(outputPath), JSON.stringify(normalized, null, "\t") + "\n", "utf8");
	}

	let daiya = null;
	if (daiyaMode || daiyaOutputPath) {
		if (!ekiMasterPath) throw new Error("--daiya を使う場合は --eki-master <eki-master-json> を指定してください。");
		const ekiMaster = await loadJson(ekiMasterPath);
		daiya = adapter.toDaiya(rawJson, ekiMaster, { includeMeta: true });
		if (daiyaOutputPath) {
			fs.writeFileSync(path.resolve(daiyaOutputPath), JSON.stringify(daiya, null, "\t") + "\n", "utf8");
		}
	}

	if (summaryMode) {
		printSummary(normalized);
		if (daiya) printDaiyaSummary(daiya);
		return;
	}
	if (daiyaMode && !daiyaOutputPath) {
		process.stdout.write(JSON.stringify(daiya, null, "\t") + "\n");
		return;
	}
	if (!outputPath && !daiyaOutputPath) {
		process.stdout.write(JSON.stringify(normalized, null, "\t") + "\n");
		return;
	}

	if (outputPath) process.stdout.write("Wrote " + path.resolve(outputPath) + "\n");
	if (daiyaOutputPath) process.stdout.write("Wrote " + path.resolve(daiyaOutputPath) + "\n");
}

async function loadJson(source) {
	if (/^https?:\/\//i.test(source)) {
		const response = await fetch(source);
		if (!response.ok) throw new Error("JSONを取得できませんでした: " + source + " (" + response.status + ")");
		return response.json();
	}
	const resolvedPath = path.resolve(source);
	const rawText = fs.readFileSync(resolvedPath, "utf8");
	return JSON.parse(rawText);
}

function printSummary(data) {
	const trains = Array.isArray(data.trains) ? data.trains : [];
	process.stdout.write("source: " + data.source + "\n");
	process.stdout.write("screenCode: " + data.screenCode + "\n");
	process.stdout.write("dateTime: " + data.dateTime + "\n");
	process.stdout.write("trainCount: " + trains.length + "\n\n");
	process.stdout.write([
		pad("列番", 8),
		pad("方向", 4),
		pad("遅れ", 6),
		pad("両数", 5),
		pad("愛称", 24),
		pad("行先", 16),
		pad("位置", 16)
	].join("  ") + "\n");
	process.stdout.write("-".repeat(100) + "\n");

	trains.forEach(function(train) {
		process.stdout.write([
			pad(train.cbango, 8),
			pad(train.jrEast && train.jrEast.direction === "up" ? "上り" : "下り", 4),
			pad(formatDelay(train.chien), 6),
			pad(formatCars(train.ryosu), 5),
			pad(train.jrEast && train.jrEast.nickname || train.typeName || "", 24),
			pad(train.shuEkiName || train.shuEkiSimple || "", 16),
			pad(train.pos, 16)
		].join("  ") + "\n");
	});
}

function printDaiyaSummary(daiya) {
	const trains = Array.isArray(daiya.today) ? daiya.today : [];
	const unmatchedStations = daiya.meta && Array.isArray(daiya.meta.unmatchedStations) ? daiya.meta.unmatchedStations : [];
	process.stdout.write("\nDaiya conversion\n");
	process.stdout.write("today: " + trains.length + "\n");
	process.stdout.write("unmatchedStations: " + unmatchedStations.length + "\n");
	if (unmatchedStations.length) {
		process.stdout.write("unmatched: " + unmatchedStations.join(", ") + "\n");
	}
	process.stdout.write("\n");
	process.stdout.write([
		pad("列番", 8),
		pad("列車名", 28),
		pad("種別", 4),
		pad("終着駅key", 9),
		pad("停車駅数", 8),
		pad("先頭", 12),
		pad("最後", 12)
	].join("  ") + "\n");
	process.stdout.write("-".repeat(100) + "\n");
	trains.forEach(function(train) {
		const stations = Array.isArray(train.stations) ? train.stations : [];
		const first = stations[0] ? stations[0].key + " " + stations[0].time : "";
		const last = stations[stations.length - 1] ? stations[stations.length - 1].key + " " + stations[stations.length - 1].time : "";
		process.stdout.write([
			pad(train.cbango, 8),
			pad(train.name, 28),
			pad(train.type, 4),
			pad(train.shuEkiKey, 9),
			pad(stations.length, 8),
			pad(first, 12),
			pad(last, 12)
		].join("  ") + "\n");
	});
}

function formatDelay(value) {
	const delay = Number(value || 0);
	return delay > 0 ? delay + "分" : "";
}

function formatCars(value) {
	return value ? value + "両" : "";
}

function pad(value, width) {
	const text = String(value || "");
	const fullWidthCount = (text.match(/[^\x00-\xff]/g) || []).length;
	const displayWidth = text.length + fullWidthCount;
	return text + " ".repeat(Math.max(0, width - displayWidth));
}
