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

function redirect(location, headers = {}) {
	return new Response(null, {
		status: 302,
		headers: {
			"location": location,
			"cache-control": "no-store",
			...headers
		}
	});
}

function getSafeNext(value) {
	if (!value || !value.startsWith("/")) return "/admin.html";
	if (value.startsWith("//")) return "/admin.html";
	return value;
}

export async function onRequestPost({ request, env }) {
	const form = await request.formData();
	const user = String(form.get("user") || "");
	const password = String(form.get("password") || "");
	const next = getSafeNext(String(form.get("next") || ""));

	if (user !== env.ADMIN_BASIC_USER || password !== env.ADMIN_BASIC_PASSWORD) {
		return redirect("/admin_login.html?error=1&next=" + encodeURIComponent(next));
	}

	const sessionValue = await createSessionValue(env);
	if (!sessionValue) {
		return redirect("/admin_login.html?error=2&next=" + encodeURIComponent(next));
	}

	return redirect(next, {
		"set-cookie": "trainlocation_admin_session=" + encodeURIComponent(sessionValue) + "; Path=/; Max-Age=86400; HttpOnly; Secure; SameSite=Strict"
	});
}
