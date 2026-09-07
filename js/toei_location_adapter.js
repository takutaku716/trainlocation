(function(root, factory) {
	if (typeof module === "object" && module.exports) module.exports = factory(require("./toei_routes.js"));
	else root.ToeiLocationAdapter = factory(root.ToeiRoutes);
}(typeof self !== "undefined" ? self : this, function(catalog) {
	"use strict";
	const API = "https://api-public.odpt.org/api/v4/";
	const TYPE_SHORT = { "普通": "普", "急行": "急", "特急": "特", "快速": "快", "快特": "快特", "通勤特急": "通特", "アクセス特急": "ア特", "エアポート快特": "エ快" };
	const THROUGH_DESTINATIONS = {
		Aoto: "青砥", KeiseiTakasago: "京成高砂", KeiseiNarita: "京成成田",
		NaritaAirportTerminal1: "成田空港", NaritaAirportTerminal2and3: "空港第2ビル",
		ImbaNihonIdai: "印旛日本医大", ImbaNihonidai: "印旛日本医大", InzaiMakinohara: "印西牧の原",
		HanedaAirportTerminal1and2: "羽田空港第1・第2ターミナル", KeikyuKurihama: "京急久里浜",
		Misakiguchi: "三崎口", Miurakaigan: "三浦海岸", ZushiHayama: "逗子・葉山",
		KanazawaBunko: "金沢文庫", KanazawaHakkei: "金沢八景", KanagawaShimmachi: "神奈川新町",
 		KeikyuKawasaki: "京急川崎",
		Shinagawa: "品川", Sengakuji: "泉岳寺", Sasazuka: "笹塚", Hashimoto: "橋本",
		KeioTamaCenter: "京王多摩センター", Wakabadai: "若葉台", Chofu: "調布",
		Sakurajosui: "桜上水", Tsutsujigaoka: "つつじヶ丘", KeioHachioji: "京王八王子",
		Takaosanguchi: "高尾山口", Takahatafudo: "高幡不動", Hiyoshi: "日吉",
		MusashiKosugi: "武蔵小杉", MusashiKoyama: "武蔵小山", Okusawa: "奥沢",
		ShinYokohama: "新横浜", Nishiya: "西谷", Ebina: "海老名", Shonandai: "湘南台"
	};
	const stationNames = new Map(catalog.routes.flatMap(r => r.stations.map(s => [s.id, s.name])));
	function routeFor(rosen) { return catalog.routes.find(r => r.rosen === String(rosen)); }
	function stationName(id) {
		if (!id) return "";
		return stationNames.get(id) || THROUGH_DESTINATIONS[String(id).split(".").pop()] || "行先取得不可";
	}
	function stationPosition(route, station, direction) {
		// 大江戸線の都庁前は路線図に2回現れる。在駅表示は分岐部（後方の駅枠）に集約する。
		const canonical = route.stations.filter(s => s.id === station.id).slice(-1)[0];
		return "TOEI" + route.rosen + "P" + canonical.index + direction;
	}
	function positionFor(row, route) {
		const directionId = row["odpt:railDirection"];
		const direction = directionId === route.ascending ? "D" : directionId === route.descending ? "U" : "";
		if (!direction) return null;
		const fromId = row["odpt:fromStation"];
		const toId = row["odpt:toStation"];
		const from = route.stations.find(s => s.id === fromId);
		if (!from) return null;
		if (!toId || toId === fromId) return { key: stationPosition(route, from, direction), name: from.name };
		const step = direction === "D" ? 1 : -1;
		for (let i = 0; i < route.stations.length; i++) {
			const next = route.stations[i + step];
			if (route.stations[i].id === fromId && next && next.id === toId) {
				const lower = Math.min(route.stations[i].index, next.index);
				return { key: "TOEI" + route.rosen + "P" + lower + "_" + (lower + 1) + direction,
					name: from.name + "→" + next.name + " 間" };
			}
		}
		// 不明な駅や非隣接駅を、推測で既知の駅間に置かない。
		return null;
	}
	function normalize(raw, options) {
		const settings = options || {};
		const route = routeFor(settings.rosen);
		if (!route) throw new Error("Unknown Toei railway");
		const rows = typeof raw === "string" ? JSON.parse(raw) : raw;
		if (!Array.isArray(rows)) throw new Error("Invalid ODPT Train response");
		const now = settings.now == null ? Date.now() : Number(settings.now);
		const selected = rows.filter(row => row && row["odpt:operator"] === "odpt.Operator:Toei" && row["odpt:railway"] === route.railway);
		const timestamps = selected.map(row => Date.parse(row["dc:date"])).filter(Number.isFinite);
		let expired = 0, unmapped = 0;
		const seen = new Set();
		const trains = selected.flatMap(row => {
			const timestamp = Date.parse(row["dc:date"]);
			const valid = Date.parse(row["dct:valid"]);
			if (!Number.isFinite(timestamp) || now - timestamp > 300000 || timestamp > now + 60000 || (Number.isFinite(valid) && valid < now)) {
				expired++;
				return [];
			}
			const position = positionFor(row, route);
			if (!position) { unmapped++; return []; }
			const cbango = String(row["odpt:trainNumber"] || "");
			const identity = row["owl:sameAs"] || cbango;
			if (!cbango || seen.has(identity)) return [];
			seen.add(identity);
			const destinations = row["odpt:destinationStation"];
			const destination = (Array.isArray(destinations) ? destinations : []).map(stationName).join("・") || "行先取得不可";
			const typeLabel = catalog.types[row["odpt:trainType"]] || "種別不明";
			const delay = Number(row["odpt:delay"]);
			return [{ cbango, type: "3", typeLabel, name: "", pos: position.key, posName: position.name,
				chien: Number.isFinite(delay) ? Math.max(0, Math.floor(delay / 60)) : 0,
				shuEkiSimple: destination === "行先取得不可" ? "？" : Array.from(destination)[0],
				shuEkiName: destination, shuEkiKey: "", ryosu: Number(row["odpt:carComposition"]) || 0,
				status: "1", statusDetail: "", senku: route.rosen, source: "toei", sourceRosen: route.rosen,
				toei: { id: identity, delayKnown: row["odpt:delay"] != null, typeSimple: TYPE_SHORT[typeLabel] || "？" } }];
		});
		const result = { trains, time: { ja: "", en: "", tc: "", sc: "", kr: "" }, toei: { expired, unmapped, live: route.live } };
		if (timestamps.length) {
			const timestamp = Math.min(...timestamps);
			const date = new Date(timestamp + 9 * 3600000).toISOString();
			const text = date.slice(0, 10).replace(/-/g, "/") + " " + date.slice(11, 19) + " 現在";
			result.time = { ja: text, en: text, tc: text, sc: text, kr: text };
			result.sourceTimes = [{ rosen: route.rosen, text, timestamp }];
		}
		return result;
	}
	async function load(rosen) {
		const route = routeFor(rosen);
		if (!route) throw new Error("Unknown Toei railway");
		if (!route.live) return normalize([], { rosen });
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 15000);
		try {
			const url = API + "odpt:Train?odpt:operator=odpt.Operator:Toei&odpt:railway=" + encodeURIComponent(route.railway);
			const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
			if (!response.ok) throw new Error("ODPT HTTP " + response.status);
			return normalize(await response.json(), { rosen });
		} finally { clearTimeout(timeout); }
	}
	return { routeFor, stationName, stationPosition, positionFor, normalize, load };
}));
