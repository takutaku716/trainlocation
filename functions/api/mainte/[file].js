const ALLOWED_FILES = new Set([
	"location_maintenance.json",
	"rosen_maintenance.json"
]);

const JSON_HEADERS = {
	"content-type": "application/json; charset=utf-8",
	"cache-control": "public, max-age=30",
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

export async function onRequestGet({ env, params }) {
	const file = String(params.file || "");
	if (!ALLOWED_FILES.has(file)) {
		return new Response("Not Found", { status: 404, headers: TEXT_HEADERS });
	}
	if (!env.MAINTE_KV) {
		return new Response("MAINTE_KV is not configured", { status: 500, headers: TEXT_HEADERS });
	}

	const value = await env.MAINTE_KV.get(file);
	if (!value) {
		return new Response("Not Found", { status: 404, headers: TEXT_HEADERS });
	}

	return new Response(value, {
		headers: JSON_HEADERS
	});
}
