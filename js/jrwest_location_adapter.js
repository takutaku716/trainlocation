(function(root, factory) {
	if (typeof module === "object" && module.exports) {
		module.exports = factory();
	} else {
		root.JrWestLocationAdapter = factory();
	}
}(typeof self !== "undefined" ? self : this, function() {
	"use strict";

	const KINKI_TYPE_LABELS = {
		"01": "特急", "02": "特急", "03": "寝台特急",
		"06": "新快速", "07": "新快速", "08": "快速", "09": "快速",
		"10": "普通", "11": "普通", "16": "ライナー", "17": "特別快速",
		"18": "区間快速", "19": "臨時", "20": "特急", "21": "寝台特急",
		"24": "新快速", "25": "快速", "26": "普通", "27": "特別快速",
		"28": "区間快速", "29": "丹波路快速", "30": "関空快速",
		"31": "紀州路快速", "32": "大和路快速", "35": "特急",
		"37": "関空/紀州路快速", "38": "みやこ路快速", "39": "直通快速",
		"40": "B快速", "41": "シャトル",
		"42": "新快速", "43": "新快速", "44": "新快速", "45": "新快速",
		"46": "新快速", "47": "快速", "48": "快速", "49": "快速",
		"50": "快速", "51": "快速", "52": "普通", "53": "普通",
		"54": "普通", "55": "普通", "56": "普通", "57": "直通快速",
		"58": "直通快速", "59": "区間快速", "60": "区間快速",
		"61": "大和路快速", "62": "大和路快速", "63": "快速", "64": "快速",
		"65": "普通", "66": "普通", "67": "丹波路快速", "68": "丹波路快速",
		"69": "みやこ路快速", "70": "みやこ路快速", "71": "新快速",
		"72": "新快速"
	};

	const WIDE_AREA_TYPE_LABELS = {
		"01": "新快速",
		"02": "直通快速",
		"03": "快速",
		"04": "特別快速",
		"05": "丹波路快速",
		"06": "紀州路快速",
		"07": "みやこ路快速",
		"08": "ライナー",
		"09": "区間快速",
		"10": "普通",
		"11": "シャトル",
		"12": "特急",
		"13": "急行",
		"14": "寝台特急",
		"15": "SL",
		"16": "観光列車",
		"17": "瑞風",
		"18": "臨時",
		"19": "臨時特急"
	};

	const KINKI_TYPE_LINES = new Set([
		"hokurikubiwako", "kyoto", "kobesanyo", "ako", "kosei",
		"osakahigashi", "takarazuka", "tozai", "gakkentoshi",
		"osakaloop", "yumesaki", "yamatoji", "hanwahagoromo",
		"kansaiairport"
	]);

	const WIDE_AREA_TYPE_LINES = new Set([
		"hokuriku", "kusatsu", "nara", "sagano", "sanin1", "sanin2",
		"fukuchiyama", "bantan", "maizuru", "wakayama2", "wakayama1",
		"manyomahoroba", "kansai", "kinokuni", "unominato", "setoohashi",
		"ako2", "sanyo1", "tsuyama", "hakubi1", "fukuen1", "kabe",
		"sanyo2", "sanyo3", "geibi1", "kure", "yamaguchi", "sanin3",
		"imbi1", "sanin4", "hakubi2"
	]);

	const LINE_COLOR_ICON_CODES = {
		"hokuriku": "hk1",
		"hokurikubiwako": "kka",
		"kyoto": "kka",
		"kobesanyo": "kka",
		"ako": "kka",
		"kosei": "kkb",
		"kusatsu": "kkc",
		"nara": "kkd",
		"sagano": "kke",
		"sanin1": "kke",
		"sanin2": "kke",
		"osakahigashi": "kkf",
		"takarazuka": "kkg",
		"fukuchiyama": "kkg",
		"tozai": "kkh",
		"gakkentoshi": "kkh",
		"bantan": "kkj",
		"maizuru": "kkl",
		"osakaloop": "kko",
		"yumesaki": "kkp",
		"yamatoji": "kkq",
		"hanwahagoromo": "kkr",
		"kansaiairport": "kks",
		"wakayama2": "kkt",
		"wakayama1": "kkt",
		"manyomahoroba": "kku",
		"kansai": "kkv",
		"kinokuni": "kkw",
		"unominato": "okl",
		"setoohashi": "okm",
		"ako2": "okn",
		"sanyo1": "oks",
		"tsuyama": "okt",
		"hakubi1": "okv",
		"fukuen1": "okz",
		"kabe": "hyb",
		"sanyo2": "hyg",
		"sanyo3": "hy1",
		"geibi1": "hyp",
		"kure": "hyy",
		"yamaguchi": "hy3",
		"sanin3": "sia",
		"imbi1": "sib",
		"sanin4": "sid",
		"hakubi2": "siv"
	};

	const KINKI_DESTINATION_COLOR_ICON_CODES = {
		"hokuriku": "kka",
		"kyoto": "kka",
		"kobesanyo": "kka",
		"sanyo": "kka",
		"ako": "kka",
		"kosei": "kkb",
		"kusatsu": "kkc",
		"nara": "kkd",
		"sagano": "kke",
		"sanin": "kke",
		"osakahigashi": "kkf",
		"takarazuka": "kkg",
		"fukuchiyama": "kkg",
		"tozai": "kkh",
		"gakkentoshi": "kkh",
		"bantan": "kkj",
		"maizuru": "kkl",
		"osakaloop": "kko",
		"yumesaki": "kkp",
		"yamatoji": "kkq",
		"hanwa": "kkr",
		"hanwahagoromo": "kkr",
		"kansaiairport": "kks",
		"wakayama": "kkt",
		"manyomahoroba": "kku",
		"kansai": "kkv",
		"kinokuni": "kkw"
	};

	const TYPE_PRESENTATIONS = {
		"特急": { type: "1", semanticType: "limited_express", simpleLabel: "特" },
		"臨時特急": { type: "1", semanticType: "special_limited_express", simpleLabel: "臨" },
		"急行": { type: "1", semanticType: "express", simpleLabel: "急" },
		"寝台特急": { type: "1", semanticType: "sleeper", simpleLabel: "寝" },
		"瑞風": { type: "1", semanticType: "mizukaze", simpleLabel: "瑞" },
		"ライナー": { type: "6", semanticType: "liner", simpleLabel: "ラ" },
		"新快速": { type: "8", semanticType: "special_rapid", simpleLabel: "新" },
		"直通快速": { type: "8", semanticType: "direct_rapid", simpleLabel: "直" },
		"丹波路快速": { type: "8", semanticType: "tambaji_rapid", simpleLabel: "丹" },
		"紀州路快速": { type: "8", semanticType: "kishuji_rapid", simpleLabel: "紀" },
		"みやこ路快速": { type: "8", semanticType: "miyakoji_rapid", simpleLabel: "都" },
		"大和路快速": { type: "8", semanticType: "yamatoji_rapid", simpleLabel: "大" },
		"関空快速": { type: "8", semanticType: "kansai_airport_rapid", simpleLabel: "関" },
		"関空/紀州路快速": { type: "8", semanticType: "kansai_airport_kishuji_rapid", simpleLabel: "併" },
		"B快速": { type: "8", semanticType: "b_rapid", simpleLabel: "B" },
		"特別快速": { type: "8", semanticType: "special_rapid_service", simpleLabel: "特" },
		"区間快速": { type: "9", semanticType: "section_rapid", simpleLabel: "区" },
		"快速": { type: "8", semanticType: "rapid", simpleLabel: "快" },
		"シャトル": { type: "8", semanticType: "shuttle", simpleLabel: "シ" },
		"SL": { type: "7", semanticType: "steam_locomotive", simpleLabel: "S" },
		"観光列車": { type: "7", semanticType: "sightseeing", simpleLabel: "観" },
		"臨時": { type: "7", semanticType: "special", simpleLabel: "臨" },
		"普通": { type: "3", semanticType: "local", simpleLabel: "普" },
		"回送": { type: "3", semanticType: "out_of_service", simpleLabel: "回" }
	};

	const DISPLAY_TYPE_ALIASES = [
		["関空/紀州路快速", ["関空/紀州路快速", "関空・紀州路快速"]],
		["臨時特急", ["臨時特急"]],
		["丹波路快速", ["丹波路快速"]],
		["紀州路快速", ["紀州路快速"]],
		["みやこ路快速", ["みやこ路快速"]],
		["大和路快速", ["大和路快速"]],
		["関空快速", ["関空快速"]],
		["直通快速", ["直通快速"]],
		["新快速", ["新快速", "新快"]],
		["特別快速", ["特別快速"]],
		["区間快速", ["区間快速"]],
		["B快速", ["B快速"]],
		["快速", ["快速"]],
		["シャトル", ["シャトル"]],
		["急行", ["急行"]],
		["寝台特急", ["寝台特急", "寝台"]],
		["SL", ["SL"]],
		["観光列車", ["観光列車"]],
		["瑞風", ["瑞風"]],
		["臨時", ["臨時"]],
		["特急", ["特急"]],
		["ライナー", ["ライナー"]],
		["普通", ["普通"]],
		["回送", ["回送"]]
	];

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
					notDisplayType: Number(row && row.info && row.info.notDisplayType),
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
		let direction = Number(train.direction) === 0 ? "U" : "D";
		const destinationCode = toText(train.dest && train.dest.code);
		const destinationLine = toText(train.dest && train.dest.line);
		if (toText(options && options.lineId) === "hanwahagoromo" && destinationLine === "hagoromo") {
			if (destinationCode === "2651") direction = "D";
			if (destinationCode === "2613") direction = "U";
		}
		const position = resolvePosition(train.pos, direction, context);
		if (!position.key) return null;
		const destinationName = toText(typeof train.dest === "object" && train.dest ? train.dest.text : train.dest) || "行先取得不可";
		const typeInfo = mapTrainType(train, options);
		const lineColorIconCode = getLineColorIconCode(train, options, typeInfo);
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
				typeCode: typeInfo.typeCode,
				typeClassSystem: typeInfo.classSystem,
				semanticType: typeInfo.semanticType,
				typeSimple: typeInfo.simpleLabel,
				lineColorIconCode: lineColorIconCode,
				codeTypeLabel: typeInfo.codeLabel,
				displayTypeLabel: typeInfo.displayLabel,
				typeChange: toText(train.typeChange),
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
			const nonDisplaySection = resolveNonDisplaySection(station, direction, context);
			if (nonDisplaySection) {
				return {
					key: makeStationPositionKey(nonDisplaySection.positionCode, direction, context.positionPrefix),
					name: nonDisplaySection.name
				};
			}
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

	function resolveNonDisplaySection(station, direction, context) {
		if (!station || station.notDisplayType !== 5) return null;
		let firstIndex = station.index;
		let lastIndex = station.index;
		while (firstIndex > 0 && context.allStations[firstIndex - 1].notDisplayType === 5) firstIndex -= 1;
		while (lastIndex < context.allStations.length - 1 && context.allStations[lastIndex + 1].notDisplayType === 5) lastIndex += 1;

		const previousStation = context.allStations[firstIndex - 1];
		const nextStation = context.allStations[lastIndex + 1];
		if (
			!previousStation || !nextStation ||
			!context.displayStationCodes.has(previousStation.code) ||
			!context.displayStationCodes.has(nextStation.code)
		) return null;

		const from = direction === "U" ? nextStation : previousStation;
		const to = direction === "U" ? previousStation : nextStation;
		return {
			positionCode: context.allStations[firstIndex].code,
			name: from.name + "→" + to.name + " 間"
		};
	}

	function makeStationPositionKey(code, direction, prefix) {
		return (prefix || "JW") + code + direction;
	}

	function makeBetweenPositionKey(firstCode, secondCode, direction, prefix) {
		return (prefix || "JW") + firstCode + "_" + secondCode + direction;
	}

	function mapTrainType(train, options) {
		const classSystem = getTrainTypeClassSystem(options);
		const typeCode = normalizeTypeCode(train && train.type);
		const typeTable = classSystem === "kinki" ? KINKI_TYPE_LABELS : WIDE_AREA_TYPE_LABELS;
		const codeLabel = typeTable[typeCode] || "";
		const displayLabel = normalizeDisplayTypeLabel(train && train.displayType);
		const label = codeLabel || displayLabel;
		const presentation = TYPE_PRESENTATIONS[label];

		if (!label || !presentation) {
			return {
				type: "unknown",
				label: label,
				semanticType: "unknown",
				simpleLabel: "",
				classSystem: classSystem,
				typeCode: typeCode,
				codeLabel: codeLabel,
				displayLabel: displayLabel
			};
		}

		return {
			type: presentation.type,
			label: label,
			semanticType: presentation.semanticType,
			simpleLabel: presentation.simpleLabel,
			classSystem: classSystem,
			typeCode: typeCode,
			codeLabel: codeLabel,
			displayLabel: displayLabel
		};
	}

	function getLineColorIconCode(train, options, typeInfo) {
		const settings = options || {};
		const normalizedType = typeInfo || mapTrainType(train, settings);
		if (
			normalizedType.semanticType === "limited_express" ||
			normalizedType.semanticType === "special_limited_express" ||
			normalizedType.semanticType === "sleeper"
		) {
			return "";
		}
		const destinationLine = toText(
			train && typeof train.dest === "object" && train.dest ? train.dest.line : ""
		);
		if (!destinationLine) return "";
		if (
			normalizedType.classSystem === "kinki" &&
			KINKI_DESTINATION_COLOR_ICON_CODES[destinationLine]
		) {
			return KINKI_DESTINATION_COLOR_ICON_CODES[destinationLine];
		}
		return LINE_COLOR_ICON_CODES[destinationLine] || "";
	}

	function getTrainTypeClassSystem(options) {
		const settings = options || {};
		if (settings.classSystem === "kinki" || settings.classSystem === "wide_area") {
			return settings.classSystem;
		}
		const lineId = toText(settings.lineId);
		if (KINKI_TYPE_LINES.has(lineId)) return "kinki";
		if (WIDE_AREA_TYPE_LINES.has(lineId)) return "wide_area";
		return toText(settings.areaId) === "kinki" ? "kinki" : "wide_area";
	}

	function normalizeTypeCode(value) {
		const text = toText(value);
		if (!text) return "";
		return /^\d+$/.test(text) ? text.padStart(2, "0") : text;
	}

	function normalizeDisplayTypeLabel(value) {
		const raw = toText(value).replace(/[○●]/g, "").trim();
		if (!raw) return "";
		const compact = raw
			.replace(/\s+/g, "")
			.replace(/／/g, "/")
			.replace(/Ｂ/g, "B");
		for (const entry of DISPLAY_TYPE_ALIASES) {
			if (entry[1].some(function(alias) { return compact.indexOf(alias) >= 0; })) {
				return entry[0];
			}
		}
		return raw;
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
		isLongTimeStopping: isLongTimeStopping,
		mapTrainType: mapTrainType,
		getTrainTypeClassSystem: getTrainTypeClassSystem,
		getLineColorIconCode: getLineColorIconCode
	};
}));
