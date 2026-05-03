export async function onRequestGet() {
	return new Response(null, {
		status: 302,
		headers: {
			"location": "/admin_logged_out.html?logout=" + Date.now(),
			"cache-control": "no-store",
			"set-cookie": "trainlocation_admin_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict"
		}
	});
}
