(function(global) {
	"use strict";

	const CENTRAL_STATION_ORDER = [
		"1", "2", "3", "4", "5", "6", "32", "7", "33", "8", "9", "34",
		"10", "11", "12", "13", "15", "16", "17", "18", "19", "20",
		"21", "22", "35", "23", "41", "24", "25", "26", "27", "42",
		"28", "29", "30"
	];

	const CENTRAL_STATION_NAMES = {
		"1": "\u6771\u4eac",
		"2": "\u54c1\u5ddd",
		"3": "\u65b0\u6a2a\u6d5c",
		"4": "\u5c0f\u7530\u539f",
		"5": "\u71b1\u6d77",
		"6": "\u4e09\u5cf6",
		"32": "\u65b0\u5bcc\u58eb",
		"7": "\u9759\u5ca1",
		"33": "\u639b\u5ddd",
		"8": "\u6d5c\u677e",
		"9": "\u8c4a\u6a4b",
		"34": "\u4e09\u6cb3\u5b89\u57ce",
		"10": "\u540d\u53e4\u5c4b",
		"11": "\u5c90\u961c\u7fbd\u5cf6",
		"12": "\u7c73\u539f",
		"13": "\u4eac\u90fd",
		"15": "\u65b0\u5927\u962a",
		"16": "\u65b0\u795e\u6238",
		"17": "\u897f\u660e\u77f3",
		"18": "\u59eb\u8def",
		"19": "\u76f8\u751f",
		"20": "\u5ca1\u5c71",
		"21": "\u65b0\u5009\u6577",
		"22": "\u798f\u5c71",
		"35": "\u65b0\u5c3e\u9053",
		"23": "\u4e09\u539f",
		"41": "\u6771\u5e83\u5cf6",
		"24": "\u5e83\u5cf6",
		"25": "\u65b0\u5ca9\u56fd",
		"26": "\u5fb3\u5c71",
		"27": "\u65b0\u5c71\u53e3",
		"42": "\u539a\u72ed",
		"28": "\u65b0\u4e0b\u95a2",
		"29": "\u5c0f\u5009",
		"30": "\u535a\u591a"
	};

	const CENTRAL_TRAIN_NAMES = {
		"1": "\u3072\u304b\u308a",
		"2": "\u3053\u3060\u307e",
		"6": "\u306e\u305e\u307f",
		"8": "\u56e3\u4f53",
		"9": "\u56de\u9001",
		"10": "\u307f\u305a\u307b",
		"11": "\u3055\u304f\u3089",
		"12": "\u3064\u3070\u3081"
	};

	const KYUSHU_POSITION_NAMES = [
		"\u535a\u591a",
		"\u535a\u591a\uff5e\u65b0\u9ce5\u6816",
		"\u65b0\u9ce5\u6816",
		"\u65b0\u9ce5\u6816\uff5e\u4e45\u7559\u7c73",
		"\u4e45\u7559\u7c73",
		"\u4e45\u7559\u7c73\uff5e\u7b51\u5f8c\u8239\u5c0f\u5c4b",
		"\u7b51\u5f8c\u8239\u5c0f\u5c4b",
		"\u7b51\u5f8c\u8239\u5c0f\u5c4b\uff5e\u65b0\u5927\u725f\u7530",
		"\u65b0\u5927\u725f\u7530",
		"\u65b0\u5927\u725f\u7530\uff5e\u65b0\u7389\u540d",
		"\u65b0\u7389\u540d",
		"\u65b0\u7389\u540d\uff5e\u718a\u672c",
		"\u718a\u672c",
		"\u718a\u672c\uff5e\u65b0\u516b\u4ee3",
		"\u65b0\u516b\u4ee3",
		"\u65b0\u516b\u4ee3\uff5e\u65b0\u6c34\u4fe3",
		"\u65b0\u6c34\u4fe3",
		"\u65b0\u6c34\u4fe3\uff5e\u51fa\u6c34",
		"\u51fa\u6c34",
		"\u51fa\u6c34\uff5e\u5ddd\u5185",
		"\u5ddd\u5185",
		"\u5ddd\u5185\uff5e\u9e7f\u5150\u5cf6\u4e2d\u592e",
		"\u9e7f\u5150\u5cf6\u4e2d\u592e"
	];

	const DESTINATION_SHORT = {
		"\u6771\u4eac": "\u6771",
		"\u535a\u591a": "\u535a",
		"\u9e7f\u5150\u5cf6\u4e2d\u592e": "\u9e7f",
		"\u718a\u672c": "\u718a",
		"\u5c0f\u5009": "\u5c0f",
		"\u5e83\u5cf6": "\u5e83",
		"\u5ca1\u5c71": "\u5ca1",
		"\u65b0\u5927\u962a": "\u962a",
		"\u540d\u53e4\u5c4b": "\u540d"
	};

	function normalize(centralLocationJson, centralMasterJson, kyushuHtml, options) {
		const trains = []
			.concat(normalizeCentral(centralLocationJson, centralMasterJson, options))
			.concat(normalizeKyushu(kyushuHtml, options));
		const timeText = getLatestTimeText(centralLocationJson, kyushuHtml);
		return {
			location: {
				time: timeText ? { ja: timeText } : undefined,
				trains: trains
			}
		};
	}

	function normalizeCentral(rawData, masterData, options) {
		const locationInfo = rawData && rawData.trainLocationInfo ? rawData.trainLocationInfo : {};
		const trains = [];
		const stationIndexById = new Map(CENTRAL_STATION_ORDER.map((id, index) => [String(id), index]));
		const trainNameMap = Object.assign({}, CENTRAL_TRAIN_NAMES, extractCentralTrainNameMap(masterData));
		const centralTrainInfoMap = options && options.centralTrainInfoMap ? options.centralTrainInfoMap : {};

		["1", "2"].forEach((bound) => {
			const suffix = bound === "1" ? "U" : "D";
			const fallbackDestination = bound === "1" ? "\u6771\u4eac" : "\u535a\u591a";
			const atStations = locationInfo.atStation && locationInfo.atStation.bounds && locationInfo.atStation.bounds[bound] ? locationInfo.atStation.bounds[bound] : [];
			atStations.forEach((entry) => {
				const index = stationIndexById.get(String(entry.station));
				if (typeof index !== "number") return;
				const posNumber = index * 2 + 1;
				addCentralTrains(trains, entry.trains, "JT01P" + pad2(posNumber) + suffix, fallbackDestination, trainNameMap, centralTrainInfoMap, options);
			});

			const betweenStations = locationInfo.betweenStation && locationInfo.betweenStation.bounds && locationInfo.betweenStation.bounds[bound] ? locationInfo.betweenStation.bounds[bound] : [];
			betweenStations.forEach((entry) => {
				const index = stationIndexById.get(String(entry.station));
				if (typeof index !== "number") return;
				const posNumber = bound === "1" ? index * 2 : index * 2 + 2;
				if (posNumber < 1 || posNumber > 68) return;
				addCentralTrains(trains, entry.trains, "JT01P" + pad2(posNumber) + suffix, fallbackDestination, trainNameMap, centralTrainInfoMap, options);
			});
		});

		return trains;
	}

	function addCentralTrains(output, rawTrains, pos, fallbackDestination, trainNameMap, centralTrainInfoMap, options) {
		if (!Array.isArray(rawTrains)) return;
		rawTrains.forEach((rawTrain) => {
			const trainNumber = String(rawTrain.trainNumber || rawTrain.train || "").trim();
			if (!trainNumber) return;
			const displayTrainNumber = normalizeShinkansenTrainNumber(trainNumber);
			const trainName = trainNameMap[String(rawTrain.train)] || "";
			const destination = getCentralDestination(rawTrain, centralTrainInfoMap) || fallbackDestination;
			output.push(buildTrain({
				cbango: displayTrainNumber,
				name: makeDisplayTrainName(trainName, trainNumber),
				typeLabel: "\u65b0\u5e79\u7dda",
				destination: destination,
				delay: rawTrain.delay,
				pos: pos,
				source: "jrshinkansen",
				sourceRosen: "59",
				senku: options && options.senku ? options.senku : "59",
				ryosu: "",
				extra: {
					jrShinkansen: {
						source: "central",
						trainCode: rawTrain.train || "",
						rawTrainNumber: trainNumber,
						track: rawTrain.track || "",
						sot: rawTrain.sot || "",
						terminalStation: getCentralTerminalStationId(rawTrain, centralTrainInfoMap)
					}
				}
			}));
		});
	}

	function getCentralDestination(rawTrain, centralTrainInfoMap) {
		const stationId = getCentralTerminalStationId(rawTrain, centralTrainInfoMap);
		return stationId ? CENTRAL_STATION_NAMES[String(stationId)] || "" : "";
	}

	function getCentralTerminalStationId(rawTrain, centralTrainInfoMap) {
		const trainInfo = centralTrainInfoMap[getCentralTrainInfoKey(rawTrain)];
		const trainRows = trainInfo && trainInfo.trainInfo && Array.isArray(trainInfo.trainInfo.trains) ? trainInfo.trainInfo.trains : [];
		if (trainRows.length < 1) return "";
		const terminal = trainRows[0].terminalStation || {};
		return terminal.station ? String(terminal.station) : "";
	}

	function getCentralTrainInfoKey(rawTrain) {
		return String(rawTrain && rawTrain.train || "") + "_" + String(rawTrain && rawTrain.trainNumber || "");
	}

	function normalizeKyushu(html, options) {
		const rows = parseKyushuRows(html);
		const trains = [];
		rows.forEach((row) => {
			if (!row || !Array.isArray(row.trains)) return;
			const posBase = getKyushuPosBase(row.kukan);
			if (!posBase) return;
			row.trains.forEach((rawTrain) => {
				const suffix = rawTrain.direction === "U" ? "U" : "D";
			const trainNumber = rawTrain.number || rawTrain.cbango || "";
			if (!trainNumber) return;
			const displayTrainNumber = normalizeShinkansenTrainNumber(rawTrain.cbango || trainNumber);
			trains.push(buildTrain({
				cbango: displayTrainNumber,
				name: rawTrain.name || makeDisplayTrainName(rawTrain.serviceName, trainNumber),
				typeLabel: "\u65b0\u5e79\u7dda",
				destination: rawTrain.destination || (suffix === "U" ? "\u535a\u591a" : "\u9e7f\u5150\u5cf6\u4e2d\u592e"),
				delay: rawTrain.delay,
				pos: posBase + suffix,
					source: "jrshinkansen",
					sourceRosen: "59",
					senku: options && options.senku ? options.senku : "59",
					ryosu: "",
					extra: {
						jrShinkansen: {
							source: "kyushu",
							rawTrainNumber: trainNumber,
							rawCbango: rawTrain.cbango || ""
						}
					}
				}));
			});
		});
		return trains;
	}

	function parseKyushuRows(html) {
		if (!html) return [];
		const doc = typeof DOMParser !== "undefined" ? new DOMParser().parseFromString(String(html), "text/html") : null;
		if (!doc) return parseKyushuRowsWithRegex(html);
		return Array.from(doc.querySelectorAll("tr[title^='KUKAN']")).map((row) => {
			const title = row.getAttribute("title") || "";
			const kukanMatch = title.match(/^KUKAN(\d+)$/);
			if (!kukanMatch) return null;
			const trains = Array.from(row.querySelectorAll("td[title]"))
				.map((cell) => parseKyushuTrainCell(cell.getAttribute("title"), cell.getAttribute("background"), cell.innerHTML))
				.filter(Boolean);
			return { kukan: Number(kukanMatch[1]), trains: trains };
		}).filter(Boolean);
	}

	function parseKyushuRowsWithRegex(html) {
		const rows = [];
		const rowPattern = /<tr\b[^>]*title=["']?KUKAN(\d+)["']?[^>]*>([\s\S]*?)<\/tr>/gi;
		let rowMatch;
		while ((rowMatch = rowPattern.exec(String(html))) !== null) {
			const trains = [];
			const cellPattern = /<td\b([^>]*)>([\s\S]*?)<\/td>/gi;
			let cellMatch;
			while ((cellMatch = cellPattern.exec(rowMatch[2])) !== null) {
				const attrs = cellMatch[1] || "";
				const titleMatch = attrs.match(/\btitle=["']?([^"'\s>]+)/i);
				if (!titleMatch) continue;
				const backgroundMatch = attrs.match(/\bbackground=["']?([^"'\s>]+)/i);
				const train = parseKyushuTrainCell(titleMatch[1], backgroundMatch ? backgroundMatch[1] : "", cellMatch[2]);
				if (train) trains.push(train);
			}
			rows.push({ kukan: Number(rowMatch[1]), trains: trains });
		}
		return rows;
	}

	function parseKyushuTrainCell(cbango, background, html) {
		const text = String(html || "")
			.replace(/<br\s*\/?>/gi, "\n")
			.replace(/<[^>]+>/g, "")
			.replace(/&nbsp;/g, " ")
			.trim();
		const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
		if (lines.length < 1) return null;
		const direction = /up/i.test(String(background || "")) ? "U" : "D";
		const destination = normalizeKyushuDestination(lines[0] || "");
		const nameLine = lines[1] || "";
		const numberMatch = nameLine.match(/(\d+)/) || String(cbango || "").match(/(\d+)/);
		const trainNumber = numberMatch ? numberMatch[1] : String(cbango || "");
		const serviceName = (nameLine.match(/^([^\d\s]+)/) || [null, ""])[1] || "";
		return {
			cbango: String(cbango || ""),
			number: trainNumber,
			serviceName: serviceName,
			name: nameLine,
			destination: destination,
			direction: direction,
			delay: parseDelay(lines.slice(2).join(" "))
		};
	}

	function buildTrain(params) {
		const delay = normalizeDelay(params.delay);
		return Object.assign({
			cbango: String(params.cbango || ""),
			name: params.name || "",
			type: "4",
			typeLabel: params.typeLabel || "",
			shaEki: "",
			shaTime: "",
			shuEki: "",
			shuEkiKey: "",
			shuEkiName: params.destination || "",
			shuEkiSimple: getDestinationShort(params.destination),
			ryosu: params.ryosu || "",
			senku: params.senku || "59",
			runStatus: 1,
			yokuStatus: 0,
			yokuDetail: {},
			status: 1,
			statusDetail: "",
			statusDetailEn: "",
			statusDetailTc: "",
			statusDetailSc: "",
			statusDetailKr: "",
			chien: delay,
			pos: params.pos || "",
			source: params.source || "jrshinkansen",
			sourceRosen: params.sourceRosen || "59"
		}, params.extra || {});
	}

	function getKyushuPosBase(kukan) {
		if (kukan < 2 || kukan > 24) return "";
		return "JQ01P" + pad2(kukan - 1);
	}

	function extractCentralTrainNameMap(masterData) {
		const result = {};
		if (!masterData || typeof masterData !== "object") return result;
		const candidates = [];
		collectArrays(masterData, candidates);
		candidates.forEach((array) => {
			array.forEach((row) => {
				if (!row || typeof row !== "object") return;
				const code = row.code || row.train || row.id || row.key;
				const name = extractName(row.name || row.text || row.label || row.value);
				if (typeof code !== "undefined" && name) result[String(code)] = name;
			});
		});
		return result;
	}

	function collectArrays(value, output) {
		if (Array.isArray(value)) {
			output.push(value);
			value.forEach((row) => collectArrays(row, output));
			return;
		}
		if (!value || typeof value !== "object") return;
		Object.keys(value).forEach((key) => collectArrays(value[key], output));
	}

	function extractName(value) {
		if (!value) return "";
		if (typeof value === "string") return value;
		if (typeof value === "object") return value.ja || value.name || value.text || "";
		return "";
	}

	function getLatestTimeText(centralLocationJson, kyushuHtml) {
		const centralTime = centralLocationJson && centralLocationJson.trainLocationInfo ? Number(centralLocationJson.trainLocationInfo.datetime || 0) : 0;
		const kyushuTime = parseKyushuMetaTime(kyushuHtml);
		const timestamp = Math.max(centralTime ? centralTime * 1000 : 0, kyushuTime || 0);
		if (!timestamp) return "";
		return formatJstTime(timestamp);
	}

	function parseKyushuMetaTime(html) {
		const match = String(html || "").match(/name=["']datetimestamp["'][^>]*content=["']([^"']+)/i);
		if (!match) return 0;
		const parts = match[1].match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2}):(\d{2})/);
		if (!parts) return 0;
		return Date.UTC(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]), Number(parts[4]) - 9, Number(parts[5]), Number(parts[6]));
	}

	function formatJstTime(timestamp) {
		const date = new Date(timestamp + 9 * 60 * 60 * 1000);
		return date.getUTCFullYear() + "\u5e74" +
			(date.getUTCMonth() + 1) + "\u6708" +
			date.getUTCDate() + "\u65e5" +
			date.getUTCHours() + "\u6642" +
			date.getUTCMinutes() + "\u5206" +
			date.getUTCSeconds() + "\u79d2\u73fe\u5728";
	}

	function makeDisplayTrainName(name, number) {
		if (!name) return "";
		return name + String(number || "") + "\u53f7";
	}

	function normalizeShinkansenTrainNumber(number) {
		const text = String(number || "").trim().toUpperCase();
		if (!text) return "";
		const match = text.match(/^0*(\d+)([A-Z]?)$/);
		if (!match) return text;
		return String(Number(match[1])) + (match[2] || "A");
	}

	function normalizeKyushuDestination(destination) {
		return String(destination || "")
			.replace(/\u9e7f\u5150\u4e2d\u592e/g, "\u9e7f\u5150\u5cf6\u4e2d\u592e")
			.replace(/\u884c$/g, "")
			.replace(/\s+/g, "");
	}

	function getDestinationShort(destination) {
		const normalized = normalizeKyushuDestination(destination);
		return DESTINATION_SHORT[normalized] || normalized.slice(0, 1);
	}

	function parseDelay(text) {
		if (!text || /\u5b9a\u523b/.test(text)) return 0;
		const match = String(text).match(/(\d+)\s*\u5206/);
		return match ? Number(match[1]) : 0;
	}

	function normalizeDelay(value) {
		const minutes = Number(value || 0);
		if (!Number.isFinite(minutes) || minutes < 0) return 0;
		return minutes;
	}

	function pad2(value) {
		return String(value).padStart(2, "0");
	}

	global.JrShinkansenLocationAdapter = {
		normalize: normalize,
		parseKyushuRows: parseKyushuRows
	};
}(window));
