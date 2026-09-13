const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const CACHE_KEY_PREFIX = "jrkyushu:timetable";
const JREAST_TRAIN_NUMBER_CACHE_KEY_PREFIX = "jreast:shinkansen:train-numbers";
const JREAST_TIMETABLE_BASE_URL = "https://timetables.jreast.co.jp";
const JRKYUSHU_TRAIN_NAVI_API_BASE = "https://www.goto-mirai.jrkyushu.co.jp/api/";
const MAX_DETAIL_FETCHES = 500;
const DETAIL_BATCH_SIZE = 15;
const japaneseHolidayCache = new Map();

const STATION_SOURCES = [
	{ code: "28283", group: "kyushu", name: "hakata" },
	{ code: "28626", group: "kyushu", name: "kumamoto" },
	{ code: "28984", group: "kyushu", name: "sendai" },
	{ code: "29007", group: "kyushu", name: "kagoshima_chuo" },
	{ code: "28395", group: "nishi_kyushu", name: "takeo_onsen" },
	{ code: "11227", group: "nishi_kyushu", name: "shin_omura" },
	{ code: "28533", group: "nishi_kyushu", name: "nagasaki" }
];

const SHINKANSEN_TRAIN_NAMES = new Set([
	"\u307f\u305a\u307b",
	"\u3055\u304f\u3089",
	"\u3064\u3070\u3081",
	"\u304b\u3082\u3081"
]);

const JSON_HEADERS = {
	"content-type": "application/json; charset=utf-8",
	"cache-control": "no-store",
	"access-control-allow-origin": "*"
};

const CORS_HEADERS = {
	"access-control-allow-origin": "*",
	"access-control-allow-methods": "GET, OPTIONS",
	"access-control-allow-headers": "content-type"
};

export default {
	async scheduled(controller, env, ctx) {
		ctx.waitUntil(refreshTimetableCache(env, { triggeredBy: "cron", cron: controller.cron }));
	},

	async fetch(request, env) {
		const url = new URL(request.url);
		if (request.method === "OPTIONS") {
			return new Response(null, { headers: CORS_HEADERS });
		}
		if (url.pathname.endsWith("/health")) {
			return jsonResponse({ ok: true });
		}
		if (url.pathname.endsWith("/cleanup")) {
			return cleanupTimetableCache(env, url);
		}
		if (url.pathname.endsWith("/inspect")) {
			return inspectTimetableCache(env, url);
		}
		if (url.pathname.endsWith("/jreast-shinkansen/train-numbers")) {
			return getJreastShinkansenTrainNumbers(env, url);
		}
		if (url.pathname.endsWith("/trainnavi/operation-status")) {
			return proxyTrainNaviOperationStatus(url);
		}
		if (url.pathname.endsWith("/trainnavi/train-info")) {
			return proxyTrainNaviTrainInfo(url);
		}
		if (url.pathname.endsWith("/trainnavi/timetable")) {
			return resolveTrainNaviTimetable(url);
		}
		const trainNumber = getTimetableTrainNumber(url.pathname);
		if (trainNumber) {
			return getTimetableResponse(env, trainNumber, url.searchParams.get("date"));
		}
		if (url.pathname.endsWith("/refresh")) {
			if (env.TIMETABLE_REFRESH_TOKEN) {
				const token = url.searchParams.get("token") || request.headers.get("x-refresh-token") || "";
				if (token !== env.TIMETABLE_REFRESH_TOKEN) return jsonResponse({ ok: false, error: "Unauthorized" }, { status: 401 });
			}
			const result = await refreshTimetableCache(env, {
				triggeredBy: "manual",
				forceNew: isTruthy(url.searchParams.get("reset")),
				cursor: parseOptionalNumber(url.searchParams.get("cursor")),
				limit: parseOptionalNumber(url.searchParams.get("limit")),
				requestUrl: url
			});
			return jsonResponse(result);
		}
		return jsonResponse({ ok: false, error: "Not Found" }, { status: 404 });
	}
};

async function getTimetableResponse(env, trainNumber, requestedDate) {
	if (!env.JRKYUSHU_TIMETABLE_KV) {
		return jsonResponse({ ok: false, error: "JRKYUSHU_TIMETABLE_KV is not configured" }, { status: 500 });
	}
	const serviceDate = normalizeDate(requestedDate) || getServiceDate().ymd;
	const value = await env.JRKYUSHU_TIMETABLE_KV.get(trainKey(serviceDate, trainNumber));
	if (!value) return jsonResponse({ ok: false, error: "Not Found" }, { status: 404 });
	return new Response(value, { headers: JSON_HEADERS });
}

async function proxyTrainNaviOperationStatus(url) {
	try {
		const params = buildTrainNaviOperationStatusParams(url.searchParams);
		const data = await fetchTrainNaviJson("station/operationStatus", params, 10);
		return jsonResponse(data, { headers: { "cache-control": "public, max-age=10" } });
	} catch (error) {
		return trainNaviErrorResponse(error);
	}
}

async function proxyTrainNaviTrainInfo(url) {
	try {
		const params = buildTrainNaviTrainInfoParams(url.searchParams);
		const data = await fetchTrainNaviJson("station/trainInfo", params, 30);
		return jsonResponse(data, { headers: { "cache-control": "public, max-age=30" } });
	} catch (error) {
		return trainNaviErrorResponse(error);
	}
}

async function resolveTrainNaviTimetable(url) {
	try {
		let input = parseTrainNaviTimetableRequest(url.searchParams);
		const stationInputs = input.currentStationCode ? [input] : await resolveTrainNaviStationInputs(input);
		input = stationInputs[0];
		let identity = input.identity;
		let train = null;

		if (identity.trainSignCode === null) {
			const inferredIdentity = inferTrainNaviIdentity(input);
			if (inferredIdentity) {
				for (const candidateInput of stationInputs) {
					try {
						const directInfoData = await fetchTrainNaviInfo(candidateInput, inferredIdentity);
						const directTrain = selectTrainNaviInfoRow(directInfoData, inferredIdentity, true);
						if (!directTrain) continue;
						input = candidateInput;
						identity = inferredIdentity;
						train = directTrain;
						break;
					} catch (_error) {
						// Some trains use exceptional identity values; operationStatus remains the fallback.
					}
				}
			}

			if (!train) {
				identity = null;
				for (const candidateInput of stationInputs) {
					const operationParams = buildTrainNaviOperationStatusParams(new URLSearchParams({
						drivingRouteCode: candidateInput.drivingRouteCode,
						stationCode: candidateInput.currentStationCode,
						upperLowerKbn: candidateInput.upperLowerKbn,
						lang: candidateInput.lang
					}));
					let operationData;
					try {
						operationData = await fetchTrainNaviJson("station/operationStatus", operationParams, 10);
					} catch (_error) {
						continue;
					}
					identity = resolveTrainNaviIdentity(operationData, candidateInput);
					if (identity) {
						input = candidateInput;
						break;
					}
				}
			}
			if (!train && !identity) {
				return jsonResponse({
					ok: true,
					matched: false,
					reason: "train-not-found",
					timetable: []
				}, { headers: { "cache-control": "public, max-age=10" } });
			}
		}

		if (!train) {
			const infoData = await fetchTrainNaviInfo(input, identity);
			train = selectTrainNaviInfoRow(infoData, identity);
		}
		if (!train) {
			return jsonResponse({
				ok: true,
				matched: false,
				reason: "timetable-not-found",
				timetable: []
			}, { headers: { "cache-control": "public, max-age=15" } });
		}

		return jsonResponse({
			ok: true,
			matched: true,
			identity: pickTrainNaviIdentity(train),
			train: normalizeTrainNaviTrain(train),
			timetable: normalizeTrainNaviTimetable(train)
		}, { headers: { "cache-control": "public, max-age=30" } });
	} catch (error) {
		return trainNaviErrorResponse(error);
	}
}

function inferTrainNaviIdentity(input) {
	const signCodes = { "": 0, M: 1, D: 2, C: 3, H: 10 };
	if (!Object.prototype.hasOwnProperty.call(signCodes, input.trainSignName)) return null;
	return Object.assign({}, input.identity, {
		trainSignCode: signCodes[input.trainSignName]
	});
}

function fetchTrainNaviInfo(input, identity) {
	const infoParams = buildTrainNaviTrainInfoParams(new URLSearchParams({
		drivingRouteCode: input.drivingRouteCode,
		stationCode: input.stationCode,
		currentStationCode: input.currentStationCode,
		trainCrownCode: String(identity.trainCrownCode),
		trainNumber: String(identity.trainNumber),
		trainSignCode: String(identity.trainSignCode),
		trainGenkai: String(identity.trainGenkai),
		trainCompanyCode: String(identity.trainCompanyCode),
		drivingBaseDate: identity.drivingBaseDate,
		isVisibleAllTrain: "true",
		lang: input.lang
	}));
	return fetchTrainNaviJson("station/trainInfo", infoParams, 30);
}

function parseTrainNaviTimetableRequest(searchParams) {
	const parsedTrainNumber = parseTrainNaviDisplayNumber(requireTrainNaviText(searchParams, "trainNumber", /^\d{1,6}[A-Za-z]?$/));
	const drivingBaseDate = normalizeDate(searchParams.get("drivingBaseDate")) || getServiceDate().ymd;
	const signCodeText = optionalTrainNaviText(searchParams, "trainSignCode", /^\d{1,3}$/);
	const currentStationCode = optionalTrainNaviText(searchParams, "currentStationCode", /^\d{1,12}$/);
	const drivingRouteCode = optionalTrainNaviText(searchParams, "drivingRouteCode", /^\d{1,8}$/);
	const stationCode = optionalTrainNaviText(searchParams, "stationCode", /^\d{1,12}$/) || currentStationCode;
	const currentStationName = optionalTrainNaviText(searchParams, "currentStationName", /^.{1,40}$/);
	const drivingRouteName = optionalTrainNaviText(searchParams, "drivingRouteName", /^.{1,40}$/);
	if ((!currentStationCode || !drivingRouteCode) && (!currentStationName || !drivingRouteName)) {
		throw trainNaviRequestError("station code or station/route name is required");
	}
	return {
		drivingRouteCode,
		stationCode,
		currentStationCode,
		currentStationName,
		drivingRouteName,
		upperLowerKbn: requireTrainNaviText(searchParams, "upperLowerKbn", /^[12]$/),
		lang: normalizeTrainNaviLanguage(searchParams.get("lang")),
		trainNumber: parsedTrainNumber.number,
		trainSignName: parsedTrainNumber.signName,
		drivingBaseDate,
		identity: {
			trainCrownCode: Number(optionalTrainNaviText(searchParams, "trainCrownCode", /^\d{1,3}$/) || 0),
			trainNumber: parsedTrainNumber.number,
			trainSignCode: signCodeText === "" ? null : Number(signCodeText),
			trainGenkai: Number(optionalTrainNaviText(searchParams, "trainGenkai", /^\d{1,3}$/) || 0),
			trainCompanyCode: Number(optionalTrainNaviText(searchParams, "trainCompanyCode", /^\d{1,3}$/) || 1),
			drivingBaseDate
		}
	};
}

async function resolveTrainNaviStationInput(input) {
	const stationInputs = await resolveTrainNaviStationInputs(input);
	return stationInputs[0];
}

async function resolveTrainNaviStationInputs(input) {
	const searchData = await fetchTrainNaviJson("findStationInput", new URLSearchParams({
		inputString: input.currentStationName,
		lang: input.lang
	}), 86400);
	const stationRows = Array.isArray(searchData) ? searchData : [];
	const normalizedStationName = normalizeTrainNaviLookupText(input.currentStationName);
	const station = stationRows.find((row) => normalizeTrainNaviLookupText(row && row.stationName) === normalizedStationName) || stationRows[0];
	if (!station || !station.stationCode) throw trainNaviRequestError("station not found");

	const stationCode = String(station.stationCode);
	const detail = await fetchTrainNaviJson("stationDetailInfo", new URLSearchParams({
		stationCode,
		lang: input.lang
	}), 86400);
	const routes = detail && Array.isArray(detail.drivingNumberingDirectionList) ? detail.drivingNumberingDirectionList : [];
	const normalizedRouteName = normalizeTrainNaviLookupText(input.drivingRouteName);
	const exactRoutes = routes.filter((row) => normalizeTrainNaviLookupText(row && row.drivingRouteName) === normalizedRouteName);
	const partialRoutes = routes.filter((row) => {
		if (exactRoutes.includes(row)) return false;
		const candidate = normalizeTrainNaviLookupText(row && row.drivingRouteName);
		return candidate && (candidate.includes(normalizedRouteName) || normalizedRouteName.includes(candidate));
	});
	const remainingRoutes = routes.filter((row) => !exactRoutes.includes(row) && !partialRoutes.includes(row));
	let orderedRoutes = exactRoutes.concat(partialRoutes, remainingRoutes);
	if (!orderedRoutes.length && routes.length === 1) orderedRoutes = routes.slice();
	if (!orderedRoutes.length) throw trainNaviRequestError("route not found at station");

	return orderedRoutes.map((route) => {
		const routeCode = String(route.guidanceDrivingRouteCode || route.drivingRouteCode || "");
		if (!/^\d{1,8}$/.test(routeCode)) return null;
		return Object.assign({}, input, {
			drivingRouteCode: routeCode,
			stationCode,
			currentStationCode: stationCode
		});
	}).filter(Boolean);
}

function normalizeTrainNaviLookupText(value) {
	return String(value || "")
		.replace(/[\s・･]/g, "")
		.replace(/[()（）]/g, "")
		.replace(/本線$/, "線")
		.replace(/福北ゆたか線$/, "篠栗線")
		.toLowerCase();
}

function buildTrainNaviOperationStatusParams(searchParams) {
	return new URLSearchParams({
		drivingRouteCode: requireTrainNaviText(searchParams, "drivingRouteCode", /^\d{1,8}$/),
		stationCode: requireTrainNaviText(searchParams, "stationCode", /^\d{1,12}$/),
		upperLowerKbn: requireTrainNaviText(searchParams, "upperLowerKbn", /^[12]$/),
		lang: normalizeTrainNaviLanguage(searchParams.get("lang"))
	});
}

function buildTrainNaviTrainInfoParams(searchParams) {
	return new URLSearchParams({
		drivingRouteCode: requireTrainNaviText(searchParams, "drivingRouteCode", /^\d{1,8}$/),
		stationCode: requireTrainNaviText(searchParams, "stationCode", /^\d{1,12}$/),
		currentStationCode: requireTrainNaviText(searchParams, "currentStationCode", /^\d{1,12}$/),
		trainCrownCode: optionalTrainNaviText(searchParams, "trainCrownCode", /^\d{1,3}$/) || "0",
		trainNumber: requireTrainNaviText(searchParams, "trainNumber", /^\d{1,6}$/),
		trainSignCode: requireTrainNaviText(searchParams, "trainSignCode", /^\d{1,3}$/),
		trainGenkai: optionalTrainNaviText(searchParams, "trainGenkai", /^\d{1,3}$/) || "0",
		trainCompanyCode: optionalTrainNaviText(searchParams, "trainCompanyCode", /^\d{1,3}$/) || "1",
		drivingBaseDate: normalizeDate(searchParams.get("drivingBaseDate")) || getServiceDate().ymd,
		isVisibleAllTrain: searchParams.get("isVisibleAllTrain") === "false" ? "false" : "true",
		lang: normalizeTrainNaviLanguage(searchParams.get("lang"))
	});
}

async function fetchTrainNaviJson(path, params, cacheTtl) {
	const upstreamUrl = new URL(path, JRKYUSHU_TRAIN_NAVI_API_BASE);
	upstreamUrl.search = params.toString();
	const response = await fetch(upstreamUrl.toString(), {
		headers: {
			accept: "application/json",
			"user-agent": "trainlocation train navi timetable"
		},
		cf: {
			cacheEverything: true,
			cacheTtl
		}
	});
	if (!response.ok) {
		const error = new Error("JR Kyushu Train Navi request failed: " + response.status);
		error.status = response.status >= 400 && response.status < 500 ? 400 : 502;
		throw error;
	}
	return response.json();
}

function resolveTrainNaviIdentity(operationData, input) {
	const rows = Array.isArray(operationData && operationData.trainInfoList) ? operationData.trainInfoList : [];
	let candidates = rows.filter((row) => Number(row && row.trainNumber) === input.trainNumber);
	if (input.trainSignName) {
		candidates = candidates.filter((row) => String(row && row.trainSignName || "").toUpperCase() === input.trainSignName);
	}
	const sameDate = candidates.filter((row) => normalizeDate(row && row.drivingBaseDate) === input.drivingBaseDate);
	if (sameDate.length) candidates = sameDate;
	const active = candidates.filter((row) => !row.operationCompleted);
	if (active.length) candidates = active;
	if (candidates.length !== 1) return null;
	return pickTrainNaviIdentity(candidates[0]);
}

function selectTrainNaviInfoRow(infoData, identity, strict) {
	const rows = Array.isArray(infoData && infoData.trainInfoDataList) ? infoData.trainInfoDataList : [];
	return rows.find((row) => sameTrainNaviIdentity(row, identity)) || (strict ? null : rows[0]) || null;
}

function sameTrainNaviIdentity(row, identity) {
	return Number(row && row.trainNumber) === Number(identity && identity.trainNumber) &&
		Number(row && row.trainSignCode) === Number(identity && identity.trainSignCode) &&
		Number(row && row.trainCrownCode || 0) === Number(identity && identity.trainCrownCode || 0) &&
		Number(row && row.trainGenkai || 0) === Number(identity && identity.trainGenkai || 0) &&
		Number(row && row.trainCompanyCode || 1) === Number(identity && identity.trainCompanyCode || 1);
}

function pickTrainNaviIdentity(row) {
	return {
		trainCrownCode: Number(row && row.trainCrownCode || 0),
		trainNumber: Number(row && row.trainNumber || 0),
		trainSignCode: Number(row && row.trainSignCode || 0),
		trainSignName: String(row && row.trainSignName || ""),
		trainGenkai: Number(row && row.trainGenkai || 0),
		trainCompanyCode: Number(row && row.trainCompanyCode || 1),
		drivingBaseDate: normalizeDate(row && row.drivingBaseDate) || ""
	};
}

function normalizeTrainNaviTrain(row) {
	return {
		trainNumber: String(Number(row.trainNumber || 0)) + String(row.trainSignName || ""),
		trainKindName: String(row.trainKindName || row.trainKindInformationName || ""),
		nickName: String(row.nickName || ""),
		destinationStationName: String(row.destinationStationName || ""),
		cars: Number(row.cars) > 0 ? Number(row.cars) : null,
		delayMinutes: row.delayMinutes === null || row.delayMinutes === undefined || row.delayMinutes === "" ?
			null : (Number.isFinite(Number(row.delayMinutes)) ? Number(row.delayMinutes) : null),
		suspension: row.suspension === true,
		operationCompleted: row.operationCompleted === true
	};
}

function normalizeTrainNaviTimetable(row) {
	const stationRows = row && row.stopStationData && Array.isArray(row.stopStationData.stationDataList) ? row.stopStationData.stationDataList : [];
	return stationRows.map((station) => {
		const main = station && station.mainTrainData || {};
		const arrival = normalizeTrainNaviTime(main.arrivalTime);
		const departure = normalizeTrainNaviTime(main.departureTime);
		return {
			stationName: String(station && station.stationName || ""),
			planArrival: arrival,
			planDeparture: departure,
			time: departure || arrival,
			startingStation: main.startingStation === true,
			terminalStation: main.terminalStation === true,
			platform: station && station.departurePlatform !== null && station.departurePlatform !== undefined ? String(station.departurePlatform) : ""
		};
	}).filter((station) => station.stationName && station.time);
}

function normalizeTrainNaviTime(value) {
	const match = String(value || "").match(/^(\d{1,2}):(\d{2})/);
	return match ? String(Number(match[1])).padStart(2, "0") + ":" + match[2] : "";
}

function parseTrainNaviDisplayNumber(value) {
	const match = String(value || "").trim().toUpperCase().match(/^0*(\d+)([A-Z]?)$/);
	if (!match) throw trainNaviRequestError("invalid trainNumber");
	return { number: Number(match[1]), signName: match[2] || "" };
}

function requireTrainNaviText(searchParams, name, pattern) {
	const value = String(searchParams.get(name) || "").trim();
	if (!value || !pattern.test(value)) throw trainNaviRequestError("invalid " + name);
	return value;
}

function optionalTrainNaviText(searchParams, name, pattern) {
	const raw = searchParams.get(name);
	if (raw === null || raw === "") return "";
	const value = String(raw).trim();
	if (!pattern.test(value)) throw trainNaviRequestError("invalid " + name);
	return value;
}

function normalizeTrainNaviLanguage(value) {
	const language = String(value || "ja").toLowerCase();
	return ["ja", "en", "ko", "zh-cn", "zh-tw"].includes(language) ? language : "ja";
}

function trainNaviRequestError(message) {
	const error = new Error(message);
	error.status = 400;
	return error;
}

function trainNaviErrorResponse(error) {
	const status = Number(error && error.status) || 502;
	return jsonResponse({
		ok: false,
		error: status === 400 ? String(error && error.message || "Bad Request") : "JR Kyushu Train Navi is unavailable"
	}, { status });
}

async function getJreastShinkansenTrainNumbers(env, url) {
	if (!env.JRKYUSHU_TIMETABLE_KV) {
		return jsonResponse({ ok: false, error: "JRKYUSHU_TIMETABLE_KV is not configured" }, { status: 500 });
	}
	const serviceDate = getRequestedServiceDate(url.searchParams.get("date"));
	const timetableMonth = serviceDate.ym.slice(2);
	const monthlyData = await getJreastMonthlyTrainNumberData(env, timetableMonth);
	const calendarType = isJreastHolidaySchedule(serviceDate) ? "holiday" : "weekday";
	const selectedPages = monthlyData.pages && monthlyData.pages[calendarType] ? monthlyData.pages[calendarType] : {};
	const maps = {
		U: buildJreastActiveTrainNumberMap(selectedPages.U || [], serviceDate),
		D: buildJreastActiveTrainNumberMap(selectedPages.D || [], serviceDate)
	};
	return jsonResponse({
		ok: true,
		date: serviceDate.ymd,
		month: timetableMonth,
		calendarType,
		fetchedAt: monthlyData.fetchedAt || "",
		counts: {
			U: Object.keys(maps.U).length,
			D: Object.keys(maps.D).length
		},
		maps
	}, {
		headers: {
			"cache-control": "public, max-age=3600",
			"access-control-allow-origin": "*"
		}
	});
}

async function getJreastMonthlyTrainNumberData(env, timetableMonth) {
	const key = JREAST_TRAIN_NUMBER_CACHE_KEY_PREFIX + ":" + timetableMonth;
	const cached = await env.JRKYUSHU_TIMETABLE_KV.get(key, "json");
	if (cached && cached.version === 1 && cached.pages) return cached;

	const pageDefinitions = [
		{ calendarType: "weekday", direction: "D", file: "001d1.html" },
		{ calendarType: "holiday", direction: "D", file: "001d2.html" },
		{ calendarType: "weekday", direction: "U", file: "001u1.html" },
		{ calendarType: "holiday", direction: "U", file: "001u2.html" }
	];
	const results = await Promise.all(pageDefinitions.map(async (definition) => {
		const sourceUrl = JREAST_TIMETABLE_BASE_URL + "/" + timetableMonth + "/timetable-v/" + definition.file;
		const html = await fetchText(sourceUrl);
		return Object.assign({}, definition, {
			sourceUrl,
			entries: parseJreastShinkansenTimetablePage(html)
		});
	}));
	const pages = {
		weekday: { U: [], D: [] },
		holiday: { U: [], D: [] }
	};
	const sources = {};
	for (const result of results) {
		pages[result.calendarType][result.direction] = result.entries;
		sources[result.calendarType + result.direction] = result.sourceUrl;
	}
	const value = {
		version: 1,
		month: timetableMonth,
		fetchedAt: new Date().toISOString(),
		sources,
		pages
	};
	await env.JRKYUSHU_TIMETABLE_KV.put(key, JSON.stringify(value), {
		expirationTtl: 120 * 24 * 60 * 60
	});
	return value;
}

function parseJreastShinkansenTimetablePage(html) {
	const rows = extractJreastTimetableRows(html);
	const numberRow = rows.find((row) => row[0] === "列車番号") || [];
	const nameRow = rows.find((row) => row[0] === "列車名") || [];
	const operationRow = rows.find((row) => row[0] === "運転日") || [];
	const length = Math.min(numberRow.length, nameRow.length);
	const entries = [];
	for (let index = 0; index < length; index += 1) {
		const trainNumber = normalizeTrainNumber(numberRow[index]);
		const trainName = normalizeJreastShinkansenTrainName(nameRow[index]);
		if (!/^\d+A$/.test(trainNumber) || !trainName) continue;
		entries.push({
			trainNumber,
			trainName,
			operation: normalizeJreastOperationText(operationRow[index] || "全日")
		});
	}
	if (entries.length < 1) throw new Error("JR East timetable train rows were not found");
	return entries;
}

function extractJreastTimetableRows(html) {
	const rows = [];
	const rowPattern = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
	let rowMatch;
	while ((rowMatch = rowPattern.exec(String(html || ""))) !== null) {
		const cells = [];
		const cellPattern = /<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/gi;
		let cellMatch;
		while ((cellMatch = cellPattern.exec(rowMatch[1])) !== null) {
			cells.push(normalizeJreastCellText(cellMatch[1]));
		}
		if (cells.length) rows.push(cells);
	}
	return rows;
}

function normalizeJreastCellText(html) {
	return decodeHtmlEntities(stripHtml(html))
		.replace(/[\u00a0\u3000\s]+/g, " ")
		.trim();
}

function decodeHtmlEntities(text) {
	return String(text || "")
		.replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
		.replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
		.replace(/&nbsp;/gi, " ")
		.replace(/&amp;/gi, "&")
		.replace(/&lt;/gi, "<")
		.replace(/&gt;/gi, ">")
		.replace(/&quot;/gi, "\"")
		.replace(/&#39;|&apos;/gi, "'");
}

function normalizeJreastShinkansenTrainName(value) {
	const text = String(value || "")
		.replace(/[\u00a0\u3000\s]+/g, "")
		.replace(/号$/g, "");
	const match = text.match(/(のぞみ|ひかり|こだま|みずほ|さくら|つばめ)(\d+)/);
	return match ? match[1] + String(Number(match[2])) : "";
}

function normalizeJreastOperationText(value) {
	return String(value || "")
		.replace(/[\u00a0\u3000\s]+/g, "")
		.replace(/^◆/g, "") || "全日";
}

function buildJreastActiveTrainNumberMap(entries, serviceDate) {
	const candidates = new Map();
	for (const entry of entries) {
		if (!entry || !entry.trainName || !isJreastOperationActive(entry.operation, serviceDate)) continue;
		if (!candidates.has(entry.trainName)) candidates.set(entry.trainName, []);
		const values = candidates.get(entry.trainName);
		if (!values.includes(entry.trainNumber)) values.push(entry.trainNumber);
	}
	const result = {};
	for (const [trainName, trainNumbers] of candidates.entries()) {
		result[trainName] = trainNumbers.length === 1 ? trainNumbers[0] : trainNumbers;
	}
	return result;
}

function isJreastOperationActive(operationText, serviceDate) {
	const text = normalizeJreastOperationText(operationText);
	if (!text || text === "全日") return true;
	const parts = text.split(/・?但し、?/);
	const main = parts[0] || "";
	const exception = parts.slice(1).join("・") || "";
	const dateKey = serviceDate.ymd;
	const mainDates = extractJreastOperationDates(main, serviceDate).has(dateKey);
	let active = true;
	if (main.indexOf("時変") >= 0) {
		active = mainDates;
	} else if (main.indexOf("運休") >= 0) {
		const holidayCondition = main.indexOf("休日") >= 0 && isJapanesePublicHolidayOrSunday(serviceDate);
		const saturdayCondition = main.indexOf("土曜") >= 0 && serviceDate.dayOfWeek === 6;
		active = !(holidayCondition || saturdayCondition || mainDates);
	} else if (main.indexOf("運転") >= 0) {
		active = mainDates;
	}
	if (exception) {
		const exceptionDates = extractJreastOperationDates(exception, serviceDate).has(dateKey);
		if (exception.indexOf("運転") >= 0 && exceptionDates) active = true;
		if (exception.indexOf("運休") >= 0 && exceptionDates) active = false;
	}
	return active;
}

function extractJreastOperationDates(text, serviceDate) {
	const dates = new Set();
	const tokens = [];
	const pattern = /(\d{1,2})月|(\d{1,2})(?:日)?(?=～|・|運転|運休|時変|$)|([～・])/g;
	let match;
	while ((match = pattern.exec(String(text || ""))) !== null) {
		if (match[1]) tokens.push({ type: "month", value: Number(match[1]) });
		else if (match[2]) tokens.push({ type: "day", value: Number(match[2]) });
		else tokens.push({ type: match[3] === "～" ? "range" : "separator" });
	}
	let currentMonth = serviceDate.month;
	let previousDate = null;
	let rangePending = false;
	for (const token of tokens) {
		if (token.type === "month") {
			currentMonth = token.value;
			continue;
		}
		if (token.type === "range") {
			rangePending = true;
			continue;
		}
		if (token.type === "separator") continue;
		if (token.type !== "day") continue;
		const currentDate = makeJreastOperationDate(serviceDate, currentMonth, token.value);
		if (rangePending && previousDate) addJreastDateRange(dates, previousDate, currentDate);
		else dates.add(formatDateParts(currentDate));
		previousDate = currentDate;
		rangePending = false;
	}
	return dates;
}

function makeJreastOperationDate(serviceDate, month, day) {
	let year = serviceDate.year;
	if (serviceDate.month >= 11 && month <= 2) year += 1;
	if (serviceDate.month <= 2 && month >= 11) year -= 1;
	return { year, month, day };
}

function addJreastDateRange(output, start, end) {
	let cursor = Date.UTC(start.year, start.month - 1, start.day);
	const endTime = Date.UTC(end.year, end.month - 1, end.day);
	if (endTime < cursor || endTime - cursor > 120 * 24 * 60 * 60 * 1000) return;
	while (cursor <= endTime) {
		const date = new Date(cursor);
		output.add(formatDateParts({
			year: date.getUTCFullYear(),
			month: date.getUTCMonth() + 1,
			day: date.getUTCDate()
		}));
		cursor += 24 * 60 * 60 * 1000;
	}
}

async function cleanupTimetableCache(env, url) {
	if (!env.JRKYUSHU_TIMETABLE_KV) {
		return jsonResponse({ ok: false, error: "JRKYUSHU_TIMETABLE_KV is not configured" }, { status: 500 });
	}
	if (url.searchParams.get("confirm") !== "delete") {
		return jsonResponse({ ok: false, error: "confirm=delete is required" }, { status: 400 });
	}
	if (env.TIMETABLE_REFRESH_TOKEN) {
		const token = url.searchParams.get("token") || "";
		if (token !== env.TIMETABLE_REFRESH_TOKEN) return jsonResponse({ ok: false, error: "Unauthorized" }, { status: 401 });
	}
	const date = normalizeDate(url.searchParams.get("date"));
	if (!date) return jsonResponse({ ok: false, error: "date=YYYY-MM-DD is required" }, { status: 400 });

	const prefix = CACHE_KEY_PREFIX + ":" + date + ":";
	const cursor = url.searchParams.get("cursor") || undefined;
	const list = await env.JRKYUSHU_TIMETABLE_KV.list({ prefix, cursor, limit: 50 });
	const keys = Array.isArray(list.keys) ? list.keys.map((key) => key.name).filter(Boolean) : [];
	for (const key of keys) {
		await env.JRKYUSHU_TIMETABLE_KV.delete(key);
	}
	return jsonResponse({
		ok: true,
		date,
		prefix,
		deleted: keys.length,
		keys,
		cursor: list.cursor || "",
		listComplete: !!list.list_complete,
		nextUrl: buildCleanupNextUrl(url, list)
	});
}

function buildCleanupNextUrl(url, list) {
	if (!list || list.list_complete || !list.cursor) return "";
	const nextUrl = new URL(url.toString());
	nextUrl.searchParams.set("cursor", list.cursor);
	return nextUrl.toString();
}

async function inspectTimetableCache(env, url) {
	if (!env.JRKYUSHU_TIMETABLE_KV) {
		return jsonResponse({ ok: false, error: "JRKYUSHU_TIMETABLE_KV is not configured" }, { status: 500 });
	}
	const date = normalizeDate(url.searchParams.get("date"));
	const trainNumber = normalizeTrainNumber(url.searchParams.get("train") || "");
	const key = url.searchParams.get("key") || (date && trainNumber ? trainKey(date, trainNumber) : "");
	if (!key) return jsonResponse({ ok: false, error: "key or date+train is required" }, { status: 400 });

	const value = await env.JRKYUSHU_TIMETABLE_KV.getWithMetadata(key);
	const listPrefix = key;
	const listed = await env.JRKYUSHU_TIMETABLE_KV.list({ prefix: listPrefix, limit: 1 });
	const listEntry = listed.keys && listed.keys.length ? listed.keys[0] : null;
	const expiration = listEntry && listEntry.expiration ? Number(listEntry.expiration) : 0;
	return jsonResponse({
		ok: true,
		key,
		exists: value.value !== null,
		expiration,
		expirationJst: expiration ? formatJstDateTime(expiration * 1000) : "",
		metadata: value.metadata || null
	});
}

function formatJstDateTime(timestamp) {
	const date = new Date(timestamp + JST_OFFSET_MS);
	return date.getUTCFullYear() + "-" +
		String(date.getUTCMonth() + 1).padStart(2, "0") + "-" +
		String(date.getUTCDate()).padStart(2, "0") + " " +
		String(date.getUTCHours()).padStart(2, "0") + ":" +
		String(date.getUTCMinutes()).padStart(2, "0") + ":" +
		String(date.getUTCSeconds()).padStart(2, "0") + " JST";
}

function getTimetableTrainNumber(pathname) {
	const match = String(pathname || "").match(/^\/(?:api\/jrkyushu\/)?timetable\/([^\/]+)\/?$/);
	return match ? normalizeTrainNumber(decodeURIComponent(match[1])) : "";
}

async function refreshTimetableCache(env, meta = {}) {
	if (!env.JRKYUSHU_TIMETABLE_KV) {
		throw new Error("JRKYUSHU_TIMETABLE_KV is not configured");
	}
	const serviceDate = getServiceDate();
	let state = meta.forceNew ? null : await readRefreshState(env);
	if (!state || state.date !== serviceDate.ymd || !Array.isArray(state.entries)) {
		state = await discoverRefreshState(env, serviceDate, meta);
	}
	if (Number.isInteger(meta.cursor) && meta.cursor >= 0) state.cursor = meta.cursor;
	if (state.completed && !meta.forceNew && !Number.isInteger(meta.cursor)) {
		return {
			ok: true,
			date: state.date,
			completed: true,
			cursor: state.cursor,
			total: state.entries.length,
			count: Array.isArray(state.trains) ? state.trains.length : 0,
			errorCount: Array.isArray(state.errors) ? state.errors.length : 0,
			processed: 0,
			remaining: 0
		};
	}

	const limit = clamp(meta.limit || DETAIL_BATCH_SIZE, 1, DETAIL_BATCH_SIZE);
	const entries = state.entries.slice(state.cursor, state.cursor + limit);
	const trains = [];
	const errors = [];

	for (const entry of entries) {
		try {
			const html = await fetchText(entry.detailUrl);
			const detail = parseTrainDetail(html, entry, serviceDate);
			if (!detail || !detail.trainNumber || !Array.isArray(detail.stations) || detail.stations.length < 1) continue;
			await putTimetableValue(env, trainKey(serviceDate.ymd, detail.trainNumber), detail, serviceDate);
			trains.push({
				trainNumber: detail.trainNumber,
				trainName: detail.trainName,
				destination: detail.destination,
				sourceStationCode: detail.sourceStationCode
			});
		} catch (error) {
			errors.push({ trainNumber: entry.trainNumber, message: String(error && error.message || error) });
		}
	}

	state.cursor += entries.length;
	state.trains = uniqueTrainSummaries([...(state.trains || []), ...trains]);
	state.errors = [...(state.errors || []), ...errors];
	state.completed = state.cursor >= state.entries.length;
	state.updatedAt = new Date().toISOString();

	const index = {
		date: serviceDate.ymd,
		fetchedAt: state.discoveredAt,
		updatedAt: state.updatedAt,
		triggeredBy: meta.triggeredBy || "",
		cron: meta.cron || "",
		completed: state.completed,
		cursor: state.cursor,
		total: state.entries.length,
		count: state.trains.length,
		errorCount: state.errors.length,
		trains: state.trains,
		errors: state.errors
	};
	await putTimetableValue(env, refreshStateKey(), state, serviceDate);
	await putTimetableValue(env, indexKey(serviceDate.ymd), index, serviceDate);
	if (state.completed) await putTimetableValue(env, latestKey(), index, serviceDate);
	return {
		ok: true,
		...index,
		processed: entries.length,
		remaining: Math.max(0, state.entries.length - state.cursor),
		nextUrl: buildNextRefreshUrl(meta.requestUrl, state)
	};
}

async function discoverRefreshState(env, serviceDate, meta) {
	const discovered = new Map();
	for (const source of STATION_SOURCES) {
		const html = await fetchText(buildStationTimetableUrl(source.code, serviceDate));
		parseStationTimetable(html, source, serviceDate).forEach((entry) => {
			if (!discovered.has(entry.trainNumber)) discovered.set(entry.trainNumber, entry);
		});
	}
	const state = {
		date: serviceDate.ymd,
		discoveredAt: new Date().toISOString(),
		triggeredBy: meta.triggeredBy || "",
		cron: meta.cron || "",
		cursor: 0,
		completed: false,
		entries: Array.from(discovered.values()).slice(0, MAX_DETAIL_FETCHES),
		trains: [],
		errors: []
	};
	await putTimetableValue(env, refreshStateKey(), state, serviceDate);
	return state;
}

async function readRefreshState(env) {
	try {
		const text = await env.JRKYUSHU_TIMETABLE_KV.get(refreshStateKey());
		return text ? JSON.parse(text) : null;
	} catch {
		return null;
	}
}

function buildStationTimetableUrl(stationCode, serviceDate) {
	const params = new URLSearchParams({
		c: stationCode,
		year_month: serviceDate.ym,
		date: serviceDate.day,
		rs: "1"
	});
	return "https://www.jrkyushu-timetable.jp/cgi-bin/jr-k_time/tt_dep.cgi?" + params.toString();
}

function parseStationTimetable(html, source, serviceDate) {
	const result = [];
	const cellPattern = /<td\b[^>]*class\s*=\s*["']?back5["']?[\s\S]*?<\/td>/gi;
	let match;
	while ((match = cellPattern.exec(String(html || ""))) !== null) {
		const cell = match[0];
		const hrefMatch = cell.match(/href=["']([^"']*\/jr-k_time\/[^"']+\.html[^"']*)["']/i);
		if (!hrefMatch) continue;
		const lines = stripHtml(cell).split(/\n+/).map((line) => line.trim()).filter(Boolean);
		if (lines.length < 3) continue;
		const trainName = lines[0] || "";
		const number = lines[1] || "";
		const trainNumber = normalizeSourceTrainNumber(number, source);
		if (!trainNumber) continue;
		if (!isTargetShinkansenTrain(trainName, trainNumber, source)) continue;
		result.push({
			date: serviceDate.ymd,
			trainNumber,
			trainName,
			destination: lines[lines.length - 1] || "",
			sourceGroup: source.group,
			sourceStationCode: source.code,
			sourceStationName: source.name,
			detailUrl: new URL(hrefMatch[1], "https://www.jrkyushu-timetable.jp").toString()
		});
	}
	return result;
}

function parseTrainDetail(html, entry, serviceDate) {
	const columnInfo = getTrainDetailColumnInfo(html, entry);
	const rows = [];
	const rowPattern = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
	let rowMatch;
	while ((rowMatch = rowPattern.exec(String(html || ""))) !== null) {
		const cells = Array.from(rowMatch[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)).map((cell) => cell[1]);
		if (cells.length <= columnInfo.timeIndex) continue;
		const stationName = stripHtml(cells[0]).replace(/\s+/g, "");
		const timeText = stripHtml(cells[columnInfo.timeIndex]);
		if (!stationName || !/\d{1,2}:\d{2}/.test(timeText)) continue;
		rows.push({
			stationName,
			arrival: extractTime(timeText, "\u7740"),
			departure: extractTime(timeText, "\u767a"),
			platform: stripHtml(cells[columnInfo.platformIndex] || "").replace(/\s+/g, "")
		});
	}
	return {
		date: serviceDate.ymd,
		trainNumber: columnInfo.trainNumber,
		trainName: entry.trainName,
		destination: entry.destination,
		source: "jrkyushu-timetable",
		sourceStationCode: entry.sourceStationCode,
		sourceStationName: entry.sourceStationName,
		detailUrl: entry.detailUrl,
		fetchedAt: new Date().toISOString(),
		stations: rows
	};
}

function getTrainDetailColumnInfo(html, entry) {
	const numbers = extractDetailTrainNumbers(html);
	const entryNumber = normalizeSourceTrainNumber(entry && entry.trainNumber, { group: entry && entry.sourceGroup });
	const sourceGroup = entry && entry.sourceGroup || "";
	let index = numbers.findIndex((number) => number === entryNumber);
	if (index < 0 && sourceGroup === "nishi_kyushu") index = numbers.findIndex((number) => /G$/.test(number));
	if (index < 0) index = 0;
	const trainNumber = numbers[index] || entryNumber || normalizeTrainNumber(entry && entry.trainNumber);
	return {
		trainNumber: trainNumber,
		timeIndex: index * 2 + 1,
		platformIndex: index * 2 + 2
	};
}

function extractDetailTrainNumbers(html) {
	const result = [];
	const pattern = /<td\b[^>]*colspan\s*=\s*["']?2["']?[^>]*>\s*([\s\S]*?)\s*<\/td>/gi;
	let match;
	while ((match = pattern.exec(String(html || ""))) !== null) {
		const text = stripHtml(match[1]).replace(/\s+/g, "");
		const numberMatch = text.match(/\d+[A-Z]/i);
		if (numberMatch) result.push(normalizeTrainNumber(numberMatch[0]));
	}
	return result;
}

function extractTime(text, suffix) {
	const match = String(text || "").match(new RegExp("(\\d{1,2}:\\d{2})\\s*" + suffix));
	return match ? match[1] : "";
}

async function fetchText(url) {
	const response = await fetch(url, {
		headers: {
			"user-agent": "trainlocation timetable cache"
		}
	});
	if (!response.ok) throw new Error("Fetch failed " + response.status + " " + url);
	return response.text();
}

function stripHtml(html) {
	return String(html || "")
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<[^>]+>/g, "")
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.trim();
}

function normalizeTrainNumber(number) {
	const text = String(number || "").trim().toUpperCase();
	if (!text) return "";
	const match = text.match(/^0*(\d+)([A-Z]?)$/);
	if (!match) return text;
	return String(Number(match[1])) + (match[2] || "A");
}

function normalizeSourceTrainNumber(number, source) {
	const text = String(number || "").trim().toUpperCase();
	if (!text) return "";
	const match = text.match(/^0*(\d+)([A-Z]?)$/);
	if (!match) return text;
	const digits = Number(match[1]);
	const suffix = match[2] || "";
	if (source && source.group === "nishi_kyushu") {
		return String(suffix ? digits : (digits < 1000 ? digits + 2000 : digits)) + (suffix || "G");
	}
	return String(digits) + (suffix || "A");
}

function isTargetShinkansenTrain(trainName, trainNumber, source) {
	const normalizedName = String(trainName || "").replace(/\s+/g, "");
	if (!SHINKANSEN_TRAIN_NAMES.has(normalizedName)) return false;
	const normalizedNumber = normalizeSourceTrainNumber(trainNumber, source);
	if (source && source.group === "nishi_kyushu") {
		return normalizedName === "\u304b\u3082\u3081" && /^\d+G$/.test(normalizedNumber);
	}
	if (!/^\d+A$/.test(normalizedNumber)) return false;
	return normalizedName !== "\u304b\u3082\u3081";
}

function normalizeDate(date) {
	const text = String(date || "").trim();
	return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

function uniqueTrainSummaries(trains) {
	const map = new Map();
	for (const train of trains) {
		if (train && train.trainNumber) map.set(train.trainNumber, train);
	}
	return Array.from(map.values());
}

function parseOptionalNumber(value) {
	if (value === null || value === undefined || value === "") return null;
	const number = Number(value);
	return Number.isFinite(number) ? Math.floor(number) : null;
}

function clamp(value, min, max) {
	return Math.max(min, Math.min(max, value));
}

function isTruthy(value) {
	return value === "1" || value === "true" || value === "yes";
}

function buildNextRefreshUrl(requestUrl, state) {
	if (!requestUrl || state.completed) return "";
	const url = new URL(requestUrl.toString());
	url.searchParams.delete("reset");
	url.searchParams.set("cursor", String(state.cursor));
	return url.toString();
}

async function putTimetableValue(env, key, value, serviceDate) {
	await env.JRKYUSHU_TIMETABLE_KV.put(key, JSON.stringify(value), {
		expiration: getTimetableExpirationEpochSeconds(serviceDate)
	});
}

function getTimetableExpirationEpochSeconds(serviceDate) {
	const ymd = typeof serviceDate === "string" ? serviceDate : serviceDate && serviceDate.ymd;
	const match = String(ymd || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!match) return Math.floor(Date.now() / 1000) + 2 * 24 * 60 * 60;
	const expiresAtUtcMs = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + 1, 15, 0, 0);
	const minExpiresAt = Date.now() + 60 * 1000;
	return Math.floor(Math.max(expiresAtUtcMs, minExpiresAt) / 1000);
}

function getRequestedServiceDate(requestedDate) {
	const normalized = normalizeDate(requestedDate);
	if (!normalized) return getServiceDate();
	const parts = normalized.split("-").map(Number);
	return makeServiceDateParts(parts[0], parts[1], parts[2]);
}

function makeServiceDateParts(year, month, day) {
	const timestamp = Date.UTC(year, month - 1, day);
	const date = new Date(timestamp);
	const normalizedYear = date.getUTCFullYear();
	const normalizedMonth = date.getUTCMonth() + 1;
	const normalizedDay = date.getUTCDate();
	return {
		year: normalizedYear,
		month: normalizedMonth,
		day: normalizedDay,
		dayOfWeek: date.getUTCDay(),
		ymd: formatDateParts({ year: normalizedYear, month: normalizedMonth, day: normalizedDay }),
		ym: String(normalizedYear) + String(normalizedMonth).padStart(2, "0")
	};
}

function formatDateParts(parts) {
	return String(parts.year) + "-" +
		String(parts.month).padStart(2, "0") + "-" +
		String(parts.day).padStart(2, "0");
}

function isJreastHolidaySchedule(serviceDate) {
	return serviceDate.dayOfWeek === 0 || serviceDate.dayOfWeek === 6 || isJapanesePublicHoliday(serviceDate);
}

function isJapanesePublicHolidayOrSunday(serviceDate) {
	return serviceDate.dayOfWeek === 0 || isJapanesePublicHoliday(serviceDate);
}

function isJapanesePublicHoliday(serviceDate) {
	return getJapanesePublicHolidaySet(serviceDate.year).has(serviceDate.ymd);
}

function getJapanesePublicHolidaySet(year) {
	if (japaneseHolidayCache.has(year)) return japaneseHolidayCache.get(year);
	const holidays = new Set();
	const add = (month, day) => holidays.add(formatDateParts({ year, month, day }));
	add(1, 1);
	add(1, getNthWeekdayOfMonth(year, 1, 1, 2));
	add(2, 11);
	if (year >= 2020) add(2, 23);
	add(3, getVernalEquinoxDay(year));
	add(4, 29);
	add(5, 3);
	add(5, 4);
	add(5, 5);
	add(7, getNthWeekdayOfMonth(year, 7, 1, 3));
	if (year >= 2016) add(8, 11);
	add(9, getNthWeekdayOfMonth(year, 9, 1, 3));
	add(9, getAutumnalEquinoxDay(year));
	add(10, getNthWeekdayOfMonth(year, 10, 1, 2));
	add(11, 3);
	add(11, 23);

	for (let cursor = Date.UTC(year, 0, 2); cursor <= Date.UTC(year, 11, 30); cursor += 24 * 60 * 60 * 1000) {
		const date = new Date(cursor);
		const key = formatDateParts({ year, month: date.getUTCMonth() + 1, day: date.getUTCDate() });
		if (holidays.has(key)) continue;
		const previous = new Date(cursor - 24 * 60 * 60 * 1000);
		const next = new Date(cursor + 24 * 60 * 60 * 1000);
		const previousKey = formatDateParts({ year, month: previous.getUTCMonth() + 1, day: previous.getUTCDate() });
		const nextKey = formatDateParts({ year, month: next.getUTCMonth() + 1, day: next.getUTCDate() });
		if (holidays.has(previousKey) && holidays.has(nextKey)) holidays.add(key);
	}

	const baseHolidays = Array.from(holidays);
	for (const key of baseHolidays) {
		const date = new Date(key + "T00:00:00Z");
		if (date.getUTCDay() !== 0) continue;
		let cursor = date.getTime() + 24 * 60 * 60 * 1000;
		let substitute = new Date(cursor);
		let substituteKey = formatDateParts({
			year: substitute.getUTCFullYear(),
			month: substitute.getUTCMonth() + 1,
			day: substitute.getUTCDate()
		});
		while (holidays.has(substituteKey)) {
			cursor += 24 * 60 * 60 * 1000;
			substitute = new Date(cursor);
			substituteKey = formatDateParts({
				year: substitute.getUTCFullYear(),
				month: substitute.getUTCMonth() + 1,
				day: substitute.getUTCDate()
			});
		}
		holidays.add(substituteKey);
	}

	japaneseHolidayCache.set(year, holidays);
	return holidays;
}

function getNthWeekdayOfMonth(year, month, weekday, nth) {
	const firstDay = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
	return 1 + ((7 + weekday - firstDay) % 7) + (nth - 1) * 7;
}

function getVernalEquinoxDay(year) {
	return Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
}

function getAutumnalEquinoxDay(year) {
	return Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
}

function getServiceDate(now = new Date()) {
	const jst = new Date(now.getTime() + JST_OFFSET_MS);
	if (jst.getUTCHours() < 4) jst.setUTCDate(jst.getUTCDate() - 1);
	return makeServiceDateParts(jst.getUTCFullYear(), jst.getUTCMonth() + 1, jst.getUTCDate());
}

function trainKey(date, trainNumber) {
	return CACHE_KEY_PREFIX + ":" + date + ":train:" + normalizeTrainNumber(trainNumber);
}

function indexKey(date) {
	return CACHE_KEY_PREFIX + ":" + date + ":index";
}

function latestKey() {
	return CACHE_KEY_PREFIX + ":latest";
}

function refreshStateKey() {
	return CACHE_KEY_PREFIX + ":refresh-state";
}

function jsonResponse(body, init = {}) {
	return new Response(JSON.stringify(body), {
		...init,
		headers: {
			...JSON_HEADERS,
			...(init.headers || {})
		}
	});
}
