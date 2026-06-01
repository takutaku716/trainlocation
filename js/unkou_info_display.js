/*
 * フッターの運行情報に表示する情報を設定する。
 */
function set_unko_info(_param_rosen) {
	let now = Date.now() >>> 10;
	let lang = document.documentElement.dataset.lang;
	if (set_merged_unko_info(_param_rosen, now, lang)) return;
	if (set_dokotre_unko_info(_param_rosen, now, lang)) return;

	if (_param_rosen == "01" || _param_rosen == "02" || _param_rosen == "03") {
		// 札幌近郊
		let fileName = lang === "ja" ? "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/area/area_01.json?" : "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/area/area_01_" + lang + ".json?";
		$.getJSON(fileName + now, function (topData) {
			if (topData.today.areaStatus.spo == "1") {
				// 運行情報が存在する場合
				let areaName = getAreaName("01");
				$("#unkouInfo").show();
				$("#titleAreaName").text(areaName);
				$("#senkuList").show();
				$("#commonSenkuOperation").show();
				$("#senkuListAreaName").text(areaName);
				$("#gaikyoAreaName").text(areaName);

				// 線区別運行情報リストを作成
				let html ="<ul>";
				html += create_list(topData.today.senkuStatus.express, "01");
				html += create_list(topData.today.senkuStatus.airport, "02");
				html += create_list(topData.today.senkuStatus.hakochise, "03");
				html += create_list(topData.today.senkuStatus.gakuen, "04");
				html += "</ul>";
				$("#commonSenkuOperation").html(html);

				// 本日分の概況
				if (topData.today.gaikyo.length > 0 || topData.today.areaComments.length > 0) {
					// 概況のリストを作成
					create_gaikyo(topData.today.gaikyo);

					// エリアコメントのリストを作成する
					topData.today.areaComments.forEach(row => {
						let today_area_comments = "";
						today_area_comments += "<div>" + row.comment + "</div>";
						$("#dialogGaikyo .gaikyo-frame").append(today_area_comments);
					});
				} else {
					$("#dialogGaikyo .gaikyo-frame").html("<span>" + get_gaikyo_info_message() + "</span>");
				}
			} else {
				$("#unkouInfo").hide();
			}
		})
		.fail(function() {
			var errormessage = `<h2 class='msg-bg'>${get_error_message()}</h2>`;
			$('#message').html(errormessage);
			$('#message').show();
		});
	} else if (_param_rosen == "04" || _param_rosen == "05" || _param_rosen == "06" || _param_rosen == "07" || _param_rosen == "08") {
		// 道央エリア
		let fileName = lang === "ja" ? "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/area/area_02.json?" : "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/area/area_02_" + lang + ".json?";
		$.getJSON(fileName + now, function (topData) {
			if (topData.today.areaStatus.doo == "1") {
				// 運行情報が存在する場合
				let areaName = getAreaName("02");
				$("#unkouInfo").show();
				$("#titleAreaName").text(areaName);
				$("#senkuList").show();
				$("#commonSenkuOperation").show();
				$("#senkuListAreaName").text(areaName);
				$("#gaikyoAreaName").text(areaName);

				// 線区別運行情報リストを作成
				let html ="<ul>";
				html += create_list(topData.today.senkuStatus.express, "05");
				html += create_list(topData.today.senkuStatus.airport, "06");
				html += create_list(topData.today.senkuStatus.hakochise, "07");
				html += create_list(topData.today.senkuStatus.gakuen, "08");
				html += create_list(topData.today.senkuStatus.muroran, "09");
				html += create_list(topData.today.senkuStatus.hidaka, "10");
				html += "</ul>";
				$("#commonSenkuOperation").html(html);

				// 本日分の概況
				if (topData.today.gaikyo.length > 0 || topData.today.areaComments.length > 0) {
					// 概況のリストを作成
					create_gaikyo(topData.today.gaikyo);

					// エリアコメントのリストを作成する
					topData.today.areaComments.forEach(row => {
						let today_area_comments = "";
						today_area_comments += "<div>" + row.comment + "</div>";
						$("#dialogGaikyo .gaikyo-frame").append(today_area_comments);
					});
				} else {
					$("#dialogGaikyo .gaikyo-frame").html("<span>" + get_gaikyo_info_message() + "</span>");
				}
			} else {
				$("#unkouInfo").hide();
			}
		})
		.fail(function() {
			var errormessage = `<h2 class='msg-bg'>${get_error_message()}</h2>`;
			$('#message').html(errormessage);
			$('#message').show();
		});
	} else if (_param_rosen == "09" || _param_rosen == "10") {
		// 道南エリア
		let fileName = lang === "ja" ? "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/area/area_03.json?" : "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/area/area_03_" + lang + ".json?";
		$.getJSON(fileName + now, function (topData) {
			if (topData.today.areaStatus.donan == "1") {
				// 運行情報が存在する場合
				let areaName = getAreaName("03");
				$("#unkouInfo").show();
				$("#titleAreaName").text(areaName);
				$("#senkuList").show();
				$("#commonSenkuOperation").show();
				$("#senkuListAreaName").text(areaName);
				$("#gaikyoAreaName").text(areaName);

				// 線区別運行情報リストを作成
				let html ="<ul>";
				html += create_list(topData.today.senkuStatus.express, "11");
				html += create_list(topData.today.senkuStatus.hakodateLiner, "12");
				html += create_list(topData.today.senkuStatus.hakodate, "13");
				html += "</ul>";
				$("#commonSenkuOperation").html(html);

				// 本日分の概況
				if (topData.today.gaikyo.length > 0 || topData.today.areaComments.length > 0) {
					// 概況のリストを作成
					create_gaikyo(topData.today.gaikyo);

					// エリアコメントのリストを作成する
					topData.today.areaComments.forEach(row => {
						let today_area_comments = "";
						today_area_comments += "<div>" + row.comment + "</div>";
						$("#dialogGaikyo .gaikyo-frame").append(today_area_comments);
					});
				} else {
					$("#dialogGaikyo .gaikyo-frame").html("<span>" + get_gaikyo_info_message() + "</span>");
				}
			} else {
				$("#unkouInfo").hide();
			}
		})
		.fail(function() {
			var errormessage = `<h2 class='msg-bg'>${get_error_message()}</h2>`;
			$('#message').html(errormessage);
			$('#message').show();
		});
	} else if (_param_rosen == "11" || _param_rosen == "12") {
		// 道北エリア
		let fileName = lang === "ja" ? "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/area/area_04.json?" : "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/area/area_04_" + lang + ".json?";
		$.getJSON(fileName + now, function (topData) {
			if (topData.today.areaStatus.dohoku == "1") {
				// 運行情報が存在する場合
				let areaName = getAreaName("04");
				$("#unkouInfo").show();
				$("#titleAreaName").text(areaName);
				$("#senkuList").show();
				$("#commonSenkuOperation").show();
				$("#senkuListAreaName").text(areaName);
				$("#gaikyoAreaName").text(areaName);

				// 線区別運行情報リストを作成
				let html ="<ul>";
				html += create_list(topData.today.senkuStatus.express, "14");
				html += create_list(topData.today.senkuStatus.soya, "15");
				html += create_list(topData.today.senkuStatus.sekihoku, "16");
				html += create_list(topData.today.senkuStatus.furano, "17");
				html += create_list(topData.today.senkuStatus.rumoi, "18");
				html += "</ul>";
				$("#commonSenkuOperation").html(html);

				// 本日分の概況
				if (topData.today.gaikyo.length > 0 || topData.today.areaComments.length > 0) {
					// 概況のリストを作成
					create_gaikyo(topData.today.gaikyo);

					// エリアコメントのリストを作成する
					topData.today.areaComments.forEach(row => {
						let today_area_comments = "";
						today_area_comments += "<div>" + row.comment + "</div>";
						$("#dialogGaikyo .gaikyo-frame").append(today_area_comments);
					});
				} else {
					$("#dialogGaikyo .gaikyo-frame").html("<span>" + get_gaikyo_info_message() + "</span>");
				}
			} else {
				$("#unkouInfo").hide();
			}
		})
		.fail(function() {
			var errormessage = `<h2 class='msg-bg'>${get_error_message()}</h2>`;
			$('#message').html(errormessage);
			$('#message').show();
		});
	} else if (_param_rosen == "13" || _param_rosen == "14") {
		// 道東エリア
		let fileName = lang === "ja" ? "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/area/area_05.json?" : "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/area/area_05_" + lang + ".json?";
		$.getJSON(fileName + now, function (topData) {
			if (topData.today.areaStatus.doto == "1") {
				// 運行情報が存在する場合
				let areaName = getAreaName("05");
				$("#unkouInfo").show();
				$("#titleAreaName").text(areaName);
				$("#senkuList").show();
				$("#commonSenkuOperation").show();
				$("#senkuListAreaName").text(areaName);
				$("#gaikyoAreaName").text(areaName);

				// 線区別運行情報リストを作成
				let html ="<ul>";
				html += create_list(topData.today.senkuStatus.express, "19");
				html += create_list(topData.today.senkuStatus.sekisho, "20");
				html += create_list(topData.today.senkuStatus.nemuro, "21");
				html += create_list(topData.today.senkuStatus.hanasaki, "22");
				html += create_list(topData.today.senkuStatus.senmo, "23");
				html += "</ul>";
				$("#commonSenkuOperation").html(html);

				// 本日分の概況
				if (topData.today.gaikyo.length > 0 || topData.today.areaComments.length > 0) {
					// 概況のリストを作成
					create_gaikyo(topData.today.gaikyo);

					// エリアコメントのリストを作成する
					topData.today.areaComments.forEach(row => {
						let today_area_comments = "";
						today_area_comments += "<div>" + row.comment + "</div>";
						$("#dialogGaikyo .gaikyo-frame").append(today_area_comments);
					});
				} else {
					$("#dialogGaikyo .gaikyo-frame").html("<span>" + get_gaikyo_info_message() + "</span>");
				}
			} else {
				$("#unkouInfo").hide();
			}
		})
		.fail(function() {
			var errormessage = `<h2 class='msg-bg'>${get_error_message()}</h2>`;
			$('#message').html(errormessage);
			$('#message').show();
		});
	} else if (_param_rosen == "15") {
		// 北海道新幹線
		let fileName = lang === "ja" ? "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/senku/senku_24.json?" : "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/senku/senku_24_" + lang + ".json?";
		$.getJSON(fileName + now, function (topData) {
			if (topData.today.areaStatus.shin == "1") {
				// 運行情報が存在する場合
				let areaName = getAreaName("06");
				$("#unkouInfo").show();
				$("#titleAreaName").text(areaName);
				$("#senkuList").show();
				$("#commonSenkuOperation").show();
				$("#senkuListAreaName").text(areaName);
				$("#gaikyoAreaName").text(areaName);

				// 線区別運行情報リストを作成
				let html ="<ul>";
				html += create_list(topData.today.areaStatus.shin, "24");
				html += "</ul>";
				$("#commonSenkuOperation").html(html);

				// 本日分の概況
				if (topData.today.gaikyo.length > 0 || topData.today.areaComments.length > 0 || topData.today.senkuComments.length > 0) {
					// 概況のリストを作成
					create_gaikyo(topData.today.gaikyo);

					// エリアコメントのリストを作成する
					topData.today.areaComments.forEach(row => {
						let today_area_comments = "";
						today_area_comments += "<div>" + row.comment + "</div>";
						$("#dialogGaikyo .gaikyo-frame").append(today_area_comments);
					});

					// 線区コメントのリストを作成する（本日分）
					topData.today.senkuComments.forEach(row => {
						let today_senku_comments = "";
						today_senku_comments += "<div>" + row.comment + "</div>";
						$("#dialogGaikyo .gaikyo-frame").append(today_senku_comments);
					});
				} else {
					$("#dialogGaikyo .gaikyo-frame").html("<span>" + get_gaikyo_info_message() + "</span>");
				}
			} else {
				$("#unkouInfo").hide();
			}
		})
		.fail(function() {
			var errormessage = `<h2 class='msg-bg'>${get_error_message()}</h2>`;
			$('#message').html(errormessage);
			$('#message').show();
		});
	} else {
		$("#unkouInfo").hide();
	}
}

function set_dokotre_unko_info(_param_rosen, _now, _lang) {
	const configMap = {
		"57": {
			"areaCode": "1",
			"areaName": "\u5c71\u5f62\u65b0\u5e79\u7dda",
			"items": [
				{ "lineId": "902", "name": "\u5965\u7fbd\u672c\u7dda\uff08\u5c71\u5f62\u7dda\uff09", "filter": "yamagata" }
			]
		},
		"58": {
			"areaCode": "1",
			"areaName": "\u79cb\u7530\u65b0\u5e79\u7dda",
			"items": [
				{ "lineId": "110", "name": "\u7530\u6ca2\u6e56\u7dda" },
				{ "lineId": "902", "name": "\u5965\u7fbd\u672c\u7dda", "filter": "akita" }
			]
		}
	};
	const config = configMap[String(_param_rosen || "")];
	if (!config) return false;

	get_dokotre_delay_info_request(config.areaCode, _now)
		.done((data) => {
			const groupedItems = config.items.map((itemConfig) => {
				const items = get_dokotre_delay_info_items(data, itemConfig.lineId)
					.filter((item) => is_dokotre_delay_info_target(item, itemConfig.filter));
				return Object.assign({}, itemConfig, { "items": items });
			});
			const gaikyoItems = groupedItems.reduce((list, group) => list.concat(group.items), []);

			if (gaikyoItems.length < 1) {
				$("#unkouInfo").hide();
				return;
			}

			$("#unkouInfo").show();
			$("#titleAreaName").text(config.areaName);
			$("#senkuList").show();
			$("#commonSenkuOperation").show();
			$("#senkuListAreaName").text(config.areaName);
			$("#gaikyoAreaName").text(config.areaName);
			create_gaikyo(gaikyoItems.map(convert_dokotre_delay_info_gaikyo));

			let html = "<ul>";
			groupedItems.forEach((group) => {
				html += create_dokotre_unko_list(group.name, group.items);
			});
			html += "</ul>";
			$("#commonSenkuOperation").html(html);
		})
		.fail(() => {
			$("#unkouInfo").hide();
		});

	return true;
}

function get_dokotre_delay_info_request(areaCode, now) {
	const remoteUrl = "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://doko-train.jp/json/trainstatus/delay_info/" + areaCode + "/delay_info.json?" + now;
	if (typeof get_testable_json_request === "function" && typeof get_test_urls === "function") {
		return get_testable_json_request(get_test_urls("dokotre/delay_info_" + areaCode + ".json?" + now), remoteUrl);
	}
	return $.getJSON(remoteUrl);
}

function get_dokotre_delay_info_items(data, lineId) {
	const lineInfo = data && Array.isArray(data.LINE_INFO) ? data.LINE_INFO[0] : null;
	const rows = lineInfo && lineInfo[String(lineId)] ? lineInfo[String(lineId)] : [];
	return Array.isArray(rows) ? rows : [];
}

function is_dokotre_delay_info_target(item, filter) {
	if (!filter) return true;
	const lineName = get_dokotre_text(item && item.LINE_NAME);
	const text = [
		lineName,
		get_dokotre_text(item && item.TEXT),
		get_dokotre_text(item && item.FROM),
		get_dokotre_text(item && item.TO)
	].join(" ");
	if (filter === "yamagata") {
		if (lineName.indexOf("\u5c71\u5f62\u7dda") >= 0) return true;
		return contains_any_dokotre_word(text, [
			"\u798f\u5cf6", "\u7b39\u6728\u91ce", "\u5ead\u5742", "\u677f\u8c37", "\u5ce0", "\u5927\u6ca2", "\u95a2\u6839", "\u7c73\u6ca2",
			"\u7f6e\u8cdc", "\u9ad8\u7551", "\u8d64\u6e6f", "\u4e2d\u5ddd", "\u7fbd\u524d\u4e2d\u5c71", "\u304b\u307f\u306e\u3084\u307e\u6e29\u6cc9",
			"\u8302\u5409\u8a18\u5ff5\u9928\u524d", "\u8535\u738b", "\u5c71\u5f62", "\u5317\u5c71\u5f62", "\u7fbd\u524d\u5343\u6b73",
			"\u5357\u51fa\u7fbd", "\u6f06\u5c71", "\u9ad8\u64c1", "\u5929\u7ae5", "\u4e71\u5ddd", "\u795e\u753a", "\u3055\u304f\u3089\u3093\u307c\u6771\u6839",
			"\u6771\u6839", "\u6751\u5c71", "\u8896\u5d0e", "\u5927\u77f3\u7530", "\u5317\u5927\u77f3\u7530", "\u82a6\u6ca2", "\u821f\u5f62", "\u65b0\u5e84"
		]);
	}
	if (filter === "akita") {
		if (lineName.indexOf("\u5c71\u5f62\u7dda") >= 0) return false;
		return contains_any_dokotre_word(text, [
			"\u5927\u66f2", "\u795e\u5bae\u5bfa", "\u5208\u548c\u91ce", "\u5cf0\u5409\u5ddd", "\u7fbd\u5f8c\u5883",
			"\u548c\u7530", "\u56db\u30c4\u5c0f\u5c4b", "\u79cb\u7530", "\u516b\u90ce\u6f5f", "\u8ffd\u5206"
		]);
	}
	return true;
}

function contains_any_dokotre_word(text, words) {
	return words.some((word) => text.indexOf(word) >= 0);
}

function convert_dokotre_delay_info_gaikyo(item) {
	return {
		"time": format_dokotre_delay_info_time(item && item.UPDATED),
		"title": [get_dokotre_text(item && item.LINE_NAME), get_dokotre_text(item && item.STATUS)].filter(Boolean).join(" "),
		"honbun": get_dokotre_text(item && item.TEXT),
		"eikyo": {
			"spo": 0,
			"doo": 0,
			"donan": 0,
			"dohoku": 0,
			"doto": 0
		}
	};
}

function create_dokotre_unko_list(name, items) {
	const status = get_dokotre_info_status(items);
	let html = "<li>";
	html += "<div class='common-button'>";
	html += "<span class='name'>" + escape_dokotre_info_html(name) + "</span>";
	html += "<img class='unkou-icon' alt='' src='" + get_dokotre_info_icon(status) + "'/>";
	html += "</div>";
	html += "</li>";
	return html;
}

function get_dokotre_info_status(items) {
	if (!Array.isArray(items) || items.length < 1) return "0";
	if (items.some((item) => {
		const status = get_dokotre_text(item && item.STATUS);
		return status.indexOf("\u904b\u4f11") >= 0 || status.indexOf("\u898b\u5408") >= 0;
	})) return "2";
	return "1";
}

function get_dokotre_info_icon(status) {
	if (status === "2") return "./images/home/03.svg";
	if (status === "1") return "./images/home/02.svg";
	return "./images/home/01.svg";
}

function format_dokotre_delay_info_time(value) {
	const date = new Date(String(value || "").replace(/-/g, "/"));
	if (Number.isNaN(date.getTime())) return "";
	const lang = document.documentElement.dataset.lang;
	if (lang === "en") {
		return (date.getMonth() + 1).toString().padStart(2, "0") + "/" +
			date.getDate().toString().padStart(2, "0") + " " +
			date.getHours().toString().padStart(2, "0") + ":" +
			date.getMinutes().toString().padStart(2, "0");
	}
	return date.getDate().toString().padStart(2, "0") + "\u65e5 " +
		date.getHours().toString().padStart(2, "0") + "\u6642" +
		date.getMinutes().toString().padStart(2, "0") + "\u5206";
}

function get_dokotre_text(value) {
	return value === null || typeof value === "undefined" ? "" : String(value);
}

function escape_dokotre_info_html(text) {
	return String(text || "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function set_merged_unko_info(_param_rosen, _now, _lang) {
	const mergedAreaMap = {
		"51": ["01", "02"],
		"52": ["01", "02", "03"],
		"53": ["01", "05"]
	};
	const targetAreas = mergedAreaMap[_param_rosen];
	if (!targetAreas) return false;

	const areaConfigs = {
		"01": {
			"fileName": _lang === "ja" ? "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/area/area_01.json?" : "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/area/area_01_" + _lang + ".json?",
			"statusKey": "spo",
			"areaName": getAreaName("01"),
			"senkus": [["express", "01"], ["airport", "02"], ["hakochise", "03"], ["gakuen", "04"]]
		},
		"02": {
			"fileName": _lang === "ja" ? "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/area/area_02.json?" : "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/area/area_02_" + _lang + ".json?",
			"statusKey": "doo",
			"areaName": getAreaName("02"),
			"senkus": [["express", "05"], ["airport", "06"], ["hakochise", "07"], ["gakuen", "08"], ["muroran", "09"], ["hidaka", "10"]]
		},
		"03": {
			"fileName": _lang === "ja" ? "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/area/area_03.json?" : "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/area/area_03_" + _lang + ".json?",
			"statusKey": "donan",
			"areaName": getAreaName("03"),
			"senkus": [["express", "11"], ["hakodateLiner", "12"], ["hakodate", "13"]]
		},
		"05": {
			"fileName": _lang === "ja" ? "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/area/area_05.json?" : "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/area/area_05_" + _lang + ".json?",
			"statusKey": "doto",
			"areaName": getAreaName("05"),
			"senkus": [["express", "19"], ["sekisho", "20"], ["nemuro", "21"], ["hanasaki", "22"], ["senmo", "23"]]
		}
	};

	Promise.all(targetAreas.map((areaKey) => {
		const config = areaConfigs[areaKey];
		if (!config) return Promise.resolve(null);
		return new Promise((resolve) => {
			$.getJSON(config.fileName + _now, function(topData) {
				resolve({
					"config": config,
					"data": topData
				});
			}).fail(function() {
				resolve(null);
			});
		});
	})).then((results) => {
		const activeResults = results.filter((result) => {
			return result && result.data && result.data.today && result.data.today.areaStatus && result.data.today.areaStatus[result.config.statusKey] == "1";
		});
		if (activeResults.length < 1) {
			$("#unkouInfo").hide();
			return;
		}

		const areaNames = activeResults.map((result) => result.config.areaName);
		const titleAreaName = areaNames.join("・");
		$("#unkouInfo").show();
		$("#titleAreaName").text(titleAreaName);
		$("#senkuList").show();
		$("#commonSenkuOperation").show();
		$("#senkuListAreaName").text(titleAreaName);
		$("#gaikyoAreaName").text(titleAreaName);

		let html = "";
		activeResults.forEach((result) => {
			html += "<div class='merged-area-operation'>";
			html += "<div class='merged-area-operation-title'>" + result.config.areaName + "</div>";
			html += "<ul>";
			result.config.senkus.forEach((senkuInfo) => {
				const status = result.data.today.senkuStatus ? result.data.today.senkuStatus[senkuInfo[0]] : undefined;
				html += create_list(status, senkuInfo[1]);
			});
			html += "</ul>";
			html += "</div>";
		});
		$("#commonSenkuOperation").html(html);

		const gaikyoList = [];
		const gaikyoSet = new Set();
		const commentSet = new Set();
		let hasComment = false;
		activeResults.forEach((result) => {
			if (!Array.isArray(result.data.today.gaikyo)) return;
			result.data.today.gaikyo.forEach((row) => {
				const key = [
					row && row.time ? row.time : "",
					row && row.title ? row.title : "",
					row && row.honbun ? row.honbun : ""
				].join("||");
				if (gaikyoSet.has(key)) return;
				gaikyoSet.add(key);
				gaikyoList.push(row);
			});
		});
		if (gaikyoList.length > 0) {
			create_gaikyo(gaikyoList);
		} else {
			$("#dialogGaikyo .gaikyo-frame").empty();
		}
		activeResults.forEach((result) => {
			if (Array.isArray(result.data.today.areaComments)) {
				result.data.today.areaComments.forEach((row) => {
					if (!row || !row.comment || commentSet.has(row.comment)) return;
					commentSet.add(row.comment);
					hasComment = true;
					$("#dialogGaikyo .gaikyo-frame").append("<div>" + row.comment + "</div>");
				});
			}
		});
		if (gaikyoList.length < 1 && !hasComment) {
			$("#dialogGaikyo .gaikyo-frame").html("<span>" + get_gaikyo_info_message() + "</span>");
		}
	});

	return true;
}

/*
 * 線区別運行情報リストを作成する。
 */
function create_list(_status, _senku) {
	function set_icon(_status) {
		if (_status == "2") return "./images/home/03.svg";
		else if (_status == "1") return "./images/home/02.svg";
		else return "./images/home/01.svg";
	}
	let lang = document.documentElement.dataset.lang;
	let senkuName = getSenkuName(_senku);
	var html = "<li>";
	html += "<div class='common-button'>";
	html += "<span class='name'>" + senkuName + "</span>";
	html += "<img id='senkuStatus" + _senku + "' class='unkou-icon' alt=''";
	html += "src='" + set_icon(_status) + "'/>";

	if (lang == "ja") html += "<a class='common-button-link' href='https://www3.jrhokkaido.co.jp/webunkou/senku.html?id=" + _senku;
	else html += "<a class='common-button-link' href='https://www3.jrhokkaido.co.jp/webunkou/senku_" + lang + ".html?id=" + _senku;

	html += "' title='" + senkuName + "'></a>";
	html += "</div>";
	html += "</li>";
	return html;
}

/*
 * JSONデータ内の概況からリストを作成する。
 */
function create_gaikyo(_gaikyoArray) {
	$("#dialogGaikyo .gaikyo-frame").empty();
	_gaikyoArray.forEach(row => {
		var gaikyo_html = "";
		gaikyo_html += create_gaikyo_html(row);
		$("#dialogGaikyo .gaikyo-frame").append(gaikyo_html);
	});
	function create_gaikyo_html(_row) {
		var gaikyo_html = "<ul class='gaikyo-list'>";
		if (_row.time) gaikyo_html += "<li>" + _row.time + "</li>";
		if (_row.title) gaikyo_html += "<li>" + _row.title + "</li>";
		if (_row.honbun) gaikyo_html += "<li>" + _row.honbun + "</li>";

		var area_html = '';
		let lang = document.documentElement.dataset.lang;
		if (lang == "ja") {
			if (_row.eikyo.spo == 1)	area_html += "<li class='common-color-red gaikyo-list-area'>札幌近郊</li>"
			if (_row.eikyo.doo == 1)	area_html += "<li class='common-color-red gaikyo-list-area'>道央エリア</li>"
			if (_row.eikyo.donan == 1)	area_html += "<li class='common-color-red gaikyo-list-area'>道南エリア</li>"
			if (_row.eikyo.dohoku == 1)	area_html += "<li class='common-color-red gaikyo-list-area'>道北エリア</li>"
			if (_row.eikyo.doto == 1)	area_html += "<li class='common-color-red gaikyo-list-area'>道東エリア</li>"

			if (area_html.length > 0) {
				gaikyo_html += "<li class='common-color-red'>※以下のエリアに影響があります。</li>";
				gaikyo_html += area_html;
			}
		}
		if (lang == "en") {
			if (_row.eikyo.spo == 1)	area_html += "<li class='common-color-red gaikyo-list-area'>Sapporo area</li>"
			if (_row.eikyo.doo == 1)	area_html += "<li class='common-color-red gaikyo-list-area'>Central Hokkaido area</li>"
			if (_row.eikyo.donan == 1)	area_html += "<li class='common-color-red gaikyo-list-area'>Southern Hokkaido area</li>"
			if (_row.eikyo.dohoku == 1)	area_html += "<li class='common-color-red gaikyo-list-area'>Northern Hokkaido area</li>"
			if (_row.eikyo.doto == 1)	area_html += "<li class='common-color-red gaikyo-list-area'>Eastern Hokkaido area</li>"

			if (area_html.length > 0) {
				gaikyo_html += "<li class='common-color-red'>*The affected area(s) is (are) as follows:</li>";
				gaikyo_html += area_html;
			}
		}
		if (lang == "tc") {
			if (_row.eikyo.spo == 1)	area_html += "<li class='common-color-red gaikyo-list-area'>札幌近郊</li>"
			if (_row.eikyo.doo == 1)	area_html += "<li class='common-color-red gaikyo-list-area'>道央區域</li>"
			if (_row.eikyo.donan == 1)	area_html += "<li class='common-color-red gaikyo-list-area'>道南區域</li>"
			if (_row.eikyo.dohoku == 1)	area_html += "<li class='common-color-red gaikyo-list-area'>道北區域</li>"
			if (_row.eikyo.doto == 1)	area_html += "<li class='common-color-red gaikyo-list-area'>道東區域</li>"

			if (area_html.length > 0) {
				gaikyo_html += "<li class='common-color-red'>※以下區域受到影響。</li>";
				gaikyo_html += area_html;
			}
		}
		if (lang == "sc") {
			if (_row.eikyo.spo == 1)	area_html += "<li class='common-color-red gaikyo-list-area'>札幌近郊</li>"
			if (_row.eikyo.doo == 1)	area_html += "<li class='common-color-red gaikyo-list-area'>道央区域</li>"
			if (_row.eikyo.donan == 1)	area_html += "<li class='common-color-red gaikyo-list-area'>道南区域</li>"
			if (_row.eikyo.dohoku == 1)	area_html += "<li class='common-color-red gaikyo-list-area'>道北区域</li>"
			if (_row.eikyo.doto == 1)	area_html += "<li class='common-color-red gaikyo-list-area'>道东区域</li>"

			if (area_html.length > 0) {
				gaikyo_html += "<li class='common-color-red'>※以下区域受到影响。</li>";
				gaikyo_html += area_html;
			}
		}
		if (lang == "kr") {
			if (_row.eikyo.spo == 1)	area_html += "<li class='common-color-red gaikyo-list-area'>삿포로 근교</li>"
			if (_row.eikyo.doo == 1)	area_html += "<li class='common-color-red gaikyo-list-area'>홋카이도 중부지역</li>"
			if (_row.eikyo.donan == 1)	area_html += "<li class='common-color-red gaikyo-list-area'>홋카이도 남부지역</li>"
			if (_row.eikyo.dohoku == 1)	area_html += "<li class='common-color-red gaikyo-list-area'>홋카이도 북부지역</li>"
			if (_row.eikyo.doto == 1)	area_html += "<li class='common-color-red gaikyo-list-area'>홋카이도 동부지역</li>"

			if (area_html.length > 0) {
				gaikyo_html += "<li class='common-color-red'>※아래 지역에 영향이 있습니다.</li>";
				gaikyo_html += area_html;
			}
		}

		gaikyo_html += "</ul>"
		return gaikyo_html;
	}
}

/*
 * 各言語の「現在、遅れに関する情報はありません。」に該当するメッセージを取得します。
 */
function get_gaikyo_info_message() {
	let lang = document.documentElement.dataset.lang;
	let message = "";
	if (lang == "ja") message = "現在、遅れに関する情報はありません。";
	if (lang == "en") message = "No information for delays";
	if (lang == "tc") message = "目前沒有延遲訊息";
	if (lang == "sc") message = "目前沒有延遲信息";
	if (lang == "kr") message = "현재 지연에 관한 정보가 없습니다.";

	return message;
}
