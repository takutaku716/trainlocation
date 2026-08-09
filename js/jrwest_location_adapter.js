(function(root, factory) {
	if (typeof module === "object" && module.exports) {
		module.exports = factory();
	} else {
		root.JrWestLocationAdapter = factory();
	}
}(typeof self !== "undefined" ? self : this, function() {
	"use strict";

	const DESTINATION_SIMPLE_NAMES = {
		"京都": "京",
		"大阪": "阪",
		"新大阪": "新",
		"高槻": "高",
		"西明石": "明",
		"神戸": "神",
		"姫路": "姫",
		"網干": "網",
		"播州赤穂": "赤",
		"米原": "米",
		"野洲": "野",
		"草津": "草",
		"近江今津": "今",
		"敦賀": "敦",
		"長浜": "長",
		"柘植": "柘",
		"関西空港": "関",
		"白浜": "白",
		"新宮": "宮",
		"天王寺": "天",
		"宝塚": "宝",
		"新三田": "三"
	};

	function normalize(locationJson, stationJson, areaMasterJson, currentTimeText, options) {
		const settings = options || {};
		const context = buildContext(stationJson, settings);
		const threshold = getLongTimeStoppingThreshold(areaMasterJson, settings.lineId);
		const currentTime = parseDate(currentTimeText) || parseDate(locationJson && locationJson.update) || new Date();
		const trains = (Array.isArray(locationJson && locationJson.trains) ? locationJson.trains : [])
			.map(function(train) {
				return convertTrain(train, context, currentTime, threshold, settings);
			})
			.filter(Boolean);
		const time = formatTimestamp(locationJson && locationJson.update);
		const result = { trains: trains };
		if (time) {
			result.time = time;
			const timestamp = parseDate(locationJson.update);
			if (timestamp) {
				result.sourceTimes = [{
					rosen: toText(settings.senku),
					text: time.ja,
					timestamp: timestamp.getTime()
				}];
			}
		}
		return result;
	}

	function buildContext(stationJson, options) {
		const settings = options || {};
		const allStations = (Array.isArray(stationJson && stationJson.stations) ? stationJson.stations : [])
			.map(function(row, index) {
				return {
					code: toText(row && row.info && row.info.code),
					name: toText(row && row.info && row.info.name),
					index: index
				};
			})
			.filter(function(row) { return !!row.code; });
		const stationByCode = new Map(allStations.map(function(row) { return [row.code, row]; }));
		const displayStationCodes = new Set((settings.stationCodes || []).map(toText));
		return {
			allStations: allStations,
			stationByCode: stationByCode,
			displayStationCodes: displayStationCodes,
			positionPrefix: toText(settings.positionPrefix) || "JW"
		};
	}

	function convertTrain(train, context, currentTime, threshold, options) {
		if (!train) return null;
		const direction = Number(train.direction) === 0 ? "U" : "D";
		const position = resolvePosition(train.pos, direction, context);
		if (!position.key) return null;
		const destinationName = toText(typeof train.dest === "object" && train.dest ? train.dest.text : train.dest) || "行先取得不可";
		const typeInfo = mapTrainType(train);
		const longTimeStopping = isLongTimeStopping(train, currentTime, threshold);
		return {
			cbango: toText(train.no),
			type: typeInfo.type,
			typeLabel: typeInfo.label,
			pos: position.key,
			posName: position.name,
			chien: Math.max(0, toNumber(train.delayMinutes)),
			shuEkiSimple: getDestinationSimpleName(destinationName),
			shuEkiName: destinationName,
			shuEkiKey: toText(train.dest && train.dest.code),
			status: 1,
			statusDetail: "",
			statusDetailEn: "",
			statusDetailTc: "",
			statusDetailSc: "",
			statusDetailKr: "",
			senku: toText(options && options.senku),
			ryosu: toText(train.numberOfCars),
			yokuStatus: longTimeStopping ? 2 : 0,
			yokuDetail: {
				ja: longTimeStopping ? "停車中" : "",
				en: longTimeStopping ? "Stopped" : "",
				tc: longTimeStopping ? "停車中" : "",
				sc: longTimeStopping ? "停车中" : "",
				kr: longTimeStopping ? "정차 중" : ""
			},
			runStatus: 1,
			name: Array.isArray(train.nickname) ? train.nickname.map(toText).filter(Boolean).join("・") : toText(train.nickname),
			source: "jrwest",
			sourceRosen: toText(options && options.lineId),
			jrWest: {
				direction: Number(train.direction),
				rawPosition: toText(train.pos),
				displayType: toText(train.displayType),
				typeCode: toText(train.type),
				stopTime: toText(train.stopTime),
				longTimeStopping: longTimeStopping,
				timetable: []
			}
		};
	}

	function resolvePosition(rawPosition, direction, context) {
		const positions = toText(rawPosition).split("_").filter(Boolean);
		const stationCodes = positions.filter(function(code) { return code !== "####"; });
		if (stationCodes.length < 1) return { key: "", name: "" };
		if (stationCodes.length === 1 || positions.indexOf("####") >= 0) {
			const code = stationCodes[0];
			if (!context.displayStationCodes.has(code)) return { key: "", name: "" };
			const station = context.stationByCode.get(code);
			return {
				key: makeStationPositionKey(code, direction, context.positionPrefix),
				name: station ? station.name : code
			};
		}

		const first = context.stationByCode.get(stationCodes[0]);
		const second = context.stationByCode.get(stationCodes[1]);
		if (!first || !second || !context.displayStationCodes.has(first.code) || !context.displayStationCodes.has(second.code)) {
			return { key: "", name: "" };
		}
		const ordered = first.index <= second.index ? [first, second] : [second, first];
		const from = direction === "U" ? ordered[1] : ordered[0];
		const to = direction === "U" ? ordered[0] : ordered[1];
		return {
			key: makeBetweenPositionKey(ordered[0].code, ordered[1].code, direction, context.positionPrefix),
			name: from.name + "→" + to.name + " 間"
		};
	}

	function makeStationPositionKey(code, direction, prefix) {
		return (prefix || "JW") + code + direction;
	}

	function makeBetweenPositionKey(firstCode, secondCode, direction, prefix) {
		return (prefix || "JW") + firstCode + "_" + secondCode + direction;
	}

	function mapTrainType(train) {
		const displayType = toText(train && train.displayType);
		if (/特急/.test(displayType)) return { type: "1", label: displayType.replace(/[○●]/g, "") || "特急" };
		if (/新快/.test(displayType)) return { type: "8", label: "新快速" };
		if (/快速/.test(displayType)) return { type: "8", label: "快速" };
		if (/普通/.test(displayType)) return { type: "3", label: "普通" };
		if (/回送/.test(displayType)) return { type: "3", label: "回送" };
		return { type: "3", label: displayType.replace(/[○●]/g, "") || "普通" };
	}

	function getLongTimeStoppingThreshold(areaMasterJson, lineId) {
		const info = areaMasterJson && areaMasterJson.longTimeStoppingInfo && areaMasterJson.longTimeStoppingInfo[toText(lineId)];
		const threshold = info && info.thresholdMinutes ? info.thresholdMinutes : {};
		return {
			between: Number.isFinite(Number(threshold.between)) ? Number(threshold.between) : 30,
			inside: Number.isFinite(Number(threshold.inside)) ? Number(threshold.inside) : 30
		};
	}

	function isLongTimeStopping(train, currentTime, threshold) {
		const stopTime = parseDate(train && train.stopTime);
		if (!stopTime || !currentTime) return false;
		const rawPosition = toText(train && train.pos);
		const isInside = rawPosition.indexOf("####") >= 0 || rawPosition.split("_").filter(Boolean).length === 1;
		const thresholdMinutes = isInside ? threshold.inside : threshold.between;
		return (currentTime.getTime() - stopTime.getTime()) / 60000 > thresholdMinutes;
	}

	function getDestinationSimpleName(name) {
		const normalized = toText(name).replace(/\s+/g, "");
		if (!normalized || normalized === "行先取得不可") return "？";
		return DESTINATION_SIMPLE_NAMES[normalized] || Array.from(normalized.replace(/^JR/, ""))[0] || "？";
	}

	function formatTimestamp(value) {
		const date = parseDate(value);
		if (!date) return null;
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
		const text = parts.year + "年" + parts.month + "月" + parts.day + "日" + parts.hour + "時" + parts.minute + "分" + parts.second + "秒現在";
		return { ja: text, en: text, tc: text, sc: text, kr: text };
	}

	function parseDate(value) {
		const text = toText(value);
		if (!text) return null;
		const date = new Date(text);
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
		buildContext: buildContext,
		resolvePosition: resolvePosition,
		isLongTimeStopping: isLongTimeStopping
	};
}));
