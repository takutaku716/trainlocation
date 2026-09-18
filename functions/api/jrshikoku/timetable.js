const SOURCE_URL = "https://train.jr-shikoku.co.jp/g?arg1=station&arg2=traintimeinfo&arg3=dia";

export async function onRequestOptions() {
	return new Response(null, { headers: corsHeaders() });
}

export async function onRequestGet() {
	const response = await fetch(SOURCE_URL, {
		headers: {
			"accept": "application/json,text/plain,*/*",
			"referer": "https://train.jr-shikoku.co.jp/",
			"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/127 Safari/537.36"
		},
		cf: { cacheTtl: 86400, cacheEverything: true }
	});
	const text = await response.text();
	if (!response.ok || !text.trim()) {
		return new Response(JSON.stringify({ ok: false, error: "JR Shikoku timetable response is empty" }), {
			status: 502,
			headers: jsonHeaders("no-store")
		});
	}
	return new Response(text.replace(/^\uFEFF/, ""), {
		headers: jsonHeaders("public, max-age=86400")
	});
}

function jsonHeaders(cacheControl) {
	return Object.assign(corsHeaders(), {
		"content-type": "application/json; charset=utf-8",
		"cache-control": cacheControl
	});
}

function corsHeaders() {
	return {
		"access-control-allow-origin": "*",
		"access-control-allow-methods": "GET, OPTIONS",
		"access-control-allow-headers": "content-type"
	};
}
