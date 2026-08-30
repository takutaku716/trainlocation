const SOURCE_URL = "https://train.jr-shikoku.co.jp/g?arg1=train&arg2=train";

export async function onRequestOptions() {
	return new Response(null, { headers: corsHeaders() });
}

export async function onRequestGet() {
	return proxyJrShikokuJson(SOURCE_URL, 10);
}

async function proxyJrShikokuJson(url, cacheSeconds) {
	const response = await fetch(url, {
		headers: {
			"accept": "application/json,text/plain,*/*",
			"referer": "https://train.jr-shikoku.co.jp/",
			"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/127 Safari/537.36"
		},
		cf: { cacheTtl: cacheSeconds, cacheEverything: true }
	});
	const text = await response.text();
	if (!response.ok || !text.trim()) {
		return new Response(JSON.stringify({ ok: false, error: "JR Shikoku upstream response is empty" }), {
			status: 502,
			headers: jsonHeaders("no-store")
		});
	}
	return new Response(text.replace(/^\uFEFF/, ""), {
		headers: jsonHeaders("public, max-age=" + cacheSeconds)
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
