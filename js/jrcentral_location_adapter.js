(function(root, factory) {
	if (typeof module === "object" && module.exports) {
		module.exports = factory(require("./jrcentral_station_sets.js"));
	} else {
		root.JrCentralLocationAdapter = factory(root.JrCentralStationSets);
	}
}(typeof self !== "undefined" ? self : this, function(generatedStationSets) {
	"use strict";

	const TOKAIDO_TOYOHASHI_MAIBARA_STATIONS = [
		["90", "CA42", "豊橋"], ["100", "CA43", "西小坂井"], ["110", "CA44", "愛知御津"],
		["120", "CA45", "三河大塚"], ["130", "CA46", "三河三谷"], ["140", "CA47", "蒲郡"],
		["150", "CA48", "三河塩津"], ["160", "CA49", "三ケ根"], ["170", "CA50", "幸田"],
		["4290", "CA51", "相見"], ["180", "CA52", "岡崎"], ["190", "CA53", "西岡崎"],
		["200", "CA54", "安城"], ["210", "CA55", "三河安城"], ["220", "CA56", "東刈谷"],
		["4270", "CA57", "野田新町"], ["230", "CA58", "刈谷"], ["240", "CA59", "逢妻"],
		["250", "CA60", "大府"], ["260", "CA61", "共和"], ["4280", "CA62", "南大高"],
		["270", "CA63", "大高"], ["280", "CA64", "笠寺"], ["290", "CA65", "熱田"],
		["300", "CA66", "金山"], ["4020", "CA67", "尾頭橋"], ["310", "CA68", "名古屋"],
		["320", "CA69", "枇杷島"], ["330", "CA70", "清洲"], ["340", "CA71", "稲沢"],
		["350", "CA72", "尾張一宮"], ["360", "CA73", "木曽川"], ["370", "CA74", "岐阜"],
		["380", "CA75", "西岐阜"], ["390", "CA76", "穂積"], ["400", "CA77", "大垣"],
		["410", "CA78", "垂井"], ["420", "CA79", "関ケ原"], ["430", "CA80", "柏原"],
		["440", "CA81", "近江長岡"], ["450", "CA82", "醒ケ井"], ["460", "CA83", "米原"]
	].map(function(row, index) {
		return { code: row[0], number: row[1], name: row[2], index: index };
	});

	const TOKAIDO_ATAMI_TOYOHASHI_STATIONS = [
		["3110", "CA00", "熱海"], ["3120", "CA01", "函南"], ["3130", "CA02", "三島"],
		["3140", "CA03", "沼津"], ["3150", "CA04", "片浜"], ["3160", "CA05", "原"],
		["3170", "CA06", "東田子の浦"], ["3180", "CA07", "吉原"], ["3190", "CA08", "富士"],
		["3200", "CA09", "富士川"], ["3210", "CA10", "新蒲原"], ["3220", "CA11", "蒲原"],
		["3230", "CA12", "由比"], ["3240", "CA13", "興津"], ["3250", "CA14", "清水"],
		["3260", "CA15", "草薙"], ["4090", "CA16", "東静岡"], ["3270", "CA17", "静岡"],
		["3280", "CA18", "安倍川"], ["3290", "CA19", "用宗"], ["3300", "CA20", "焼津"],
		["3310", "CA21", "西焼津"], ["3320", "CA22", "藤枝"], ["3330", "CA23", "六合"],
		["3340", "CA24", "島田"], ["3350", "CA25", "金谷"], ["3360", "CA26", "菊川"],
		["3370", "CA27", "掛川"], ["4240", "CA28", "愛野"], ["3380", "CA29", "袋井"],
		["4300", "CA30", "御厨"], ["3390", "CA31", "磐田"], ["3400", "CA32", "豊田町"],
		["3410", "CA33", "天竜川"], ["10", "CA34", "浜松"], ["20", "CA35", "高塚"],
		["30", "CA36", "舞阪"], ["40", "CA37", "弁天島"], ["50", "CA38", "新居町"],
		["60", "CA39", "鷲津"], ["70", "CA40", "新所原"], ["80", "CA41", "二川"],
		["90", "CA42", "豊橋"]
	].map(function(row, index) {
		return { code: row[0], number: row[1], name: row[2], index: index };
	});

	const STATION_SETS = {
		tokaido_toyohashi_maibara: TOKAIDO_TOYOHASHI_MAIBARA_STATIONS,
		tokaido_atami_toyohashi: TOKAIDO_ATAMI_TOYOHASHI_STATIONS,
		...(generatedStationSets || {})
	};

	const DESTINATION_SIMPLE_NAMES = {
		"豊橋": "豊", "浜松": "浜", "蒲郡": "蒲", "岡崎": "岡", "刈谷": "刈",
		"金山": "金", "名古屋": "名", "岐阜": "岐", "大垣": "垣", "関ケ原": "関", "米原": "米"
	};

	function normalize(rawJson, options) {
		const settings = options || {};
		const json = parseJson(rawJson);
		const lineName = String(settings.lineName || "東海道線(豊橋～米原)");
		const stations = resolveStations(settings, lineName);
		const rows = Array.isArray(json && json.train_info) ? json.train_info : [];
		const trains = rows.filter(function(row) {
			return getLocalizedTextList(row && row.linename, "ja").indexOf(lineName) >= 0;
		}).map(function(row) {
			return convertTrain(row, settings, stations);
		}).filter(Boolean);
		const time = formatTimestamp(json && json.create_time);
		const result = { trains: trains };
		if (time) {
			result.time = time;
			const timestamp = parseTimestamp(json.create_time);
			if (timestamp) {
				result.sourceTimes = [{
					rosen: String(settings.senku || "74"),
					text: time.ja,
					timestamp: timestamp.getTime()
				}];
			}
		}
		return result;
	}

	function resolveStations(settings, lineName) {
		if (Array.isArray(settings.stations) && settings.stations.length) return settings.stations;
		if (settings.stationSet && STATION_SETS[settings.stationSet]) return STATION_SETS[settings.stationSet];
		if (lineName === "東海道線(熱海～豊橋)") return TOKAIDO_ATAMI_TOYOHASHI_STATIONS;
		return TOKAIDO_TOYOHASHI_MAIBARA_STATIONS;
	}

	function convertTrain(row, settings, stations) {
		const rowNumber = Number(row && row.locationRow);
		const stationIndex = rowNumber - 1;
		if (!Number.isInteger(stationIndex) || stationIndex < 0 || stationIndex >= stations.length) return null;
		const direction = String(row.locationCol) === "2" ? "D" : "U";
		const isBetween = String(row.position) === "1";
		const currentStation = stations[stationIndex];
		const nextStation = stations[stationIndex + 1];
		if (isBetween && !nextStation) return null;
		const position = getPosition(currentStation, nextStation, direction, isBetween, settings.positionPrefix || "JTC");
		const type = mapTrainType(getLocalizedText(row.traintype, "ja"));
		const destination = getDestination(row);
		const nickname = getLocalizedText(row.nickname, "ja");
		const nicknameNumber = String(row.nickname_no == null ? "" : row.nickname_no).trim();
		const trainName = nickname ? nickname + (nicknameNumber && nicknameNumber !== "-1" ? normalizeJapaneseNumber(nicknameNumber) + "号" : "") : "";
		return {
			cbango: String(row.trainnumber || "").trim(),
			type: type.type,
			typeLabel: type.label,
			name: trainName,
			pos: position.key,
			posName: position.name,
			chien: parseDelay(row.delay_lin),
			shuEkiSimple: getDestinationSimpleName(destination),
			shuEkiName: destination || "行先取得不可",
			shuEkiKey: "",
			ryosu: parseCars(row),
			status: "1",
			statusDetail: "",
			senku: String(settings.senku || "74"),
			source: "jrcentral",
			sourceRosen: String(settings.senku || "74"),
			jrCentral: {
				timetable: [],
				typeSimple: type.simple,
				semanticType: type.semanticType,
				lineColorIconCode: type.iconCode || "",
				trainIdentificationKey: String(row.train_identification_key || "")
			}
		};
	}

	function getPosition(currentStation, nextStation, direction, isBetween, prefix) {
		if (!isBetween) {
			return { key: prefix + currentStation.code + direction, name: currentStation.name };
		}
		const from = direction === "D" ? currentStation : nextStation;
		const to = direction === "D" ? nextStation : currentStation;
		return {
			key: prefix + currentStation.code + "_" + nextStation.code + direction,
			name: from.name + "→" + to.name + " 間"
		};
	}

	function convertTimetable(rawJson, trainIdentificationKey) {
		const json = parseJson(rawJson);
		const key = String(trainIdentificationKey || "").trim();
		if (!key) return [];
		const rows = (Array.isArray(json && json.train_info) ? json.train_info : [])
			.filter(function(train) {
				return String(train && train.train_identification_key || "").trim() === key;
			})
			.reduce(function(result, train) {
				return result.concat(Array.isArray(train && train.timetable) ? train.timetable : []);
			}, [])
			.sort(function(left, right) {
				return Number(left && left.stopStationOrder || 0) - Number(right && right.stopStationOrder || 0);
			});

		return rows.map(function(row) {
			const stationName = getLocalizedText(row && row.station, "ja");
			const planArrival = formatTimetableTime(row && row.arrivalTime1);
			const planDeparture = formatTimetableTime(row && row.departureTime1);
			if (!stationName || (!planArrival && !planDeparture)) return null;
			return {
				stationName: stationName,
				planArrival: planArrival,
				planDeparture: planDeparture,
				prospectArrival: "",
				prospectDeparture: "",
				stationId: "",
				runLine: String(row && row.run_line || ""),
				stopStationOrder: Number(row && row.stopStationOrder || 0)
			};
		}).filter(Boolean);
	}

	function formatTimetableTime(value) {
		const digits = String(value == null ? "" : value).replace(/\D/g, "");
		if (!digits) return "";
		const padded = digits.padStart(4, "0");
		return padded.slice(0, -2) + ":" + padded.slice(-2);
	}

	function mapTrainType(rawType) {
		const label = String(rawType || "").trim();
		if (label === "特急") return { type: "1", label: label, simple: "特", semanticType: "limited_express", iconCode: "" };
		if (label === "急行") return { type: "1", label: label, simple: "急", semanticType: "express", iconCode: "" };
		if (label === "区間快速") return { type: "9", label: label, simple: "区快", semanticType: "section_rapid", iconCode: "section_rapid" };
		if (label === "特別快速") return { type: "8", label: label, simple: "特快", semanticType: "special_rapid", iconCode: "special_rapid" };
		if (label === "新快速") return { type: "8", label: label, simple: "新快", semanticType: "new_rapid", iconCode: "new_rapid" };
		if (label === "快速みえ") return { type: "8", label: label, simple: "みえ", semanticType: "rapid_mie", iconCode: "rapid_mie" };
		if (label === "快速") return { type: "8", label: label, simple: "快", semanticType: "rapid", iconCode: "rapid" };
		if (label === "HL" || label === "ＨＬ" || label.indexOf("ホームライナー") >= 0) return { type: "6", label: "ホームライナー", simple: "ラ", semanticType: "liner", iconCode: "" };
		if (label === "臨時") return { type: "7", label: label, simple: "臨", semanticType: "special", iconCode: "" };
		return { type: "3", label: label || "普通", simple: "普", semanticType: "local", iconCode: "" };
	}

	function getDestination(row) {
		const first = getLocalizedText(row && row.tostation, "ja");
		const second = getLocalizedText(row && row.tostation2, "ja");
		if (first && second && first !== second) return first + "・" + second;
		return first || second || "";
	}

	function getDestinationSimpleName(name) {
		const normalized = String(name || "").replace(/\s+/g, "");
		if (!normalized) return "？";
		if (DESTINATION_SIMPLE_NAMES[normalized]) return DESTINATION_SIMPLE_NAMES[normalized];
		if (normalized.indexOf("・") >= 0) {
			return normalized.split("・").map(function(part) {
				return DESTINATION_SIMPLE_NAMES[part] || Array.from(part)[0] || "？";
			}).join("");
		}
		return Array.from(normalized)[0] || "？";
	}

	function getLocalizedText(value, lang) {
		if (typeof value === "string") return value.trim();
		if (!Array.isArray(value)) return "";
		const preferred = value.find(function(item) { return item && item.lang === lang; });
		const fallback = preferred || value.find(function(item) { return item && item.name; });
		return fallback && fallback.name ? String(fallback.name).trim() : "";
	}

	function getLocalizedTextList(value, lang) {
		if (!Array.isArray(value)) return [];
		return value.filter(function(item) { return item && item.lang === lang && item.name; })
			.map(function(item) { return String(item.name).trim(); });
	}

	function parseDelay(value) {
		const match = String(value == null ? "" : value).match(/-?\d+/);
		return match ? Math.max(0, Number(match[0])) : 0;
	}

	function parseCars(row) {
		const candidates = [row && row.cars, row && row.car_num, row && row.formation_num];
		for (let index = 0; index < candidates.length; index += 1) {
			const match = String(candidates[index] == null ? "" : candidates[index]).match(/\d+/);
			if (match && Number(match[0]) > 0) return Number(match[0]);
		}
		return 0;
	}

	function parseJson(value) {
		if (typeof value !== "string") return value || {};
		try { return JSON.parse(value.replace(/^\uFEFF/, "")); } catch (_error) { return {}; }
	}

	function normalizeJapaneseNumber(value) {
		return String(value || "").replace(/[０-９]/g, function(character) {
			return String.fromCharCode(character.charCodeAt(0) - 0xFEE0);
		});
	}

	function parseTimestamp(value) {
		const match = String(value || "").match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
		if (!match) return null;
		return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]), Number(match[6]));
	}

	function formatTimestamp(value) {
		const date = parseTimestamp(value);
		if (!date) return null;
		const pad = function(number) { return String(number).padStart(2, "0"); };
		const ja = date.getFullYear() + "年" + pad(date.getMonth() + 1) + "月" + pad(date.getDate()) + "日" + pad(date.getHours()) + "時" + pad(date.getMinutes()) + "分現在";
		return { ja: ja, en: ja, tc: ja, sc: ja, kr: ja };
	}

	return {
		normalize: normalize,
		convertTimetable: convertTimetable,
		mapTrainType: mapTrainType,
		stations: TOKAIDO_TOYOHASHI_MAIBARA_STATIONS.slice(),
		stationSets: Object.keys(STATION_SETS).reduce(function(result, key) {
			result[key] = STATION_SETS[key].slice();
			return result;
		}, {})
	};
}));
