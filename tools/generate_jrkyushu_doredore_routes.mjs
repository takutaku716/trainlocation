import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const routes = require("../js/jrkyushu_doredore_routes.js");
const adapter = require("../js/jrkyushu_doredore_location_adapter.js");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const routeData = [];

for (const route of routes) {
	const url = `https://george-doredore.jrkyushu.co.jp/jrqSEN${route.sourceId}.html`;
	const response = await fetch(url, { headers: { accept: "text/html" } });
	if (!response.ok) throw new Error(`${url}: ${response.status}`);
	const html = await response.text();
	const routeHtml = adapter.buildRouteHtml(html, route);
	const rows = adapter.parseRows(html);
	if (!rows.length) throw new Error(`${url}: no KUKAN rows`);
	await fs.writeFile(path.join(root, "rosen", `rosen_${route.rosen}.html`), routeHtml + "\n", "utf8");
	routeData.push({ route, rows });
	console.log(`${route.rosen}\t${route.displayName}\t${rows.length} positions`);
}

const locationMasterPath = path.join(root, "original", "location_master.json");
const locationMaster = JSON.parse((await fs.readFile(locationMasterPath, "utf8")).replace(/^\uFEFF/, ""));
const prefixes = routes.map((route) => `JQK${String(route.sourceId).padStart(2, "0")}P`);
for (const key of Object.keys(locationMaster)) {
	if (prefixes.some((prefix) => key.startsWith(prefix))) delete locationMaster[key];
}
for (const item of routeData) {
	Object.assign(locationMaster, adapter.buildLocationMasterEntries(item.rows, item.route));
}
await fs.writeFile(locationMasterPath, `${JSON.stringify(locationMaster, null, "\t")}\n`, "utf8");
console.log(`location_master: ${Object.keys(locationMaster).filter((key) => prefixes.some((prefix) => key.startsWith(prefix))).length} JR Kyushu entries`);
