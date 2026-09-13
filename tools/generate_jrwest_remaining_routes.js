const fs = require("fs");
const https = require("https");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const API_BASE = "https://www.train-guide.westjr.co.jp/api/v3";
const PAGE_BASE = "https://www.train-guide.westjr.co.jp";
const PROXY_BASE = "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=";
const CURRENT_TIME_URL = `${PROXY_BASE}${API_BASE}/currenttime.txt`;

const AREA_PREFIXES = {
	hokuriku: "JWH",
	kinki: "JW",
	okayama: "JWO",
	hiroshima: "JWG",
	sanin: "JWS"
};

function scopePositionPrefix(prefix, rosen) {
	const page = String(rosen || "");
	return page && !String(prefix).endsWith(page) ? String(prefix) + page : String(prefix);
}

const ROUTES = [
	{ rosen: "96", name: "赤穂線", range: "相生～岡山間", symbol: "N", parts: [
		{ area: "kinki", line: "ako", start: "相生", end: "播州赤穂" },
		{ area: "okayama", line: "ako2", start: "播州赤穂", end: "岡山" }
	] },
	{ rosen: "97", name: "草津線", range: "草津～柘植間", symbol: "C", parts: [
		{ area: "kinki", line: "kusatsu", start: "草津", end: "柘植" }
	] },
	{ rosen: "98", name: "奈良線", range: "京都～木津間", symbol: "D", parts: [
		{ area: "kinki", line: "nara", start: "京都", end: "木津" }
	] },
	{ rosen: "99", name: "嵯峨野線", range: "京都～園部間", symbol: "E", parts: [
		{ area: "kinki", line: "sagano", start: "京都", end: "園部" }
	] },
	{ rosen: "100", name: "山陰線", range: "園部～豊岡間", symbol: "E", parts: [
		{ area: "kinki", line: "sanin1", start: "園部", end: "福知山" },
		{ area: "kinki", line: "sanin2", start: "福知山", end: "豊岡" }
	] },
	{ rosen: "101", name: "山陰線", range: "豊岡～米子間", symbol: "A", parts: [
		{ area: "kinki", line: "sanin2", start: "豊岡", end: "居組" },
		{ area: "sanin", line: "sanin3", start: "居組", end: "米子" }
	] },
	{ rosen: "102", name: "山陰線", range: "米子～出雲市間", symbol: "D", parts: [
		{ area: "sanin", line: "sanin4", start: "米子", end: "出雲市" }
	] },
	{ rosen: "103", name: "山陰線", range: "出雲市～益田間", symbol: "D", parts: [
		{ area: "sanin", line: "sanin4", start: "出雲市", end: "益田" }
	] },
	{ rosen: "104", name: "JR宝塚線・福知山線", range: "大阪～福知山間", symbol: "G", parts: [
		{ area: "kinki", line: "takarazuka", start: "大阪", end: "新三田", prefix: "JWT" },
		{ area: "kinki", line: "fukuchiyama", start: "新三田", end: "福知山", prefix: "JWF" }
	], extraSources: [
		{ area: "kinki", line: "takarazuka", locationLine: "takarazukakobe", start: "大阪", end: "新三田", prefix: "JWT" }
	] },
	{ rosen: "105", name: "播但線", range: "姫路～和田山間", symbol: "J", parts: [
		{ area: "kinki", line: "bantan", start: "姫路", end: "和田山" }
	] },
	{ rosen: "106", name: "舞鶴線", range: "綾部～東舞鶴間", symbol: "L", parts: [
		{ area: "kinki", line: "maizuru", start: "綾部", end: "東舞鶴" }
	] },
	{ rosen: "107", name: "和歌山線", range: "王寺～和歌山間", symbol: "T", parts: [
		{ area: "kinki", line: "wakayama2", start: "王寺", end: "五条" },
		{ area: "kinki", line: "wakayama1", start: "五条", end: "和歌山" }
	] },
	{ rosen: "108", name: "万葉まほろば線", range: "奈良～高田間", symbol: "U", parts: [
		{ area: "kinki", line: "manyomahoroba", start: "奈良", end: "高田" }
	] },
	{ rosen: "109", name: "関西線", range: "加茂～亀山間", symbol: "V", parts: [
		{ area: "kinki", line: "kansai", start: "加茂", end: "亀山" }
	] },
	{ rosen: "110", name: "きのくに線", range: "和歌山～新宮間", symbol: "W", parts: [
		{ area: "kinki", line: "kinokuni", start: "和歌山", end: "新宮" }
	] },
	{ rosen: "111", name: "伯備線", range: "岡山～米子間", symbol: "V", parts: [
		{ area: "okayama", line: "sanyo1", start: "岡山", end: "倉敷" },
		{ area: "okayama", line: "hakubi1", start: "倉敷", end: "新郷" },
		{ area: "sanin", line: "hakubi2", start: "新郷", end: "伯耆大山" },
		{ area: "sanin", line: "sanin3", start: "伯耆大山", end: "米子" }
	] },
	{ rosen: "112", name: "山陽線", range: "姫路～三原間", symbol: "S", parts: [
		{ area: "kinki", line: "kobesanyo", start: "姫路", end: "上郡" },
		{ area: "okayama", line: "sanyo1", start: "上郡", end: "三原" }
	] },
	{ rosen: "113", name: "山陽線", range: "三原～岩国間", symbol: "G", parts: [
		{ area: "hiroshima", line: "sanyo2", start: "三原", end: "岩国" }
	] },
	{ rosen: "114", name: "山陽線", range: "岩国～下関間", symbol: "", parts: [
		{ area: "hiroshima", line: "sanyo3", start: "岩国", end: "下関" }
	] },
	{ rosen: "115", name: "津山線", range: "岡山～津山間", symbol: "T", parts: [
		{ area: "okayama", line: "tsuyama", start: "岡山", end: "津山" }
	] },
	{ rosen: "116", name: "福塩線", range: "福山～府中間", symbol: "Z", parts: [
		{ area: "okayama", line: "fukuen1", start: "福山", end: "府中" }
	] },
	{ rosen: "117", name: "可部線", range: "広島～あき亀山間", symbol: "B", parts: [
		{ area: "hiroshima", line: "kabe", start: "広島", end: "あき亀山" }
	] },
	{ rosen: "118", name: "芸備線", range: "三次～広島間", symbol: "P", parts: [
		{ area: "hiroshima", line: "geibi1", start: "三次", end: "広島" }
	] },
	{ rosen: "119", name: "呉線", range: "三原～広島間", symbol: "Y", parts: [
		{ area: "hiroshima", line: "kure", start: "三原", end: "広島" }
	] },
	{ rosen: "120", name: "山口線", range: "新山口～益田間", symbol: "", parts: [
		{ area: "hiroshima", line: "yamaguchi", start: "新山口", end: "益田" }
	] },
	{ rosen: "121", name: "因美線", range: "智頭～鳥取間", symbol: "B", parts: [
		{ area: "sanin", line: "imbi1", start: "智頭", end: "鳥取" }
	] }
];

const MENU_GROUPS = [
	{ name: "北陸", routes: [
		["62", "A", "#0072ba", "北陸線", "敦賀～米原間"],
		["63", "B", "#00acd1", "湖西線・北陸線", "京都～敦賀間"]
	] },
	{ name: "近畿", routes: [
		["61", "A", "#0072ba", "琵琶湖線・JR京都線・JR神戸線", "米原～姫路間"],
		["63", "B", "#00acd1", "湖西線・北陸線", "京都～敦賀間"],
		["97", "C", "#5a9934", "草津線", "草津～柘植間"],
		["98", "D", "#aa731c", "奈良線", "京都～木津間"],
		["99", "E", "#878ddc", "嵯峨野線", "京都～園部間"],
		["70", "F", "#467088", "おおさか東線", "大阪～久宝寺間"],
		["104", "G", "#ffba00", "JR宝塚線・福知山線", "大阪～福知山間"],
		["65", "H", "#e25c83", "JR東西線・学研都市線", "尼崎～木津間"],
		["105", "J", "#a52f5d", "播但線", "姫路～和田山間"],
		["106", "L", "#ff8e1f", "舞鶴線", "綾部～東舞鶴間"],
		["67", "O", "#f8405c", "大阪環状線", "大阪～天王寺～大阪間"],
		["68", "P", "#003c88", "JRゆめ咲線", "西九条～桜島間"],
		["69", "Q", "#00b17b", "大和路線", "JR難波～加茂間"],
		["66", "R", "#ff8e1f", "阪和線・羽衣線", "天王寺～和歌山・鳳～東羽衣間"],
		["71", "S", "#0072ba", "関西空港線", "日根野～関西空港間"],
		["107", "T", "#f79fba", "和歌山線", "王寺～和歌山間"],
		["108", "U", "#b31c31", "万葉まほろば線", "奈良～高田間"],
		["109", "V", "#5726b7", "関西線", "加茂～亀山間"],
		["110", "W", "#00a6b4", "きのくに線", "和歌山～新宮間"],
		["96", "A", "#0072ba", "赤穂線", "相生～岡山間"],
		["100", "E", "#878ddc", "山陰線", "園部～豊岡間"],
		["101", "E", "#878ddc", "山陰線", "豊岡～米子間"],
		["112", "A", "#0072ba", "山陽線", "姫路～三原間"]
	] },
	{ name: "岡山・福山", routes: [
		["72", "L", "#63d2d3", "宇野みなと線", "茶屋町～宇野間"],
		["64", "M", "#0072ba", "瀬戸大橋線", "岡山～宇多津間"],
		["96", "N", "#f8405c", "赤穂線", "相生～岡山間"],
		["112", "S", "#accd00", "山陽線", "姫路～三原間"],
		["115", "T", "#ffba00", "津山線", "岡山～津山間"],
		["111", "V", "#378640", "伯備線", "岡山～米子間"],
		["116", "Z", "#5726b7", "福塩線", "福山～府中間"]
	] },
	{ name: "広島・山口", routes: [
		["117", "B", "#00a6b4", "可部線", "広島～あき亀山間"],
		["113", "G", "#5a9934", "山陽線", "三原～岩国間"],
		["114", "", "#0072ba", "山陽線", "岩国～下関間"],
		["118", "P", "#8f76d6", "芸備線", "三次～広島間"],
		["119", "Y", "#db8e00", "呉線", "三原～広島間"],
		["120", "", "#ff7860", "山口線", "新山口～益田間"]
	] },
	{ name: "山陰", routes: [
		["101", "A", "#9dcd20", "山陰線", "豊岡～米子間"],
		["121", "B", "#aa731c", "因美線", "智頭～鳥取間"],
		["102", "D", "#ff5611", "山陰線", "米子～出雲市間"],
		["103", "D", "#ff5611", "山陰線", "出雲市～益田間"],
		["111", "V", "#378640", "伯備線", "岡山～米子間"]
	] }
];

const jsonCache = new Map();

function fetchJson(url) {
	if (jsonCache.has(url)) return jsonCache.get(url);
	const target = `${PROXY_BASE}${url}${url.includes("?") ? "&" : "?"}cache=${Date.now()}`;
	const promise = new Promise((resolve, reject) => {
		https.get(target, (response) => {
			let body = "";
			response.setEncoding("utf8");
			response.on("data", (chunk) => { body += chunk; });
			response.on("end", () => {
				if (response.statusCode < 200 || response.statusCode >= 300) {
					reject(new Error(`${url}: HTTP ${response.statusCode}`));
					return;
				}
				try { resolve(JSON.parse(body.replace(/^\uFEFF/, ""))); }
				catch (error) { reject(new Error(`${url}: ${error.message}`)); }
			});
		}).on("error", reject);
	});
	jsonCache.set(url, promise);
	return promise;
}

function escapeHtml(value) {
	return String(value == null ? "" : value)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function sourceKey(alias) {
	return `${alias.area}:${alias.line}`;
}

function sliceStations(stationJson, startName, endName) {
	const stations = (stationJson.stations || []).map((row, index) => ({ row, index, info: row.info || {} }));
	const start = stations.findIndex((station) => station.info.name === startName);
	const end = stations.findIndex((station) => station.info.name === endName);
	if (start < 0 || end < 0) throw new Error(`Station boundary not found: ${startName} -> ${endName}`);
	if (start <= end) return stations.slice(start, end + 1);
	return stations.slice(end, start + 1).reverse();
}

async function prepareRoute(route) {
	const parts = [];
	for (const part of route.parts) {
		const areaMasterUrl = `${API_BASE}/area_${part.area}_master.json`;
		const stationUrl = `${API_BASE}/${part.line}_st.json`;
		const locationUrl = `${API_BASE}/${part.line}.json`;
		const [areaMaster, stationJson] = await Promise.all([fetchJson(areaMasterUrl), fetchJson(stationUrl)]);
		const lineInfo = areaMaster.lines && areaMaster.lines[part.line];
		if (!lineInfo) throw new Error(`Line not found in area master: ${part.area}/${part.line}`);
		const sliced = sliceStations(stationJson, part.start, part.end);
		const prefix = scopePositionPrefix(part.prefix || AREA_PREFIXES[part.area] || "JW", route.rosen);
		parts.push({
			...part,
			prefix,
			areaMasterUrl,
			stationUrl,
			locationUrl,
			lineInfo,
			stationJson,
			stations: sliced
		});
	}
	const extraSources = [];
	for (const source of route.extraSources || []) {
		const areaMasterUrl = `${API_BASE}/area_${source.area}_master.json`;
		const stationUrl = `${API_BASE}/${source.line}_st.json`;
		const locationLine = source.locationLine || source.line;
		const locationUrl = `${API_BASE}/${locationLine}.json`;
		const stationJson = await fetchJson(stationUrl);
		const sliced = sliceStations(stationJson, source.start, source.end);
		extraSources.push({
			areaId: source.area,
			lineId: source.line,
			positionPrefix: scopePositionPrefix(source.prefix || AREA_PREFIXES[source.area] || "JW", route.rosen),
			stationCodes: sliced.map((station) => String(station.info.code)),
			areaMasterUrl,
			stationUrl,
			locationUrl
		});
	}

	const displayStations = [];
	for (const part of parts) {
		for (const station of part.stations) {
			const alias = {
				area: part.area,
				line: part.line,
				prefix: part.prefix,
				code: String(station.info.code),
				name: String(station.info.name),
				notDisplayType: Number(station.info.notDisplayType),
				sourceIndex: station.index,
				href: `${PAGE_BASE}/${part.line}.html`
			};
			const previous = displayStations[displayStations.length - 1];
			if (previous && (previous.name === alias.name || previous.aliases.some((item) => item.code === alias.code))) {
				previous.aliases.push(alias);
				continue;
			}
			displayStations.push({ name: alias.name, aliases: [alias] });
		}
	}

	return {
		...route,
		parts,
		stations: displayStations,
		sources: parts.map((part) => ({
			areaId: part.area,
			lineId: part.line,
			positionPrefix: part.prefix,
			stationCodes: part.stations.map((station) => String(station.info.code)),
			areaMasterUrl: part.areaMasterUrl,
			stationUrl: part.stationUrl,
			locationUrl: part.locationUrl
		})).concat(extraSources)
	};
}

function aliasClasses(station, direction, onlyNonDisplay) {
	return station.aliases
		.filter((alias) => !onlyNonDisplay || alias.notDisplayType === 5)
		.map((alias) => `${alias.prefix}${alias.code}${direction}`);
}

function sharedPairs(first, second) {
	const pairs = [];
	for (const from of first.aliases) {
		const to = second.aliases.find((candidate) => sourceKey(candidate) === sourceKey(from));
		if (!to) continue;
		const ordered = from.sourceIndex <= to.sourceIndex ? [from, to] : [to, from];
		pairs.push({ from, to, first: ordered[0], second: ordered[1] });
	}
	return pairs;
}

function renderStation(station, isEnd) {
	const primary = station.aliases[0];
	const upClasses = aliasClasses(station, "U", false).join(" ");
	const downClasses = aliasClasses(station, "D", false).join(" ");
	return `<div class="eki-panel eki${isEnd ? " end" : ""}"><div class="eki-contents"><div class="stalist-eki-link"><a href="${primary.href}" target="_blank" rel="noopener"><div class="stalist-eki-contents non-icon"><span class="eki-icon hide"></span><div key="${escapeHtml(primary.code)}" class="margin-left05">${escapeHtml(station.name)}</div></div></a></div><div class="ressha-contents"><div class="ressha-icon ${upClasses}"></div><div class="ressha-icon ${downClasses}"></div></div></div>${isEnd ? "" : '<svg class="senro-img"><use xlink:href="#senro"></use></svg>'}</div>`;
}

function renderBetween(first, second) {
	const pairs = sharedPairs(first, second);
	if (pairs.length < 1) return "";
	const up = pairs.map((pair) => `${pair.first.prefix}${pair.first.code}_${pair.second.code}U`).join(" ");
	const down = pairs.map((pair) => `${pair.first.prefix}${pair.first.code}_${pair.second.code}D`).join(" ");
	return `<div class="eki-panel"><div class="eki-contents"><div class="ressha-contents"><div class="ressha-icon ${up}"></div><div class="ressha-icon ${down}"></div></div></div><svg class="senro-img"><use xlink:href="#senro"></use></svg></div>`;
}

function countClass(count) {
	return ["", "", "two-eki", "three-eki", "four-eki", "five-eki"][count] || "many-eki";
}

function renderNonDisplayGroup(group) {
	const allAliases = group.flatMap((station) => station.aliases);
	const up = [...new Set(allAliases.map((alias) => `${alias.prefix}${alias.code}U`))].join(" ");
	const down = [...new Set(allAliases.map((alias) => `${alias.prefix}${alias.code}D`))].join(" ");
	const stationLinks = group.map((station) => {
		const primary = station.aliases[0];
		return `<a href="${primary.href}" target="_blank" rel="noopener"><div class="stalist-eki-contents non-icon"><span class="eki-icon hide"></span><div key="${escapeHtml(primary.code)}">${escapeHtml(station.name)}</div></div></a>`;
	}).join("\n");
	const sizeClass = countClass(group.length);
	return `<div class="eki-panel hirendo"><div class="eki-contents"><div class="hirendo-msg">この区間は実際の<br>走行位置と異なる<br>場合があります</div><div class="hirendo-contents"><div class="ressha-contents"><div class="hirendo-ressha-panel one-eki-contents"><div class="ressha-icon ${up}"></div></div></div><div class="stalist-eki-link${sizeClass ? ` ${sizeClass}` : ""}"${group.length > 5 ? ` style="height:${group.length * 50 - 6}px;max-height:none"` : ""}>${stationLinks}</div><div class="ressha-contents"><div class="hirendo-ressha-panel one-eki-contents"><div class="ressha-icon ${down}"></div></div></div></div></div><svg class="senro-img"><use xlink:href="#senro"></use></svg></div>`;
}

function renderRoutePage(route) {
	const output = [
		`<div id="homenNameUpText" hidden>${escapeHtml(route.stations[0].name)}方面</div>`,
		`<div id="homenNameDownText" hidden>${escapeHtml(route.stations[route.stations.length - 1].name)}方面</div>`,
		""
	];
	let index = 0;
	while (index < route.stations.length) {
		const station = route.stations[index];
		const isNonDisplay = station.aliases.some((alias) => alias.notDisplayType === 5);
		if (isNonDisplay) {
			const group = [];
			while (index < route.stations.length && route.stations[index].aliases.some((alias) => alias.notDisplayType === 5)) {
				group.push(route.stations[index]);
				index += 1;
			}
			output.push(renderNonDisplayGroup(group), "");
			continue;
		}
		const isEnd = index === route.stations.length - 1;
		output.push(renderStation(station, isEnd));
		const next = route.stations[index + 1];
		if (next && !next.aliases.some((alias) => alias.notDisplayType === 5)) {
			const between = renderBetween(station, next);
			if (between) output.push(between);
		}
		output.push("");
		index += 1;
	}
	output.push('<svg style="display:none"><symbol id="senro" viewBox="0 0 8 300">');
	for (let y = 0; y < 300; y += 10) {
		output.push(`\t<rect width="6" height="10" x="1" y="${y}" fill="${y % 20 === 0 ? "#fff" : "#000"}" stroke="#000"></rect>`);
	}
	output.push("</symbol></svg>", "");
	return output.join("\n");
}

function buildLocationEntries(route, master) {
	for (const station of route.stations) {
		for (const alias of station.aliases) {
			master[`${alias.prefix}${alias.code}U`] = station.name;
			master[`${alias.prefix}${alias.code}D`] = station.name;
		}
	}
	for (let index = 0; index < route.stations.length - 1; index += 1) {
		const first = route.stations[index];
		const second = route.stations[index + 1];
		const firstNonDisplay = first.aliases.some((alias) => alias.notDisplayType === 5);
		const secondNonDisplay = second.aliases.some((alias) => alias.notDisplayType === 5);
		if (!firstNonDisplay && !secondNonDisplay) {
			for (const pair of sharedPairs(first, second)) {
				const key = `${pair.first.prefix}${pair.first.code}_${pair.second.code}`;
				master[`${key}U`] = `${second.name}→${first.name} 間`;
				master[`${key}D`] = `${first.name}→${second.name} 間`;
			}
		}
	}
	let index = 0;
	while (index < route.stations.length) {
		if (!route.stations[index].aliases.some((alias) => alias.notDisplayType === 5)) {
			index += 1;
			continue;
		}
		const start = index;
		while (index + 1 < route.stations.length && route.stations[index + 1].aliases.some((alias) => alias.notDisplayType === 5)) index += 1;
		const previous = route.stations[start - 1];
		const next = route.stations[index + 1];
		if (previous && next) {
			for (const alias of route.stations[start].aliases.filter((item) => item.notDisplayType === 5)) {
				master[`${alias.prefix}${alias.code}U`] = `${next.name}→${previous.name} 間`;
				master[`${alias.prefix}${alias.code}D`] = `${previous.name}→${next.name} 間`;
			}
		}
		index += 1;
	}
}

function writeSourceModule(routes) {
	const sources = {};
	for (const route of routes) {
		sources[route.rosen] = {
			senku: route.rosen,
			currentTimeUrl: CURRENT_TIME_URL,
			sources: route.sources
		};
	}
	const body = `(function(root, factory) {\n\tif (typeof module === "object" && module.exports) module.exports = factory();\n\telse root.JrWestRemainingRouteSources = factory();\n}(typeof self !== "undefined" ? self : this, function() {\n\t"use strict";\n\treturn ${JSON.stringify(sources, null, "\t")};\n}));\n`;
	fs.writeFileSync(path.join(ROOT, "js", "jrwest_remaining_route_sources.js"), body, "utf8");
}

function writeCatalogModule() {
	const routeIds = [...new Set(MENU_GROUPS.flatMap((group) => group.routes.map((route) => route[0])))];
	const payload = { routeIds, groups: MENU_GROUPS };
	const body = `(function(root) {\n\t"use strict";\n\tconst catalog = ${JSON.stringify(payload, null, "\t")};\n\troot.JrWestRouteCatalog = catalog;\n\tfunction escapeHtml(value) { return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }\n\tfunction renderRoute(route) {\n\t\tconst symbol = route[1] || "";\n\t\tconst noSymbol = symbol ? "" : " no-symbol";\n\t\treturn '<div value="' + escapeHtml(route[0]) + '" class="rosen-name-contents"><span class="jrwest-line-symbol' + noSymbol + '" style="background-color:' + escapeHtml(route[2]) + '">' + escapeHtml(symbol) + '</span><span class="rosen-name-label"><span class="main">' + escapeHtml(route[3]) + '</span><span class="sub">[' + escapeHtml(route[4]) + ']</span></span><span class="icon-arrow-right"></span></div>';\n\t}\n\tfunction render() {\n\t\tconst html = catalog.groups.map(function(group) {\n\t\t\treturn '<div class="jrwest-area-group"><button type="button" class="jrwest-area-label">' + escapeHtml(group.name) + '</button><div class="jrwest-area-lines">' + group.routes.map(renderRoute).join("") + '</div></div>';\n\t\t}).join("");\n\t\tdocument.querySelectorAll(".rosen-name-list.jrwest").forEach(function(node) { node.innerHTML = html; });\n\t}\n\tif (typeof document !== "undefined") {\n\t\tif (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render);\n\t\telse render();\n\t}\n}(typeof self !== "undefined" ? self : this));\n`;
	fs.writeFileSync(path.join(ROOT, "js", "jrwest_route_catalog.js"), body, "utf8");
}

function updateLocationMaster(routes) {
	const filePath = path.join(ROOT, "original", "location_master.json");
	const master = JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
	for (const route of routes) buildLocationEntries(route, master);
	fs.writeFileSync(filePath, `${JSON.stringify(master, null, "\t")}\n`, "utf8");
}

function updateRosenNameMaster(routes) {
	const filePath = path.join(ROOT, "master", "rosen_name_master.json");
	const master = JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
	const routeIds = new Set(routes.map((route) => route.rosen));
	const retained = master.filter((entry) => !routeIds.has(String(entry.rosen)));
	for (const route of routes) {
		const name = { ja: route.name, en: route.name, tc: route.name, sc: route.name, kr: route.name };
		const range = { ja: `[${route.range}]`, en: `[${route.range}]`, tc: `[${route.range}]`, sc: `[${route.range}]`, kr: `[${route.range}]` };
		retained.push({ rosen: route.rosen, rosenName: name, kukanName: range, kigo: route.symbol, area: "7" });
	}
	fs.writeFileSync(filePath, `${JSON.stringify(retained, null, "\t")}\n`, "utf8");
}

async function main() {
	const routes = [];
	for (const route of ROUTES) routes.push(await prepareRoute(route));
	for (const route of routes) {
		fs.writeFileSync(path.join(ROOT, "rosen", `rosen_${route.rosen}.html`), renderRoutePage(route), "utf8");
	}
	writeSourceModule(routes);
	writeCatalogModule();
	updateLocationMaster(routes);
	updateRosenNameMaster(routes);
	const stationCount = routes.reduce((sum, route) => sum + route.stations.length, 0);
	console.log(`Generated ${routes.length} JR West route pages (${stationCount} displayed stations).`);
}

if (require.main === module) {
	main().catch((error) => {
		console.error(error);
		process.exit(1);
	});
}

module.exports = { ROUTES, MENU_GROUPS, AREA_PREFIXES, prepareRoute, renderRoutePage };
