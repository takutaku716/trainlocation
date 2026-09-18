"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const MIGRATIONS = [
	{ rosen: "61", oldPrefix: "JW", newPrefix: "JW61" }
];

function migrateRoute(config, locationMaster) {
	const filePath = path.join(ROOT, "rosen", `rosen_${config.rosen}.html`);
	let html = fs.readFileSync(filePath, "utf8");
	const repeatedNewPrefixPattern = new RegExp(
		`\\b${config.oldPrefix}(?:${config.newPrefix.slice(config.oldPrefix.length)})+(?=\\d)`,
		"g"
	);
	html = html.replace(repeatedNewPrefixPattern, config.newPrefix);
	const oldPositionPattern = new RegExp(
		`\\b${config.oldPrefix}(?!${config.newPrefix.slice(config.oldPrefix.length)})(?=\\d)`,
		"g"
	);
	html = html.replace(oldPositionPattern, config.newPrefix);
	fs.writeFileSync(filePath, html, "utf8");

	for (const key of Object.keys(locationMaster)) {
		if (key.startsWith(config.newPrefix)) delete locationMaster[key];
	}

	const stationNames = new Map();
	for (const match of html.matchAll(/<div key="(\d+)"[^>]*>([^<]+)<\/div>/g)) {
		stationNames.set(match[1], match[2].trim());
	}

	const classPattern = new RegExp(`\\b${config.newPrefix}(\\d+)(?:_(\\d+))?([UD])\\b`, "g");
	for (const match of html.matchAll(classPattern)) {
		const firstCode = match[1];
		const secondCode = match[2];
		const direction = match[3];
		const firstName = stationNames.get(firstCode);
		if (!firstName) continue;
		if (!secondCode) {
			locationMaster[match[0]] = firstName;
			continue;
		}
		const secondName = stationNames.get(secondCode);
		if (!secondName) continue;
		locationMaster[match[0]] = direction === "U"
			? `${secondName}→${firstName} 間`
			: `${firstName}→${secondName} 間`;
	}
}

const locationMasterPath = path.join(ROOT, "original", "location_master.json");
const locationMaster = JSON.parse(fs.readFileSync(locationMasterPath, "utf8").replace(/^\uFEFF/, ""));
for (const config of MIGRATIONS) migrateRoute(config, locationMaster);
fs.writeFileSync(locationMasterPath, `${JSON.stringify(locationMaster, null, "\t")}\n`, "utf8");

console.log(`Migrated ${MIGRATIONS.length} JR West route prefix set.`);
