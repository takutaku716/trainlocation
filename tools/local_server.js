const fs = require("fs");
const http = require("http");
const path = require("path");

const root = path.resolve(__dirname, "..");
const port = Number(process.argv[2] || 8765);
const host = "127.0.0.1";
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

function send(response, statusCode, body, contentType) {
  response.statusCode = statusCode;
  response.setHeader("Cache-Control", "no-cache");
  response.setHeader("Content-Type", contentType || "text/plain; charset=utf-8");
  response.end(body);
}

http.createServer((request, response) => {
  let requestPath;
  try {
    requestPath = decodeURIComponent(new URL(request.url, `http://${host}:${port}`).pathname);
  } catch {
    send(response, 400, "Bad Request");
    return;
  }

  const relativePath = requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");
  const filePath = path.resolve(root, relativePath);
  if (filePath !== root && !filePath.startsWith(root + path.sep)) {
    send(response, 403, "Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      send(response, error.code === "ENOENT" ? 404 : 500, error.code === "ENOENT" ? "Not Found" : "Server Error");
      return;
    }
    send(response, 200, data, contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream");
  });
}).listen(port, host, () => {
  console.log(`Local server: http://${host}:${port}/`);
});
