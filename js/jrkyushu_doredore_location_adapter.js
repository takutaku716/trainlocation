(function(root, factory) {
	if (typeof module === "object" && module.exports) {
		module.exports = factory();
	} else {
		root.JrKyushuDoredoreLocationAdapter = factory();
	}
}(typeof self !== "undefined" ? self : this, function() {
	"use strict";

	const SECTION_RAPID_RANGES = {
		M: [[3120, 3199], [4120, 4199], [4320, 4399]],
		D: [[4220, 4299]]
	};
	const RAPID_RANGES = {
		M: [[1320, 1399], [3220, 3299], [4220, 4299]],
		C: [[1320, 1399], [1620, 1699]],
		H: [[4620, 4699]],
		D: [[3220, 3299], [3320, 3399], [3530, 3599], [3920, 3999]]
	};

	function normalize(html, options) {
		const settings = options || {};
		const rows = parseRows(html);
		const trains = [];
		rows.forEach(function(row) {
			row.trains.forEach(function(rawTrain) {
				const direction = rawTrain.direction === "U" ? "U" : "D";
				const anchors = findTrainNaviAnchors(rows, row.index, direction, 10);
				const anchor = anchors[0];
				const isYardSwitching = rawTrain.isYardSwitching === true;
				trains.push({
					cbango: rawTrain.number,
					name: rawTrain.name,
					type: rawTrain.type,
					typeLabel: rawTrain.typeLabel,
					shaEki: "",
					shaTime: "",
					shuEki: "",
					shuEkiKey: "",
					shuEkiName: rawTrain.destination || "行先取得不可",
					shuEkiSimple: destinationShort(rawTrain.destination),
					ryosu: "",
					senku: String(settings.senku || ""),
					runStatus: 1,
					yokuStatus: 0,
					yokuDetail: {},
					status: 1,
					statusDetail: "",
					statusDetailEn: "",
					statusDetailTc: "",
					statusDetailSc: "",
					statusDetailKr: "",
					chien: rawTrain.delay,
					pos: positionKey(settings.sourceId, row.kukan) + direction,
					source: "jrkyushu-doredore",
					sourceRosen: String(settings.senku || ""),
					jrKyushu: {
						source: "doredore",
						doredoreLineId: String(settings.sourceId || ""),
						doredoreKukan: row.kukan,
						isYardSwitching: isYardSwitching,
						typeSimple: isYardSwitching ? "入" : "",
						trainNavi: !isYardSwitching && anchor ? {
							currentStationName: anchor.stationNames[0],
							candidateStationNames: anchors.map(function(candidate) { return candidate.stationNames[0]; }),
							drivingRouteName: String(settings.trainNaviRouteName || settings.lineName || ""),
							upperLowerKbn: direction === "U" ? "2" : "1",
							trainNumber: rawTrain.number
						} : null
					}
				});
			});
		});
		const timestamp = parseTimestamp(html);
		const location = {
			trains: trains,
			meta: {
				source: "jrkyushu-doredore",
				lineId: String(settings.sourceId || ""),
				lineName: String(settings.lineName || "")
			}
		};
		if (timestamp) {
			location.time = { ja: formatTimestamp(timestamp) };
			location.sourceTimes = [{
				rosen: String(settings.senku || ""),
				text: location.time.ja,
				timestamp: timestamp
			}];
		}
		return { location: location, rows: rows };
	}

	function parseRows(html) {
		if (!html) return [];
		const doc = typeof DOMParser !== "undefined" ? new DOMParser().parseFromString(String(html), "text/html") : null;
		const rows = doc ? parseRowsWithDom(doc) : parseRowsWithRegex(String(html));
		return rows.sort(function(left, right) { return left.kukan - right.kukan; }).map(function(row, index) {
			row.index = index;
			return row;
		});
	}

	function parseRowsWithDom(doc) {
		return Array.from(doc.querySelectorAll("tr[title^='KUKAN']")).map(function(row) {
			const match = String(row.getAttribute("title") || "").match(/^KUKAN(\d+)$/);
			if (!match) return null;
			const stationId = String(row.id || "").replace(/^EKINO/, "");
			const stationCell = row.querySelector("td.auto-style1, td[class*='auto-style6']");
			return buildRow(Number(match[1]), stationId, stationCell ? stationCell.innerHTML : "", stationCell ? stationCell.className : "", Array.from(row.querySelectorAll("td[title]")).map(function(cell) {
				return parseTrainCell(cell.getAttribute("title"), cell.getAttribute("background"), cell.innerHTML);
			}).filter(Boolean));
		}).filter(Boolean);
	}

	function parseRowsWithRegex(html) {
		const rows = [];
		const pattern = /<tr\b([^>]*)title=["']?KUKAN(\d+)["']?([^>]*)>([\s\S]*?)<\/tr>/gi;
		let match;
		while ((match = pattern.exec(html)) !== null) {
			const attrs = (match[1] || "") + " " + (match[3] || "");
			const idMatch = attrs.match(/\bid=["']?EKINO([^"'\s>]*)/i);
			const stationId = idMatch ? idMatch[1] : "";
			const stationCellMatch = match[4].match(/<td\b[^>]*class=["']([^"']*(?:auto-style1|auto-style6)[^"']*)["'][^>]*>([\s\S]*?)<\/td>/i);
			const trains = [];
			const cellPattern = /<td\b([^>]*)>([\s\S]*?)(?=<td\b|$)/gi;
			let cellMatch;
			while ((cellMatch = cellPattern.exec(match[4])) !== null) {
				const titleMatch = cellMatch[1].match(/\btitle=["']?([^"'\s>]+)/i);
				if (!titleMatch) continue;
				const backgroundMatch = cellMatch[1].match(/\bbackground=["']?([^"'\s>]+)/i);
				const train = parseTrainCell(titleMatch[1], backgroundMatch ? backgroundMatch[1] : "", cellMatch[2]);
				if (train) trains.push(train);
			}
			rows.push(buildRow(Number(match[2]), stationId, stationCellMatch ? stationCellMatch[2] : "", stationCellMatch ? stationCellMatch[1] : "", trains));
		}
		return rows;
	}

	function buildRow(kukan, stationId, stationHtml, stationCellClass, trains) {
		const isNonInterlocked = stationNamesAreSeparate(stationCellClass);
		const stationNames = parseStationNames(stationHtml, isNonInterlocked);
		return {
			kukan: kukan,
			stationId: String(stationId || ""),
			stationNames: stationNames,
			hasTimetableLink: /jrkyushu-timetable\.jp/i.test(String(stationHtml || "")),
			isNonInterlocked: stationNames.length > 0 && isNonInterlocked,
			trains: trains || []
		};
	}

	function stationNamesAreSeparate(stationCellClass) {
		return /(?:^|\s)auto-style6/i.test(String(stationCellClass || ""));
	}

	function parseStationNames(html, keepSeparate) {
		let source = String(html || "");
		const primaryLink = source.match(/<a\b[^>]*href=["'][^"']*(?:hash=|#EKINO)[^"']*["'][^>]*>([\s\S]*?)<\/a>/i);
		if (primaryLink) source = primaryLink[1];
		else source = source.replace(/<a\b[^>]*href=["'][^"']*jrkyushu-timetable[^"']*["'][^>]*>[\s\S]*?<\/a>/gi, "");
		const names = decodeText(source)
			.split(/\n+/)
			.map(normalizeStationName)
			.filter(Boolean);
		return keepSeparate ? names : [normalizeStationName(names.join(""))].filter(Boolean);
	}

	function parseTrainCell(number, background, html) {
		const displayNumber = normalizeTrainNumber(number);
		if (!displayNumber) return null;
		const isYardSwitching = /^構/.test(displayNumber);
		const lines = decodeText(html).split(/\n+/).map(function(value) { return value.trim(); }).filter(Boolean);
		const destination = lines.length ? lines[0].replace(/行$/, "") : "";
		const delayLine = lines.find(function(value) { return /(?:定刻|遅れ)/.test(value); }) || "";
		const serviceName = lines.slice(1).find(function(value) { return !/(?:定刻|遅れ)/.test(value); }) || "";
		const type = classifyTrainType(displayNumber, trainTypeFromBackground(background));
		return {
			number: displayNumber,
			name: serviceName || defaultTrainName(type),
			destination: destination,
			direction: /up/i.test(String(background || "")) ? "U" : "D",
				delay: parseDelay(delayLine),
				type: type.code,
				typeLabel: type.label,
				isYardSwitching: isYardSwitching
		};
	}

	function findTrainNaviAnchors(rows, index, direction, limit) {
		const step = direction === "U" ? -1 : 1;
		const anchors = [];
		const stationNames = new Set();
		const max = Math.max(1, Number(limit) || 1);
		function addAnchor(row) {
			if (!row.hasTimetableLink || !row.stationNames.length) return;
			const name = row.stationNames[0];
			if (stationNames.has(name)) return;
			stationNames.add(name);
			anchors.push(row);
		}
		addAnchor(rows[index]);
		if (anchors.length >= max) return anchors;

		// Train Navi bases a between-station train on the last interlocked station it passed.
		if (!rows[index].hasTimetableLink) {
			for (let i = index - step; i >= 0 && i < rows.length; i -= step) {
				addAnchor(rows[i]);
				if (anchors.length > 0) break;
			}
		}
		if (anchors.length >= max) return anchors;

		for (let i = index + step; i >= 0 && i < rows.length; i += step) {
			addAnchor(rows[i]);
			if (anchors.length >= max) return anchors;
		}
		for (let i = index - step; i >= 0 && i < rows.length; i -= step) {
			addAnchor(rows[i]);
			if (anchors.length >= max) return anchors;
		}
		return anchors;
	}

	function buildRouteHtml(html, options) {
		const settings = options || {};
		const rows = parseRows(html);
		const firstStation = rows.find(function(row) { return row.stationNames.length; });
		const lastStation = rows.slice().reverse().find(function(row) { return row.stationNames.length; });
		const parts = [
			'<div id="homenNameUpText" hidden>' + escapeHtml(firstStation ? firstStation.stationNames[0] : "上り") + '方面</div>',
			'<div id="homenNameDownText" hidden>' + escapeHtml(lastStation ? lastStation.stationNames.slice(-1)[0] : "下り") + '方面</div>'
		];
		rows.forEach(function(row, index) {
			const isStation = row.stationNames.length > 0;
			const classes = ["eki-panel"];
			if (row.isNonInterlocked) classes.push("hirendo");
			else if (isStation) classes.push("eki");
			if (index === rows.length - 1) classes.push("end");
			parts.push('<div class="' + classes.join(" ") + '"><div class="eki-contents">');
			if (row.isNonInterlocked) {
				parts.push('<div class="hirendo-msg">この区間は実際の<br>走行位置と異なる<br>場合があります</div>');
				parts.push('<div class="hirendo-contents">');
				parts.push('<div class="ressha-contents"><div class="hirendo-ressha-panel one-eki-contents"><div class="ressha-icon ' + positionKey(settings.sourceId, row.kukan) + 'U"></div></div></div>');
				parts.push('<div class="stalist-eki-link ' + stationCountClass(row.stationNames.length) + '">' + row.stationNames.map(function(name, stationIndex) {
					return '<div class="stalist-eki-contents non-icon"><span class="eki-icon hide"></span><div key="' + escapeHtml(stationKey(settings.sourceId, row) + '-' + stationIndex) + '"' + stationSelectAttribute(row, name) + '>' + escapeHtml(name) + '</div></div>';
				}).join("") + '</div>');
				parts.push('<div class="ressha-contents"><div class="hirendo-ressha-panel one-eki-contents"><div class="ressha-icon ' + positionKey(settings.sourceId, row.kukan) + 'D"></div></div></div>');
				parts.push('</div>');
			} else if (isStation) {
				parts.push('<div class="stalist-eki-link"><div class="stalist-eki-contents non-icon"><span class="eki-icon hide"></span><div key="' + escapeHtml(stationKey(settings.sourceId, row)) + '" class="margin-left05"' + stationSelectAttribute(row, row.stationNames[0]) + '>' + row.stationNames.map(escapeHtml).join("<br>") + '</div></div></div>');
			}
			if (!row.isNonInterlocked) parts.push('<div class="ressha-contents"><div class="ressha-icon ' + positionKey(settings.sourceId, row.kukan) + 'U"></div><div class="ressha-icon ' + positionKey(settings.sourceId, row.kukan) + 'D"></div></div>');
			parts.push('</div>' + (index === rows.length - 1 ? '' : '<svg class="senro-img"><use xlink:href="#senro"></use></svg>') + '</div>');
		});
		parts.push(trackSymbol());
		return parts.join("\n");
	}

	function stationCountClass(count) {
		if (count === 2) return "two-eki";
		if (count === 3) return "three-eki";
		if (count === 4) return "four-eki";
		if (count >= 5) return "five-eki";
		return "many-eki";
	}

	function stationSelectAttribute(row, name) {
		if ((!row.hasTimetableLink && !row.isNonInterlocked) || isOperationalFacility(name)) return "";
		return ' data-station-selectable="1"';
	}

	function isOperationalFacility(name) {
		return /(?:信号場|操車場|貨物|電留)$/.test(String(name || ""));
	}

	function buildLocationMasterEntries(rowsOrHtml, options) {
		const settings = options || {};
		const rows = Array.isArray(rowsOrHtml) ? rowsOrHtml : parseRows(rowsOrHtml);
		const entries = {};
		rows.forEach(function(row, index) {
			const key = positionKey(settings.sourceId, row.kukan);
			if (row.stationNames.length && !row.isNonInterlocked) {
				const stationName = row.stationNames.join("・");
				entries[key + "U"] = stationName;
				entries[key + "D"] = stationName;
				return;
			}
			const previous = findLocationAnchor(rows, index, -1);
			const next = findLocationAnchor(rows, index, 1);
			if (previous && next) {
				const previousName = previous.stationNames.join("・");
				const nextName = next.stationNames.join("・");
				entries[key + "D"] = previousName + "→" + nextName + " 間";
				entries[key + "U"] = nextName + "→" + previousName + " 間";
				return;
			}
			const fallbackName = row.stationNames.join("・") || (previous && previous.stationNames.join("・")) || (next && next.stationNames.join("・")) || String(settings.lineName || "現在地不明");
			entries[key + "U"] = fallbackName;
			entries[key + "D"] = fallbackName;
		});
		return entries;
	}

	function findLocationAnchor(rows, index, step) {
		for (let i = index + step; i >= 0 && i < rows.length; i += step) {
			if (rows[i].stationNames.length && !rows[i].isNonInterlocked) return rows[i];
		}
		return null;
	}

	function stationKey(sourceId, row) {
		return "JQK" + pad(sourceId, 2) + "S" + (row.stationId || pad(row.kukan, 3));
	}

	function positionKey(sourceId, kukan) {
		return "JQK" + pad(sourceId, 2) + "P" + pad(kukan, 3);
	}

	function trackSymbol() {
		const rects = [];
		for (let y = 0; y < 300; y += 10) {
			rects.push('<rect width="6" height="10" x="1" y="' + y + '" fill="' + (y % 20 === 0 ? "#fff" : "#000") + '" stroke="#000"></rect>');
		}
		return '<svg style="display:none"><symbol id="senro" viewBox="0 0 8 300">' + rects.join("") + '</symbol></svg>';
	}

	function trainTypeFromBackground(background) {
		const value = String(background || "");
		if (/RetY/i.test(value)) return { code: "1", label: "特急" };
		if (/RetK/i.test(value)) return { code: "3", label: "快速" };
		return { code: "4", label: "普通" };
	}

	function classifyTrainType(displayNumber, locationType) {
		if (/^構/.test(String(displayNumber || "").trim())) {
			return { code: "7", label: "入替車両" };
		}
		if (locationType && String(locationType.code) === "1") {
			return { code: "1", label: "特急" };
		}
		const match = String(displayNumber || "").trim().toUpperCase().match(/^0*(\d+)([A-Z])$/);
		if (!match) return { code: "3", label: "普通" };
		const trainNumber = Number(match[1]);
		const suffix = match[2];
		if (isTrainNumberInRanges(trainNumber, SECTION_RAPID_RANGES[suffix])) {
			return { code: "9", label: "区間快速" };
		}
		if (isTrainNumberInRanges(trainNumber, RAPID_RANGES[suffix])) {
			return { code: "2", label: "快速" };
		}
		return { code: "3", label: "普通" };
	}

	function defaultTrainName(type) {
		const label = type && type.label ? type.label : "";
		if (!label) return "列車";
		return label === "入替車両" ? label : label + "列車";
	}

	function isTrainNumberInRanges(trainNumber, ranges) {
		return (Array.isArray(ranges) ? ranges : []).some(function(range) {
			return trainNumber >= range[0] && trainNumber <= range[1];
		});
	}

	function normalizeTrainNumber(value) {
		const match = String(value || "").trim().match(/(構?\d{1,6}[A-Za-z]?)/);
		return match ? match[1].toUpperCase() : "";
	}

	function parseDelay(value) {
		const match = String(value || "").match(/(\d+)\s*分遅れ/);
		return match ? Number(match[1]) : 0;
	}

	function destinationShort(value) {
		const text = String(value || "").trim();
		return text ? Array.from(text)[0] : "？";
	}

	function normalizeStationName(value) {
		return String(value || "")
			.replace(/\s+/g, "")
			.replace(/信号所/g, "信号場")
			.replace(/^北九州ターミナル$/, "北九州貨物ターミナル")
			.replace(/^ｽﾍﾟｰｽﾜｰﾙﾄﾞ$/, "スペースワールド");
	}

	function decodeText(value) {
		return String(value || "")
			.replace(/<br\s*\/?\s*>/gi, "\n")
			.replace(/<\/br\s*>/gi, "\n")
			.replace(/<[^>]+>/g, "")
			.replace(/&nbsp;|&#160;/gi, " ")
			.replace(/&amp;/gi, "&")
			.replace(/&lt;/gi, "<")
			.replace(/&gt;/gi, ">");
	}

	function parseTimestamp(html) {
		const match = String(html || "").match(/name=["']datetimestamp["'][^>]*content=["']([^"']+)/i);
		if (!match) return 0;
		const parts = match[1].match(/(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2}):(\d{2})/);
		if (!parts) return 0;
		return new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]), Number(parts[4]), Number(parts[5]), Number(parts[6])).getTime();
	}

	function formatTimestamp(timestamp) {
		const date = new Date(timestamp);
		return date.getFullYear() + "年" + (date.getMonth() + 1) + "月" + date.getDate() + "日" + date.getHours() + "時" + String(date.getMinutes()).padStart(2, "0") + "分現在";
	}

	function pad(value, length) {
		return String(value === null || value === undefined ? "" : value).padStart(length, "0");
	}

	function escapeHtml(value) {
		return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
	}

	return {
		normalize: normalize,
		parseRows: parseRows,
		classifyTrainType: classifyTrainType,
		buildRouteHtml: buildRouteHtml,
		buildLocationMasterEntries: buildLocationMasterEntries,
		positionKey: positionKey
	};
}));
