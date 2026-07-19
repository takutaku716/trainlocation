(function() {
	"use strict";

	const stationRows = [
		"札幌|01", "苗穂|H02", "白石|H03", "平和|H04", "新札幌|H05", "上野幌|H06",
		"西の里信号場|", "北広島|H07", "島松|H08", "恵み野|H09", "恵庭|H10", "サッポロビール庭園|H11",
		"長都|H12", "千歳|H13", "南千歳|H14", "新千歳空港|AP15", "駒里信号場|", "西早来信号場|",
		"追分|K15", "東追分信号場|", "川端|K17", "滝ノ下信号場|", "滝ノ上信号場|", "十三里信号場|",
		"新夕張|K20", "楓信号場|", "オサワ信号場|", "東オサワ信号場|", "清風山信号場|", "占冠|K21",
		"東占冠信号場|", "滝ノ沢信号場|", "ホロカ信号場|", "トマム|K22", "串内信号場|", "上落合信号場|",
		"新狩勝信号場|", "広内信号場|", "西新得信号場|", "新得|K23", "十勝清水|K24", "平野川信号場|",
		"御影|K26", "上芽室信号場|", "芽室|K27", "大成|K28", "西帯広|K29", "帯広貨物|",
		"柏林台|K30", "帯広|K31", "札内|K32", "幕別|K34", "利別|K35", "池田|K36",
		"昭栄信号場|", "十弗|K37", "豊頃|K38", "新吉野|K39", "浦幌|K40", "常豊信号場|",
		"上厚内信号場|", "厚内|K42", "直別信号場|", "尺別信号場|", "音別|K45", "古瀬信号場|",
		"白糠|K47", "西庶路|K48", "庶路|K49", "東庶路信号場|", "大楽毛|K50", "新大楽毛|K51",
		"新富士|K52", "(旧)釧路操車場|", "釧路|K53"
	];

	const stations = stationRows.map(function(row, index) {
		const parts = row.split("|");
		return { name: parts[0], code: parts[1], top: index * 224 };
	});

	const proxyBase = "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=";
	const typeFallback = {
		0: "特別快速", 1: "特急", 2: "快速", 3: "普通", 4: "北海道新幹線",
		5: "特別快速", 6: "ライナー", 7: "臨時", 8: "快速", 9: "区間快速"
	};
	const destinationFallback = {
		"札": "札幌", "釧": "釧路", "帯": "帯広", "空": "新千歳空港",
		"小": "小樽", "岩": "岩見沢", "北": "北広島", "千": "千歳", "苫": "苫小牧"
	};

	let trains = [];
	let livePositionMap = new Map();
	let routeStationKeyMap = new Map();
	let metadataPromise;

	let titleTimer;
	let displayMode = 0;

	document.addEventListener("DOMContentLoaded", function() {
		setRouteHeight();
		renderSections();
		renderStations();
		updateCurrentTime();
		bindInteractions();
		refreshLiveTrains();
	});

	function setRouteHeight() {
		const line = document.querySelector(".modern-line");
		line.style.height = ((stations.length * 224) - 112) + "px";
	}

	function bindInteractions() {
		const header = document.getElementById("modernHeader");
		const guideButton = document.getElementById("modernGuideButton");
		const guide = document.getElementById("modernGuide");
		const guideClose = document.getElementById("modernGuideClose");
		const displayModeButton = document.getElementById("modernDisplayModeButton");
		const refreshButton = document.getElementById("modernRefreshButton");
		const details = document.getElementById("modernTrainDetails");
		const detailsClose = document.getElementById("modernTrainDetailsClose");

		header.addEventListener("click", function() {
			header.classList.add("is-title-visible");
			window.clearTimeout(titleTimer);
			titleTimer = window.setTimeout(function() {
				header.classList.remove("is-title-visible");
			}, 1700);
		});

		guideButton.addEventListener("click", function(event) {
			event.stopPropagation();
			window.clearTimeout(titleTimer);
			guide.classList.add("is-open");
			guide.setAttribute("aria-hidden", "false");
			document.body.classList.add("is-guide-open");
		});

		guideClose.addEventListener("click", function() {
			guide.classList.remove("is-open");
			guide.setAttribute("aria-hidden", "true");
			document.body.classList.remove("is-guide-open");
			header.classList.remove("is-title-visible");
		});

		displayModeButton.addEventListener("click", function() {
			displayMode = (displayMode + 1) % 3;
			document.body.classList.toggle("train-mode-compact", displayMode === 1);
			document.body.classList.toggle("train-mode-minimal", displayMode === 2);
			displayModeButton.setAttribute("aria-label", displayMode === 0 ? "列車アイコンを簡略表示にする" : displayMode === 1 ? "列車アイコンを最小表示にする" : "列車アイコンを詳細表示にする");
		});

		detailsClose.addEventListener("click", closeTrainDetails);
		details.addEventListener("click", function(event) {
			if (event.target === details) closeTrainDetails();
		});

		refreshButton.addEventListener("click", function() {
			if (refreshButton.disabled) return;
			refreshLiveTrains();
		});
	}

	async function refreshLiveTrains() {
		const refreshButton = document.getElementById("modernRefreshButton");
		const loading = document.getElementById("modernLoading");
		const status = document.getElementById("modernDataStatus");
		refreshButton.disabled = true;
		refreshButton.classList.add("is-spinning");
		loading.classList.add("is-visible");
		loading.setAttribute("aria-hidden", "false");
		status.classList.remove("is-neutral");
		status.hidden = true;

		try {
			const metadata = await loadLiveMetadata();
			const nowData = await loadLocationSources();
			trains = convertLiveTrains(nowData.trains, metadata);
			renderTrains();
			setDataTimestamp(nowData.time);

			if (trains.length === 0) {
				status.textContent = "現在、53路線内に表示できる列車はありません";
				status.classList.add("is-neutral");
				status.hidden = false;
			}
		} catch (error) {
			trains = [];
			renderTrains();
			status.textContent = "在線情報を取得できません。更新ボタンでもう一度お試しください";
			status.classList.remove("is-neutral");
			status.hidden = false;
			console.error("Modern location data load failed", error);
		} finally {
			refreshButton.disabled = false;
			refreshButton.classList.remove("is-spinning");
			loading.classList.remove("is-visible");
			loading.setAttribute("aria-hidden", "true");
		}
	}

	function loadLiveMetadata() {
		if (metadataPromise) return metadataPromise;

		metadataPromise = Promise.all([
			fetchText("./rosen/rosen_53.html"),
			fetchJson(proxyBase + "https://www3.jrhokkaido.co.jp/webunkou/json/master/ressha_type_master.json").catch(function() { return []; }),
			fetchJson(proxyBase + "https://www3.jrhokkaido.co.jp/webunkou/json/master/eki_master.json").catch(function() { return []; }),
			fetchJson("./original/location_master.json").catch(function() { return {}; })
		]).then(function(results) {
			buildPositionMap(results[0]);
			return {
				types: Array.isArray(results[1]) ? results[1] : [],
				stations: Array.isArray(results[2]) ? results[2] : [],
				positions: results[3] || {}
			};
		});

		return metadataPromise;
	}

	async function loadLocationSources() {
		const cache = Date.now() >>> 10;
		const isTest = new URLSearchParams(window.location.search).get("test") === "1";
		const urls = isTest
			? ["./testdata/location/location_02_now.json?" + cache, "./testdata/location/location_13_now.json?" + cache]
			: [
				proxyBase + "https://www3.jrhokkaido.co.jp/trainlocation/json/location/now/location_02_now.json?" + cache,
				proxyBase + "https://www3.jrhokkaido.co.jp/trainlocation/json/location/now/location_13_now.json?" + cache
			];
		const results = await Promise.allSettled(urls.map(fetchJson));
		const successful = results
			.filter(function(result) { return result.status === "fulfilled" && result.value && Array.isArray(result.value.trains); })
			.map(function(result) { return result.value; });

		if (successful.length === 0) throw new Error("No location source was available");

		const seen = new Set();
		const merged = [];
		successful.forEach(function(source) {
			source.trains.forEach(function(train) {
				const key = String(train.cbango || train.pos || "");
				if (seen.has(key)) return;
				seen.add(key);
				merged.push(train);
			});
		});

		return { trains: merged, time: successful[0].time || "" };
	}

	function buildPositionMap(html) {
		const routeDocument = new DOMParser().parseFromString(html, "text/html");
		const stationIndexByName = new Map();
		stations.forEach(function(station, index) {
			stationIndexByName.set(station.name, index);
		});
		livePositionMap = new Map();
		routeStationKeyMap = new Map();
		let currentStationIndex = -1;

		routeDocument.querySelectorAll(".eki-panel").forEach(function(panel) {
			const stationNodes = Array.from(panel.querySelectorAll(".stalist-eki-contents [key]"));
			let panelTop = currentStationIndex < 0 ? 56 : (currentStationIndex * 224) + 168;

			stationNodes.forEach(function(node) {
				const stationName = node.textContent.trim();
				const stationIndex = stationIndexByName.get(stationName);
				if (typeof stationIndex === "number") {
					currentStationIndex = stationIndex;
					panelTop = (stationIndex * 224) + 56;
				}
				const stationKey = node.getAttribute("key");
				if (stationKey && stationName) routeStationKeyMap.set(stationKey, stationName);
			});

			panel.querySelectorAll(".ressha-icon").forEach(function(icon) {
				Array.from(icon.classList).forEach(function(className) {
					if (/^R\d+P\d+[UD]$/.test(className) && !livePositionMap.has(className)) {
						livePositionMap.set(className, { top: panelTop });
					}
				});
			});
		});
	}

	function convertLiveTrains(rows, metadata) {
		const typeMap = new Map();
		metadata.types.forEach(function(type) {
			typeMap.set(String(type.type), type.typeText && type.typeText.ja ? type.typeText.ja : "");
		});
		const destinationMap = new Map(routeStationKeyMap);
		metadata.stations.forEach(function(station) {
			if (station && station.key && station.ja) destinationMap.set(String(station.key), station.ja);
		});
		const stackCounts = new Map();

		return rows.map(function(row) {
			const placement = livePositionMap.get(String(row.pos || ""));
			if (!placement) return null;
			const type = typeMap.get(String(row.type)) || typeFallback[row.type] || "列車";
			const destination = destinationMap.get(String(row.shuEkiKey || "")) || destinationFallback[row.shuEkiSimple] || row.shuEkiSimple || "行先不明";
			const direction = /U$/.test(row.pos) ? "up" : "down";
			const stackKey = String(row.pos) + "|" + direction;
			const stack = stackCounts.get(stackKey) || 0;
			stackCounts.set(stackKey, stack + 1);
			const positionName = metadata.positions[row.pos] || destination;
			const delayMinutes = Number(row.chien || 0);

			return {
				direction: direction,
				top: placement.top,
				type: type,
				destination: destination,
				cars: row.ryosu ? row.ryosu + "両" : "両数不明",
				number: row.cbango || "不明",
				congestion: "混雑情報はありません",
				stops: [["現在", positionName], ["行先", destination]],
				delay: delayMinutes > 0 ? (delayMinutes >= 999 ? "大幅" : "+" + delayMinutes + "分") : "",
				stack: stack,
				position: row.pos,
				icon: "local"
			};
		}).filter(Boolean).sort(function(a, b) {
			return a.top - b.top || a.direction.localeCompare(b.direction) || a.number.localeCompare(b.number, "ja");
		});
	}

	function setDataTimestamp(rawTime) {
		const time = document.getElementById("modernCurrentTime");
		const match = String(rawTime || "").match(/\d+年(\d+)月(\d+)日(\d+)時(\d+)分/);
		if (!match) {
			updateCurrentTime();
			return;
		}
		time.textContent = Number(match[1]) + "月" + Number(match[2]) + "日 " + match[3].padStart(2, "0") + ":" + match[4].padStart(2, "0") + " 現在";
	}

	async function fetchJson(url) {
		const response = await fetch(url, { cache: "no-store" });
		if (!response.ok) throw new Error("HTTP " + response.status + " for " + url);
		const text = await response.text();
		return JSON.parse(text.replace(/^\uFEFF/, ""));
	}

	async function fetchText(url) {
		const response = await fetch(url, { cache: "no-store" });
		if (!response.ok) throw new Error("HTTP " + response.status + " for " + url);
		return response.text();
	}

	function renderSections() {
		const list = document.getElementById("modernStationList");
		if (!list) return;
		list.innerHTML = "";

		for (let index = 0; index < (stations.length * 2) - 1; index += 1) {
			const element = document.createElement("div");
			element.className = "modern-section" + (index % 2 === 0 ? " is-station" : "");
			element.style.top = (index * 112) + "px";
			element.style.height = "112px";
			list.appendChild(element);
		}
	}

	function renderStations() {
		const list = document.getElementById("modernStationList");
		if (!list) return;

		stations.forEach(function(station) {
			const element = document.createElement("div");
			element.className = "modern-station" + (station.code ? "" : " is-operational-point");
			element.style.top = station.top + "px";

			const name = document.createElement("span");
			name.className = "modern-station-name";
			name.textContent = station.name;

			element.appendChild(name);

			if (station.code) {
				const code = document.createElement("span");
				code.className = "modern-station-code";
				code.textContent = station.code;
				element.appendChild(code);
			}

			list.appendChild(element);
		});
	}

	function updateCurrentTime() {
		const time = document.getElementById("modernCurrentTime");
		const now = new Date();
		const hours = String(now.getHours()).padStart(2, "0");
		const minutes = String(now.getMinutes()).padStart(2, "0");
		time.textContent = (now.getMonth() + 1) + "月" + now.getDate() + "日 " + hours + ":" + minutes + " 現在";
	}

	function renderTrains() {
		const layer = document.getElementById("modernTrainLayer");
		if (!layer) return;
		layer.innerHTML = "";

		trains.forEach(function(train, index) {
			layer.appendChild(createTrainCard(train, index));
		});
	}

	function createTrainCard(train, index) {
		const card = document.createElement("button");
		card.type = "button";
		card.className = "modern-train-card " + train.direction;
		card.style.top = train.top + "px";
		card.style.marginTop = ((train.stack || 0) * 12) + "px";
		card.dataset.trainNumber = train.number;
		card.dataset.position = train.position;
		card.setAttribute("aria-label", train.type + "・" + train.destination + " " + train.cars);
		card.addEventListener("click", function() {
			openTrainDetails(train);
		});

		if (train.delay) {
			const delay = document.createElement("div");
			delay.className = "modern-delay";
			delay.textContent = train.delay;
			card.appendChild(delay);
		}

		card.appendChild(createTrainShape(train.direction, index));

		const icon = document.createElement("span");
		icon.className = "modern-train-icon";
		icon.setAttribute("aria-hidden", "true");
		card.appendChild(icon);

		const text = document.createElement("div");
		text.className = "modern-train-text";

		const main = document.createElement("div");
		main.className = "modern-train-main";
		main.textContent = train.type + "・" + train.destination;

		const cars = document.createElement("div");
		cars.className = "modern-train-cars";
		cars.textContent = train.cars;

		text.appendChild(main);
		text.appendChild(cars);
		card.appendChild(text);

		return card;
	}

	function openTrainDetails(train) {
		const details = document.getElementById("modernTrainDetails");
		const status = details.querySelector(".modern-details-status");
		document.getElementById("modernTrainDetailsType").textContent = train.type + "列車";
		document.getElementById("modernTrainDetailsTitle").textContent = train.destination + " 行";
		document.getElementById("modernTrainDetailsNumber").textContent = train.number;
		document.getElementById("modernTrainDetailsCars").textContent = train.cars;
		document.getElementById("modernTrainDetailsCongestion").textContent = train.congestion;
		status.textContent = train.delay ? train.delay + "遅れ" : "定刻通り";
		status.classList.toggle("is-delayed", Boolean(train.delay));
		renderTrainStops(train.stops);
		details.classList.add("is-open");
		details.setAttribute("aria-hidden", "false");
		document.body.classList.add("is-details-open");
	}

	function closeTrainDetails() {
		const details = document.getElementById("modernTrainDetails");
		details.classList.remove("is-open");
		details.setAttribute("aria-hidden", "true");
		document.body.classList.remove("is-details-open");
	}

	function renderTrainStops(stops) {
		const list = document.getElementById("modernTrainDetailsStops");
		list.innerHTML = "";
		stops.forEach(function(stop) {
			const row = document.createElement("div");
			row.className = "modern-stop-row";
			const time = document.createElement("time");
			time.textContent = stop[0];
			const name = document.createElement("span");
			name.textContent = stop[1];
			row.appendChild(time);
			row.appendChild(name);
			list.appendChild(row);
		});
	}

	function createTrainShape(direction, index) {
		const svgNs = "http://www.w3.org/2000/svg";
		const svg = document.createElementNS(svgNs, "svg");
		const clipId = "modernTrainClip" + direction + index;
		svg.setAttribute("class", "modern-train-shape");
		svg.setAttribute("viewBox", "0 0 55 85");
		svg.setAttribute("aria-hidden", "true");
		svg.setAttribute("focusable", "false");

		const defs = document.createElementNS(svgNs, "defs");
		const clip = document.createElementNS(svgNs, "clipPath");
		clip.setAttribute("id", clipId);

		const clipPath = document.createElementNS(svgNs, "path");
		clipPath.setAttribute("d", direction === "up" ? upPath() : downPath());
		clip.appendChild(clipPath);
		defs.appendChild(clip);
		svg.appendChild(defs);

		const body = document.createElementNS(svgNs, "path");
		body.setAttribute("class", "modern-train-shape-body");
		body.setAttribute("d", direction === "up" ? upPath() : downPath());
		svg.appendChild(body);

		const band = document.createElementNS(svgNs, "rect");
		band.setAttribute("class", "modern-train-shape-band");
		band.setAttribute("x", "0");
		band.setAttribute("width", "55");
		band.setAttribute("height", "26");
		band.setAttribute("y", direction === "up" ? "59" : "0");
		band.setAttribute("clip-path", "url(#" + clipId + ")");
		svg.appendChild(band);

		return svg;
	}

	function upPath() {
		return "M27.5 1 C30 1 32 2 34.5 3.5 L47 11.5 C52 14.7 54 20 54 26 L54 70 C54 80 49 84 39 84 L16 84 C6 84 1 80 1 70 L1 26 C1 20 3 14.7 8 11.5 L20.5 3.5 C23 2 25 1 27.5 1 Z";
	}

	function downPath() {
		return "M16 1 L39 1 C49 1 54 5 54 15 L54 59 C54 65 52 70.3 47 73.5 L34.5 81.5 C32 83 30 84 27.5 84 C25 84 23 83 20.5 81.5 L8 73.5 C3 70.3 1 65 1 59 L1 15 C1 5 6 1 16 1 Z";
	}
}());
