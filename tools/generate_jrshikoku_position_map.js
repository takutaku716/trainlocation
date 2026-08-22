"use strict";

const fs = require("fs");
const path = require("path");
const adapter = require("../js/jrshikoku_location_adapter.js");

const ROOT = path.resolve(__dirname, "..");
const CSV_PATH = path.join(ROOT, "original", "SikokuPos", "jrshikoku_gui_collector", "Pos_PosNum_Direction_Line.csv");
const OUTPUT_PATH = path.join(ROOT, "js", "jrshikoku_position_map.js");
const LOCATION_MASTER_PATH = path.join(ROOT, "original", "location_master.json");

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

// 佐古～徳島は高徳線・徳島線で同じ物理区間を別Lineとして配信する。
// 81ページの駅間と、徳島線由来の徳島駅在線を80/82ページへ出す場合は、
// それぞれの画面上の並びに合わせてU/Dを反転する。
const SAKO_TOKUSHIMA_PROJECTIONS = {
	"494": { "80": "JSTT01", "81": "JSBB01", "82": "JSNT01" },
	"495": { "80": "JSTT01", "81": "JSBB01", "82": "JSNT01" },
	"496": { "80": "JSTT01_T00", "81": "JSBT00_B01", "82": "JSNT01_T00" },
	"497": { "80": "JSTT01_T00", "81": "JSBT00_B01", "82": "JSNT01_T00" },
	"499": { "80": "JSTT00", "81": "JSBT00", "82": "JSNT00" },
	"500": { "80": "JSTT00", "81": "JSBT00", "82": "JSNT00" },
	"501": { "80": "JSTT00", "81": "JSBT00", "82": "JSNT00" },
	"502": { "80": "JSTT00", "81": "JSBT00", "82": "JSNT00" }
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
	"uwajima:30": [
		{ senku: "76", U: "JSUDEPOT30U", D: "JSUDEPOT30D", name: "北伊予～伊予市" },
		{ senku: "77", U: "JSSDEPOT30U", D: "JSSDEPOT30D", name: "北伊予～伊予市" }
	],
	"uwajima:31": [
		{ senku: "76", U: "JSUDEPOT31U", D: "JSUDEPOT31D", name: "北伊予～伊予市" },
		{ senku: "77", U: "JSSDEPOT31U", D: "JSSDEPOT31D", name: "北伊予～伊予市" }
	],
	"uwajima:32": [
		{ senku: "76", U: "JSUDEPOT32", D: "JSUDEPOT32", name: "北伊予～伊予市" },
		{ senku: "77", U: "JSSDEPOT32", D: "JSSDEPOT32", name: "北伊予～伊予市" }
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
		{ senku: "76", U: "JSUWAKA92U", D: "JSUWAKA92D" },
		{ senku: "77", U: "JSSWAKA92U", D: "JSSWAKA92D" }
	],
	"uwajima:213": [
		{ senku: "76", U: "JSUWAKA213U", D: "JSUWAKA213D" },
		{ senku: "77", U: "JSSWAKA213U", D: "JSSWAKA213D" }
	],
	"uwajima:87": [
		{ senku: "76", U: "JSUWAKA87U", D: "JSUWAKA87D", name: "新谷～伊予若宮" }
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
		{ senku: "73", U: "JSYV295D", D: "JSYV295D", kind: "virtual" }
	],
	"yosan:346": [
		{ senku: "73", U: "JSYFT346U", D: "JSYFT346D" }
	]
};

// Branches and depot leads do not always follow the endpoint order in Pos.
// Keep their direction-specific detail labels explicit and independent of rendering.
const SPECIAL_DIRECTION_NAMES = {
	"uwajima:33": {
		U: "松山運転所→北伊予 入出区線 間",
		D: "北伊予 入出区線→松山運転所 間"
	},
	"uwajima:184": {
		U: "北宇和島→宮野下方 間",
		D: "宮野下方→北宇和島 間"
	},
	"dosan:178": {
		U: "後免→なはり方 間",
		D: "なはり方→後免 間"
	},
	"dosan:199": {
		U: "土佐一宮→運転所方 間",
		D: "運転所方→土佐一宮 間"
	},
	"yosan:295": {
		U: "鬼無仮想窓",
		D: "鬼無仮想窓"
	},
	"yosan:346": {
		U: "鬼無→高松（タ） 間",
		D: "高松（タ）→鬼無 間"
	}
};

// 元データの地点名から自動投影できても、その画面には在線を出さない組み合わせ。
const DISABLED_PROJECTIONS = {
	"uwajima:87": ["77"]
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

Object.keys(SAKO_TOKUSHIMA_PROJECTIONS).forEach(function(posNum) {
	["koutoku", "tokushima"].forEach(function(line) {
		const record = records[line + ":" + posNum];
		if (!record) throw new Error("Missing Sako-Tokushima record: " + line + ":" + posNum);
		Object.keys(SAKO_TOKUSHIMA_PROJECTIONS[posNum]).forEach(function(senku) {
			const base = SAKO_TOKUSHIMA_PROJECTIONS[posNum][senku];
			const reverseIntervalOnTokushimaPage = senku === "81" && (posNum === "496" || posNum === "497");
			const reverseTokushimaStationOnKoutokuPages = line === "tokushima" &&
				(senku === "80" || senku === "82") &&
				(posNum === "499" || posNum === "500" || posNum === "501" || posNum === "502");
			const reverse = reverseIntervalOnTokushimaPage || reverseTokushimaStationOnKoutokuPages;
			addProjection(record, senku, {
				U: base + (reverse ? "D" : "U"),
				D: base + (reverse ? "U" : "D")
			});
		});
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

Object.keys(DISABLED_PROJECTIONS).forEach(function(key) {
	if (!records[key]) throw new Error("Missing disabled projection record: " + key);
	DISABLED_PROJECTIONS[key].forEach(function(senku) {
		delete records[key].projections[senku];
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
const locationMaster = JSON.parse(fs.readFileSync(LOCATION_MASTER_PATH, "utf8"));
Object.keys(records).forEach(function(key) {
	const record = records[key];
	const sourceKey = "JSP_" + record.line.replace(/[^A-Za-z0-9_-]/g, "_") + "_" + record.posNum;
	locationMaster[sourceKey] = record.name;
});
Object.keys(SPECIAL_DIRECTION_NAMES).forEach(function(key) {
	const record = records[key];
	if (!record) throw new Error("Missing special direction-name record: " + key);
	const sourceKey = "JSP_" + record.line.replace(/[^A-Za-z0-9_-]/g, "_") + "_" + record.posNum;
	locationMaster[sourceKey + "_U"] = SPECIAL_DIRECTION_NAMES[key].U;
	locationMaster[sourceKey + "_D"] = SPECIAL_DIRECTION_NAMES[key].D;
});
fs.writeFileSync(LOCATION_MASTER_PATH, JSON.stringify(locationMaster, null, "\t") + "\n", "utf8");
const unmapped = Object.keys(records).filter(function(key) { return records[key].unmapped; });
console.log("Generated", path.relative(ROOT, OUTPUT_PATH), "with", Object.keys(records).length, "Line+PosNum records and location_master entries.");
console.log("Unmapped records:", unmapped.length, unmapped.join(", "));
