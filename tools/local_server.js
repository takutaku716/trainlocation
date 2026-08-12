const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const jrShikokuSources = {
  '/api/jrshikoku/location': 'https://train.jr-shikoku.co.jp/g?arg1=train&arg2=train',
  '/api/jrshikoku/timetable': 'https://train.jr-shikoku.co.jp/g?arg1=station&arg2=traintimeinfo&arg3=dia',
};
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

async function proxyJrShikoku(requestPath, response) {
  try {
    const upstream = await fetch(jrShikokuSources[requestPath], {
      headers: {
        accept: 'application/json,text/plain,*/*',
        referer: 'https://train.jr-shikoku.co.jp/',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/127 Safari/537.36',
      },
      signal: AbortSignal.timeout(15000),
    });
    const text = (await upstream.text()).replace(/^\uFEFF/, '');
    if (!upstream.ok || !text.trim()) throw new Error(`upstream status ${upstream.status}`);
    response.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': requestPath.endsWith('/location') ? 'no-store' : 'public, max-age=3600',
      'Content-Type': 'application/json; charset=utf-8',
    });
    response.end(text);
  } catch (error) {
    response.writeHead(502, {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
    });
    response.end(JSON.stringify({ ok: false, error: `JR Shikoku proxy failed: ${error.message}` }));
  }
}

const server = http.createServer(async (request, response) => {
  let requestPath;
  try {
    requestPath = decodeURIComponent((request.url || '/').split('?')[0]);
  } catch {
    response.writeHead(400);
    response.end('Bad Request');
    return;
  }

  if (request.method === 'OPTIONS' && jrShikokuSources[requestPath]) {
    response.writeHead(204, {
      'Access-Control-Allow-Headers': 'content-type',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Origin': '*',
    });
    response.end();
    return;
  }
  if (request.method === 'GET' && jrShikokuSources[requestPath]) {
    await proxyJrShikoku(requestPath, response);
    return;
  }

  if (requestPath === '/') requestPath = '/index.html';
  const filePath = path.resolve(root, `.${requestPath}`);
  if (!filePath.startsWith(`${root}${path.sep}`) || !fs.existsSync(filePath)) {
    response.writeHead(404);
    response.end('Not Found');
    return;
  }

  const stat = fs.statSync(filePath);
  if (!stat.isFile()) {
    response.writeHead(404);
    response.end('Not Found');
    return;
  }

  response.writeHead(200, {
    'Cache-Control': 'no-store',
    'Content-Type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
  });
  fs.createReadStream(filePath).pipe(response);
});

server.listen(8765, '127.0.0.1', () => {
  console.log('Local server: http://127.0.0.1:8765/');
});
