const fs = require("fs");
const https = require("https");
const path = require("path");
const adapter = require("../js/jrcentral_location_adapter.js");

const ROOT = path.resolve(__dirname, "..");
const LIVE_URL = "https://traininfo.jr-central.co.jp/zairaisen/data/zaisenichi.json";
const ROUTES = [
	["75", "東海道線(熱海～豊橋)", "tokaido_atami_toyohashi", "JTC"],
	["74", "東海道線(豊橋～米原)", "tokaido_toyohashi_maibara", "JTC"],
	["83", "中央線", "chuo", "JTC83"],
	["84", "関西線", "kansai", "JTC84"],
	["85", "紀勢線", "kisei", "JTC85"],
	["86", "高山線", "takayama", "JTC86"],
	["87", "武豊線", "taketoyo", "JTC87"],
	["88", "飯田線", "iida", "JTC88"],
	["89", "太多線", "taita", "JTC89"],
	["90", "御殿場線", "gotemba", "JTC90"],
	["91", "身延線", "minobu", "JTC91"],
	["92", "参宮線", "sangu", "JTC92"],
	["93", "名松線", "meisho", "JTC93"],
	["94", "美濃赤坂線", "mino_akasaka", "JTC94"],
	["95", "伊勢鉄道", "ise_railway", "JTC95"]
];

function fetchJson(url) {
	return new Promise((resolve, reject) => {
		https.get(url, (response) => {
			const chunks = [];
			response.on("data", (chunk) => chunks.push(chunk));
			response.on("end", () => {
				try {
					resolve(JSON.parse(Buffer.concat(chunks).toString("utf8").replace(/^\uFEFF/, "")));
				} catch (error) {
					reject(error);
				}
			});
		}).on("error", reject);
	});
}

async function main() {
	const raw = await fetchJson(LIVE_URL);
	let failed = false;
	for (const [rosen, lineName, stationSet, positionPrefix] of ROUTES) {
		const stations = adapter.stationSets[stationSet] || [];
		const html = fs.readFileSync(path.join(ROOT, "rosen", `rosen_${rosen}.html`), "utf8");
		const normalized = adapter.normalize(raw, { rosen, lineName, stationSet, positionPrefix });
		const missingPositions = normalized.trains.filter((train) => !html.includes(`ressha-icon ${train.pos}`));
		const numberedStations = stations.filter((station) => /^[A-Z]{2}\d{2}$/.test(station.number));
		const renderedNumberIcons = (html.match(/eki-icon jrcentral-eki-icon/g) || []).length;
		const validNumberIcons = renderedNumberIcons === numberedStations.length;
		const validPage = stations.length > 0 && html.includes(`key="${stations[0].number}"`) && html.includes(`key="${stations[stations.length - 1].number}"`) && validNumberIcons;
		if (!validPage || missingPositions.length) failed = true;
		console.log(`${rosen} ${lineName}: stations=${stations.length}, numbering=${renderedNumberIcons}/${numberedStations.length}, trains=${normalized.trains.length}, missingPos=${missingPositions.length}, page=${validPage ? "ok" : "ng"}`);
	}
	if (failed) process.exitCode = 1;
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
