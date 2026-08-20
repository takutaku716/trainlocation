"use strict";

const fs = require("fs");
const path = require("path");
const adapter = require("../js/jrshikoku_location_adapter.js");

const ROOT = path.resolve(__dirname, "..");
const CSV_PATH = path.join(ROOT, "original", "SikokuPos", "jrshikoku_gui_collector", "Pos_PosNum_Direction_Line.csv");
const OUTPUT_PATH = path.join(ROOT, "js", "jrshikoku_position_map.js");

const AUTO_ROUTES = [
	{ senku: "64", lineId: "seto", sourceLine: "yosan" },
	{ senku: "73", lineId: "yosan", sourceLine: "yosan" },
	{ senku: "76", lineId: "uwajima", sourceLine: "uwajima" },
	{ senku: "77", lineId: "uwajima2", sourceLine: "uwajima" },
	{ senku: "78", lineId: "dosan", sourceLine: "dosan" },
	{ senku: "79", lineId: "kubokawa", sourceLine: "kubokawa" },
	{ senku: "80", lineId: "koutoku", sourceLine: "koutoku" },
	{ senku: "81", lineId: "tokushima", sourceLine: "tokushima" },
	{ senku: "82", lineId: "naruto", sourceLine: "koutoku" }
];

const EXTRA_RESOLVED_PROJECTIONS = {
	"73": ["uwajima:231"],
	"80": [
		"yosan:401", "yosan:406", "yosan:407", "yosan:408",
		"yosan:409", "yosan:410", "yosan:411", "yosan:420",
		"koutoku:496", "tokushima:483", "tokushima:496"
	],
	"81": [
		"koutoku:497", "koutoku:604", "koutoku:605", "koutoku:606",
		"koutoku:607", "koutoku:608", "koutoku:609", "koutoku:610",
		"koutoku:611", "koutoku:612", "koutoku:613", "tokushima:497",
		"dosan:70"
	],
	"82": ["tokushima:483", "tokushima:496"]
};

// 瀬戸大橋周辺は挙動確認後に、この表だけを差し替えて拡張する。
const SETO_OHASHI_OVERRIDES = {
	"yosan:246": { senku: "64", render: "JSYF246", kind: "forecast" },
	"yosan:93": { senku: "64", render: "JSYF93", kind: "forecast" }
};

const SPECIAL_PROJECTIONS = {
	"tokushima:496": [
		{ senku: "82", U: "JSNT01_T00U", D: "JSNT01_T00D" }
	],
	"uwajima:33": [
		{ senku: "76", U: "JSUDEPOT33U", D: "JSUDEPOT33D", name: "松山運転所～北伊予 入出区線" },
		{ senku: "77", U: "JSSDEPOT33U", D: "JSSDEPOT33D", name: "松山運転所～北伊予 入出区線" }
	],
	"uwajima:250": [
		{ senku: "76", U: "JSUU00U", D: "JSUU00D", name: "松山" },
		{ senku: "77", U: "JSSU00U", D: "JSSU00D", name: "松山" }
	],
	"uwajima:252": [
		{ senku: "76", U: "JSUU00U", D: "JSUU00D", name: "松山" },
		{ senku: "77", U: "JSSU00U", D: "JSSU00D", name: "松山" }
	],
	"uwajima:92": [
		{ senku: "77", U: "JSSIYOWAKA92U", D: "JSSIYOWAKA92D" }
	],
	"uwajima:213": [
		{ senku: "77", U: "JSSIYOWAKA213U", D: "JSSIYOWAKA213D" }
	],
	"uwajima:184": [
		{ senku: "76", U: "JSUYODO184U", D: "JSUYODO184D" },
		{ senku: "77", U: "JSSYODO184U", D: "JSSYODO184D" }
	],
	"dosan:178": [
		{ senku: "78", U: "JSDNAHARI178U", D: "JSDNAHARI178D" }
	],
	"dosan:199": [
		{ senku: "78", U: "JSDKDEPOT199U", D: "JSDKDEPOT199D" }
	],
	"yosan:295": [
		{ senku: "73", U: "JSYV295", D: "JSYV295", kind: "virtual" }
	],
	"yosan:346": [
		{ senku: "73", U: "JSYFT346", D: "JSYFT346" }
	]
};

const FORECAST_SOURCES = {
	"yosan:293": ["73"], "yosan:294": ["73"],
	"yosan:246": ["64"], "yosan:93": ["64"],
	"yosan:45": ["73"], "yosan:303": ["73"],
	"uwajima:185": ["76", "77"],
	"dosan:68": ["78"], "dosan:69": ["78"],
	"dosan:176": ["78"], "dosan:177": ["78"],
	"dosan:197": ["78"], "dosan:198": ["78"],
	"tokushima:669": ["81"], "tokushima:670": ["81"],
	"uwajima:227": ["73"], "uwajima:228": ["73"],
	"uwajima:34": ["76", "77"], "uwajima:35": ["76", "77"]
};

const rows = fs.readFileSync(CSV_PATH, "utf8").trim().split(/\r?\n/).slice(1).map(function(line) {
	const columns = line.split(",");
	return { pos: columns[0], posNum: columns[1], direction: columns[2], line: columns[3] };
});

const records = {};
rows.forEach(function(row) {
	const key = row.line + ":" + row.posNum;
	if (!records[key]) {
		records[key] = { line: row.line, posNum: row.posNum, name: row.pos, directions: [], projections: {} };
	}
	if (records[key].name !== row.pos) throw new Error("Conflicting Pos for " + key);
	if (records[key].directions.indexOf(row.direction) < 0) records[key].directions.push(row.direction);
});

function buildContext(config) {
	const byName = new Map();
	const byCode = new Map();
	config.stations.forEach(function(station, index) {
		const row = { code: station[0], name: station[1], index: index };
		byName.set(row.name, row);
		byCode.set(row.code, row);
	});
	return {
		stations: config.stations,
		byName: byName,
		byCode: byCode,
		groups: config.nonInterlockedGroups.map(function(group) {
			return {
				from: byCode.get(group.from),
				to: byCode.get(group.to),
				stations: group.stations.map(function(code) { return byCode.get(code); }).filter(Boolean)
			};
		}),
		positionPrefix: config.positionPrefix,
		stationPositionPrefixes: config.stationPositionPrefixes
	};
}

// CSVのPos文字列を初回の投影表生成にだけ使う。配信時の位置判定では使用しない。
function normalizePositionText(value) {
	return String(value || "").replace(/[（(](?:上り|下り)[）)]/g, "").replace(/\s+/g, "").trim();
}

function getNonInterlockedPositionName(group, direction) {
	const displayFrom = direction === "D" ? group.from.name : group.to.name;
	const displayTo = direction === "D" ? group.to.name : group.from.name;
	return displayFrom + "→" + displayTo + " 間";
}

function resolvePositionForMap(rawPosition, direction, context) {
	const cleaned = normalizePositionText(rawPosition);
	if (!cleaned || cleaned.indexOf("予告窓") >= 0) return null;
	const station = context.byName.get(cleaned);
	if (station) {
		const stationGroup = context.groups.find(function(group) {
			return group.stations.some(function(row) { return row.code === station.code; });
		});
		if (stationGroup) {
			return {
				pos: context.positionPrefix + stationGroup.from.code + "_" + stationGroup.to.code + direction,
				name: getNonInterlockedPositionName(stationGroup, direction)
			};
		}
		const stationPrefix = context.stationPositionPrefixes[station.code] || context.positionPrefix;
		return { pos: stationPrefix + station.code + direction, name: station.name };
	}
	const parts = cleaned.split(/[～〜~]/).map(function(value) { return value.trim(); }).filter(Boolean);
	if (parts.length < 2) return null;
	const from = context.byName.get(parts[0]);
	const to = context.byName.get(parts[parts.length - 1]);
	if (!from || !to || from.index === to.index) return null;
	const lowIndex = Math.min(from.index, to.index);
	const highIndex = Math.max(from.index, to.index);
	const nonInterlockedGroup = context.groups.find(function(group) {
		return group.from.index <= lowIndex && group.to.index >= highIndex &&
			lowIndex < group.to.index && highIndex > group.from.index;
	});
	if (nonInterlockedGroup) {
		return {
			pos: context.positionPrefix + nonInterlockedGroup.from.code + "_" + nonInterlockedGroup.to.code + direction,
			name: getNonInterlockedPositionName(nonInterlockedGroup, direction)
		};
	}
	const segmentIndex = direction === "D" ? lowIndex : highIndex - 1;
	const left = context.stations[segmentIndex];
	const right = context.stations[segmentIndex + 1];
	if (!left || !right) return null;
	const displayFrom = direction === "D" ? from.name : to.name;
	const displayTo = direction === "D" ? to.name : from.name;
	return {
		pos: context.positionPrefix + left[0] + "_" + right[0] + direction,
		name: displayFrom + "→" + displayTo + " 間"
	};
}

const routeBySenku = new Map(AUTO_ROUTES.map(function(route) { return [route.senku, route]; }));
const contexts = new Map(AUTO_ROUTES.map(function(route) {
	return [route.senku, buildContext(adapter.lineConfigs[route.lineId])];
}));

function addProjection(record, senku, projection) {
	record.projections[senku] = Object.assign({}, record.projections[senku] || {}, projection);
}

function addResolvedProjection(record, senku) {
	const context = contexts.get(senku);
	if (!context || !record.name) return false;
	const up = resolvePositionForMap(record.name, "U", context);
	const down = resolvePositionForMap(record.name, "D", context);
	if (!up || !down) return false;
	addProjection(record, senku, { U: up.pos, D: down.pos });
	return true;
}

AUTO_ROUTES.forEach(function(route) {
	Object.keys(records).forEach(function(key) {
		const record = records[key];
		if (record.line === route.sourceLine) addResolvedProjection(record, route.senku);
	});
});

Object.keys(EXTRA_RESOLVED_PROJECTIONS).forEach(function(senku) {
	EXTRA_RESOLVED_PROJECTIONS[senku].forEach(function(key) {
		if (!records[key]) throw new Error("Missing extra projection record: " + key);
		if (!addResolvedProjection(records[key], senku)) {
			const direct = {
				"koutoku:496": { U: "JSTT01_T00U", D: "JSTT01_T00D" },
				"tokushima:496": { U: "JSTT01_T00U", D: "JSTT01_T00D" },
				"koutoku:497": { U: "JSBT00_B01U", D: "JSBT00_B01D" },
				"tokushima:497": { U: "JSBT00_B01U", D: "JSBT00_B01D" },
				"dosan:70": { U: "JSBB23_B24U", D: "JSBB23_B24D" }
			}[key];
			if (!direct) throw new Error("Unresolved extra projection: " + senku + " " + key);
			addProjection(records[key], senku, direct);
		}
	});
});

Object.keys(SPECIAL_PROJECTIONS).forEach(function(key) {
	if (!records[key]) throw new Error("Missing special projection record: " + key);
	SPECIAL_PROJECTIONS[key].forEach(function(projection) {
		addProjection(records[key], projection.senku, projection);
		if (projection.name) records[key].name = projection.name;
	});
});

const forecastDefinitions = adapter.forecastPositions;
Object.keys(FORECAST_SOURCES).forEach(function(key) {
	if (!records[key]) throw new Error("Missing forecast record: " + key);
	const positionNumber = records[key].posNum;
	FORECAST_SOURCES[key].forEach(function(senku) {
		const definition = forecastDefinitions.find(function(row) {
			return row.positionNumber === positionNumber && row.rosen === senku;
		});
		if (!definition) throw new Error("Missing forecast definition: " + key + " route " + senku);
		addProjection(records[key], senku, {
			U: definition.pos,
			D: definition.pos,
			kind: "forecast"
		});
		records[key].name = definition.name;
	});
});

Object.keys(SETO_OHASHI_OVERRIDES).forEach(function(key) {
	const override = SETO_OHASHI_OVERRIDES[key];
	if (!records[key]) throw new Error("Missing Seto Ohashi record: " + key);
	addProjection(records[key], override.senku, {
		U: override.render,
		D: override.render,
		kind: override.kind
	});
});

// 佃仮想窓は土讃線側の共通在線を使うため表示しない。
if (records["tokushima:668"]) records["tokushima:668"].projections = {};

Object.keys(records).forEach(function(key) {
	records[key].directions.sort();
	if (Object.keys(records[key].projections).length === 0) records[key].unmapped = true;
});

const payload = {
	version: 1,
	keyType: "Line+PosNum",
	generatedFrom: path.relative(ROOT, CSV_PATH).replace(/\\/g, "/"),
	records: records,
	setoOhashiOverrides: SETO_OHASHI_OVERRIDES
};

const output = `(function(root, factory) {\n` +
	`\tif (typeof module === "object" && module.exports) module.exports = factory();\n` +
	`\telse root.JrShikokuPositionMap = factory();\n` +
	`}(typeof self !== "undefined" ? self : this, function() {\n` +
	`\t"use strict";\n\treturn ${JSON.stringify(payload, null, "\t")};\n}));\n`;

fs.writeFileSync(OUTPUT_PATH, output, "utf8");
const unmapped = Object.keys(records).filter(function(key) { return records[key].unmapped; });
console.log("Generated", path.relative(ROOT, OUTPUT_PATH), "with", Object.keys(records).length, "Line+PosNum records.");
console.log("Unmapped records:", unmapped.length, unmapped.join(", "));
