const fs = require("fs");
const https = require("https");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA_BASE = "https://traininfo.jr-central.co.jp/zairaisen/data";
const OFFICIAL_BASE = "https://traininfo.jr-central.co.jp/zairaisen/status_detail.html";

const ROUTES = [
	{ rosen: "75", lineCode: "050010", lineName: "東海道線(熱海～豊橋)", stationSet: "tokaido_atami_toyohashi", prefix: "JTC", detailLine: "10011" },
	{ rosen: "74", lineCode: "050020", lineName: "東海道線(豊橋～米原)", stationSet: "tokaido_toyohashi_maibara", prefix: "JTC", detailLine: "10001" },
	{ rosen: "83", lineCode: "050030", lineName: "中央線", stationSet: "chuo", prefix: "JTC83", detailLine: "10003" },
	{ rosen: "84", lineCode: "050040", lineName: "関西線", stationSet: "kansai", prefix: "JTC84", detailLine: "10006" },
	{ rosen: "85", lineCode: "050050", lineName: "紀勢線", stationSet: "kisei", prefix: "JTC85", detailLine: "10007" },
	{ rosen: "86", lineCode: "050060", lineName: "高山線", stationSet: "takayama", prefix: "JTC86", detailLine: "10004" },
	{ rosen: "87", lineCode: "050070", lineName: "武豊線", stationSet: "taketoyo", prefix: "JTC87", detailLine: "10002" },
	{ rosen: "88", lineCode: "050080", lineName: "飯田線", stationSet: "iida", prefix: "JTC88", detailLine: "10010" },
	{ rosen: "89", lineCode: "050090", lineName: "太多線", stationSet: "taita", prefix: "JTC89", detailLine: "10005" },
	{ rosen: "90", lineCode: "050100", lineName: "御殿場線", stationSet: "gotemba", prefix: "JTC90", detailLine: "10013" },
	{ rosen: "91", lineCode: "050110", lineName: "身延線", stationSet: "minobu", prefix: "JTC91", detailLine: "10012" },
	{ rosen: "92", lineCode: "050120", lineName: "参宮線", stationSet: "sangu", prefix: "JTC92", detailLine: "10008" },
	{ rosen: "93", lineCode: "050130", lineName: "名松線", stationSet: "meisho", prefix: "JTC93", detailLine: "10009" },
	{ rosen: "94", lineCode: "050240", lineName: "美濃赤坂線", stationSet: "mino_akasaka", prefix: "JTC94", detailLine: "50001" },
	{ rosen: "95", lineCode: "350010", lineName: "伊勢鉄道", stationSet: "ise_railway", prefix: "JTC95", detailLine: "70033" }
];

function fetchJson(url) {
	return new Promise((resolve, reject) => {
		https.get(url, (response) => {
			if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
				response.resume();
				fetchJson(new URL(response.headers.location, url).toString()).then(resolve, reject);
				return;
			}
			if (response.statusCode !== 200) {
				response.resume();
				reject(new Error(`HTTP ${response.statusCode}: ${url}`));
				return;
			}
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

function escapeHtml(value) {
	return String(value == null ? "" : value)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function stationKey(lineMaster, station, route, index) {
	const symbol = String(lineMaster.ekiNumberKigobu || "").trim();
	const number = String(station.ekiNumberSujibu || "").trim();
	if (symbol && number) return symbol + number;
	return `JTC${route.rosen}P${String(index + 1).padStart(2, "0")}`;
}

function stationNumberIcon(lineMaster, station) {
	const symbol = String(lineMaster.ekiNumberKigobu || "").trim();
	const number = String(station.ekiNumberSujibu || "").trim();
	if (!symbol || !number) return "";
	return `<span class="eki-icon jrcentral-eki-icon jrcentral-icon-${escapeHtml(symbol)}"><span class="kigo">${escapeHtml(symbol)}</span><span class="number">${escapeHtml(number)}</span></span>`;
}

function stationPanel(route, station, index, isEnd, lineMaster) {
	const key = stationKey(lineMaster, station, route, index);
	const officialUrl = `${OFFICIAL_BASE}?line=${route.detailLine}&lang=ja`;
	const icon = stationNumberIcon(lineMaster, station);
	const stationRowClass = icon ? "stalist-eki-contents jrcentral-station-row" : "stalist-eki-contents non-icon";
	const stationNameClass = icon ? "jrcentral-station-name" : "margin-left05";
	return `<div class="eki-panel eki${isEnd ? " end" : ""}"><div class="eki-contents"><div class="stalist-eki-link"><a href="${officialUrl}" target="_blank" rel="noopener"><div class="${stationRowClass}">${icon || '<span class="eki-icon hide"></span>'}<div key="${escapeHtml(key)}" class="${stationNameClass}">${escapeHtml(station.ekiMei)}</div></div></a></div><div class="ressha-contents"><div class="ressha-icon ${route.prefix}${station.ryokakuEkiCd}U"></div><div class="ressha-icon ${route.prefix}${station.ryokakuEkiCd}D"></div></div></div>${isEnd ? "" : '<svg class="senro-img"><use xlink:href="#senro"></use></svg>'}</div>`;
}

function betweenPanel(route, from, to) {
	const position = `${route.prefix}${from.ryokakuEkiCd}_${to.ryokakuEkiCd}`;
	return `<div class="eki-panel"><div class="eki-contents"><div class="ressha-contents"><div class="ressha-icon ${position}U"></div><div class="ressha-icon ${position}D"></div></div></div><svg class="senro-img"><use xlink:href="#senro"></use></svg></div>`;
}

function trackSymbol() {
	const rects = [];
	for (let y = 0; y < 300; y += 10) {
		rects.push(`\t\t<rect width="6" height="10" x="1" y="${y}" fill="${y % 20 === 0 ? "#fff" : "#000"}" stroke="#000"></rect>`);
	}
	return `<svg style="display:none" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" role="img">\n\t<symbol id="senro" viewBox="0 0 8 300">\n${rects.join("\n")}\n\t</symbol>\n</svg>\n`;
}

function createRouteHtml(route, lineMaster, stations) {
	const parts = [
		`<div id="homenNameUpText" hidden>${escapeHtml(lineMaster.noboriHomenMojiretsu)}</div>`,
		`<div id="homenNameDownText" hidden>${escapeHtml(lineMaster.kudariHomenMojiretsu)}</div>`,
		""
	];
	stations.forEach((station, index) => {
		parts.push(stationPanel(route, station, index, index === stations.length - 1, lineMaster));
		if (index < stations.length - 1) parts.push(betweenPanel(route, station, stations[index + 1]));
		parts.push("");
	});
	parts.push(trackSymbol());
	return parts.join("\n");
}

function createStationSetModule(routeData) {
	const sets = {};
	for (const item of routeData) {
		sets[item.route.stationSet] = item.stations.map((station, index) => ({
			code: String(station.ryokakuEkiCd),
			number: stationKey(item.lineMaster, station, item.route, index),
			name: String(station.ekiMei),
			index: index
		}));
	}
	return `(function(root, factory) {\n\tif (typeof module === "object" && module.exports) {\n\t\tmodule.exports = factory();\n\t} else {\n\t\troot.JrCentralStationSets = factory();\n\t}\n}(typeof self !== "undefined" ? self : this, function() {\n\t"use strict";\n\treturn ${JSON.stringify(sets, null, "\t")};\n}));\n`;
}

function updateLocationMaster(routeData) {
	const filePath = path.join(ROOT, "original", "location_master.json");
	const master = JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
	const prefixes = routeData.map((item) => item.route.prefix).sort((a, b) => b.length - a.length);
	for (const key of Object.keys(master)) {
		if (prefixes.some((prefix) => key.startsWith(prefix))) delete master[key];
	}
	for (const item of routeData) {
		const { route, stations } = item;
		stations.forEach((station, index) => {
			master[`${route.prefix}${station.ryokakuEkiCd}U`] = station.ekiMei;
			master[`${route.prefix}${station.ryokakuEkiCd}D`] = station.ekiMei;
			if (index >= stations.length - 1) return;
			const next = stations[index + 1];
			const position = `${route.prefix}${station.ryokakuEkiCd}_${next.ryokakuEkiCd}`;
			master[`${position}D`] = `${station.ekiMei}→${next.ekiMei} 間`;
			master[`${position}U`] = `${next.ekiMei}→${station.ekiMei} 間`;
		});
	}
	fs.writeFileSync(filePath, `${JSON.stringify(master, null, "\t")}\n`, "utf8");
}

function updateRosenNameMaster(routeData) {
	const filePath = path.join(ROOT, "master", "rosen_name_master.json");
	const master = JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
	const routeIds = new Set(ROUTES.map((route) => route.rosen));
	const retained = master.filter((row) => !routeIds.has(String(row.rosen)));
	const entries = routeData.map(({ route, lineMaster, stations }) => {
		const first = stations[0].ekiMei;
		const last = stations[stations.length - 1].ekiMei;
		const range = `[${first}～${last}間]`;
		return {
			rosen: route.rosen,
			rosenName: { ja: lineMaster.ryokakuSenkuMei, en: lineMaster.ryokakuSenkuMei, tc: lineMaster.ryokakuSenkuMei, sc: lineMaster.ryokakuSenkuMei, kr: lineMaster.ryokakuSenkuMei },
			kukanName: { ja: range, en: range, tc: range, sc: range, kr: range },
			kigo: String(lineMaster.ekiNumberKigobu || ""),
			area: "9"
		};
	});
	const combined = retained.concat(entries).sort((a, b) => Number(a.rosen) - Number(b.rosen));
	fs.writeFileSync(filePath, `${JSON.stringify(combined, null, "\t")}\n`, "utf8");
}

async function main() {
	const [lineJson, stationJson] = await Promise.all([
		fetchJson(`${DATA_BASE}/hp_senku_master_ja.json`),
		fetchJson(`${DATA_BASE}/hp_eki_master_ja.json`)
	]);
	const lines = Array.isArray(lineJson.lst) ? lineJson.lst : [];
	const allStations = Array.isArray(stationJson.lst) ? stationJson.lst : [];
	const routeData = ROUTES.map((route) => {
		const lineMaster = lines.find((line) => String(line.ryokakuSenkuCd) === route.lineCode);
		if (!lineMaster) throw new Error(`Missing line master: ${route.lineCode}`);
		const stations = allStations
			.filter((station) => String(station.ryokakuSenkuCd) === route.lineCode)
			.sort((left, right) => Number(left.kudariJun) - Number(right.kudariJun));
		if (!stations.length) throw new Error(`Missing station master: ${route.lineCode}`);
		fs.writeFileSync(path.join(ROOT, "rosen", `rosen_${route.rosen}.html`), createRouteHtml(route, lineMaster, stations), "utf8");
		return { route, lineMaster, stations };
	});

	fs.writeFileSync(path.join(ROOT, "js", "jrcentral_station_sets.js"), createStationSetModule(routeData), "utf8");
	updateLocationMaster(routeData);
	updateRosenNameMaster(routeData);
	console.log(`Generated ${routeData.length} JR Central route pages (${routeData.reduce((sum, item) => sum + item.stations.length, 0)} stations).`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
