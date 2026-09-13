"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ROSEN_DIR = path.join(ROOT, "rosen");
const LOCATION_MASTER_PATH = path.join(ROOT, "original", "location_master.json");
const JRWEST_PREFIXES = ["JWH", "JWO", "JWG", "JWS", "JWT", "JWF", "JW"];

function getRoutePages() {
	return fs.readdirSync(ROSEN_DIR)
		.map((fileName) => {
			const match = fileName.match(/^rosen_(\d+)\.html$/);
			return match ? match[1] : "";
		})
		.filter(Boolean)
		.sort((left, right) => Number(left) - Number(right));
}

function isAlreadyScoped(positionKey, prefix, page) {
	return positionKey.startsWith(prefix + page) && /^\d/.test(positionKey.slice((prefix + page).length));
}

function scopePositionKey(positionKey, page) {
	for (const prefix of JRWEST_PREFIXES) {
		if (!positionKey.startsWith(prefix)) continue;
		if (isAlreadyScoped(positionKey, prefix, page)) return positionKey;
		if (/^\d/.test(positionKey.slice(prefix.length))) {
			return prefix + page + positionKey.slice(prefix.length);
		}
	}
	return positionKey;
}

function getScopedPrefix(positionKey, page) {
	return JRWEST_PREFIXES
		.map((prefix) => prefix + page)
		.sort((left, right) => right.length - left.length)
		.find((prefix) => positionKey.startsWith(prefix)) || "";
}

function collectStationNames(html, page) {
	const stationNames = new Map();
	const prefixesByCode = new Map();
	const namesByCode = new Map();
	for (const match of html.matchAll(/\b([A-Za-z][A-Za-z0-9_]*?)[UD]\b/g)) {
		const scopedPrefix = getScopedPrefix(match[1], page);
		if (!scopedPrefix) continue;
		const codePart = match[1].slice(scopedPrefix.length);
		if (codePart.includes("_")) continue;
		if (!prefixesByCode.has(codePart)) prefixesByCode.set(codePart, new Set());
		prefixesByCode.get(codePart).add(scopedPrefix);
	}
	for (const match of html.matchAll(/<div key="([^"]+)"[^>]*>([^<]+)<\/div>/g)) {
		if (!namesByCode.has(match[1])) namesByCode.set(match[1], new Set());
		namesByCode.get(match[1]).add(match[2].trim());
	}

	function assignStationBlock(block) {
		const stationMatch = block.match(/<div key="([^"]+)"[^>]*>([^<]+)<\/div>/);
		if (!stationMatch) return;
		const name = stationMatch[2].trim();
		for (const classMatch of block.matchAll(/\b([A-Za-z][A-Za-z0-9_]*?)[UD]\b/g)) {
			const scopedPrefix = getScopedPrefix(classMatch[1], page);
			if (!scopedPrefix) continue;
			const codePart = classMatch[1].slice(scopedPrefix.length);
			if (!codePart.includes("_")) stationNames.set(scopedPrefix + codePart, name);
		}
	}

	for (const match of html.matchAll(/<div class="eki-panel[^"]*">[\s\S]*?<svg class="senro-img">[\s\S]*?<\/svg><\/div>/g)) {
		assignStationBlock(match[0]);
	}

	for (const line of html.split(/\r?\n/)) {
		const stationMatch = line.match(/<div key="([^"]+)"[^>]*>([^<]+)<\/div>/);
		if (!stationMatch) continue;
		const code = stationMatch[1];
		const name = stationMatch[2].trim();
		const matchingPrefixes = new Set();
		for (const classMatch of line.matchAll(/\b([A-Za-z][A-Za-z0-9_]*?)[UD]\b/g)) {
			const scopedPrefix = getScopedPrefix(classMatch[1], page);
			if (!scopedPrefix) continue;
			const codePart = classMatch[1].slice(scopedPrefix.length);
			if (codePart.includes("_")) continue;
			stationNames.set(scopedPrefix + codePart, name);
			if (codePart === code) matchingPrefixes.add(scopedPrefix);
		}
		if (matchingPrefixes.size > 0) continue;
		const candidates = prefixesByCode.get(code) || new Set();
		if (candidates.size === 1) stationNames.set([...candidates][0] + code, name);
	}

	for (const [code, names] of namesByCode) {
		if (names.size !== 1) continue;
		for (const scopedPrefix of prefixesByCode.get(code) || []) {
			stationNames.set(scopedPrefix + code, [...names][0]);
		}
	}

	for (const match of html.matchAll(/<div key="([^"]+)"[^>]*>([^<]+)<\/div>[\s\S]{0,1800}?<div class="ressha-contents"><div class="ressha-icon ([A-Za-z0-9_]+?)[UD]"><\/div>/g)) {
		const scopedPrefix = getScopedPrefix(match[3], page);
		const key = scopedPrefix + match[1];
		if (scopedPrefix && !stationNames.has(key)) {
			stationNames.set(key, match[2].trim());
		}
	}
	return stationNames;
}

function rebuildPageMaster(html, page, locationMaster) {
	const stationNames = collectStationNames(html, page);
	const positionPattern = /\b([A-Za-z][A-Za-z0-9_]*?)([UD])\b/g;
	let rebuilt = 0;
	let unresolved = 0;
	const unresolvedKeys = [];
	const seen = new Set();

	for (const match of html.matchAll(positionPattern)) {
		const positionBase = match[1];
		const direction = match[2];
		const scopedPrefix = getScopedPrefix(positionBase, page);
		if (!scopedPrefix) continue;
		const fullKey = positionBase + direction;
		if (seen.has(fullKey)) continue;
		seen.add(fullKey);

		const codePart = positionBase.slice(scopedPrefix.length);
		const codes = codePart.split("_");
		const firstName = stationNames.get(scopedPrefix + codes[0]);
		const secondName = codes[1] ? stationNames.get(scopedPrefix + codes[1]) : "";
		if (!firstName || (codes[1] && !secondName)) {
			unresolved += 1;
			unresolvedKeys.push(fullKey);
			continue;
		}

		locationMaster[fullKey] = codes[1]
			? (direction === "U" ? `${secondName}\u2192${firstName} \u9593` : `${firstName}\u2192${secondName} \u9593`)
			: firstName;
		rebuilt += 1;
	}

	return { rebuilt, unresolved, unresolvedKeys };
}

function migratePage(page, locationMaster) {
	const filePath = path.join(ROSEN_DIR, `rosen_${page}.html`);
	let html = fs.readFileSync(filePath, "utf8");
	if (!JRWEST_PREFIXES.some((prefix) => html.includes(`ressha-icon ${prefix}`))) return null;

	html = html.replace(/class="([^"]*\bressha-icon\b[^"]*)"/g, (whole, classNames) => {
		const scopedClassNames = classNames.split(/\s+/).map((className) => {
			return /^[A-Za-z][A-Za-z0-9_]*[UD]$/.test(className)
				? scopePositionKey(className, page)
				: className;
		});
		return `class="${scopedClassNames.join(" ")}"`;
	});
	fs.writeFileSync(filePath, html, "utf8");

	const result = rebuildPageMaster(html, page, locationMaster);
	return { page, ...result };
}

const locationMaster = JSON.parse(fs.readFileSync(LOCATION_MASTER_PATH, "utf8").replace(/^\uFEFF/, ""));
const results = getRoutePages().map((page) => migratePage(page, locationMaster)).filter(Boolean);
const activePositionKeys = new Set();
for (const result of results) {
	const html = fs.readFileSync(path.join(ROSEN_DIR, `rosen_${result.page}.html`), "utf8");
	for (const match of html.matchAll(/\b([A-Za-z][A-Za-z0-9_]*[UD])\b/g)) {
		if (getScopedPrefix(match[1].slice(0, -1), result.page)) activePositionKeys.add(match[1]);
	}
}
let removed = 0;
for (const key of Object.keys(locationMaster)) {
	if (!JRWEST_PREFIXES.some((prefix) => key.startsWith(prefix))) continue;
	if (activePositionKeys.has(key)) continue;
	delete locationMaster[key];
	removed += 1;
}
fs.writeFileSync(LOCATION_MASTER_PATH, `${JSON.stringify(locationMaster, null, "\t")}\n`, "utf8");

for (const result of results) {
	const unresolvedText = result.unresolvedKeys.length > 0 ? ` [${result.unresolvedKeys.join(", ")}]` : "";
	console.log(`page ${result.page}: rebuilt=${result.rebuilt}, unresolved=${result.unresolved}${unresolvedText}`);
}
console.log(`Scoped ${results.length} JR West route pages and removed ${removed} stale position keys.`);
