const ALLOWED_FILES = new Set([
	"location_maintenance.json",
	"rosen_maintenance.json"
]);

function unauthorized() {
	return new Response("Unauthorized", {
		status: 401,
		headers: {
			"www-authenticate": 'Basic realm="Trainlocation Admin", charset="UTF-8"',
			"cache-control": "no-store"
		}
	});
}

function getBasicAuth(request) {
	const auth = request.headers.get("authorization") || "";
	if (!auth.startsWith("Basic ")) return null;

	try {
		const decoded = atob(auth.slice(6));
		const separatorIndex = decoded.indexOf(":");
		if (separatorIndex < 0) return null;
		return {
			user: decoded.slice(0, separatorIndex),
			password: decoded.slice(separatorIndex + 1)
		};
	} catch {
		return null;
	}
}

function isBasicAuthorized(request, env) {
	const expectedUser = env.ADMIN_BASIC_USER;
	const expectedPassword = env.ADMIN_BASIC_PASSWORD;
	if (!expectedUser || !expectedPassword) return false;

	const basicAuth = getBasicAuth(request);
	if (!basicAuth) return false;

	return basicAuth.user === expectedUser && basicAuth.password === expectedPassword;
}

function isAuthorized(request, env) {
	return isBasicAuthorized(request, env);
}

function jsonResponse(body, init = {}) {
	return new Response(JSON.stringify(body), {
		...init,
		headers: {
			"content-type": "application/json; charset=utf-8",
			...(init.headers || {})
		}
	});
}

function validateMaintenanceJson(file, data) {
	if (!data || typeof data !== "object" || Array.isArray(data)) {
		return "JSON object is required";
	}
	if (file === "location_maintenance.json" && !("status" in data)) {
		return "location_maintenance.json requires status";
	}
	if (file === "rosen_maintenance.json" && !Array.isArray(data.lines)) {
		return "rosen_maintenance.json requires lines array";
	}
	return "";
}

export async function onRequestGet({ request, env, params }) {
	if (!isAuthorized(request, env)) return unauthorized();

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
			"cache-control": "no-store"
		}
	});
}

export async function onRequestPut({ request, env, params }) {
	if (!isAuthorized(request, env)) return unauthorized();

	const file = String(params.file || "");
	if (!ALLOWED_FILES.has(file)) {
		return new Response("Not Found", { status: 404 });
	}
	if (!env.MAINTE_KV) {
		return new Response("MAINTE_KV is not configured", { status: 500 });
	}

	const text = await request.text();
	let data;
	try {
		data = JSON.parse(text);
	} catch {
		return jsonResponse({ ok: false, error: "Invalid JSON" }, { status: 400 });
	}

	const validationError = validateMaintenanceJson(file, data);
	if (validationError) {
		return jsonResponse({ ok: false, error: validationError }, { status: 400 });
	}

	const formatted = JSON.stringify(data, null, "\t");
	await env.MAINTE_KV.put(file, formatted);

	return jsonResponse({ ok: true, file });
}
