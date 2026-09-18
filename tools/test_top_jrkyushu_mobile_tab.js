"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "js", "top.js"), "utf8");

assert.strictEqual((html.match(/<li id="jrkyushu">/g) || []).length, 1);
assert.match(html, /id="areaOperationJrKyushuTab"[^>]*value="10"/);
assert.match(html, /for="areaOperationJrKyushuTab"/);
assert.match(html, /<span class="area-name">JR九州<\/span>/);
assert.ok(html.indexOf('<li id="jrkyushu">') > html.indexOf('<li id="jrcentral">'));

assert.match(script, /const JRKYUSHU_ROUTE_IDS\s*=/);
assert.match(script, /"jrkyushu": JRKYUSHU_ROUTE_IDS/);
assert.match(script, /JRKYUSHU_ROUTE_IDS\.includes\(rosen\)/);
assert.match(script, /area = "jrkyushu"/);

console.log("Top JR Kyushu mobile tab tests passed");
