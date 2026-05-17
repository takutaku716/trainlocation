#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const DEFAULT_DOKOTRE_BASE = "https://doko-train.jp/json";

const args = process.argv.slice(2);
const options = parseArgs(args);

main().catch((error) => {
	console.error(error && error.message ? error.message : error);
	process.exit(1);
});

async function main() {
	const mappingPath = options.mapping || path.join(__dirname, "dokotre_9021_mapping.json");
	const mapping = await loadJson(mappingPath);
	const dokotreId = toText(options.line || mapping.dokotreId);
	if (!dokotreId) throw new Error("--line か mapping.dokotreId を指定してください。");

	const lineJson = await loadJson(options.lineJson || buildDokotreUrl("line", dokotreId));
	const diagramJson = await loadJson(options.diagramJson || buildDokotreUrl("diagram", dokotreId));
	const statusJson = await loadJson(options.statusJson || buildDokotreUrl("status", dokotreId));
	const stationKeyOverrides = options.stationKeyMap ? await loadJson(options.stationKeyMap) : {};
	const context = buildMappingContext(mapping, lineJson, stationKeyOverrides);

	const daiya = convertDaiya(diagramJson, context, { includeMeta: options.meta });
	const locationNow = convertLocationNow(statusJson, diagramJson, context, { includeMeta: options.meta });
	const rosenNow = convertRosenNow(statusJson, context);

	if (options.outLocation) writeJson(options.outLocation, locationNow);
	if (options.outDaiya) writeJson(options.outDaiya, daiya);
	if (options.outRosen) writeJson(options.outRosen, rosenNow);

	if (options.summary) {
		printSummary(locationNow, daiya, rosenNow);
		return;
	}

	if (!options.outLocation && !options.outDaiya && !options.outRosen) {
		process.stdout.write(JSON.stringify({ location: locationNow, daiya, rosen: rosenNow }, null, "\t") + "\n");
		return;
	}

	if (options.outLocation) process.stdout.write("Wrote " + path.resolve(options.outLocation) + "\n");
	if (options.outDaiya) process.stdout.write("Wrote " + path.resolve(options.outDaiya) + "\n");
	if (options.outRosen) process.stdout.write("Wrote " + path.resolve(options.outRosen) + "\n");
}

function parseArgs(argv) {
	const result = {};
	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (arg === "--summary") {
			result.summary = true;
		} else if (arg === "--meta") {
			result.meta = true;
		} else if (arg.startsWith("--")) {
			const key = arg.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
			result[key] = argv[i + 1];
			i += 1;
		}
	}
	return result;
}

function buildDokotreUrl(kind, dokotreId) {
	if (kind === "line") return `${DEFAULT_DOKOTRE_BASE}/line/${dokotreId}.json`;
	if (kind === "diagram") return `${DEFAULT_DOKOTRE_BASE}/diagram/line/${dokotreId}.json`;
	if (kind === "status") return `${DEFAULT_DOKOTRE_BASE}/trainstatus/${dokotreId}.json`;
	throw new Error("unknown dokotre url kind: " + kind);
}

async function loadJson(source) {
	if (!source) throw new Error("JSON source is empty.");
	if (/^https?:\/\//i.test(source)) {
		const response = await fetch(source);
		if (!response.ok) throw new Error("JSONを取得できませんでした: " + source + " (" + response.status + ")");
		return response.json();
	}
	const resolved = path.resolve(source);
	return JSON.parse(fs.readFileSync(resolved, "utf8"));
}

function writeJson(outputPath, data) {
	const resolved = path.resolve(outputPath);
	fs.mkdirSync(path.dirname(resolved), { recursive: true });
	fs.writeFileSync(resolved, JSON.stringify(data, null, "\t") + "\n", "utf8");
}

function buildMappingContext(mapping, lineJson, stationKeyOverrides) {
	const positions = Array.isArray(mapping.stations) ? mapping.stations : [];
	const stationById = new Map();
	const stationOrder = [];
	const positionByStationId = new Map();
	const positionByPair = new Map();
	const stationKeyById = new Map();

	positions.forEach((row, index) => {
		if (!row || !row.stationId) return;
		const station = Object.assign({ index }, row);
		stationById.set(toText(row.stationId), station);
		stationOrder.push(station);
		positionByStationId.set(toText(row.stationId), station);
		if (row.hokkaidoKey) stationKeyById.set(toText(row.stationId), toText(row.hokkaidoKey));
	});

	(Array.isArray(lineJson && lineJson.data) ? lineJson.data : []).forEach((row) => {
		const stationId = toText(row && row.STATION_ID);
		if (!stationId || stationById.has(stationId)) return;
		stationById.set(stationId, {
			stationId,
			name: toText(row.STATION_NAME_KANJI),
			index: Number.MAX_SAFE_INTEGER
		});
	});

	Object.keys(stationKeyOverrides || {}).forEach((stationId) => {
		const value = stationKeyOverrides[stationId];
		if (value !== null && value !== undefined && toText(value)) {
			stationKeyById.set(toText(stationId), toText(value));
		}
	});

	positions.forEach((row, index) => {
		if (!row || row.stationId) return;
		const prev = findNeighborStation(positions, index, -1);
		const next = findNeighborStation(positions, index, 1);
		if (!prev || !next) return;
		positionByPair.set(makePairKey(prev.stationId, next.stationId), Object.assign({ prev, next, index }, row));
		positionByPair.set(makePairKey(next.stationId, prev.stationId), Object.assign({ prev: next, next: prev, index }, row));
	});

	return {
		dokotreId: toText(mapping.dokotreId),
		senku: toText(mapping.senku || mapping.dokotreId),
		lineName: toText(mapping.lineName),
		positions,
		stationById,
		stationOrder,
		positionByStationId,
		positionByPair,
		stationKeyById
	};
}

function findNeighborStation(positions, startIndex, step) {
	for (let i = startIndex + step; i >= 0 && i < positions.length; i += step) {
		if (positions[i] && positions[i].stationId) return positions[i];
	}
	return null;
}

function convertLocationNow(statusJson, diagramJson, context, options) {
	const settings = options || {};
	const statusRows = getStatusRows(statusJson);
	const diagramByKey = buildDiagramIndex(diagramJson);
	const trains = statusRows.map((entry) => {
		const row = entry.value;
		const diagram = diagramByKey.get(entry.key) || diagramByKey.get(toText(row.TRAIN_LCLID).replace(/\.0$/, "")) || null;
		const destinationId = toText(row.END_STATION || diagram && diagram.END_RLSTC);
		const position = resolvePosition(row, context);
		const status = getUnkouStatus(diagram);
		const statusDetails = getStatusDetails(diagram, context);
		const trainName = buildTrainName(diagram, row);

		return {
			cbango: getTrainNo(entry.key, diagram),
			type: mapTrainType(diagram, row),
			pos: position.key,
			posName: position.name,
			chien: toNumber(row.LATENCY),
			shuEkiSimple: getStationName(destinationId, context) || toText(diagram && diagram.END_RLSTC_LNAME),
			shuEkiName: getStationName(destinationId, context) || toText(diagram && diagram.END_RLSTC_LNAME),
			shuEkiKey: getStationKey(destinationId, context),
			status,
			statusDetail: statusDetails.ja,
			statusDetailEn: statusDetails.en,
			statusDetailTc: statusDetails.tc,
			statusDetailSc: statusDetails.sc,
			statusDetailKr: statusDetails.kr,
			senku: context.senku,
			ryosu: getCars(diagram),
			yokuStatus: 0,
			yokuDetail: {
				ja: "",
				en: "",
				tc: "",
				sc: "",
				kr: ""
			},
			runStatus: toNumber(row.STATUS),
			name: trainName,
			source: "dokotre",
			dokotre: {
				key: entry.key,
				bound: toText(row.BOUND),
				preStation: toText(row.PRE_STATION),
				curStation: toText(row.CUR_STATION),
				posStation: toText(row.POS_STATION),
				sectionId: toText(row.SECTION_ID),
				lastUpdateTime: toText(row.LAST_UPDATE_TIME),
				scdlTime: toText(row.SCDL_TIME)
			}
		};
	});

	const result = {
		time: formatDokotreTimestamp(statusJson && (statusJson.created || statusJson.announced_date)),
		trains
	};
	if (settings.includeMeta) {
		result.meta = {
			source: "dokotre",
			line: context.dokotreId,
			senku: context.senku,
			lineName: context.lineName,
			created: toText(statusJson && statusJson.created),
			announcedDate: toText(statusJson && statusJson.announced_date)
		};
	}
	return result;
}

function convertDaiya(diagramJson, context, options) {
	const settings = options || {};
	const unmatchedStations = new Set();
	const today = (Array.isArray(diagramJson && diagramJson.DIAGRAM) ? diagramJson.DIAGRAM : []).map((train) => {
		const stations = convertDaiyaStations(train, context, unmatchedStations);
		const destinationKey = getStationKey(train.END_RLSTC, context) || (stations.length ? stations[stations.length - 1].key : "");
		return {
			cbango: toText(train.TRAIN_ID),
			name: buildTrainName(train),
			type: mapTrainType(train),
			shuEkiKey: destinationKey,
			ryosu: getCars(train),
			stations
		};
	});

	const result = { today };
	if (settings.includeMeta) {
		result.meta = {
			source: "dokotre",
			line: context.dokotreId,
			senku: context.senku,
			lineName: context.lineName,
			created: toText(diagramJson && diagramJson.created),
			announcedDate: toText(diagramJson && diagramJson.announced_date),
			unmatchedStations: Array.from(unmatchedStations).sort()
		};
	}
	return result;
}

function convertRosenNow(statusJson, context) {
	const statusRows = getStatusRows(statusJson);
	const maxChien = statusRows.reduce((max, entry) => Math.max(max, toNumber(entry.value && entry.value.LATENCY)), 0);
	return {
		lines: [
			{
				rosen: context.senku,
				maxChien
			}
		]
	};
}

function getStatusRows(statusJson) {
	const trainStatus = statusJson && statusJson.LINE_STATUS && statusJson.LINE_STATUS.TRAIN_STATUS;
	if (!trainStatus || typeof trainStatus !== "object") return [];
	return Object.keys(trainStatus).sort().map((key) => ({ key, value: trainStatus[key] }));
}

function buildDiagramIndex(diagramJson) {
	const index = new Map();
	(Array.isArray(diagramJson && diagramJson.DIAGRAM) ? diagramJson.DIAGRAM : []).forEach((train) => {
		const trainId = toText(train.TRAIN_ID);
		const start = toText(train.START_RLSTC);
		const end = toText(train.END_RLSTC);
		if (trainId && start && end) index.set(`${trainId}:${start}-${end}`, train);
		const trainLocalId = toText(train.TRAIN_LCLID).replace(/^(\d{8}:)/, "").replace(/\.0$/, "");
		if (trainLocalId) index.set(trainLocalId, train);
	});
	return index;
}

function resolvePosition(row, context) {
	const direction = getDirectionSuffix(row && row.BOUND);
	const cur = toText(row && row.CUR_STATION);
	const pre = toText(row && row.PRE_STATION);
	const pos = toText(row && row.POS_STATION);

	if (cur && cur !== "0") {
		const stationPosition = context.positionByStationId.get(cur);
		if (stationPosition) return positionResult(stationPosition, direction);
	}

	if (pre && pre !== "0" && pos && pos !== "0") {
		const pairPosition = context.positionByPair.get(makePairKey(pre, pos));
		if (pairPosition) return positionResult(pairPosition, direction);
	}

	if (pos && pos !== "0") {
		const stationPosition = context.positionByStationId.get(pos);
		if (stationPosition) return positionResult(stationPosition, direction);
	}

	if (pre && pre !== "0") {
		const stationPosition = context.positionByStationId.get(pre);
		if (stationPosition) return positionResult(stationPosition, direction);
	}

	return { key: "", name: "" };
}

function positionResult(position, direction) {
	return {
		key: direction === "U" ? toText(position.up) : toText(position.down),
		name: makePositionName(position, direction)
	};
}

function makePositionName(position, direction) {
	if (position && position.prev && position.next) {
		const from = direction === "U" ? position.next : position.prev;
		const to = direction === "U" ? position.prev : position.next;
		const fromName = toText(from && from.name);
		const toName = toText(to && to.name);
		if (fromName && toName) return `${fromName}→${toName} 間`;
	}
	return toText(position && position.name);
}

function getDirectionSuffix(bound) {
	return toText(bound) === "1" ? "U" : "D";
}

function makePairKey(a, b) {
	return `${toText(a)}>${toText(b)}`;
}

function getUnkouStatus(diagram) {
	const flag = toText(diagram && diagram.CANCEL_FLAG);
	if (flag === "T") return "0";
	if (flag === "P") return "2";
	return "1";
}

function getStatusDetails(diagram, context) {
	const flag = toText(diagram && diagram.CANCEL_FLAG);
	if (!diagram || (flag !== "T" && flag !== "P")) return blankDetails();
	const suspendedStops = (Array.isArray(diagram.SDL) ? diagram.SDL : []).filter((row) => toText(row.SSPNSN_FLAG) !== "0");
	if (suspendedStops.length < 1) return blankDetails();
	const first = getStationName(suspendedStops[0].RLSTC_LCLID, context) || toText(suspendedStops[0].RLSTC_LNAME);
	const last = getStationName(suspendedStops[suspendedStops.length - 1].RLSTC_LCLID, context) || toText(suspendedStops[suspendedStops.length - 1].RLSTC_LNAME);
	const ja = first && last ? `${first}～${last}間運休` : "";
	return {
		ja,
		en: "",
		tc: "",
		sc: "",
		kr: ""
	};
}

function blankDetails() {
	return {
		ja: "",
		en: "",
		tc: "",
		sc: "",
		kr: ""
	};
}

function convertDaiyaStations(train, context, unmatchedStations) {
	const seen = new Set();
	const rows = [];
	(Array.isArray(train && train.SDL) ? train.SDL : []).forEach((row, index, allRows) => {
		const stationId = toText(row && row.RLSTC_LCLID);
		if (!stationId) return;
		const key = getStationKey(stationId, context);
		if (!key) {
			if (unmatchedStations) unmatchedStations.add(stationId);
			return;
		}
		if (!isDaiyaStop(row)) return;
		const time = selectDaiyaTime(row, index === allRows.length - 1);
		if (!time || seen.has(key)) return;
		seen.add(key);
		rows.push({ key, time });
	});
	return rows;
}

function isDaiyaStop(row) {
	const passCode = toText(row && row.PASS_CODE);
	if (passCode === "10" || passCode === "30") return false;
	return Boolean(toText(row && (row.STD || row.STA)));
}

function selectDaiyaTime(row, isLast) {
	if (!row) return "";
	if (isLast) return toText(row.STA) || toText(row.STD);
	return toText(row.STD) || toText(row.STA);
}

function buildTrainName(diagram, statusRow) {
	const nickname = toText(diagram && diagram.TRAIN_NNAME) || toText(statusRow && statusRow.TRAIN_NNAME);
	const nicknameNo = toText(diagram && diagram.TRAIN_NNAME_ID) || toText(statusRow && statusRow.TRAIN_NNO);
	if (nickname && nicknameNo && nicknameNo !== "0") return `${nickname}${nicknameNo}号`;
	if (nickname) return nickname;
	return "普通列車";
}

function mapTrainType(diagram, statusRow) {
	const nickname = toText(diagram && diagram.TRAIN_NNAME) || toText(statusRow && statusRow.TRAIN_NNAME);
	if (nickname.indexOf("つばさ") >= 0) return "4";
	return "3";
}

function getTrainNo(statusKey, diagram) {
	return toText(diagram && diagram.TRAIN_ID) || toText(statusKey).split(":")[0];
}

function getCars(diagram) {
	const cars = toText(diagram && diagram.UNIT_INFO);
	return cars && cars !== "0" ? cars : "";
}

function getStationName(stationId, context) {
	const station = context.stationById.get(toText(stationId));
	return station ? toText(station.name) : "";
}

function getStationKey(stationId, context) {
	const id = toText(stationId);
	if (!id) return "";
	return context.stationKeyById.get(id) || id;
}

function formatDokotreTimestamp(value) {
	const date = parseDokotreDate(value);
	if (!date) return undefined;
	const parts = new Intl.DateTimeFormat("ja-JP", {
		timeZone: "Asia/Tokyo",
		year: "numeric",
		month: "numeric",
		day: "numeric",
		hour: "numeric",
		minute: "numeric",
		second: "numeric",
		hour12: false
	}).formatToParts(date).reduce((memo, part) => {
		memo[part.type] = part.value;
		return memo;
	}, {});
	return {
		ja: `${parts.year}年${parts.month}月${parts.day}日${parts.hour}時${parts.minute}分${parts.second}秒現在`
	};
}

function parseDokotreDate(value) {
	const text = toText(value);
	if (!text) return null;
	const normalized = text.replace(/\//g, "-").replace(" GMT", "Z").replace(" ", "T");
	const date = new Date(normalized);
	return Number.isNaN(date.getTime()) ? null : date;
}

function printSummary(locationNow, daiya, rosenNow) {
	process.stdout.write("location trains: " + locationNow.trains.length + "\n");
	process.stdout.write("daiya trains: " + daiya.today.length + "\n");
	process.stdout.write("rosen maxChien: " + (rosenNow.lines[0] ? rosenNow.lines[0].maxChien : 0) + "\n\n");
	process.stdout.write(["列番", "位置", "遅れ", "行先", "状態"].join("\t") + "\n");
	locationNow.trains.forEach((train) => {
		process.stdout.write([
			train.cbango,
			train.pos,
			train.chien,
			train.shuEkiSimple,
			train.statusDetail || train.status
		].join("\t") + "\n");
	});
}

function toNumber(value) {
	const number = Number(value || 0);
	return Number.isFinite(number) ? number : 0;
}

function toText(value) {
	if (value === null || value === undefined) return "";
	return String(value).trim();
}
