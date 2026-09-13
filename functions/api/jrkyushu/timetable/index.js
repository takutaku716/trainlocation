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

export async function onRequestGet({ env }) {
	if (!env.JRKYUSHU_TIMETABLE_KV) {
		return new Response("JRKYUSHU_TIMETABLE_KV is not configured", { status: 500, headers: TEXT_HEADERS });
	}
	const value = await env.JRKYUSHU_TIMETABLE_KV.get("jrkyushu:timetable:latest");
	if (!value) return new Response("Not Found", { status: 404, headers: TEXT_HEADERS });
	return new Response(value, { headers: JSON_HEADERS });
}
