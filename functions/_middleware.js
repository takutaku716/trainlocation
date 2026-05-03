function redirect(location) {
	return new Response(null, {
		status: 302,
		headers: {
			"location": location,
			"cache-control": "no-store"
		}
	});
}

function unauthorizedJson() {
	return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
		status: 401,
		headers: {
			"content-type": "application/json; charset=utf-8",
			"cache-control": "no-store"
		}
	});
}

function getCookie(request, name) {
	const cookie = request.headers.get("cookie") || "";
	const prefix = name + "=";
	const parts = cookie.split(";");
	for (const part of parts) {
		const value = part.trim();
		if (value.startsWith(prefix)) return decodeURIComponent(value.slice(prefix.length));
	}
	return "";
}

async function sha256(text) {
	const bytes = new TextEncoder().encode(text);
	const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
	return Array.from(new Uint8Array(hashBuffer)).map((value) => value.toString(16).padStart(2, "0")).join("");
}

async function createSessionValue(env) {
	const user = env.ADMIN_BASIC_USER || "";
	const password = env.ADMIN_BASIC_PASSWORD || "";
	if (!user || !password) return "";
	return await sha256(user + ":" + password + ":trainlocation-admin");
}

async function isCookieAuthorized(request, env) {
	const expected = await createSessionValue(env);
	if (!expected) return false;
	return getCookie(request, "trainlocation_admin_session") === expected;
}

function shouldProtect(pathname) {
	return pathname === "/admin.html" || pathname === "/admin" || pathname.startsWith("/api/admin/");
}

export async function onRequest(context) {
	const url = new URL(context.request.url);
	if (!shouldProtect(url.pathname)) {
		return context.next();
	}

	if (url.pathname === "/api/admin/login" || url.pathname === "/api/admin/logout") {
		return context.next();
	}

	if (!(await isCookieAuthorized(context.request, context.env))) {
		if (url.pathname.startsWith("/api/admin/")) {
			return unauthorizedJson();
		}
		return redirect("/admin_login.html?next=" + encodeURIComponent(url.pathname + url.search));
	}

	return context.next();
}
