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
		}
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
		const nicknameText = collectNicknameTexts(organizations);
		const timetable = collectTimetableRows(train);

		return {
			cbango: normalizeTrainNo(train && train.trainNo),
			type: mapTrainType(typeName),
			typeName: typeName,
			typeAbbr: getLanguageText(train && train.type && train.type.abbreviated),
			pos: position,
			chien: getDelayMinutes(train),
			shuEkiSimple: destinationAbbreviations || destinationNames,
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
		return rows;
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
			const rowKey = key + "|" + time;
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

	function collectNicknameTexts(organizations) {
		return uniqueTexts(organizations.map(function(organization) {
			const nickname = getLanguageText(organization.nickname);
			const nicknameNo = getValidText(organization.nicknameNo);
			if (!nickname) return "";
			return nicknameNo ? nickname + nicknameNo + "号" : nickname;
		})).join("・");
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
		if (positionInfo.number && positionInfo.rosenCode) {
			return "RE" + positionInfo.rosenCode + "P" + positionInfo.number + (direction === "up" ? "U" : "D");
		}

		const screen = toText(context.screenCode) || "00";
		const tile = toText(context.tileId) || "0";
		const side = context.side === "leftSide" ? "L" : "R";
		const laneMatch = toText(context.lane).match(/\d+/);
		const lane = laneMatch ? laneMatch[0] : "0";
		return "JRE" + screen + "T" + tile + side + lane + (direction === "up" ? "U" : "D");
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
