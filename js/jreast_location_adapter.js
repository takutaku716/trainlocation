(function(root, factory) {
	if (typeof module === "object" && module.exports) {
		module.exports = factory();
	} else {
		root.JrEastLocationAdapter = factory();
	}
}(typeof self !== "undefined" ? self : this, function() {
	"use strict";

	const JREAST_SCREEN_POSITION_MASTERS = {
		"88": {
			rosenCode: "13",
			positions: {
				"52": "東京",
				"51": "東京上野",
				"50": "上野",
				"49": "上野大宮",
				"48": "大宮",
				"47": "大宮小山",
				"46": "小山",
				"45": "小山宇都宮",
				"44": "宇都宮",
				"43": "宇都宮那須塩原",
				"42": "那須塩原",
				"41": "那須塩原新白河",
				"40": "新白河",
				"39": "新白河郡山",
				"38": "郡山",
				"37": "郡山福島",
				"36": "福島",
				"35": "福島白石蔵王",
				"34": "白石蔵王",
				"33": "白石蔵王仙台",
				"32": "仙台",
				"31": "仙台古川",
				"30": "古川",
				"29": "古川くりこま高原",
				"28": "くりこま高原",
				"27": "くりこま高原一ノ関",
				"26": "一ノ関",
				"25": "一ノ関水沢江刺",
				"24": "水沢江刺",
				"23": "水沢江刺北上",
				"22": "北上",
				"21": "北上新花巻",
				"20": "新花巻",
				"19": "新花巻盛岡",
				"18": "盛岡",
				"17": "盛岡いわて沼宮内",
				"16": "いわて沼宮内",
				"15": "いわて沼宮内二戸",
				"14": "二戸",
				"13": "二戸八戸",
				"12": "八戸",
				"11": "八戸七戸十和田",
				"10": "七戸十和田",
				"9": "七戸十和田新青森",
				"8": "新青森",
				"7": "新青森奥津軽いまべつ",
				"6": "奥津軽いまべつ",
				"5": "奥津軽いまべつ木古内",
				"4": "木古内",
				"3": "木古内新函館北斗",
				"2": "新函館北斗"
			}
		},
		"87": {
			rosenCode: "14",
			positions: {
				"24": "東京",
				"23": "東京上野",
				"22": "上野",
				"21": "上野大宮",
				"20": "大宮",
				"19": "大宮熊谷",
				"18": "熊谷",
				"17": "熊谷本庄早稲田",
				"16": "本庄早稲田",
				"15": "本庄早稲田高崎",
				"14": "高崎",
				"13": "高崎上毛高原",
				"12": "上毛高原",
				"11": "上毛高原越後湯沢",
				"10": "越後湯沢",
				"9": "越後湯沢浦佐",
				"8": "浦佐",
				"7": "浦佐長岡",
				"6": "長岡",
				"5": "長岡燕三条",
				"4": "燕三条",
				"3": "燕三条新潟",
				"2": "新潟"
			}
		},
		"89": {
			rosenCode: "15",
			positions: {
				"48": "\u6771\u4eac",
				"47": "\u6771\u4eac\u4e0a\u91ce",
				"46": "\u4e0a\u91ce",
				"45": "\u4e0a\u91ce\u5927\u5bae",
				"44": "\u5927\u5bae",
				"43": "\u5927\u5bae\u718a\u8c37",
				"42": "\u718a\u8c37",
				"41": "\u718a\u8c37\u672c\u5e84\u65e9\u7a32\u7530",
				"40": "\u672c\u5e84\u65e9\u7a32\u7530",
				"39": "\u672c\u5e84\u65e9\u7a32\u7530\u9ad8\u5d0e",
				"38": "\u9ad8\u5d0e",
				"37": "\u9ad8\u5d0e\u5b89\u4e2d\u69db\u540d",
				"36": "\u5b89\u4e2d\u69db\u540d",
				"35": "\u5b89\u4e2d\u69db\u540d\u8efd\u4e95\u6ca2",
				"34": "\u8efd\u4e95\u6ca2",
				"33": "\u8efd\u4e95\u6ca2\u4f50\u4e45\u5e73",
				"32": "\u4f50\u4e45\u5e73",
				"31": "\u4f50\u4e45\u5e73\u4e0a\u7530",
				"30": "\u4e0a\u7530",
				"29": "\u4e0a\u7530\u9577\u91ce",
				"28": "\u9577\u91ce",
				"27": "\u9577\u91ce\u98ef\u5c71",
				"26": "\u98ef\u5c71",
				"25": "\u98ef\u5c71\u4e0a\u8d8a\u5999\u9ad8",
				"24": "\u4e0a\u8d8a\u5999\u9ad8",
				"23": "\u4e0a\u8d8a\u5999\u9ad8\u7cf8\u9b5a\u5ddd",
				"22": "\u7cf8\u9b5a\u5ddd",
				"21": "\u7cf8\u9b5a\u5ddd\u9ed2\u90e8\u5b87\u5948\u6708\u6e29\u6cc9",
				"20": "\u9ed2\u90e8\u5b87\u5948\u6708\u6e29\u6cc9",
				"19": "\u9ed2\u90e8\u5b87\u5948\u6708\u6e29\u6cc9\u5bcc\u5c71",
				"18": "\u5bcc\u5c71",
				"17": "\u5bcc\u5c71\u65b0\u9ad8\u5ca1",
				"16": "\u65b0\u9ad8\u5ca1",
				"15": "\u65b0\u9ad8\u5ca1\u91d1\u6ca2",
				"14": "\u91d1\u6ca2",
				"13": "\u91d1\u6ca2\u5c0f\u677e",
				"12": "\u5c0f\u677e",
				"11": "\u5c0f\u677e\u52a0\u8cc0\u6e29\u6cc9",
				"10": "\u52a0\u8cc0\u6e29\u6cc9",
				"9": "\u52a0\u8cc0\u6e29\u6cc9\u82a6\u539f\u6e29\u6cc9",
				"8": "\u82a6\u539f\u6e29\u6cc9",
				"7": "\u82a6\u539f\u6e29\u6cc9\u798f\u4e95",
				"6": "\u798f\u4e95",
				"5": "\u798f\u4e95\u8d8a\u524d\u305f\u3051\u3075",
				"4": "\u8d8a\u524d\u305f\u3051\u3075",
				"3": "\u8d8a\u524d\u305f\u3051\u3075\u6566\u8cc0",
				"2": "\u6566\u8cc0"
			}
		}
	};
	const JREAST_DESTINATION_SIMPLE_MAP = {
		"新函館北斗": "函",
		"新青森": "青",
		"盛岡": "盛",
		"仙台": "仙",
		"福島": "福",
		"郡山": "郡",
		"那須塩原": "塩",
		"大宮": "大",
		"上野": "上",
		"東京": "東",
		"山形": "山",
		"新庄": "庄",
		"秋田": "秋",
		"熊谷": "熊",
		"高崎": "高",
		"長野": "長",
		"富山": "富",
		"金沢": "金",
		"敦賀": "敦",
		"越後湯沢": "湯",
		"新潟": "潟",
		"ガーラ湯沢": "ガ"
	};

	function normalizeJrEastLocation(rawData, options) {
		const settings = options || {};
		const screenCode = toText(settings.screenCode || rawData && rawData.screenCode);
		const trains = [];

		(rawData && Array.isArray(rawData.trainInfo) ? rawData.trainInfo : []).forEach(function(tile) {
			collectTileSideTrains(tile, "leftSide", screenCode, trains);
			collectTileSideTrains(tile, "rightSide", screenCode, trains);
		});

		return {
			source: "jreast",
			screenCode: screenCode,
			dateTime: toText(rawData && rawData.dateTime),
			screenDisplayMode: rawData && rawData.screenDisplayMode ? rawData.screenDisplayMode : null,
			trains: trains
		};
	}

	function convertJrEastToDaiya(rawData, ekiMaster, options) {
		const settings = options || {};
		const normalized = normalizeJrEastLocation(rawData, settings);
		const stationKeyMap = buildStationKeyMap(ekiMaster || []);
		const unmatchedStationSet = new Set();
		const today = normalized.trains.map(function(train) {
			const stations = convertTimetableToDaiyaStations(train.jrEast && train.jrEast.timetable, stationKeyMap, unmatchedStationSet);
			const destinationKey = findStationKey(train.shuEkiName || train.shuEkiSimple, stationKeyMap) ||
				(stations.length ? stations[stations.length - 1].key : "");
			return {
				cbango: train.cbango,
				name: train.jrEast && train.jrEast.nickname ? train.jrEast.nickname : train.typeName,
				type: train.type,
				shuEkiKey: destinationKey,
				ryosu: train.ryosu,
				stations: stations
			};
		});

		const result = { today: today };
		if (settings.includeMeta) {
			result.meta = {
				source: "jreast",
				screenCode: normalized.screenCode,
				dateTime: normalized.dateTime,
				unmatchedStations: Array.from(unmatchedStationSet).sort()
			};
		}
		return result;
	}

	function collectTileSideTrains(tile, sideName, screenCode, trains) {
		const side = tile && tile[sideName];
		if (!side || typeof side !== "object") return;

		Object.keys(side).sort(compareLaneName).forEach(function(laneName) {
			const lane = side[laneName];
			const laneTrains = lane && Array.isArray(lane.trains) ? lane.trains : [];
			laneTrains.forEach(function(train, trainIndex) {
				trains.push(normalizeJrEastTrain(train, {
					screenCode: screenCode,
					tileId: toText(tile.tileId),
					side: sideName,
					lane: laneName,
					index: trainIndex
				}));
			});
		});
	}

	function normalizeJrEastTrain(train, context) {
		const organizations = Array.isArray(train && train.organizationBasicInfo) ? train.organizationBasicInfo : [];
		const primaryOrganization = organizations[0] || {};
		const direction = getDirection(train);
		const position = buildPositionKey(context, direction);
		const positionInfo = getPositionInfo(context);
		const typeName = getLanguageText(train && train.type && train.type.fullName);
		const destinationNames = collectDestinationNames(organizations, "fullName");
		const destinationAbbreviations = collectDestinationNames(organizations, "abbreviated");
		const destinationSimpleNames = collectDestinationSimpleNames(organizations);
		const nicknameText = collectNicknameTexts(organizations);
		const seriesText = collectSeriesTexts(organizations, train);
		const timetable = collectTimetableRows(train);

		return {
			cbango: normalizeTrainNo(train && train.trainNo),
			type: mapTrainType(typeName),
			typeName: typeName,
			typeAbbr: getLanguageText(train && train.type && train.type.abbreviated),
			pos: position,
			chien: getDelayMinutes(train),
			shuEkiSimple: destinationSimpleNames || destinationAbbreviations || destinationNames,
			shuEkiName: destinationNames,
			shuEkiKey: "",
			status: "1",
			statusDetail: "",
			statusDetailEn: "",
			statusDetailTc: "",
			statusDetailSc: "",
			statusDetailKr: "",
			senku: toText(context.screenCode),
			ryosu: getCarsValue(train),
			yokuStatus: 0,
			yokuDetail: {
				ja: "",
				en: "",
				tc: "",
				sc: "",
				kr: ""
			},
			jrEast: {
				infoType: toText(train && train.infoType),
				screenCode: toText(context.screenCode),
				tileId: toText(context.tileId),
				positionName: positionInfo.name,
				positionNumber: positionInfo.number,
				positionRosenCode: positionInfo.rosenCode,
				side: context.side,
				lane: context.lane,
				index: context.index,
				direction: direction,
				orderBetweenStations: getValidValue(train && train.orderBetweenStations),
				routeChange: Boolean(train && train.routeChange),
				lineCode: getValidText(primaryOrganization.lineCode),
				lineName: getLanguageText(primaryOrganization.lineName),
				lineColorCode: toText(primaryOrganization.lineColorCode),
				trainIconMaterialCode: toText(primaryOrganization.trainIconMaterialCode),
				trainTypeMaterialCode: toText(train && train.type && train.type.trainTypeMaterialCode),
				nickname: nicknameText,
				destination: destinationNames,
				series: seriesText,
				organizations: normalizeOrganizations(organizations),
				timetable: timetable
			}
		};
	}

	function normalizeOrganizations(organizations) {
		return organizations.map(function(organization) {
			return {
				lineCode: getValidText(organization.lineCode),
				lineName: getLanguageText(organization.lineName),
				lineColorCode: toText(organization.lineColorCode),
				trainIconMaterialCode: toText(organization.trainIconMaterialCode),
				nickname: getLanguageText(organization.nickname),
				nicknameNo: getValidText(organization.nicknameNo),
				destination: getLanguageText(organization.destination && organization.destination.fullName),
				destinationAbbr: getLanguageText(organization.destination && organization.destination.abbreviated),
				series: getLanguageText(organization.series)
			};
		});
	}

	function collectTimetableRows(train) {
		const timetableInfo = train && train.organizationDetail && train.organizationDetail.timetableInfo;
		if (!timetableInfo || typeof timetableInfo !== "object") return [];

		const rows = [];
		Object.keys(timetableInfo).forEach(function(key) {
			const formation = timetableInfo[key];
			const timetable = formation && formation.timetableInfo && formation.timetableInfo.timetable;
			if (!Array.isArray(timetable)) return;

			timetable.forEach(function(row) {
				rows.push({
					stationName: getLanguageText(row.stationName),
					pass: row.pass,
					planArrival: toText(row.planArrival),
					planDeparture: toText(row.planDeparture),
					prospectArrival: toText(row.prospectArrival),
					prospectDeparture: toText(row.prospectDeparture),
					lineColorCode: toText(row.lineColorCode)
				});
			});
		});
		return uniqueTimetableRowsByStation(rows);
	}

	function uniqueTimetableRowsByStation(rows) {
		const seen = new Set();
		return (Array.isArray(rows) ? rows : []).filter(function(row) {
			const stationName = toText(row && row.stationName);
			const time = selectDaiyaTime(row);
			if (!stationName || !time || seen.has(stationName)) return false;
			seen.add(stationName);
			return true;
		});
	}

	function convertTimetableToDaiyaStations(timetable, stationKeyMap, unmatchedStationSet) {
		const seen = new Set();
		const stations = [];
		(Array.isArray(timetable) ? timetable : []).forEach(function(row) {
			const stationName = toText(row && row.stationName);
			if (!stationName) return;
			const key = findStationKey(stationName, stationKeyMap);
			if (!key) {
				if (unmatchedStationSet) unmatchedStationSet.add(stationName);
				return;
			}
			const time = selectDaiyaTime(row);
			if (!time) return;
			const rowKey = key;
			if (seen.has(rowKey)) return;
			seen.add(rowKey);
			stations.push({
				key: key,
				time: time
			});
		});
		return stations;
	}

	function selectDaiyaTime(row) {
		return toText(row && row.planDeparture) ||
			toText(row && row.planArrival) ||
			toText(row && row.prospectDeparture) ||
			toText(row && row.prospectArrival);
	}

	function buildStationKeyMap(ekiMaster) {
		const map = new Map();
		(Array.isArray(ekiMaster) ? ekiMaster : []).forEach(function(station) {
			const key = toText(station && station.key);
			if (!key) return;
			["ja", "en", "tc", "sc", "kr", "hira", "kata"].forEach(function(field) {
				const value = normalizeStationName(station && station[field]);
				if (value && !map.has(value)) map.set(value, key);
			});
		});
		return map;
	}

	function findStationKey(stationName, stationKeyMap) {
		const normalizedName = normalizeStationName(stationName);
		if (!normalizedName) return "";
		const directKey = stationKeyMap.get(normalizedName);
		if (directKey) return directKey;
		const parts = toText(stationName).split(/[・･／/]/).map(normalizeStationName).filter(Boolean);
		for (let i = 0; i < parts.length; i++) {
			const key = stationKeyMap.get(parts[i]);
			if (key) return key;
		}
		return "";
	}

	function collectDestinationNames(organizations, nameType) {
		return uniqueTexts(organizations.map(function(organization) {
			return getLanguageText(organization.destination && organization.destination[nameType]);
		})).join("・");
	}

	function collectDestinationSimpleNames(organizations) {
		return uniqueTexts(organizations.map(function(organization) {
			const destinationName = getLanguageText(organization.destination && organization.destination.fullName);
			const mapped = convertDestinationToSimpleName(destinationName);
			if (mapped) return mapped;
			return getLanguageText(organization.destination && organization.destination.abbreviated);
		})).join("・");
	}

	function convertDestinationToSimpleName(destinationName) {
		const name = toText(destinationName);
		if (!name) return "";
		const directName = JREAST_DESTINATION_SIMPLE_MAP[name];
		if (directName) return directName;

		const parts = name.split(/[・･／/]/).map(function(part) {
			return JREAST_DESTINATION_SIMPLE_MAP[toText(part)] || "";
		}).filter(Boolean);
		return parts.length ? parts.join("・") : "";
	}

	function collectNicknameTexts(organizations) {
		return uniqueTexts(organizations.map(function(organization) {
			const nickname = getLanguageText(organization.nickname);
			const nicknameNo = getValidText(organization.nicknameNo);
			if (!nickname) return "";
			return nicknameNo ? nickname + nicknameNo + "号" : nickname;
		})).join("・");
	}

	function collectSeriesTexts(organizations, train) {
		const series = [];
		organizations.forEach(function(organization) {
			getLanguageText(organization.series).split(/[+＋]/).forEach(function(text) {
				const value = toText(text);
				if (value) series.push(value);
			});
		});
		const timetableInfo = train && train.organizationDetail && train.organizationDetail.timetableInfo;
		if (timetableInfo && typeof timetableInfo === "object") {
			Object.keys(timetableInfo).forEach(function(key) {
				const formation = timetableInfo[key];
				if (!formation || typeof formation !== "object") return;
				getLanguageText(formation.series).split(/[+＋]/).forEach(function(text) {
					const value = toText(text);
					if (value) series.push(value);
				});
			});
		}
		return uniqueTexts(series).join("+");
	}

	function uniqueTexts(values) {
		const seen = new Set();
		return values
			.map(toText)
			.filter(function(value) {
				if (!value || seen.has(value)) return false;
				seen.add(value);
				return true;
			});
	}

	function buildPositionKey(context, direction) {
		const positionInfo = getPositionInfo(context);
		const locationDirection = convertJrEastDirectionToLocationDirection(direction);
		if (positionInfo.number && positionInfo.rosenCode) {
			return "RE" + positionInfo.rosenCode + "P" + positionInfo.number + locationDirection;
		}

		const screen = toText(context.screenCode) || "00";
		const tile = toText(context.tileId) || "0";
		const side = context.side === "leftSide" ? "L" : "R";
		const laneMatch = toText(context.lane).match(/\d+/);
		const lane = laneMatch ? laneMatch[0] : "0";
		return "JRE" + screen + "T" + tile + side + lane + locationDirection;
	}

	function convertJrEastDirectionToLocationDirection(direction) {
		return direction === "up" ? "D" : "U";
	}

	function getPositionInfo(context) {
		const screen = toText(context && context.screenCode);
		const tile = toText(context && context.tileId);
		const master = JREAST_SCREEN_POSITION_MASTERS[screen];
		if (!master || !tile || !Object.prototype.hasOwnProperty.call(master.positions, tile)) {
			return {
				name: "",
				number: "",
				rosenCode: ""
			};
		}
		return {
			name: master.positions[tile],
			number: tile,
			rosenCode: master.rosenCode
		};
	}

	function getDirection(train) {
		const directionText = toText(train && train.organizationDetail && train.organizationDetail.timetableInfo && train.organizationDetail.timetableInfo.directionOfTravel);
		if (directionText.indexOf("forKiten") >= 0) return "up";
		if (directionText.indexOf("forShuten") >= 0) return "down";

		const trainNo = normalizeTrainNo(train && train.trainNo);
		const numberMatch = trainNo.match(/^0*([0-9]+)/);
		if (!numberMatch) return "down";
		return parseInt(numberMatch[1], 10) % 2 === 0 ? "up" : "down";
	}

	function mapTrainType(typeName) {
		const name = toText(typeName);
		if (name.indexOf("新幹線") >= 0) return "4";
		if (name.indexOf("特急") >= 0) return "1";
		if (name.indexOf("快速") >= 0) return "2";
		if (name.indexOf("普通") >= 0) return "3";
		return "0";
	}

	function getDelayMinutes(train) {
		const delay = train && train.delayMinute;
		if (!delay || delay.valid === false) return 0;
		const value = Number(delay.value);
		return Number.isFinite(value) ? value : 0;
	}

	function getCarsValue(train) {
		const cars = train && train.cars;
		if (!cars || cars.valid === false) return "";
		return getValidText(cars);
	}

	function getValidValue(valueObject) {
		if (!valueObject || valueObject.valid === false) return "";
		if (Object.prototype.hasOwnProperty.call(valueObject, "value")) return valueObject.value;
		return valueObject;
	}

	function getValidText(valueObject) {
		const value = getValidValue(valueObject);
		return toText(value);
	}

	function getLanguageText(valueObject, language) {
		const lang = language || "ja";
		if (!valueObject || valueObject.valid === false) return "";
		if (typeof valueObject === "string" || typeof valueObject === "number") return toText(valueObject);
		return toText(valueObject[lang] || valueObject.ja || valueObject.value || "");
	}

	function normalizeTrainNo(trainNo) {
		return toText(trainNo).replace(/\s+/g, "");
	}

	function compareLaneName(a, b) {
		const aNo = Number(toText(a).replace(/\D/g, ""));
		const bNo = Number(toText(b).replace(/\D/g, ""));
		if (Number.isFinite(aNo) && Number.isFinite(bNo) && aNo !== bNo) return aNo - bNo;
		return toText(a).localeCompare(toText(b));
	}

	function toText(value) {
		if (value === null || value === undefined) return "";
		return String(value).trim();
	}

	function normalizeStationName(value) {
		return toText(value).replace(/[ 　・･\-‐‑‒–—―]/g, "").toLowerCase();
	}

	return {
		normalize: normalizeJrEastLocation,
		normalizeTrain: normalizeJrEastTrain,
		toDaiya: convertJrEastToDaiya
	};
}));
