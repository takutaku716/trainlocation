const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const CACHE_KEY_PREFIX = "jrkyushu:timetable";
const MAX_DETAIL_FETCHES = 500;

const STATION_SOURCES = [
	{ code: "28283", group: "kyushu", name: "hakata" },
	{ code: "29007", group: "kyushu", name: "kagoshima_chuo" },
	{ code: "28395", group: "nishi_kyushu", name: "takeo_onsen" },
	{ code: "28533", group: "nishi_kyushu", name: "nagasaki" }
];

const JSON_HEADERS = {
	"content-type": "application/json; charset=utf-8",
	"cache-control": "no-store"
};

export default {
	async scheduled(controller, env, ctx) {
		ctx.waitUntil(refreshTimetableCache(env, { triggeredBy: "cron", cron: controller.cron }));
	},

	async fetch(request, env) {
		const url = new URL(request.url);
		if (url.pathname.endsWith("/health")) {
			return jsonResponse({ ok: true });
		}
		if (url.pathname.endsWith("/refresh")) {
			if (env.TIMETABLE_REFRESH_TOKEN) {
				const token = url.searchParams.get("token") || request.headers.get("x-refresh-token") || "";
				if (token !== env.TIMETABLE_REFRESH_TOKEN) return jsonResponse({ ok: false, error: "Unauthorized" }, { status: 401 });
			}
			const result = await refreshTimetableCache(env, { triggeredBy: "manual" });
			return jsonResponse(result);
		}
		return jsonResponse({ ok: false, error: "Not Found" }, { status: 404 });
	}
};

async function refreshTimetableCache(env, meta = {}) {
	if (!env.JRKYUSHU_TIMETABLE_KV) {
		throw new Error("JRKYUSHU_TIMETABLE_KV is not configured");
	}
	const serviceDate = getServiceDate();
	const discovered = new Map();

	for (const source of STATION_SOURCES) {
		const html = await fetchText(buildStationTimetableUrl(source.code, serviceDate));
		parseStationTimetable(html, source, serviceDate).forEach((entry) => {
			if (!discovered.has(entry.trainNumber)) discovered.set(entry.trainNumber, entry);
		});
	}

	const entries = Array.from(discovered.values()).slice(0, MAX_DETAIL_FETCHES);
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

	const index = {
		date: serviceDate.ymd,
		fetchedAt: new Date().toISOString(),
		triggeredBy: meta.triggeredBy || "",
		cron: meta.cron || "",
		count: trains.length,
		errorCount: errors.length,
		trains,
		errors
	};
	await env.JRKYUSHU_TIMETABLE_KV.put(indexKey(serviceDate.ymd), JSON.stringify(index));
	await env.JRKYUSHU_TIMETABLE_KV.put(latestKey(), JSON.stringify(index));
	return { ok: true, ...index };
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

function jsonResponse(body, init = {}) {
	return new Response(JSON.stringify(body), {
		...init,
		headers: {
			...JSON_HEADERS,
			...(init.headers || {})
		}
	});
}
