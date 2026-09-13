const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const port = Number(process.argv[2]) || 8765;
const mimeTypes = {
	".css": "text/css; charset=utf-8",
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".png": "image/png",
	".svg": "image/svg+xml",
	".webp": "image/webp"
};

http.createServer((request, response) => {
	const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
	const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
	const filePath = path.resolve(root, relativePath);
	if (!filePath.startsWith(root + path.sep)) {
		response.writeHead(403).end("Forbidden");
		return;
	}
	fs.readFile(filePath, (error, body) => {
		if (error) {
			response.writeHead(error.code === "ENOENT" ? 404 : 500).end(error.code || "Error");
			return;
		}
		response.writeHead(200, {
			"Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
			"Cache-Control": "no-store"
		});
		response.end(body);
	});
}).listen(port, "127.0.0.1", () => {
	console.log(`http://127.0.0.1:${port}/`);
});
