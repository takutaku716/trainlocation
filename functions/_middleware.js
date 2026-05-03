function unauthorized() {
	return new Response("Unauthorized", {
		status: 401,
		headers: {
			"www-authenticate": 'Basic realm="Trainlocation Admin", charset="UTF-8"',
			"cache-control": "no-store"
		}
	});
}

function redirect(location) {
	return new Response(null, {
		status: 302,
		headers: {
			"location": location,
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

function shouldProtect(pathname) {
	return pathname === "/admin.html" || pathname === "/admin" || pathname.startsWith("/api/admin/");
}

export async function onRequest(context) {
	const url = new URL(context.request.url);
	if (!shouldProtect(url.pathname)) {
		return context.next();
	}

	const basicAuth = getBasicAuth(context.request);
	if (basicAuth && basicAuth.user === "logout" && url.searchParams.has("logout")) {
		return redirect("/admin_logged_out.html?logout=" + Date.now());
	}

	if (!isBasicAuthorized(context.request, context.env)) {
		return unauthorized();
	}

	if (url.pathname === "/admin") {
		return redirect("/admin.html");
	}

	return context.next();
}
