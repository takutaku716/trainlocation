const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const CACHE_KEY_PREFIX = "jrkyushu:timetable";

const JSON_HEADERS = {
	"content-type": "application/json; charset=utf-8",
	"cache-control": "public, max-age=3600",
	"access-control-allow-origin": "*"
};

const TEXT_HEADERS = {
	"access-control-allow-origin": "*"
};

export async function onRequestOptions() {
	return new Response(null, {
		headers: {
			"access-control-allow-origin": "*",
			"access-control-allow-methods": "GET, OPTIONS",
			"access-control-allow-headers": "content-type"
		}
	});
}

export async function onRequestGet({ request, env, params }) {
	if (!env.JRKYUSHU_TIMETABLE_KV) {
		return new Response("JRKYUSHU_TIMETABLE_KV is not configured", { status: 500, headers: TEXT_HEADERS });
	}

	const url = new URL(request.url);
	const trainNumber = normalizeTrainNumber(params.train || "");
	if (!trainNumber) return new Response("Bad Request", { status: 400, headers: TEXT_HEADERS });

	const date = normalizeDate(url.searchParams.get("date")) || getServiceDate().ymd;
	const value = await env.JRKYUSHU_TIMETABLE_KV.get(trainKey(date, trainNumber));
	if (!value) return new Response("Not Found", { status: 404, headers: TEXT_HEADERS });

	return new Response(value, { headers: JSON_HEADERS });
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

function getServiceDate(now = new Date()) {
	const jst = new Date(now.getTime() + JST_OFFSET_MS);
	if (jst.getUTCHours() < 4) jst.setUTCDate(jst.getUTCDate() - 1);
	const year = jst.getUTCFullYear();
	const month = String(jst.getUTCMonth() + 1).padStart(2, "0");
	const day = String(jst.getUTCDate()).padStart(2, "0");
	return {
		ymd: year + "-" + month + "-" + day
	};
}

function trainKey(date, trainNumber) {
	return CACHE_KEY_PREFIX + ":" + date + ":train:" + normalizeTrainNumber(trainNumber);
}
