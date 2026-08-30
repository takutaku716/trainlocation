const assert = require("assert");
const fs = require("fs");
const path = require("path");

const adapter = require("../js/jrwest_location_adapter.js");
const routeSources = require("../js/jrwest_remaining_route_sources.js");
const { ROUTES } = require("./generate_jrwest_remaining_routes.js");

const ROOT = path.resolve(__dirname, "..");
const PROXY = "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=";
const EXPECTED_ROUTE_IDS = Array.from({ length: 26 }, (_, index) => String(index + 96));
const fetchCache = new Map();

function throughProxy(url) {
	return url.startsWith(PROXY) ? url : PROXY + url;
}

async function fetchText(url) {
	const target = throughProxy(url);
	if (!fetchCache.has(target)) {
		fetchCache.set(target, fetch(target).then(async (response) => {
			assert(response.ok, `${response.status} ${target}`);
			return response.text();
		}));
	}
	return fetchCache.get(target);
}

async function fetchJson(url) {
	return JSON.parse(await fetchText(url));
}

function testStructure() {
	assert.deepStrictEqual(Object.keys(routeSources).sort((a, b) => Number(a) - Number(b)), EXPECTED_ROUTE_IDS);
	assert.deepStrictEqual(ROUTES.map((route) => route.rosen), EXPECTED_ROUTE_IDS);

	for (const route of ROUTES) {
		const filePath = path.join(ROOT, "rosen", `rosen_${route.rosen}.html`);
		assert(fs.existsSync(filePath), `missing ${filePath}`);
		const html = fs.readFileSync(filePath, "utf8");
		assert(html.includes(route.parts[0].start), `${route.rosen}: missing first station ${route.parts[0].start}`);
		assert(html.includes(route.parts[route.parts.length - 1].end), `${route.rosen}: missing last station ${route.parts[route.parts.length - 1].end}`);
		const expectedSourceCount = route.parts.length + (route.extraSources || []).length;
		assert(routeSources[route.rosen].sources.length === expectedSourceCount, `${route.rosen}: source count mismatch`);
		for (const source of routeSources[route.rosen].sources) {
			assert(source.stationCodes.length > 0, `${route.rosen}/${source.lineId}: no station codes`);
			assert(source.positionPrefix, `${route.rosen}/${source.lineId}: no position prefix`);
		}
	}
	assert.deepStrictEqual(
		routeSources["104"].sources.map((source) => [source.locationUrl.split("/").pop(), source.positionPrefix]),
		[["takarazuka.json", "JWT"], ["fukuchiyama.json", "JWF"], ["takarazukakobe.json", "JWT"]]
	);
}

async function testLiveConversion() {
	let converted = 0;
	let activeSources = 0;
	const currentTime = await fetchText(Object.values(routeSources)[0].currentTimeUrl);

	for (const route of ROUTES) {
		const html = fs.readFileSync(path.join(ROOT, "rosen", `rosen_${route.rosen}.html`), "utf8");
		for (const source of routeSources[route.rosen].sources) {
			const [locationJson, stationJson, areaMasterJson] = await Promise.all([
				fetchJson(source.locationUrl),
				fetchJson(source.stationUrl),
				fetchJson(source.areaMasterUrl)
			]);
			const result = adapter.normalize(locationJson, stationJson, areaMasterJson, currentTime, {
				...source,
				senku: route.rosen
			});
			if (result.trains.length) activeSources += 1;
			for (const train of result.trains) {
				assert(html.includes(train.pos), `${route.rosen}/${source.lineId}/${train.cbango}: missing position ${train.pos}`);
				converted += 1;
			}
		}
	}
	return { converted, activeSources, requests: fetchCache.size };
}

async function main() {
	testStructure();
	const live = await testLiveConversion();
	console.log(`JR West remaining routes: ${EXPECTED_ROUTE_IDS.length} pages OK`);
	console.log(`Live conversion: ${live.converted} trains across ${live.activeSources} active route sources (${live.requests} unique requests)`);
}

main().catch((error) => {
	console.error(error.stack || error);
	process.exit(1);
});
