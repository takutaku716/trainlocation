const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const CACHE_KEY_PREFIX = "jrkyushu:timetable";
const MAX_DETAIL_FETCHES = 500;
const DETAIL_BATCH_SIZE = 15;

const STATION_SOURCES = [
	{ code: "28283", group: "kyushu", name: "hakata" },
	{ code: "29007", group: "kyushu", name: "kagoshima_chuo" },
	{ code: "28395", group: "nishi_kyushu", name: "takeo_onsen" },
	{ code: "28533", group: "nishi_kyushu", name: "nagasaki" }
];

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
			await env.JRKYUSHU_TIMETABLE_KV.put(trainKey(serviceDate.ymd, detail.trainNumber), JSON.stringify(detail));
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
	await env.JRKYUSHU_TIMETABLE_KV.put(refreshStateKey(), JSON.stringify(state));
	await env.JRKYUSHU_TIMETABLE_KV.put(indexKey(serviceDate.ymd), JSON.stringify(index));
	if (state.completed) await env.JRKYUSHU_TIMETABLE_KV.put(latestKey(), JSON.stringify(index));
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
	await env.JRKYUSHU_TIMETABLE_KV.put(refreshStateKey(), JSON.stringify(state));
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
		const trainNumber = normalizeTrainNumber(number);
		if (!trainNumber) continue;
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
	const rows = [];
	const rowPattern = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
	let rowMatch;
	while ((rowMatch = rowPattern.exec(String(html || ""))) !== null) {
		const cells = Array.from(rowMatch[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)).map((cell) => cell[1]);
		if (cells.length < 3) continue;
		const stationName = stripHtml(cells[0]).replace(/\s+/g, "");
		const timeText = stripHtml(cells[1]);
		if (!stationName || !/\d{1,2}:\d{2}/.test(timeText)) continue;
		rows.push({
			stationName,
			arrival: extractTime(timeText, "\u7740"),
			departure: extractTime(timeText, "\u767a"),
			platform: stripHtml(cells[2]).replace(/\s+/g, "")
		});
	}
	return {
		date: serviceDate.ymd,
		trainNumber: normalizeTrainNumber(entry.trainNumber),
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

function getServiceDate(now = new Date()) {
	const jst = new Date(now.getTime() + JST_OFFSET_MS);
	if (jst.getUTCHours() < 4) jst.setUTCDate(jst.getUTCDate() - 1);
	const year = jst.getUTCFullYear();
	const month = String(jst.getUTCMonth() + 1).padStart(2, "0");
	const day = String(jst.getUTCDate()).padStart(2, "0");
	return {
		ymd: year + "-" + month + "-" + day,
		ym: String(year) + month,
		day
	};
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
