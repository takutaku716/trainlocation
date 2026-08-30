(function(root, factory) {
	if (typeof module === "object" && module.exports) {
		module.exports = factory();
	} else {
		root.JrKyushuTrainNaviAdapter = factory();
	}
}(typeof self !== "undefined" ? self : this, function() {
	"use strict";

	function buildTimetableRequest(train, options) {
		const settings = options || {};
		const metadata = train && train.jrKyushu && train.jrKyushu.trainNavi || train && train.trainNavi || {};
		const candidateStationNames = stationNames(metadata.candidateStationNames || settings.candidateStationNames);
		const request = {
			drivingRouteCode: text(metadata.drivingRouteCode || settings.drivingRouteCode),
			stationCode: text(metadata.stationCode || settings.stationCode || metadata.currentStationCode || settings.currentStationCode),
			currentStationCode: text(metadata.currentStationCode || settings.currentStationCode),
			currentStationName: text(metadata.currentStationName || settings.currentStationName),
			drivingRouteName: text(metadata.drivingRouteName || settings.drivingRouteName),
			upperLowerKbn: text(metadata.upperLowerKbn || settings.upperLowerKbn),
			trainNumber: text(metadata.trainNumber || train && train.cbango),
			drivingBaseDate: text(metadata.drivingBaseDate || settings.drivingBaseDate),
			trainCrownCode: optionalText(metadata.trainCrownCode),
			trainSignCode: optionalText(metadata.trainSignCode),
			trainGenkai: optionalText(metadata.trainGenkai),
			trainCompanyCode: optionalText(metadata.trainCompanyCode),
			lang: text(metadata.lang || settings.lang || "ja")
		};
		if (candidateStationNames.length) request.candidateStationNames = candidateStationNames;
		return isValidTimetableRequest(request) ? request : null;
	}

	function isValidTimetableRequest(request) {
		if (!request || !/^[12]$/.test(request.upperLowerKbn) || !/^\d{1,6}[A-Za-z]?$/.test(request.trainNumber)) return false;
		const hasCodes = /^\d{1,8}$/.test(request.drivingRouteCode) &&
			/^\d{1,12}$/.test(request.stationCode) &&
			/^\d{1,12}$/.test(request.currentStationCode);
		const hasNames = request.currentStationName.length > 0 && request.currentStationName.length <= 40 &&
			request.drivingRouteName.length > 0 && request.drivingRouteName.length <= 40;
		return hasCodes || hasNames;
	}

	function makeTimetableUrl(baseUrl, request) {
		if (!isValidTimetableRequest(request)) throw new Error("invalid JR Kyushu Train Navi request");
		const normalizedBase = text(baseUrl).replace(/\/+$/, "");
		if (!normalizedBase) throw new Error("empty JR Kyushu Train Navi worker URL");
		const params = new URLSearchParams();
		Object.keys(request).forEach(function(key) {
			if (request[key] !== "" && request[key] !== null && request[key] !== undefined) {
				params.set(key, String(request[key]));
			}
		});
		return normalizedBase + "/trainnavi/timetable?" + params.toString();
	}

	function fetchTimetable(baseUrl, request, fetcher) {
		const requestFetch = fetcher || (typeof fetch === "function" ? fetch.bind(typeof window !== "undefined" ? window : null) : null);
		if (!requestFetch) return Promise.reject(new Error("fetch is unavailable"));
		return requestFetch(makeTimetableUrl(baseUrl, request), { headers: { accept: "application/json" } })
			.then(function(response) {
				if (!response.ok) throw new Error("JR Kyushu Train Navi request failed: " + response.status);
				return response.json();
			})
			.then(normalizeTimetableResponse);
	}

	function normalizeTimetableResponse(response) {
		const train = response && response.train || {};
		return {
			ok: !!(response && response.ok),
			matched: !!(response && response.matched),
			reason: text(response && response.reason),
			identity: response && response.identity || null,
			train: {
				trainNumber: text(train.trainNumber),
				trainKindName: text(train.trainKindName),
				nickName: text(train.nickName),
				destinationStationName: text(train.destinationStationName),
				cars: positiveNumber(train.cars),
				delayMinutes: finiteNumberOrNull(train.delayMinutes),
				suspension: train.suspension === true,
				operationCompleted: train.operationCompleted === true
			},
			timetable: normalizeTimetableRows(response && response.timetable)
		};
	}

	function normalizeTimetableRows(rows) {
		return (Array.isArray(rows) ? rows : []).map(function(row) {
			return {
				stationName: text(row && row.stationName),
				planArrival: normalizeTime(row && row.planArrival),
				planDeparture: normalizeTime(row && row.planDeparture),
				time: normalizeTime(row && row.time) || normalizeTime(row && row.planDeparture) || normalizeTime(row && row.planArrival),
				startingStation: !!(row && row.startingStation),
				terminalStation: !!(row && row.terminalStation),
				platform: text(row && row.platform)
			};
		}).filter(function(row) {
			return row.stationName && row.time;
		});
	}

	function applyResponseToDataset(dataset, response, language) {
		const normalized = normalizeTimetableResponse(response);
		dataset.jrkyushu_timetable = JSON.stringify(normalized.timetable);
		if (!normalized.matched) return normalized;
		const train = normalized.train;
		if (train.trainKindName) dataset.ressha_type_name = train.trainKindName;
		if (train.nickName) dataset.aisho = train.nickName;
		if (train.destinationStationName) dataset.shu_eki = destinationText(train.destinationStationName, language);
		if (train.cars) dataset.ryosu = carsText(train.cars, language);
		if (train.delayMinutes !== null) {
			dataset.chien = String(train.delayMinutes);
			dataset.chien_status = train.delayMinutes > 0 ? "1" : "0";
			dataset.chien_text = train.delayMinutes > 0 ? delayText(train.delayMinutes, language) : "";
		}
		return normalized;
	}

	function destinationText(stationName, language) {
		if (language === "en") return "For " + stationName;
		if (language === "tc") return "開往" + stationName;
		if (language === "sc") return "开往" + stationName;
		if (language === "kr") return stationName + "행";
		return stationName + " 行き";
	}

	function carsText(cars, language) {
		if (language === "en") return cars + " car(s)";
		if (language === "tc") return cars + "節車廂";
		if (language === "sc") return cars + "节车厢";
		if (language === "kr") return cars + "량 편성";
		return cars + "両";
	}

	function delayText(minutes, language) {
		if (language === "en") return minutes + " minute(s) late";
		if (language === "tc") return "延遲" + minutes + "分";
		if (language === "sc") return "延迟" + minutes + "分";
		if (language === "kr") return minutes + "분 지연";
		return minutes + "分遅れ";
	}

	function normalizeTime(value) {
		const match = text(value).match(/^(\d{1,2}):(\d{2})/);
		return match ? String(Number(match[1])).padStart(2, "0") + ":" + match[2] : "";
	}

	function optionalText(value) {
		return value === null || value === undefined ? "" : text(value);
	}

	function text(value) {
		return String(value === null || value === undefined ? "" : value).trim();
	}

	function positiveNumber(value) {
		const number = Number(value);
		return Number.isFinite(number) && number > 0 ? number : null;
	}

	function finiteNumberOrNull(value) {
		if (value === null || value === undefined || value === "") return null;
		const number = Number(value);
		return Number.isFinite(number) ? number : null;
	}

	function stationNames(value) {
		const values = Array.isArray(value) ? value : String(value || "").split(/[|,]/);
		return values.map(text).filter(Boolean).filter(function(name, index, rows) {
			return rows.indexOf(name) === index;
		}).slice(0, 10);
	}

	return {
		buildTimetableRequest: buildTimetableRequest,
		isValidTimetableRequest: isValidTimetableRequest,
		makeTimetableUrl: makeTimetableUrl,
		fetchTimetable: fetchTimetable,
		normalizeTimetableResponse: normalizeTimetableResponse,
		applyResponseToDataset: applyResponseToDataset
	};
}));
