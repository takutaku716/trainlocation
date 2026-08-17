const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const proxySources = {
  '/api/jrshikoku/location': {
    url: 'https://train.jr-shikoku.co.jp/g?arg1=train&arg2=train',
    referer: 'https://train.jr-shikoku.co.jp/',
  },
  '/api/jrshikoku/timetable': {
    url: 'https://train.jr-shikoku.co.jp/g?arg1=station&arg2=traintimeinfo&arg3=dia',
    referer: 'https://train.jr-shikoku.co.jp/',
  },
  '/api/jrcentral/operation': {
    url: 'https://traininfo.jr-central.co.jp/zairaisen/data/trainInfo/json/unkou.json',
    referer: 'https://traininfo.jr-central.co.jp/zairaisen/',
  },
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

async function proxyUpstream(requestPath, request, response) {
  try {
    const freightPreview = String(request.headers.referer || '').includes('previewFreight=1');
    if (freightPreview && requestPath === '/api/jrshikoku/location') {
      response.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json; charset=utf-8',
      });
      response.end(JSON.stringify([
        { GetDateTime: new Date().toISOString() },
        {
          Index: 41,
          TrainNum: '3072',
          Pos: '鬼無～高松（タ）',
          PosNum: 346,
          delay: 0,
          Direction: 0,
          Type: 'normal',
          Line: 'yosan',
        },
      ]));
      return;
    }
    if (freightPreview && requestPath === '/api/jrshikoku/timetable') {
      response.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json; charset=utf-8',
      });
      response.end('[]');
      return;
    }
    const source = proxySources[requestPath];
    const upstream = await fetch(source.url, {
      headers: {
        accept: 'application/json,text/plain,*/*',
        referer: source.referer,
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/127 Safari/537.36',
      },
      signal: AbortSignal.timeout(15000),
    });
    let text = (await upstream.text()).replace(/^\uFEFF/, '');
    if (!upstream.ok || !text.trim()) throw new Error(`upstream status ${upstream.status}`);
    response.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': requestPath.endsWith('/timetable') ? 'public, max-age=3600' : 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
    });
    response.end(text);
  } catch (error) {
    response.writeHead(502, {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
    });
    response.end(JSON.stringify({ ok: false, error: `Upstream proxy failed: ${error.message}` }));
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

  if (request.method === 'OPTIONS' && proxySources[requestPath]) {
    response.writeHead(204, {
      'Access-Control-Allow-Headers': 'content-type',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Origin': '*',
    });
    response.end();
    return;
  }
  if (request.method === 'GET' && proxySources[requestPath]) {
    await proxyUpstream(requestPath, request, response);
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

const port = Number(process.argv[2]) || 8765;
server.listen(port, '127.0.0.1', () => {
  console.log(`Local server: http://127.0.0.1:${port}/`);
});
