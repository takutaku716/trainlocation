const MODERN_ROSEN = "53";
const MODERN_ROUTE_LAYOUT_PATH = "./rosen/rosen_53.html";
const MODERN_LINE_MIN_HEIGHT = 2200;
const MODERN_LOCATION_JSON_SOURCE_MAP = {
	"51": ["01", "05"],
	"52": ["02", "07", "09"],
	"53": ["02", "13"]
};
const MODERN_FALLBACK_STATIONS = [
	{ name: "南千歳", key: "R1P118" },
	{ name: "追分", key: "R2P6" },
	{ name: "新夕張", key: "R2P53" },
	{ name: "占冠", key: "R7P19" },
	{ name: "トマム", key: "R7P21" },
	{ name: "新得", key: "R7P29" },
	{ name: "帯広", key: "R7P39" },
	{ name: "池田", key: "R7P51" },
	{ name: "浦幌", key: "R7P57" },
	{ name: "白糠", key: "R7P69" },
	{ name: "釧路", key: "R7P79" }
];

let modernRouteLayout = create_modern_fallback_layout();

$(function() {
	$("#modernRefreshButton").on("click", load_modern_location_53);
	$("#modernBackLink").attr("href", build_page_url("./location.html", "rosen=53"));
	initialize_modern_location_53();
});

function initialize_modern_location_53() {
	load_modern_route_layout().always(() => {
		render_modern_stations();
		load_modern_location_53();
	});
}

function load_modern_route_layout() {
	return $.get(MODERN_ROUTE_LAYOUT_PATH)
		.done((html) => {
			modernRouteLayout = build_modern_route_layout(html) || create_modern_fallback_layout();
		})
		.fail(() => {
			modernRouteLayout = create_modern_fallback_layout();
		});
}

function build_modern_route_layout(html) {
	const root = $("<div>").append($.parseHTML(html, document, false));
	const points = [];
	const pointSet = new Set();
	const stations = [];

	root.find(".eki-panel").each(function() {
		const panel = $(this);
		const panelKeys = collect_modern_position_keys(panel);
		const isStation = panel.hasClass("eki");
		const stationName = isStation ? extract_modern_station_name(panel) : "";
		panelKeys.forEach((key) => {
			if (pointSet.has(key)) return;
			pointSet.add(key);
			points.push({
				key: key,
				isStation: isStation,
				name: stationName
			});
		});

		if (!isStation) return;
		if (!stationName || panelKeys.length < 1) return;
		stations.push({
			name: stationName,
			key: panelKeys[0]
		});
	});

	if (points.length < 2 || stations.length < 2) return null;
	return normalize_modern_route_layout(points, stations);
}

function collect_modern_position_keys(panel) {
	const keys = [];
	const keySet = new Set();

	panel.find(".ressha-icon").each(function() {
		String($(this).attr("class") || "")
			.split(/\s+/)
			.forEach((className) => {
				const match = className.match(/^(R\d+P\d+)[UD]$/);
				if (!match || keySet.has(match[1])) return;
				keySet.add(match[1]);
				keys.push(match[1]);
			});
	});

	return keys;
}

function extract_modern_station_name(panel) {
	const contents = panel.find(".stalist-eki-contents").first().clone();
	contents.find(".eki-icon").remove();
	const name = contents.text().replace(/\s+/g, "").trim();
	if (name) return name;
	return panel.find("[key]").first().text().replace(/\s+/g, "").trim();
}

function create_modern_fallback_layout() {
	const points = MODERN_FALLBACK_STATIONS.map((station) => ({
		key: station.key,
		isStation: true,
		name: station.name
	}));
	const stations = MODERN_FALLBACK_STATIONS.map((station) => ({
		name: station.name,
		key: station.key
	}));
	return normalize_modern_route_layout(points, stations);
}

function normalize_modern_route_layout(points, stations) {
	const positionIndexMap = new Map();
	points.forEach((point, index) => {
		point.index = index;
		positionIndexMap.set(point.key, index);
	});

	const normalizedStations = stations
		.map((station) => ({
			name: station.name,
			key: station.key,
			index: positionIndexMap.get(station.key)
		}))
		.filter((station) => Number.isInteger(station.index));

	return {
		points: points,
		stations: normalizedStations,
		positionIndexMap: positionIndexMap
	};
}

function render_modern_stations() {
	const list = $("#modernStationList");
	list.empty();
	update_modern_line_height();

	render_modern_sections(list);

	modernRouteLayout.stations.forEach((station) => {
		const top = station_top_percent(station);
		const stationElement = $("<div>", {
			class: "modern-station",
			css: { top: top + "%" }
		});
		stationElement.append($("<span>", { class: "modern-station-name", text: station.name }));
		stationElement.append($("<span>", { class: "modern-station-dot", "aria-hidden": "true" }));
		list.append(stationElement);
	});
}

function render_modern_sections(list) {
	const height = modern_section_height_percent();

	modernRouteLayout.points.forEach((point) => {
		const sectionElement = $("<div>", {
			class: "modern-section " + (point.isStation ? "station-section" : "between-section"),
			css: {
				top: position_index_to_percent(point.index) + "%",
				height: height + "%"
			}
		});
		list.append(sectionElement);
	});
}

function load_modern_location_53() {
	const now = Date.now() >>> 10;
	$("#modernTimestamp").text("読み込み中...");

	load_modern_now_data(MODERN_ROSEN, now)
		.then((data) => {
			const trains = Array.isArray(data.trains) ? data.trains : [];
			render_modern_trains(trains);
			update_modern_timestamp();
		})
		.catch(() => {
			$("#modernTrainLayer").html($("<div>", {
				class: "modern-error",
				text: "データを取得できませんでした。"
			}));
			update_modern_timestamp("取得失敗");
		});
}

function load_modern_now_data(rosen, now) {
	const sources = get_modern_location_sources(rosen);
	return Promise.all(
		sources.map((sourceRosen) => jqxhr_to_modern_promise(get_location_now_request(sourceRosen, now)).catch(() => null))
	).then((nowDataList) => {
		const successDataList = nowDataList.filter((nowData) => nowData && Array.isArray(nowData.trains));
		if (successDataList.length < 1) throw new Error("location now json load failed");
		return merge_modern_now_data(successDataList);
	});
}

function get_modern_location_sources(rosen) {
	const sourceList = MODERN_LOCATION_JSON_SOURCE_MAP[String(rosen)];
	if (!Array.isArray(sourceList) || sourceList.length < 1) return [String(rosen)];
	return [...new Set(sourceList.map(String).filter(Boolean))];
}

function jqxhr_to_modern_promise(jqxhr) {
	return new Promise((resolve, reject) => {
		jqxhr.done((data) => resolve(data)).fail((error) => reject(error));
	});
}

function merge_modern_now_data(nowDataList) {
	const seenCbangoMap = new Map();
	const mergedTrains = [];

	nowDataList.forEach((nowData) => {
		nowData.trains.forEach((train) => {
			if (!train || !train.cbango) {
				mergedTrains.push(train);
				return;
			}
			const cbango = String(train.cbango);
			if (seenCbangoMap.has(cbango)) return;
			seenCbangoMap.set(cbango, true);
			mergedTrains.push(train);
		});
	});

	return { trains: mergedTrains };
}

function render_modern_trains(trains) {
	const layer = $("#modernTrainLayer");
	layer.empty();

	if (trains.length < 1) {
		layer.append($("<div>", {
			class: "modern-empty",
			text: "現在表示できる列車はありません。"
		}));
		return;
	}

	trains
		.slice()
		.sort((a, b) => train_top_percent(a) - train_top_percent(b))
		.forEach((train) => {
			layer.append(create_modern_train_card(train));
		});
}

function create_modern_train_card(train) {
	const direction = is_up_train(train) ? "up" : "down";
	const typeClass = get_modern_type_class(train.type);
	const card = $("<article>", {
		class: "modern-train-card " + direction + " " + typeClass,
		css: { top: train_top_percent(train) + "%" }
	});

	if (Number(train.chien || 0) > 0) {
		card.append($("<div>", {
			class: "modern-delay",
			text: get_modern_delay_text(train.chien)
		}));
	}

	const trainMark = create_modern_train_mark(train);
	const trainNumber = $("<div>", {
		class: "modern-train-no",
		text: train.cbango || ""
	});
	const destinationText = get_modern_destination_text(train);
	const bandTitle = get_modern_type_text(train.type) + " " + destinationText + " 行き";
	const trainBand = $("<div>", {
		class: "modern-train-band",
		title: bandTitle
	}).append($("<div>", {
		class: "modern-train-main"
	}).append($("<span>", {
		class: "modern-train-type",
		text: get_modern_type_text(train.type)
	})).append($("<span>", {
		class: "modern-train-separator",
		text: "・"
	})).append($("<span>", {
		class: "modern-train-dest",
		text: destinationText
	}))).append($("<div>", {
		class: "modern-train-cars",
		text: get_modern_ryosu_text(train.ryosu)
	}));

	if (direction === "up") {
		card.append(trainMark);
		card.append(trainNumber);
		card.append(trainBand);
	} else {
		card.append(trainBand);
		card.append(trainNumber);
		card.append(trainMark);
	}
	card.append($("<div>", {
		class: "modern-train-pos",
		text: get_modern_position_text(train.pos)
	}));

	card.on("click", () => {
		if (!train.cbango) return;
		location.href = build_page_url("./location.html", "rosen=53&cbango=" + encodeURIComponent(train.cbango));
	});

	return card;
}

function create_modern_train_mark(train) {
	const trainMark = $("<div>", {
		class: "modern-train-mark",
		"aria-hidden": "true"
	});
	trainMark.append($("<img>", {
		class: "modern-train-icon",
		src: get_modern_train_icon_src(train.type),
		alt: ""
	}));
	return trainMark;
}

function update_modern_line_height() {
	const stationCount = modernRouteLayout.stations.length;
	const pointCount = modernRouteLayout.points.length;
	const height = Math.max(
		MODERN_LINE_MIN_HEIGHT,
		220 + stationCount * 220,
		220 + pointCount * 180
	);
	$(".modern-line").css("min-height", height + "px");
}

function modern_section_height_percent() {
	const maxIndex = Math.max(1, modernRouteLayout.points.length - 1);
	return (92 / maxIndex) * 0.94;
}

function station_top_percent(station) {
	return position_index_to_percent(station.index);
}

function train_top_percent(train) {
	return position_index_to_percent(get_modern_position_index(train.pos));
}

function position_index_to_percent(index) {
	const maxIndex = Math.max(1, modernRouteLayout.points.length - 1);
	const safeIndex = Math.max(0, Math.min(maxIndex, Number(index) || 0));
	return 4 + (safeIndex / maxIndex) * 92;
}

function get_modern_position_index(pos) {
	const key = get_modern_position_key(pos);
	if (key && modernRouteLayout.positionIndexMap.has(key)) {
		return modernRouteLayout.positionIndexMap.get(key);
	}

	const posNo = get_modern_pos_no(pos);
	if (!Number.isFinite(posNo)) return Math.floor((modernRouteLayout.points.length - 1) / 2);
	const fallbackIndex = modernRouteLayout.points.findIndex((point) => get_modern_pos_no(point.key) === posNo);
	return fallbackIndex >= 0 ? fallbackIndex : Math.floor((modernRouteLayout.points.length - 1) / 2);
}

function get_modern_position_key(pos) {
	const match = String(pos || "").match(/(R\d+P\d+)[UD]?/);
	return match ? match[1] : "";
}

function get_modern_pos_no(pos) {
	const match = String(pos || "").match(/P(\d+)/);
	if (!match) return NaN;
	return Number(match[1]);
}

function is_up_train(train) {
	const pos = String(train.pos || "");
	if (pos.endsWith("U")) return true;
	if (pos.endsWith("D")) return false;
	const number = Number(String(train.cbango || "").match(/\d+/)?.[0] || 1);
	return number % 2 === 0;
}

function get_modern_type_text(type) {
	const typeMap = {
		"1": "特急",
		"2": "快速",
		"3": "普通",
		"4": "新幹線",
		"5": "区快",
		"6": "臨時",
		"7": "区快",
		"8": "快速"
	};
	return typeMap[String(type)] || "列車";
}

function get_modern_type_class(type) {
	if (String(type) === "1") return "type-limited";
	if (String(type) === "2" || String(type) === "5" || String(type) === "7" || String(type) === "8") return "type-rapid";
	if (String(type) === "3") return "type-local";
	return "";
}

function get_modern_train_icon_src(type) {
	const iconMap = {
		"1": "./images/home/train_icon_red.svg",
		"2": "./images/home/train_icon_orange.svg",
		"3": "./images/home/train_icon.svg",
		"4": "./images/home/train_icon_green.svg",
		"5": "./images/home/train_icon_orange.svg",
		"6": "./images/home/train_icon_blue.svg",
		"7": "./images/home/train_icon_green.svg",
		"8": "./images/home/train_icon_orange.svg"
	};
	return iconMap[String(type)] || "./images/home/train_icon.svg";
}

function get_modern_ryosu_text(ryosu) {
	const value = String(ryosu || "").trim();
	return value ? value + "両" : "";
}

function get_modern_destination_text(train) {
	const simple = String(train.shuEkiSimple || "").trim();
	const destinationMap = {
		"札": "札幌",
		"札幌": "札幌",
		"Sapporo": "札幌",
		"釧": "釧路",
		"釧路": "釧路",
		"Kushiro": "釧路",
		"帯": "帯広",
		"帯広": "帯広",
		"Obihiro": "帯広",
		"新": "新得",
		"新得": "新得",
		"Shintoku": "新得",
		"南": "南千",
		"南千歳": "南千",
		"Minami-Chitose": "南千",
		"千": "千歳",
		"千歳": "千歳",
		"池": "池田",
		"池田": "池田",
		"Ikeda": "池田",
		"浦": "浦幌",
		"浦幌": "浦幌",
		"Urahoro": "浦幌",
		"白": "白糠",
		"白糠": "白糠",
		"Shiranuka": "白糠",
		"旭": "旭川",
		"旭川": "旭川",
		"Asahikawa": "旭川",
		"函": "函館",
		"函館": "函館",
		"Hakodate": "函館",
		"小": "小樽",
		"小樽": "小樽",
		"Otaru": "小樽",
		"手": "手稲",
		"手稲": "手稲",
		"Teine": "手稲",
		"岩": "岩見",
		"岩見沢": "岩見",
		"Iwamizawa": "岩見",
		"苫": "苫小",
		"苫小牧": "苫小",
		"Tomakomai": "苫小",
		"室": "室蘭",
		"室蘭": "室蘭",
		"Muroran": "室蘭",
		"東": "東室",
		"東室蘭": "東室",
		"Higashi-Muroran": "東室",
		"長": "長万",
		"長万部": "長万",
		"Oshamambe": "長万",
		"倶": "倶知",
		"倶知安": "倶知",
		"Kutchan": "倶知",
		"追": "追分",
		"追分": "追分",
		"Oiwake": "追分",
		"夕": "夕張",
		"夕張": "夕張",
		"Yubari": "夕張",
		"空": "空港",
		"新千歳空港": "空港",
		"New-Chitose-Airport": "空港",
		"新夕張": "新夕",
		"ト": "トマ",
		"トマム": "トマ",
		"Tomamu": "トマ",
		"占": "占冠",
		"占冠": "占冠",
		"Shimukappu": "占冠"
	};
	if (destinationMap[simple]) return destinationMap[simple];
	const stationText = get_modern_destination_from_station_name(simple);
	if (stationText) return stationText;
	const chars = Array.from(simple);
	if (chars.length >= 2) return chars.slice(0, 2).join("");
	return simple || "不明";
}

function get_modern_destination_from_station_name(simple) {
	if (!simple) return "";
	const stations = modernRouteLayout && Array.isArray(modernRouteLayout.stations) ? modernRouteLayout.stations : [];
	const matchedStation = stations.find((station) => {
		const name = String(station.name || "");
		return name && name.startsWith(simple);
	});
	if (!matchedStation) return "";
	return Array.from(matchedStation.name).slice(0, 2).join("");
}

function get_modern_delay_text(delay) {
	const value = Number(delay || 0);
	if (value >= 999) return "大幅遅れ";
	return "+" + value + "分";
}

function get_modern_position_text(pos) {
	const index = get_modern_position_index(pos);
	const stations = modernRouteLayout.stations;
	const previous = stations.slice().reverse().find((station) => station.index <= index);
	const next = stations.find((station) => station.index > index);

	if (previous && previous.index === index) return previous.name + " 付近";
	if (previous && next) return previous.name + "〜" + next.name;
	if (previous) return previous.name + " 付近";
	if (next) return next.name + " 付近";
	return "位置情報なし";
}

function update_modern_timestamp(extraText) {
	const now = new Date();
	const text =
		now.getFullYear() + "年" +
		(now.getMonth() + 1).toString().padStart(2, "0") + "月" +
		now.getDate().toString().padStart(2, "0") + "日 " +
		now.getHours().toString().padStart(2, "0") + ":" +
		now.getMinutes().toString().padStart(2, "0") + ":" +
		now.getSeconds().toString().padStart(2, "0") + " 現在";
	$("#modernTimestamp").text(extraText ? text + " / " + extraText : text);
}
