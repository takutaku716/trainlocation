const ALLOWED_FILES = new Set([
	"location_maintenance.json",
	"rosen_maintenance.json"
]);

export async function onRequestGet({ env, params }) {
	const file = String(params.file || "");
	if (!ALLOWED_FILES.has(file)) {
		return new Response("Not Found", { status: 404 });
	}
	if (!env.MAINTE_KV) {
		return new Response("MAINTE_KV is not configured", { status: 500 });
	}

	const value = await env.MAINTE_KV.get(file);
	if (!value) {
		return new Response("Not Found", { status: 404 });
	}

	return new Response(value, {
		headers: {
			"content-type": "application/json; charset=utf-8",
			"cache-control": "public, max-age=30"
		}
	});
}
