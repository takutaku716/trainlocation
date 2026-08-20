(function(root, factory) {
	if (typeof module === "object" && module.exports) {
		module.exports = factory(require("./jrshikoku_position_map.js"));
	} else {
		root.JrShikokuLocationAdapter = factory(root.JrShikokuPositionMap);
	}
}(typeof self !== "undefined" ? self : this, function(positionMap) {
	"use strict";

	const YOSAN_STATIONS = [
		["Y00", "高松"], ["Y01", "香西"], ["Y02", "鬼無"], ["Y03", "端岡"],
		["Y04", "国分"], ["Y05", "讃岐府中"], ["Y06", "鴨川"], ["Y07", "八十場"],
		["Y08", "坂出"], ["Y09", "宇多津"], ["Y10", "丸亀"], ["Y11", "讃岐塩屋"],
		["Y12", "多度津"], ["Y13", "海岸寺"], ["Y14", "詫間"], ["Y15", "みの"],
		["Y16", "高瀬"], ["Y17", "比地大"], ["Y18", "本山"], ["Y19", "観音寺"],
		["Y20", "豊浜"], ["Y21", "箕浦"], ["Y22", "川之江"], ["Y23", "伊予三島"],
		["Y24", "伊予寒川"], ["Y25", "赤星"], ["Y26", "伊予土居"], ["Y27", "関川"],
		["Y28", "多喜浜"], ["Y29", "新居浜"], ["Y30", "中萩"], ["Y31", "伊予西条"],
		["Y32", "石鎚山"], ["Y33", "伊予氷見"], ["Y34", "伊予小松"], ["Y35", "玉之江"],
		["Y36", "壬生川"], ["Y37", "伊予三芳"], ["Y38", "伊予桜井"], ["Y39", "伊予富田"],
		["Y40", "今治"], ["Y41", "波止浜"], ["Y42", "波方"], ["Y43", "大西"],
		["Y44", "伊予亀岡"], ["Y45", "菊間"], ["Y46", "浅海"], ["Y47", "大浦"],
		["Y48", "伊予北条"], ["Y49", "柳原"], ["Y50", "粟井"], ["Y51", "光洋台"],
		["Y52", "堀江"], ["Y53", "伊予和気"], ["Y54", "三津浜"], ["Y55", "松山"]
	];
	const SETO_STATIONS = [
		["0256", "児島"], ["Y09", "宇多津"]
	];
	const UWAJIMA_STATIONS = [
		["U00", "松山"], ["U01", "市坪"], ["U02", "北伊予"], ["U02-1", "南伊予"],
		["U03", "伊予横田"], ["U04", "鳥ノ木"], ["U05", "伊予市"], ["U06", "向井原"],
		["U07", "伊予大平"], ["U08", "伊予中山"], ["U09", "伊予立川"], ["U10", "内子"],
		["U11", "五十崎"], ["U12", "喜多山"], ["U13", "新谷"], ["U14", "伊予大洲"],
		["U15", "西大洲"], ["U16", "伊予平野"], ["U17", "千丈"], ["U18", "八幡浜"],
		["U19", "双岩"], ["U20", "伊予石城"], ["U21", "上宇和"], ["U22", "卯之町"],
		["U23", "下宇和"], ["U24", "立間"], ["U25", "伊予吉田"], ["U26", "高光"],
		["U27", "北宇和島"], ["U28", "宇和島"]
	];
	const UWAJIMA2_STATIONS = [
		["U00", "松山"], ["U01", "市坪"], ["U02", "北伊予"], ["U02-1", "南伊予"],
		["U03", "伊予横田"], ["U04", "鳥ノ木"], ["U05", "伊予市"],
		["S06", "向井原"], ["S07", "高野川"], ["S08", "伊予上灘"], ["S09", "下灘"],
		["S10", "串"], ["S11", "喜多灘"], ["S12", "伊予長浜"], ["S13", "伊予出石"],
		["S14", "伊予白滝"], ["S15", "八多喜"], ["S16", "春賀"], ["S17", "五郎"],
		["S18", "伊予大洲"], ["U15", "西大洲"], ["U16", "伊予平野"],
		["U17", "千丈"], ["U18", "八幡浜"], ["U19", "双岩"], ["U20", "伊予石城"],
		["U21", "上宇和"], ["U22", "卯之町"], ["U23", "下宇和"], ["U24", "立間"],
		["U25", "伊予吉田"], ["U26", "高光"], ["U27", "北宇和島"], ["U28", "宇和島"]
	];
	const DOSAN_STATIONS = [
		["D12", "多度津"], ["D13", "金蔵寺"], ["D14", "善通寺"], ["D15", "琴平"],
		["D16", "塩入"], ["D17", "黒川"], ["D18", "讃岐財田"], ["D19", "坪尻"],
		["D20", "箸蔵"], ["D21", "佃"], ["D22", "阿波池田"], ["D23", "三縄"],
		["D24", "祖谷口"], ["D25", "阿波川口"], ["D26", "小歩危"], ["D27", "大歩危"],
		["D28", "土佐岩原"], ["D29", "豊永"], ["D30", "大田口"], ["D31", "土佐穴内"],
		["D32", "大杉"], ["D33", "土佐北川"], ["D34", "角茂谷"], ["D35", "繁藤"],
		["D36", "新改"], ["D37", "土佐山田"], ["D38", "山田西町"], ["D39", "土佐長岡"],
		["D40", "後免"], ["D41", "土佐大津"], ["D42", "布師田"], ["D43", "土佐一宮"],
		["D44", "薊野"], ["D45", "高知"]
	];
	const KUBOKAWA_STATIONS = [
		["K00", "高知"], ["K01", "入明"], ["K02", "円行寺口"], ["K03", "旭"],
		["K04", "高知商業前"], ["K05", "朝倉"], ["K06", "枝川"], ["K07", "伊野"],
		["K08", "波川"], ["K08-1", "小村神社前"], ["K09", "日下"], ["K10", "岡花"],
		["K11", "土佐加茂"], ["K12", "西佐川"], ["K13", "佐川"], ["K14", "襟野々"],
		["K15", "斗賀野"], ["K16", "吾桑"], ["K17", "多ノ郷"], ["K18", "大間"],
		["K19", "須崎"], ["K20", "土佐新荘"], ["K21", "安和"], ["K22", "土佐久礼"],
		["K23", "影野"], ["K24", "六反地"], ["K25", "仁井田"], ["K26", "窪川"]
	];
	const KOUTOKU_STATIONS = [
		["T28", "高松"], ["T27", "昭和町"], ["T26", "栗林公園北口"], ["T25", "栗林"],
		["T24", "木太町"], ["T23", "屋島"], ["T22", "古高松南"], ["T21", "八栗口"],
		["T20", "讃岐牟礼"], ["T19", "志度"], ["T18", "オレンジタウン"], ["T17", "造田"],
		["T16", "神前"], ["T15", "讃岐津田"], ["T14", "鶴羽"], ["T13", "丹生"],
		["T12", "三本松"], ["T11", "讃岐白鳥"], ["T10", "引田"], ["T09", "讃岐相生"],
		["T08", "阿波大宮"], ["T07", "板野"], ["T06", "阿波川端"], ["T05", "板東"],
		["T04", "池谷"], ["T03", "勝瑞"], ["T02", "吉成"], ["T01", "佐古"],
		["T00", "徳島"]
	];
	const TOKUSHIMA_STATIONS = [
		["T00", "徳島"], ["B01", "佐古"], ["B02", "蔵本"], ["B03", "鮎喰"],
		["B04", "府中"], ["B05", "石井"], ["B06", "下浦"], ["B07", "牛島"],
		["B08", "麻植塚"], ["B09", "鴨島"], ["B10", "西麻植"], ["B11", "阿波川島"],
		["B12", "学"], ["B13", "山瀬"], ["B14", "阿波山川"], ["B15", "川田"],
		["B16", "穴吹"], ["B17", "小島"], ["B18", "貞光"], ["B19", "阿波半田"],
		["B20", "江口"], ["B21", "三加茂"], ["B22", "阿波加茂"], ["B23", "辻"],
		["B24", "佃"], ["B25", "阿波池田"]
	];
	const NARUTO_STATIONS = [
		["N10", "鳴門"], ["N09", "撫養"], ["N08", "金比羅前"], ["N07", "教会前"],
		["N06", "立道"], ["N05", "阿波大谷"], ["N04", "池谷"], ["T03", "勝瑞"],
		["T02", "吉成"], ["T01", "佐古"], ["T00", "徳島"]
	];

	const DESTINATION_SIMPLE_NAMES = {
		"高松": "高", "松山": "松", "多度津": "多", "観音寺": "観", "伊予西条": "西",
		"今治": "今", "伊予北条": "北", "坂出": "坂", "岡山": "岡", "琴平": "琴",
		"宇和島": "宇", "高知": "高", "児島": "児", "宇多津": "宇"
	};
	const YOSAN_NON_INTERLOCKED_GROUPS = [
		{ from: "Y00", to: "Y02", stations: ["Y01"] },
		{ from: "Y03", to: "Y06", stations: ["Y04", "Y05"] },
		{ from: "Y06", to: "Y08", stations: ["Y07"] },
		{ from: "Y10", to: "Y12", stations: ["Y11"] },
		{ from: "Y14", to: "Y16", stations: ["Y15"] },
		{ from: "Y16", to: "Y18", stations: ["Y17"] },
		{ from: "Y24", to: "Y26", stations: ["Y25"] },
		{ from: "Y32", to: "Y34", stations: ["Y33"] },
		{ from: "Y34", to: "Y36", stations: ["Y35"] },
		{ from: "Y48", to: "Y50", stations: ["Y49"] },
		{ from: "Y50", to: "Y52", stations: ["Y51"] }
	];
	const UWAJIMA_NON_INTERLOCKED_GROUPS = [
		{ from: "U02", to: "U05", stations: ["U02-1", "U03", "U04"] },
		{ from: "U06", to: "U08", stations: ["U07"] },
		{ from: "U10", to: "U13", stations: ["U11", "U12"] },
		{ from: "U14", to: "U16", stations: ["U15"] },
		{ from: "U20", to: "U22", stations: ["U21"] },
		{ from: "U25", to: "U27", stations: ["U26"] }
	];
	const UWAJIMA2_NON_INTERLOCKED_GROUPS = [
		{ from: "U02", to: "U05", stations: ["U02-1", "U03", "U04"] },
		{ from: "S06", to: "S08", stations: ["S07"] },
		{ from: "S08", to: "S12", stations: ["S09", "S10", "S11"] },
		{ from: "S12", to: "S14", stations: ["S13"] },
		{ from: "S14", to: "S18", stations: ["S15", "S16", "S17"] },
		{ from: "S18", to: "U16", stations: ["U15"] },
		{ from: "U20", to: "U22", stations: ["U21"] },
		{ from: "U25", to: "U27", stations: ["U26"] }
	];
	const DOSAN_NON_INTERLOCKED_GROUPS = [
		{ from: "D16", to: "D18", stations: ["D17"] },
		{ from: "D23", to: "D25", stations: ["D24"] },
		{ from: "D30", to: "D32", stations: ["D31"] },
		{ from: "D33", to: "D35", stations: ["D34"] },
		{ from: "D37", to: "D40", stations: ["D38", "D39"] },
		{ from: "D41", to: "D43", stations: ["D42"] }
	];
	const KUBOKAWA_NON_INTERLOCKED_GROUPS = [
		{ from: "K00", to: "K03", stations: ["K01", "K02"] },
		{ from: "K03", to: "K05", stations: ["K04"] },
		{ from: "K05", to: "K07", stations: ["K06"] },
		{ from: "K07", to: "K09", stations: ["K08", "K08-1"] },
		{ from: "K09", to: "K11", stations: ["K10"] },
		{ from: "K13", to: "K15", stations: ["K14"] },
		{ from: "K17", to: "K19", stations: ["K18"] },
		{ from: "K19", to: "K22", stations: ["K20", "K21"] },
		{ from: "K23", to: "K26", stations: ["K24", "K25"] }
	];
	const KOUTOKU_NON_INTERLOCKED_GROUPS = [
		{ from: "T28", to: "T25", stations: ["T27", "T26"] },
		{ from: "T25", to: "T23", stations: ["T24"] },
		{ from: "T23", to: "T21", stations: ["T22"] },
		{ from: "T21", to: "T19", stations: ["T20"] },
		{ from: "T17", to: "T15", stations: ["T16"] },
		{ from: "T07", to: "T05", stations: ["T06"] }
	];
	const TOKUSHIMA_NON_INTERLOCKED_GROUPS = [
		{ from: "B02", to: "B04", stations: ["B03"] },
		{ from: "B05", to: "B07", stations: ["B06"] },
		{ from: "B07", to: "B09", stations: ["B08"] },
		{ from: "B09", to: "B11", stations: ["B10"] },
		{ from: "B13", to: "B15", stations: ["B14"] },
		{ from: "B18", to: "B20", stations: ["B19"] },
		{ from: "B20", to: "B22", stations: ["B21"] }
	];
	const NARUTO_NON_INTERLOCKED_GROUPS = [
		{ from: "N10", to: "N04", stations: ["N09", "N08", "N07", "N06", "N05"] }
	];
	const FORECAST_POSITIONS = {
		"293": { pos: "JSYF293", name: "鬼無予告窓①", lineId: "yosan", rosen: "73", hostStationCode: "YFT", side: "right", slot: 1 },
		"294": { pos: "JSYF294", name: "鬼無予告窓②", lineId: "yosan", rosen: "73", hostStationCode: "YFT", side: "right", slot: 2 },
		"246": { pos: "JSYF246", name: "児島予告窓①", lineId: "seto", rosen: "64", hostStationCode: "0256", side: "right", slot: 1 },
		"93": { pos: "JSYF93", name: "児島予告窓②", lineId: "seto", rosen: "64", hostStationCode: "0256", side: "right", slot: 2 },
		"45": { pos: "JSYF45", name: "多度津予告窓①", lineId: "yosan", rosen: "73", hostStationCode: "Y12", side: "left", slot: 1 },
		"303": { pos: "JSYF303", name: "多度津予告窓②", lineId: "yosan", rosen: "73", hostStationCode: "Y12", side: "left", slot: 2 },
		"185": { pos: "JSYF185", name: "北宇和島～宮野下方予告窓", lineId: "uwajima", rosen: "76", hostStationCode: "GYODO", side: "right", slot: 1,
			additionalDisplays: [{ lineId: "uwajima2", rosen: "77", hostStationCode: "GYODO", side: "right", slot: 1 }] },
		"68": { pos: "JSYF68", name: "佃予告窓①", lineId: "dosan", rosen: "78", hostStationCode: "D21", side: "right", slot: 1 },
		"69": { pos: "JSYF69", name: "佃予告窓②", lineId: "dosan", rosen: "78", hostStationCode: "D21", side: "right", slot: 2 },
		"669": { pos: "JSYF669", name: "佃予告窓①", lineId: "tokushima", rosen: "81", hostStationCode: "B24", side: "left", slot: 1 },
		"670": { pos: "JSYF670", name: "佃予告窓②", lineId: "tokushima", rosen: "81", hostStationCode: "B24", side: "left", slot: 2 },
		"176": { pos: "JSYF176", name: "後免予告窓①", lineId: "dosan", rosen: "78", hostStationCode: "GN37", side: "right", slot: 1 },
		"177": { pos: "JSYF177", name: "後免予告窓②", lineId: "dosan", rosen: "78", hostStationCode: "GN37", side: "right", slot: 2 },
		"197": { pos: "JSYF197", name: "土佐一宮予告窓①", lineId: "dosan", rosen: "78", hostStationCode: "KDEPOT", side: "right", slot: 1 },
		"198": { pos: "JSYF198", name: "土佐一宮予告窓②", lineId: "dosan", rosen: "78", hostStationCode: "KDEPOT", side: "right", slot: 2 },
		"227": { pos: "JSYF227", name: "三津浜予告窓①", lineId: "yosan", rosen: "73", hostStationCode: "Y54", side: "right", slot: 1 },
		"228": { pos: "JSYF228", name: "三津浜予告窓②", lineId: "yosan", rosen: "73", hostStationCode: "Y54", side: "right", slot: 2 },
		"34": { pos: "JSYF34", name: "北伊予予告窓①", lineId: "uwajima", rosen: "76", hostStationCode: "UDEPOT", side: "left", slot: 1,
			additionalDisplays: [{ lineId: "uwajima2", rosen: "77", hostStationCode: "UDEPOT", side: "left", slot: 1 }] },
		"35": { pos: "JSYF35", name: "北伊予予告窓②", lineId: "uwajima", rosen: "76", hostStationCode: "UDEPOT", side: "left", slot: 2,
			additionalDisplays: [{ lineId: "uwajima2", rosen: "77", hostStationCode: "UDEPOT", side: "left", slot: 2 }] }
	};
	const SHARED_LINE_DUPLICATE_PAIRS = new Set([
		"koutoku|tokushima",
		"koutoku|yosan"
	]);
	const LINE_CONFIGS = {
		yosan: {
			lineId: "yosan",
			stations: YOSAN_STATIONS,
			nonInterlockedGroups: YOSAN_NON_INTERLOCKED_GROUPS,
			positionPrefix: "JSY",
			stationPositionPrefixes: {}
		},
		seto: {
			lineId: "seto",
			matchByPosition: true,
			stations: SETO_STATIONS,
			nonInterlockedGroups: [],
			positionPrefix: "JSO",
			stationPositionPrefixes: { "0256": "JWO" }
		},
		uwajima: {
			lineId: "uwajima",
			stations: UWAJIMA_STATIONS,
			nonInterlockedGroups: UWAJIMA_NON_INTERLOCKED_GROUPS,
			positionPrefix: "JSU",
			stationPositionPrefixes: {}
		},
		uwajima2: {
			lineId: "uwajima2",
			additionalLineIds: ["uwajima"],
			stations: UWAJIMA2_STATIONS,
			nonInterlockedGroups: UWAJIMA2_NON_INTERLOCKED_GROUPS,
			positionPrefix: "JSS",
			stationPositionPrefixes: {}
		},
		dosan: {
			lineId: "dosan",
			stations: DOSAN_STATIONS,
			nonInterlockedGroups: DOSAN_NON_INTERLOCKED_GROUPS,
			positionPrefix: "JSD",
			stationPositionPrefixes: {}
		},
		kubokawa: {
			lineId: "kubokawa",
			stations: KUBOKAWA_STATIONS,
			nonInterlockedGroups: KUBOKAWA_NON_INTERLOCKED_GROUPS,
			positionPrefix: "JSK",
			stationPositionPrefixes: {}
		},
		koutoku: {
			lineId: "koutoku",
			stations: KOUTOKU_STATIONS,
			nonInterlockedGroups: KOUTOKU_NON_INTERLOCKED_GROUPS,
			positionPrefix: "JST",
			stationPositionPrefixes: {}
		},
		tokushima: {
			lineId: "tokushima",
			stations: TOKUSHIMA_STATIONS,
			nonInterlockedGroups: TOKUSHIMA_NON_INTERLOCKED_GROUPS,
			positionPrefix: "JSB",
			stationPositionPrefixes: {},
			timetableDirectionStationCodes: ["T00", "B01"]
		},
		naruto: {
			lineId: "naruto",
			additionalLineIds: ["koutoku"],
			stations: NARUTO_STATIONS,
			nonInterlockedGroups: NARUTO_NON_INTERLOCKED_GROUPS,
			positionPrefix: "JSN",
			stationPositionPrefixes: {}
		}
	};

	function normalize(liveJson, timetableJson, options) {
		const settings = options || {};
		if (typeof liveJson === "string") {
			try {
				liveJson = JSON.parse(liveJson.replace(/^\uFEFF/, ""));
			} catch (_error) {
				liveJson = [];
			}
		}
		const lineConfig = getLineConfig(settings);
		const timetableMap = buildTimetableMap(timetableJson);
		const stationContext = buildStationContext(lineConfig);
		const rows = Array.isArray(liveJson) ? liveJson : [];
		const timestampRow = rows.find(function(row) { return row && row.GetDateTime; });
		const trains = dedupeSharedLineTrains(rows.map(function(row, rowIndex) {
			return convertTrain(row, timetableMap, stationContext, settings, lineConfig, rowIndex);
		}).filter(Boolean), lineConfig);
		const time = formatTimestamp(timestampRow && timestampRow.GetDateTime);
		const result = { trains: trains };
		if (time) {
			result.time = time;
			const timestamp = parseDate(timestampRow.GetDateTime);
			if (timestamp) {
				result.sourceTimes = [{
					rosen: String(settings.senku || "73"),
					text: time.ja,
					timestamp: timestamp.getTime()
				}];
			}
		}
		return result;
	}

	function dedupeSharedLineTrains(trains, lineConfig) {
		const result = [];
		const byTrainNumber = new Map();
		trains.forEach(function(train) {
			if (!train || !train.cbango || train.jrShikoku.isForecastWindow) {
				result.push(train);
				return;
			}
			const previousIndex = byTrainNumber.get(train.cbango);
			if (previousIndex === undefined) {
				byTrainNumber.set(train.cbango, result.length);
				result.push(train);
				return;
			}
			const previous = result[previousIndex];
			const sharedPair = [previous.jrShikoku.sourceLine, train.jrShikoku.sourceLine].sort().join("|");
			if (!SHARED_LINE_DUPLICATE_PAIRS.has(sharedPair)) {
				result.push(train);
				return;
			}
			const equivalentPosition = previous.jrShikoku.positionNumber === train.jrShikoku.positionNumber ||
				previous.jrShikoku.renderPosition === train.jrShikoku.renderPosition;
			if (!equivalentPosition) {
				result.push(train);
				return;
			}
			const preferredLines = [lineConfig && lineConfig.lineId]
				.concat((lineConfig && lineConfig.additionalLineIds) || [])
				.filter(Boolean);
			if (preferredLines.indexOf(train.jrShikoku.sourceLine) >= 0 && preferredLines.indexOf(previous.jrShikoku.sourceLine) < 0) {
				result[previousIndex] = train;
			}
		});
		return result;
	}

	function getLineConfig(settings) {
		const lineId = toText(settings && settings.lineId) || "yosan";
		return LINE_CONFIGS[lineId] || LINE_CONFIGS.yosan;
	}

	function buildStationContext(lineConfig) {
		const config = lineConfig || LINE_CONFIGS.yosan;
		const byName = new Map();
		const byCode = new Map();
		config.stations.forEach(function(station, index) {
			const row = { code: station[0], name: station[1], index: index };
			byName.set(station[1], row);
			byCode.set(station[0], row);
		});
		const groups = config.nonInterlockedGroups.map(function(group) {
			return {
				from: byCode.get(group.from),
				to: byCode.get(group.to),
				stations: group.stations.map(function(code) { return byCode.get(code); }).filter(Boolean)
			};
		});
		return {
			stations: config.stations,
			byName: byName,
			byCode: byCode,
			groups: groups,
			positionPrefix: config.positionPrefix,
			stationPositionPrefixes: config.stationPositionPrefixes
		};
	}

	function buildPositionMapKey(line, posNum) {
		const sourceLine = toText(line);
		const positionNumber = toText(posNum);
		if (!sourceLine || !positionNumber) return "";
		return sourceLine + ":" + positionNumber;
	}

	function getPositionRecord(line, posNum) {
		const key = buildPositionMapKey(line, posNum);
		if (!key || !positionMap || !positionMap.records) return null;
		return positionMap.records[key] || null;
	}

	function buildSourcePositionKey(line, posNum) {
		const sourceLine = toText(line).replace(/[^A-Za-z0-9_-]/g, "_");
		const positionNumber = toText(posNum).replace(/[^A-Za-z0-9_-]/g, "_");
		if (!sourceLine || !positionNumber) return "";
		return "JSP_" + sourceLine + "_" + positionNumber;
	}

	function getPositionProjection(record, senku, direction) {
		if (!record || !record.projections) return null;
		const projection = record.projections[String(senku || "")];
		if (!projection) return null;
		const renderPosition = projection[direction] || projection.U || projection.D;
		if (!renderPosition) return null;
		return {
			renderPosition: renderPosition,
			name: toText(projection.name) || toText(record.name),
			kind: toText(projection.kind)
		};
	}

	function convertTrain(row, timetableMap, context, settings, lineConfig, rowIndex) {
		if (!row || row.GetDateTime) return null;
		const trainNumber = toText(row.TrainNum);
		const timetable = timetableMap.get(trainNumber) || [];
		const positionRecord = getPositionRecord(row.Line, row.PosNum);
		if (!positionRecord) return null;
		const direction = resolveDirection(row.Direction, positionRecord.name, context, lineConfig, timetable);
		const projection = getPositionProjection(positionRecord, settings.senku, direction);
		if (!projection) return null;
		const sourcePositionKey = buildSourcePositionKey(positionRecord.line, positionRecord.posNum);
		if (!sourcePositionKey) return null;
		const type = mapShikokuTrainType(trainNumber, row.Type);
		const destination = timetable.length > 0 ? timetable[timetable.length - 1].stationName : "行先取得不可";
		return {
			cbango: trainNumber || buildFreightTrainId(row, rowIndex),
			displayTrainNumber: trainNumber,
			type: type.type,
			typeLabel: type.label,
			pos: sourcePositionKey,
			posName: projection.name,
			chien: parseDelay(row.delay),
			shuEkiSimple: getDestinationSimpleName(destination),
			shuEkiName: destination,
			shuEkiKey: "",
			status: "1",
			statusDetail: "",
			senku: String(settings.senku || "73"),
			ryosu: "",
			yokuStatus: 0,
			yokuDetail: "",
			runStatus: "1",
			name: type.name,
			source: "jrshikoku",
			sourceRosen: String(settings.senku || "73"),
			jrShikoku: {
				timetable: timetable,
				typeSimple: type.simple,
				renderPosition: projection.renderPosition,
				sourcePositionKey: sourcePositionKey,
				sourceLine: positionRecord.line,
				rawPosition: toText(row.Pos),
				positionNumber: positionRecord.posNum,
				rawDirection: Number(row.Direction) === 0 ? 0 : 1,
				positionKind: projection.kind,
				isForecastWindow: projection.kind === "forecast"
			}
		};
	}

	function resolveDirection(rawDirection, positionName, context, lineConfig, timetable) {
		const sourceDirection = Number(rawDirection) === 0 ? "U" : "D";
		const timetableCodes = Array.isArray(lineConfig && lineConfig.timetableDirectionStationCodes)
			? lineConfig.timetableDirectionStationCodes
			: [];
		if (timetableCodes.length === 0) return sourceDirection;
		const station = context.byName.get(normalizePositionText(positionName));
		if (!station || timetableCodes.indexOf(station.code) < 0) return sourceDirection;
		const fallbackDirection = sourceDirection === "U" ? "D" : "U";
		if (!Array.isArray(timetable) || timetable.length === 0) return fallbackDirection;
		const timetableIndex = timetable.findIndex(function(row) { return row.stationName === station.name; });
		if (timetableIndex < 0) return fallbackDirection;
		for (let index = timetableIndex + 1; index < timetable.length; index += 1) {
			const next = context.byName.get(timetable[index].stationName);
			if (next && next.index !== station.index) return next.index > station.index ? "D" : "U";
		}
		for (let index = timetableIndex - 1; index >= 0; index -= 1) {
			const previous = context.byName.get(timetable[index].stationName);
			if (previous && previous.index !== station.index) return station.index > previous.index ? "D" : "U";
		}
		return fallbackDirection;
	}

	function normalizePositionText(value) {
		return toText(value).replace(/[（(](?:上り|下り)[）)]/g, "").replace(/\s+/g, "").trim();
	}

	function mapTrainType(rawType) {
		const text = toText(rawType).replace(/\r/g, "");
		const separator = text.indexOf(":");
		const code = (separator >= 0 ? text.slice(0, separator) : text).toLowerCase();
		const name = separator >= 0 ? normalizeJapaneseNumber(text.slice(separator + 1)) : "";
		if (code === "express" || code === "limitedexpress" || code === "limited_express" || code === "ltd") {
			return { type: "1", label: "特急", simple: "特", name: name };
		}
		if (code === "rapid") {
			return { type: "8", label: "快速", simple: "快", name: name };
		}
		if (code === "special" || code === "specialtrain") {
			return { type: "7", label: "臨時", simple: "臨", name: name };
		}
		return { type: "3", label: "普通", simple: "普", name: name };
	}

	function mapShikokuTrainType(trainNumber, rawType) {
		const normalizedNumber = toText(trainNumber).toUpperCase();
		if (!normalizedNumber || /^\d+$/.test(normalizedNumber)) {
			return { type: "3", label: "貨物", simple: "貨", name: "" };
		}
		const suffix = normalizedNumber.slice(-1);
		if (["A", "B", "R", "E"].indexOf(suffix) >= 0) {
			return { type: "3", label: "回送", simple: "回", name: "" };
		}
		if (suffix === "H") {
			return { type: "3", label: "試運転", simple: "試", name: "" };
		}
		if (suffix === "T") {
			return { type: "3", label: "単機", simple: "単", name: "" };
		}
		return mapTrainType(rawType);
	}

	function buildFreightTrainId(row, rowIndex) {
		const parts = [
			toText(row && row.Line) || "line",
			toText(row && row.Index) || String(rowIndex || 0),
			toText(row && row.Direction) || "0"
		];
		return "JRSHIKOKU-FREIGHT-" + parts.join("-");
	}

	function buildTimetableMap(rawJson) {
		let rows = rawJson;
		if (typeof rows === "string") {
			try {
				rows = JSON.parse(rows.replace(/^\uFEFF/, ""));
			} catch (_error) {
				rows = [];
			}
		}
		const map = new Map();
		(Array.isArray(rows) ? rows : []).forEach(function(entry) {
			if (!entry || typeof entry !== "object") return;
			Object.keys(entry).forEach(function(trainNumber) {
				map.set(String(trainNumber).trim(), parseTimetable(entry[trainNumber]));
			});
		});
		return map;
	}

	function parseTimetable(value) {
		const stationRows = [];
		const stationMap = new Map();
		toText(value).split("#").forEach(function(item) {
			const columns = item.split(",").map(function(column) { return column.trim(); });
			const stationName = columns[0] || "";
			const kind = columns[1] || "";
			const time = normalizeTime(columns[2] || "");
			if (!stationName || !time) return;
			let row = stationMap.get(stationName);
			if (!row) {
				row = { stationName: stationName, planArrival: "", planDeparture: "" };
				stationMap.set(stationName, row);
				stationRows.push(row);
			}
			if (kind.indexOf("着") >= 0) row.planArrival = time;
			if (kind.indexOf("発") >= 0 || kind.indexOf("通") >= 0) row.planDeparture = time;
			if (!row.planArrival && !row.planDeparture) row.planDeparture = time;
		});
		return stationRows;
	}

	function parseDelay(value) {
		const match = toText(value).match(/-?\d+/);
		return match ? Math.max(0, Number(match[0])) : 0;
	}

	function getDestinationSimpleName(name) {
		const normalized = toText(name).replace(/\s+/g, "");
		if (!normalized || normalized === "行先取得不可") return "？";
		return DESTINATION_SIMPLE_NAMES[normalized] || Array.from(normalized)[0] || "？";
	}

	function normalizeJapaneseNumber(value) {
		return toText(value).replace(/[０-９]/g, function(character) {
			return String.fromCharCode(character.charCodeAt(0) - 0xFEE0);
		});
	}

	function normalizeTime(value) {
		const match = toText(value).match(/(\d{1,2}):(\d{2})/);
		return match ? String(match[1]).padStart(2, "0") + ":" + match[2] : "";
	}

	function formatTimestamp(value) {
		const date = parseDate(value);
		if (!date) return null;
		const text = date.getFullYear() + "年" + (date.getMonth() + 1) + "月" + date.getDate() + "日" +
			date.getHours() + "時" + String(date.getMinutes()).padStart(2, "0") + "分" +
			String(date.getSeconds()).padStart(2, "0") + "秒現在";
		return { ja: text, en: text, tc: text, sc: text, kr: text };
	}

	function parseDate(value) {
		const text = toText(value);
		if (!text) return null;
		const match = text.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2}):(\d{2})/);
		if (!match) return null;
		const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]), Number(match[6]));
		return Number.isNaN(date.getTime()) ? null : date;
	}

	function toText(value) {
		if (value === null || value === undefined) return "";
		return String(value).trim();
	}

	return {
		normalize: normalize,
		getPositionRecord: getPositionRecord,
		getPositionProjection: getPositionProjection,
		buildSourcePositionKey: buildSourcePositionKey,
		mapTrainType: mapTrainType,
		mapShikokuTrainType: mapShikokuTrainType,
		buildTimetableMap: buildTimetableMap,
		stations: YOSAN_STATIONS,
		lineConfigs: LINE_CONFIGS,
		forecastPositions: Object.keys(FORECAST_POSITIONS).reduce(function(rows, key) {
			const baseDefinition = FORECAST_POSITIONS[key];
			rows.push(Object.assign({ positionNumber: key }, baseDefinition));
			(baseDefinition.additionalDisplays || []).forEach(function(displayDefinition) {
				rows.push(Object.assign({
					positionNumber: key,
					pos: baseDefinition.pos,
					name: baseDefinition.name
				}, displayDefinition));
			});
			return rows;
		}, [])
	};
}));
