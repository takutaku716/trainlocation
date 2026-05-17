(function(root, factory) {
	if (typeof module === "object" && module.exports) {
		module.exports = factory();
	} else {
		root.DokotreLocationAdapter = factory();
	}
}(typeof self !== "undefined" ? self : this, function() {
	"use strict";

	const DESTINATION_SIMPLE_NAMES = {
		"東京": "東",
		"山形": "山",
		"福島": "福",
		"米沢": "米",
		"新庄": "庄",
		"天童": "天",
		"村山": "村",
		"仙台": "仙",
		"寒河江": "寒",
		"左沢": "左",
		"庭坂": "庭"
	};

	function normalize(lineJson, diagramJson, statusJson, mapping, options) {
		const settings = options || {};
		const context = buildMappingContext(mapping, lineJson, settings.stationKeyMap || {}, settings);
		return {
			location: convertLocationNow(statusJson, diagramJson, context, settings),
			daiya: convertDaiya(diagramJson, context, settings),
			rosen: convertRosenNow(statusJson, context)
		};
	}

	function buildMappingContext(mapping, lineJson, stationKeyOverrides, options) {
		const settings = options || {};
		const positions = Array.isArray(mapping && mapping.stations) ? mapping.stations : [];
		const stationById = new Map();
		const stationOrder = [];
		const positionByStationId = new Map();
		const positionByPair = new Map();
		const stationKeyById = new Map();

		positions.forEach(function(row, index) {
			if (!row || !row.stationId) return;
			const station = Object.assign({ index: index }, row);
			const stationId = toText(row.stationId);
			stationById.set(stationId, station);
			stationOrder.push(station);
			positionByStationId.set(stationId, station);
			if (row.hokkaidoKey) stationKeyById.set(stationId, toText(row.hokkaidoKey));
		});

		(Array.isArray(lineJson && lineJson.data) ? lineJson.data : []).forEach(function(row) {
			const stationId = toText(row && row.STATION_ID);
			if (!stationId || stationById.has(stationId)) return;
			stationById.set(stationId, {
				stationId: stationId,
				name: toText(row.STATION_NAME_KANJI),
				index: Number.MAX_SAFE_INTEGER
			});
		});

		Object.keys(stationKeyOverrides || {}).forEach(function(stationId) {
			const value = stationKeyOverrides[stationId];
			if (value !== null && value !== undefined && toText(value)) {
				stationKeyById.set(toText(stationId), toText(value));
			}
		});

		positions.forEach(function(row, index) {
			if (!row || row.stationId) return;
			const prev = findNeighborStation(positions, index, -1);
			const next = findNeighborStation(positions, index, 1);
			if (!prev || !next) return;
			positionByPair.set(makePairKey(prev.stationId, next.stationId), Object.assign({ prev: prev, next: next, index: index }, row));
			positionByPair.set(makePairKey(next.stationId, prev.stationId), Object.assign({ prev: next, next: prev, index: index }, row));
		});

		return {
			dokotreId: toText(settings.dokotreId || mapping && mapping.dokotreId),
			senku: toText(settings.senku || mapping && (mapping.senku || mapping.dokotreId)),
			lineName: toText(mapping && mapping.lineName),
			positions: positions,
			stationById: stationById,
			stationOrder: stationOrder,
			positionByStationId: positionByStationId,
			positionByPair: positionByPair,
			stationKeyById: stationKeyById
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
		const trains = statusRows.map(function(entry) {
			const row = entry.value;
			const diagram = diagramByKey.get(entry.key) || diagramByKey.get(toText(row && row.TRAIN_LCLID).replace(/\.0$/, "")) || null;
			const destinationId = toText(row && row.END_STATION || diagram && diagram.END_RLSTC);
			const position = resolvePosition(row, context);
			const status = getUnkouStatus(diagram);
			const statusDetails = getStatusDetails(diagram, context);
			const trainName = buildTrainName(diagram, row);

			const destinationName = getStationName(destinationId, context) || toText(diagram && diagram.END_RLSTC_LNAME);

			return {
				cbango: getTrainNo(entry.key, diagram),
				type: mapTrainType(diagram, row),
				pos: position.key,
				posName: position.name,
				chien: toNumber(row && row.LATENCY),
				shuEkiSimple: getDestinationSimpleName(destinationName),
				shuEkiName: destinationName,
				shuEkiKey: getStationKey(destinationId, context),
				status: status,
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
				runStatus: toNumber(row && row.STATUS),
				name: trainName,
				source: "dokotre",
				sourceRosen: context.dokotreId,
				dokotre: {
					key: entry.key,
					bound: toText(row && row.BOUND),
					preStation: toText(row && row.PRE_STATION),
					curStation: toText(row && row.CUR_STATION),
					posStation: toText(row && row.POS_STATION),
					sectionId: toText(row && row.SECTION_ID),
					lastUpdateTime: toText(row && row.LAST_UPDATE_TIME),
					scdlTime: toText(row && row.SCDL_TIME),
					timetable: convertDetailTimetable(diagram, context)
				}
			};
		});

		const time = formatDokotreTimestamp(statusJson && (statusJson.created || statusJson.announced_date));
		const result = {
			time: time,
			trains: trains
		};
		const sourceTime = time ? {
			rosen: context.senku,
			text: time.ja,
			timestamp: parseDokotreDate(statusJson && (statusJson.created || statusJson.announced_date)).getTime()
		} : null;
		if (sourceTime) result.sourceTimes = [sourceTime];
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
		const today = (Array.isArray(diagramJson && diagramJson.DIAGRAM) ? diagramJson.DIAGRAM : []).map(function(train) {
			const stations = convertDaiyaStations(train, context, unmatchedStations);
			const destinationKey = getStationKey(train.END_RLSTC, context) || (stations.length ? stations[stations.length - 1].key : "");
			return {
				cbango: toText(train.TRAIN_ID),
				name: buildTrainName(train),
				type: mapTrainType(train),
				shuEkiKey: destinationKey,
				ryosu: getCars(train),
				stations: stations
			};
		});

		const result = { today: today };
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
		const maxChien = statusRows.reduce(function(max, entry) {
			return Math.max(max, toNumber(entry.value && entry.value.LATENCY));
		}, 0);
		return {
			lines: [
				{
					rosen: context.senku,
					maxChien: maxChien
				}
			]
		};
	}

	function getStatusRows(statusJson) {
		const trainStatus = statusJson && statusJson.LINE_STATUS && statusJson.LINE_STATUS.TRAIN_STATUS;
		if (!trainStatus || typeof trainStatus !== "object") return [];
		return Object.keys(trainStatus).sort().map(function(key) {
			return { key: key, value: trainStatus[key] };
		});
	}

	function buildDiagramIndex(diagramJson) {
		const index = new Map();
		(Array.isArray(diagramJson && diagramJson.DIAGRAM) ? diagramJson.DIAGRAM : []).forEach(function(train) {
			const trainId = toText(train.TRAIN_ID);
			const start = toText(train.START_RLSTC);
			const end = toText(train.END_RLSTC);
			if (trainId && start && end) index.set(trainId + ":" + start + "-" + end, train);
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
			if (fromName && toName) return fromName + "→" + toName + " 間";
		}
		return toText(position && position.name);
	}

	function getDirectionSuffix(bound) {
		return toText(bound) === "1" ? "U" : "D";
	}

	function makePairKey(a, b) {
		return toText(a) + ">" + toText(b);
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
		const suspendedStops = (Array.isArray(diagram.SDL) ? diagram.SDL : []).filter(function(row) {
			return toText(row.SSPNSN_FLAG) !== "0";
		});
		if (suspendedStops.length < 1) return blankDetails();
		const first = getStationName(suspendedStops[0].RLSTC_LCLID, context) || toText(suspendedStops[0].RLSTC_LNAME);
		const last = getStationName(suspendedStops[suspendedStops.length - 1].RLSTC_LCLID, context) || toText(suspendedStops[suspendedStops.length - 1].RLSTC_LNAME);
		const ja = first && last ? first + "～" + last + "間運休" : "";
		return {
			ja: ja,
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
		(Array.isArray(train && train.SDL) ? train.SDL : []).forEach(function(row, index, allRows) {
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
			rows.push({ key: key, time: time });
		});
		return rows;
	}

	function convertDetailTimetable(train, context) {
		const seen = new Set();
		const rows = [];
		(Array.isArray(train && train.SDL) ? train.SDL : []).forEach(function(row, index, allRows) {
			if (!isDaiyaStop(row)) return;
			const stationId = toText(row && row.RLSTC_LCLID);
			const stationName = getStationName(stationId, context) || toText(row && row.RLSTC_LNAME);
			if (!stationName || seen.has(stationName)) return;
			const planArrival = toText(row && row.STA);
			const planDeparture = toText(row && row.STD);
			const time = selectDaiyaTime(row, index === allRows.length - 1);
			if (!time && !planArrival && !planDeparture) return;
			seen.add(stationName);
			rows.push({
				stationName: stationName,
				planArrival: planArrival,
				planDeparture: planDeparture,
				time: time
			});
		});
		return rows;
	}

	function isDaiyaStop(row) {
		const passCode = toText(row && row.PASS_CODE);
		if (passCode === "10" || passCode === "23" || passCode === "30") return false;
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
		if (nickname && nicknameNo && nicknameNo !== "0") return nickname + nicknameNo + "号";
		if (nickname) return nickname;
		return "普通列車";
	}

	function mapTrainType(diagram, statusRow) {
		const nickname = toText(diagram && diagram.TRAIN_NNAME) || toText(statusRow && statusRow.TRAIN_NNAME);
		if (nickname.indexOf("つばさ") >= 0) return "1";
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

	function getDestinationSimpleName(name) {
		const normalized = toText(name).replace(/\s+/g, "");
		return DESTINATION_SIMPLE_NAMES[normalized] || normalized;
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
		}).formatToParts(date).reduce(function(memo, part) {
			memo[part.type] = part.value;
			return memo;
		}, {});
		const ja = parts.year + "年" + parts.month + "月" + parts.day + "日" + parts.hour + "時" + parts.minute + "分" + parts.second + "秒現在";
		return {
			ja: ja,
			en: ja,
			tc: ja,
			sc: ja,
			kr: ja
		};
	}

	function parseDokotreDate(value) {
		const text = toText(value);
		if (!text) return null;
		const normalized = text.replace(/\//g, "-").replace(" GMT", "Z").replace(" ", "T");
		const date = new Date(normalized);
		return Number.isNaN(date.getTime()) ? null : date;
	}

	function toNumber(value) {
		const number = Number(value || 0);
		return Number.isFinite(number) ? number : 0;
	}

	function toText(value) {
		if (value === null || value === undefined) return "";
		return String(value).trim();
	}

	return {
		normalize: normalize,
		buildMappingContext: buildMappingContext,
		convertLocationNow: convertLocationNow,
		convertDaiya: convertDaiya,
		convertRosenNow: convertRosenNow
	};
}));
