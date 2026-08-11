const fs = require("fs");
const path = require("path");
const adapter = require("../js/jrshikoku_location_adapter.js");

const ROOT = path.resolve(__dirname, "..");
const OFFICIAL_URL = "https://train.jr-shikoku.co.jp/";
const ROUTES = {
	uwajima: { rosen: "76", up: "松山方面", down: "宇和島方面" },
	uwajima2: { rosen: "77", up: "松山方面", down: "宇和島方面" },
	dosan: { rosen: "78", up: "多度津方面", down: "高知方面" },
	dosan2: { rosen: "79", up: "高知方面", down: "窪川方面" },
	koutoku: { rosen: "80", up: "高松方面", down: "徳島方面" },
	tokushima: { rosen: "81", up: "徳島方面", down: "阿波池田方面" },
	naruto: { rosen: "82", up: "鳴門方面", down: "徳島方面" }
};

const escapeHtml = (value) => String(value)
	.replace(/&/g, "&amp;")
	.replace(/</g, "&lt;")
	.replace(/>/g, "&gt;")
	.replace(/"/g, "&quot;");

function stationNumberIcon(code) {
	const match = String(code).match(/^([A-Z]+)(\d+(?:-\d+)?)$/);
	if (!match) return '<span class="eki-icon hide"></span>';
	const numberClass = match[2].includes("-") ? ' class="eda"' : "";
	return `<span class="eki-icon jrshikoku-eki-icon jrshikoku-icon-${escapeHtml(match[1])}"><span class="kigo">${escapeHtml(match[1])}</span><span${numberClass}>${escapeHtml(match[2])}</span></span>`;
}

function stationPanel(config, station, isEnd) {
	const prefix = config.stationPositionPrefixes[station[0]] || config.positionPrefix;
	return `<div class="eki-panel eki${isEnd ? " end" : ""}"><div class="eki-contents"><div class="stalist-eki-link"><a href="${OFFICIAL_URL}" target="_blank" rel="noopener"><div class="stalist-eki-contents">${stationNumberIcon(station[0])}<div key="${escapeHtml(station[0])}" class="margin-left05">${escapeHtml(station[1])}</div></div></a></div><div class="ressha-contents"><div class="ressha-icon ${prefix}${station[0]}U"></div><div class="ressha-icon ${prefix}${station[0]}D"></div></div></div>${isEnd ? "" : '<svg class="senro-img"><use xlink:href="#senro"></use></svg>'}</div>`;
}

function betweenPanel(config, from, to) {
	return `<div class="eki-panel"><div class="eki-contents"><div class="ressha-contents"><div class="ressha-icon ${config.positionPrefix}${from[0]}_${to[0]}U"></div><div class="ressha-icon ${config.positionPrefix}${from[0]}_${to[0]}D"></div></div></div><svg class="senro-img"><use xlink:href="#senro"></use></svg></div>`;
}

function nonInterlockedPanel(config, group, stationByCode) {
	const from = stationByCode.get(group.from);
	const to = stationByCode.get(group.to);
	const links = group.stations.map((code) => {
		const station = stationByCode.get(code);
		return `<a href="${OFFICIAL_URL}" target="_blank" rel="noopener"><div class="stalist-eki-contents">${stationNumberIcon(station[0])}<div key="${escapeHtml(station[0])}">${escapeHtml(station[1])}</div></div></a>`;
	}).join("");
	const countClass = ["", "one-eki", "two-eki", "three-eki", "four-eki", "five-eki"][Math.min(group.stations.length, 5)];
	const pos = `${config.positionPrefix}${from[0]}_${to[0]}`;
	return `<div class="eki-panel hirendo"><div class="eki-contents"><div class="hirendo-msg">この区間は実際の<br>走行位置と異なる<br>場合があります</div><div class="hirendo-contents"><div class="ressha-contents"><div class="hirendo-ressha-panel ${countClass}"><div class="ressha-icon ${pos}U"></div></div></div><div class="stalist-eki-link ${countClass}">${links}</div><div class="ressha-contents"><div class="hirendo-ressha-panel ${countClass}"><div class="ressha-icon ${pos}D"></div></div></div></div></div><svg class="senro-img"><use xlink:href="#senro"></use></svg></div>`;
}

function trackSymbol() {
	const rects = [];
	for (let y = 0; y < 300; y += 10) {
		rects.push(`\t\t<rect width="6" height="10" x="1" y="${y}" fill="${y % 20 === 0 ? "#fff" : "#000"}" stroke="#000"></rect>`);
	}
	return `<svg style="display:none" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" role="img">\n\t<symbol id="senro" viewBox="0 0 8 300">\n${rects.join("\n")}\n\t</symbol>\n</svg>`;
}

function renderRoute(lineId, route, config) {
	const stationByCode = new Map(config.stations.map((station) => [station[0], station]));
	const nonInterlockedCodes = new Set(config.nonInterlockedGroups.flatMap((group) => group.stations));
	const visibleStations = config.stations.filter((station) => !nonInterlockedCodes.has(station[0]));
	const groupByFrom = new Map(config.nonInterlockedGroups.map((group) => [group.from, group]));
	const rows = [
		`<div id="homenNameUpText" hidden>${escapeHtml(route.up)}</div>`,
		`<div id="homenNameDownText" hidden>${escapeHtml(route.down)}</div>`,
		""
	];
	visibleStations.forEach((station, index) => {
		rows.push(stationPanel(config, station, index === visibleStations.length - 1));
		if (index === visibleStations.length - 1) return;
		const next = visibleStations[index + 1];
		const group = groupByFrom.get(station[0]);
		rows.push(group && group.to === next[0]
			? nonInterlockedPanel(config, group, stationByCode)
			: betweenPanel(config, station, next));
		rows.push("");
	});
	rows.push(trackSymbol(), "");
	return rows.join("\n");
}

function updateLocationMaster() {
	const filePath = path.join(ROOT, "original", "location_master.json");
	const locationMaster = JSON.parse(fs.readFileSync(filePath, "utf8"));
	for (const [lineId, route] of Object.entries(ROUTES)) {
		const config = adapter.lineConfigs[lineId];
		const stationByCode = new Map(config.stations.map((station) => [station[0], station]));
		const nonInterlockedCodes = new Set(config.nonInterlockedGroups.flatMap((group) => group.stations));
		const visibleStations = config.stations.filter((station) => !nonInterlockedCodes.has(station[0]));
		const groupByFrom = new Map(config.nonInterlockedGroups.map((group) => [group.from, group]));
		for (const station of visibleStations) {
			const prefix = config.stationPositionPrefixes[station[0]] || config.positionPrefix;
			locationMaster[`${prefix}${station[0]}D`] = station[1];
			locationMaster[`${prefix}${station[0]}U`] = station[1];
		}
		for (let index = 0; index < visibleStations.length - 1; index += 1) {
			const from = visibleStations[index];
			const to = visibleStations[index + 1];
			const group = groupByFrom.get(from[0]);
			const keyTo = group && group.to === to[0] ? group.to : to[0];
			const pos = `${config.positionPrefix}${from[0]}_${keyTo}`;
			locationMaster[`${pos}D`] = `${from[1]}→${to[1]} 間`;
			locationMaster[`${pos}U`] = `${to[1]}→${from[1]} 間`;
		}
	}
	fs.writeFileSync(filePath, `${JSON.stringify(locationMaster, null, "\t")}\n`, "utf8");
}

function updateExistingRouteIcons(fileName) {
	const filePath = path.join(ROOT, "rosen", fileName);
	const html = fs.readFileSync(filePath, "utf8");
	const updated = html.replace(
		/<span class="eki-icon hide"><\/span>(<div key="([A-Z]+\d+(?:-\d+)?)"[^>]*>)/g,
		function(_match, stationElement, code) {
			return stationNumberIcon(code) + stationElement;
		}
	).replace(
		/<div class="stalist-eki-contents non-icon">(?=<span class="eki-icon jrshikoku-eki-icon)/g,
		'<div class="stalist-eki-contents">'
	);
	fs.writeFileSync(filePath, updated, "utf8");
}

for (const [lineId, route] of Object.entries(ROUTES)) {
	const config = adapter.lineConfigs[lineId];
	if (!config) throw new Error(`Missing JR Shikoku line config: ${lineId}`);
	fs.writeFileSync(
		path.join(ROOT, "rosen", `rosen_${route.rosen}.html`),
		renderRoute(lineId, route, config),
		"utf8"
	);
}
updateExistingRouteIcons("rosen_73.html");
updateExistingRouteIcons("rosen_64.html");
updateLocationMaster();
console.log(`Generated ${Object.keys(ROUTES).length} JR Shikoku route pages and location_master entries.`);
