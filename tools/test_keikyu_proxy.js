"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
(async function() {
  const source = fs.readFileSync(path.join(__dirname, "../functions/api/keikyu/[[path]].js"), "utf8");
  const { onRequestGet } = await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));
  const original = global.fetch;
  let requests = [];
  global.fetch = async (url, options) => {
    requests.push(url);
    assert.equal(options.headers["user-agent"], "Mozilla/5.0");
    return Response.json(url.endsWith("/train") ? [] : { info: {}, stations: [] });
  };
  const get = p => onRequestGet({ request: new Request("https://example.test/api/keikyu/" + p) });
  try {
    assert.equal((await get("location")).status, 200);
    assert.equal(requests.pop(), "https://app-kq.net/api/train");
    assert.equal((await get("timetable/8401-0-1054K")).status, 200);
    assert.equal(requests.pop(), "https://app-kq.net/api/locationTimetable/8401-0-1054K");
    assert.equal((await get("timetable/9999-0-1054K")).status, 404);
    assert.equal((await get("https://other.test")).status, 404);
    assert.equal(requests.length, 0);
    global.fetch = async () => new Response("Forbidden", { status: 403 });
    assert.equal((await get("location")).status, 502);
    global.fetch = async () => Response.json({});
    assert.equal((await get("location")).status, 502);
  } finally { global.fetch = original; }
  console.log("Keikyu proxy: allowed paths, headers and failure handling passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
