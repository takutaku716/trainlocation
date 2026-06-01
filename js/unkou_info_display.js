/*
 * フッターの運行情報に表示する情報を設定する。
 */
function set_unko_info(_param_rosen) {
	let now = Date.now() >>> 10;
	let lang = document.documentElement.dataset.lang;
	if (set_merged_unko_info(_param_rosen, now, lang)) return;
	if (set_dokotre_unko_info(_param_rosen, now, lang)) return;
	if (set_jr_shinkansen_unko_info(_param_rosen, now, lang)) return;

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

function set_jr_shinkansen_unko_info(_param_rosen, _now, _lang) {
	const rosen = String(_param_rosen || "");
	if (rosen !== "59" && rosen !== "60") return false;
	const areaName = "\u65b0\u5e79\u7dda";

	const groupLoaders = rosen === "60" ? [
		{
			"name": "\u897f\u4e5d\u5dde\u65b0\u5e79\u7dda",
			"request": get_jr_kyushu_shinkansen_unko_info_request(_now),
			"parser": (data) => get_jr_kyushu_shinkansen_notice_list(data, "Nishi-Kyushu-Shinkansen", "\u897f\u4e5d\u5dde\u65b0\u5e79\u7dda"),
			"converter": convert_jr_kyushu_shinkansen_notice_gaikyo
		}
	] : [
		{
			"name": "\u6771\u6d77\u9053\u65b0\u5e79\u7dda",
			"request": get_jr_central_shinkansen_unko_info_request(_now),
			"parser": get_jr_central_shinkansen_notice_list,
			"converter": convert_jr_central_shinkansen_notice_gaikyo
		},
		{
			"name": "\u5c71\u967d\u65b0\u5e79\u7dda",
			"request": get_jr_west_shinkansen_unko_info_request(_now),
			"parser": get_jr_west_shinkansen_notice_list,
			"converter": convert_jr_west_shinkansen_notice_gaikyo
		},
		{
			"name": "\u4e5d\u5dde\u65b0\u5e79\u7dda",
			"request": get_jr_kyushu_shinkansen_unko_info_request(_now),
			"parser": (data) => get_jr_kyushu_shinkansen_notice_list(data, "Kyushu-Shinkansen", "\u4e5d\u5dde\u65b0\u5e79\u7dda"),
			"converter": convert_jr_kyushu_shinkansen_notice_gaikyo
		}
	];

	Promise.all(groupLoaders.map((group) => {
		return get_jr_shinkansen_notice_promise(group.request, group.parser);
	})).then((noticeGroups) => {
			const groups = groupLoaders.map((group, index) => {
				return {
					"name": group.name,
					"notices": noticeGroups[index],
					"converter": group.converter
				};
			});
			const activeGroups = groups.filter((group) => group.notices.length > 0);
			if (activeGroups.length < 1) {
				$("#unkouInfo").hide();
				return;
			}

			$("#unkouInfo").show();
			$("#titleAreaName").text(areaName);
			$("#senkuList").show();
			$("#commonSenkuOperation").show();
			$("#senkuListAreaName").text(areaName);
			$("#gaikyoAreaName").text(areaName);
			create_gaikyo(activeGroups.reduce((list, group) => {
				return list.concat(group.notices.map(group.converter));
			}, []));

			let html = "<ul>";
			activeGroups.forEach((group) => {
				html += create_jr_shinkansen_unko_list(group.name, group.notices);
			});
			html += "</ul>";
			$("#commonSenkuOperation").html(html);
		});

	return true;
}

function get_jr_shinkansen_notice_promise(request, parser) {
	return new Promise((resolve) => {
		request
			.done((data) => resolve(parser(data)))
			.fail(() => resolve([]));
	});
}

function get_jr_central_shinkansen_unko_info_request(now) {
	const remoteUrl = "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://traininfo.jr-central.co.jp/shinkansen/var/train_info/ti01_ja.json?" + now;
	if (typeof get_testable_json_request === "function" && typeof get_test_urls === "function") {
		return get_testable_json_request(get_test_urls("jr_central/ti01_ja.json?" + now), remoteUrl);
	}
	return $.getJSON(remoteUrl);
}

function get_jr_west_shinkansen_unko_info_request(now) {
	const remoteUrl = "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://trafficinfo.westjr.co.jp/api/v1/trafficinfo.json?" + now;
	if (typeof get_testable_json_request === "function" && typeof get_test_urls === "function") {
		return get_testable_json_request(get_test_urls("jr_west/trafficinfo.json?" + now), remoteUrl);
	}
	return $.getJSON(remoteUrl);
}

function get_jr_kyushu_shinkansen_unko_info_request(now) {
	const remoteUrl = "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www.jrkyushu.co.jp/trains/info/data/IDS2Web.xml?" + now;
	return $.ajax({
		"url": remoteUrl,
		"type": "GET",
		"dataType": "xml",
		"timeout": 5000
	});
}

function get_jr_central_shinkansen_notice_list(data) {
	const notices = data && data.screen && Array.isArray(data.screen.noticeList) ? data.screen.noticeList : [];
	return notices.filter((notice) => {
		return get_dokotre_text(notice && notice.noticeTitle) || get_dokotre_text(notice && notice.contents);
	});
}

function get_jr_kyushu_shinkansen_notice_list(data, targetAreaName, displayAreaName) {
	const xmlData = typeof data === "string" ? $.parseXML(data) : data;
	const target = $(xmlData).find("aif").filter(function() {
		return $(this).children("nm").first().text() === targetAreaName;
	}).first();
	if (target.length < 1 || target.children("sts").first().text() !== "1") return [];

	const notices = [];
	target.children("eif").each(function() {
		const row = $(this);
		const text = row.children("txt").first().text();
		if (!text) return;
		const lineNames = row.children("lin").map(function() {
			return $(this).children("nm").first().text();
		}).get().filter(Boolean);
		notices.push({
			"areaName": displayAreaName,
			"lineName": lineNames.join("\u30fb"),
			"time": row.children("time").first().text(),
			"text": text
		});
	});
	return notices;
}

function get_jr_west_shinkansen_notice_list(data) {
	const area = data && Array.isArray(data.areaTrafficInfos) ? data.areaTrafficInfos.find((row) => Number(row && row.id) === 4) : null;
	const today = area && Array.isArray(area.dailyData) ? area.dailyData[0] : null;
	const places = today && Array.isArray(today.placeTrafficInfos) ? today.placeTrafficInfos : [];
	const notices = [];
	places.forEach((place) => {
		if (Array.isArray(place.noEffectLineTrafficInfos)) {
			place.noEffectLineTrafficInfos.forEach((row) => {
				const detail = get_jr_west_latest_version_detail(row && row.versionDetail);
				if (!detail) return;
				notices.push({
					"lineName": "\u5c71\u967d\u65b0\u5e79\u7dda",
					"iconType": "0000",
					"cause": row && row.cause,
					"supplementary": row && row.supplementary,
					"updatedAt": detail.updatedAt || row.publicationDate,
					"title": detail.title,
					"body": detail.body
				});
			});
		}
		if (Array.isArray(place.shinkansenTrafficInfos)) {
			place.shinkansenTrafficInfos.forEach((line) => {
				const lineName = get_jr_west_shinkansen_line_name(data, line && line.id) || "\u5c71\u967d\u65b0\u5e79\u7dda";
				const details = Array.isArray(line && line.shinkansenTrafficInfoDetails) ? line.shinkansenTrafficInfoDetails : [];
				details.forEach((row) => {
					const detail = get_jr_west_latest_version_detail(row && row.versionDetail);
					if (!detail) return;
					notices.push({
						"lineName": lineName,
						"iconType": row && row.iconType,
						"cause": row && row.cause,
						"supplementary": row && row.supplementary,
						"updatedAt": detail.updatedAt || row.publicationDate,
						"title": detail.title,
						"body": detail.body
					});
				});
			});
		}
	});
	return notices.filter((notice) => get_dokotre_text(notice.title) || get_dokotre_text(notice.body));
}

function get_jr_west_latest_version_detail(details) {
	if (!Array.isArray(details) || details.length < 1) return null;
	return details[0];
}

function get_jr_west_shinkansen_line_name(data, lineId) {
	const area = data && data.masterData && Array.isArray(data.masterData.areas) ? data.masterData.areas.find((row) => Number(row && row.id) === 4) : null;
	if (!area || !Array.isArray(area.places)) return "";
	for (const place of area.places) {
		if (!Array.isArray(place.lines)) continue;
		const line = place.lines.find((row) => String(row && row.id) === String(lineId));
		if (line) return line.name || "";
	}
	return "";
}

function convert_jr_central_shinkansen_notice_gaikyo(notice) {
	return {
		"time": get_jr_central_shinkansen_notice_time(notice && notice.noticeTitle),
		"title": escape_dokotre_info_html(get_dokotre_text(notice && notice.noticeTitle)),
		"honbun": sanitize_jr_central_shinkansen_notice_html(notice && notice.contents, notice && notice.links),
		"eikyo": {
			"spo": 0,
			"doo": 0,
			"donan": 0,
			"dohoku": 0,
			"doto": 0
		}
	};
}

function convert_jr_kyushu_shinkansen_notice_gaikyo(notice) {
	const title = [
		get_dokotre_text(notice && notice.areaName),
		get_dokotre_text(notice && notice.lineName)
	].filter(Boolean).join(" ");
	return {
		"time": format_jr_kyushu_shinkansen_notice_time(notice && notice.time),
		"title": escape_dokotre_info_html(title),
		"honbun": sanitize_jr_kyushu_shinkansen_notice_text(notice && notice.text),
		"eikyo": {
			"spo": 0,
			"doo": 0,
			"donan": 0,
			"dohoku": 0,
			"doto": 0
		}
	};
}

function convert_jr_west_shinkansen_notice_gaikyo(notice) {
	const title = [
		get_dokotre_text(notice && notice.lineName),
		get_dokotre_text(notice && notice.supplementary) || get_dokotre_text(notice && notice.title)
	].filter(Boolean).join(" ");
	return {
		"time": format_jr_west_shinkansen_notice_time(notice && notice.updatedAt),
		"title": escape_dokotre_info_html(title),
		"honbun": sanitize_jr_west_shinkansen_notice_text(notice && notice.body),
		"eikyo": {
			"spo": 0,
			"doo": 0,
			"donan": 0,
			"dohoku": 0,
			"doto": 0
		}
	};
}

function create_jr_shinkansen_unko_list(name, notices) {
	const status = get_jr_shinkansen_info_status(notices);
	let html = "<li>";
	html += "<div class='common-button'>";
	html += "<span class='name'>" + escape_dokotre_info_html(name) + "</span>";
	html += "<img class='unkou-icon' alt='' src='" + get_dokotre_info_icon(status) + "'/>";
	html += "</div>";
	html += "</li>";
	return html;
}

function get_jr_shinkansen_info_status(notices) {
	const text = (Array.isArray(notices) ? notices : []).map((notice) => {
		return [
			get_dokotre_text(notice && notice.noticeTitle),
			get_dokotre_text(notice && notice.contents),
			get_dokotre_text(notice && notice.supplementary),
			get_dokotre_text(notice && notice.title),
			get_dokotre_text(notice && notice.body),
			get_dokotre_text(notice && notice.text)
		].join(" ");
	}).join(" ");
	if (text.indexOf("\u904b\u8ee2\u898b\u5408") >= 0 || text.indexOf("\u898b\u5408\u308f\u305b") >= 0 || text.indexOf("\u904b\u4f11") >= 0) return "2";
	return "1";
}

function get_jr_central_shinkansen_notice_time(title) {
	const text = get_dokotre_text(title);
	const match = text.match(/(\d{1,2})\u6708(\d{1,2})\u65e5(\d{1,2})\u6642(\d{1,2})\u5206/);
	if (!match) return "";
	return match[1].padStart(2, "0") + "\u6708" + match[2].padStart(2, "0") + "\u65e5 " +
		match[3].padStart(2, "0") + "\u6642" + match[4].padStart(2, "0") + "\u5206";
}

function format_jr_west_shinkansen_notice_time(value) {
	const date = new Date(String(value || ""));
	if (Number.isNaN(date.getTime())) return "";
	return (date.getMonth() + 1).toString().padStart(2, "0") + "\u6708" +
		date.getDate().toString().padStart(2, "0") + "\u65e5 " +
		date.getHours().toString().padStart(2, "0") + "\u6642" +
		date.getMinutes().toString().padStart(2, "0") + "\u5206";
}

function format_jr_kyushu_shinkansen_notice_time(value) {
	const text = get_dokotre_text(value);
	if (!/^\d{12,14}$/.test(text)) return "";
	return text.substring(0, 4) + "\u5e74" +
		text.substring(4, 6) + "\u6708" +
		text.substring(6, 8) + "\u65e5 " +
		text.substring(8, 10) + "\u6642" +
		text.substring(10, 12) + "\u5206\u66f4\u65b0";
}

function sanitize_jr_central_shinkansen_notice_html(contents, links) {
	let html = escape_dokotre_info_html(get_dokotre_text(contents)).replace(/&lt;br\s*\/?&gt;/gi, "<br>");
	if (Array.isArray(links) && links.length > 0) {
		const safeLinks = links
			.map((link) => sanitize_jr_central_shinkansen_notice_link(link))
			.filter(Boolean);
		if (safeLinks.length > 0) html += "<br><br>" + safeLinks.join("<br>");
	}
	return html;
}

function sanitize_jr_central_shinkansen_notice_link(linkHtml) {
	const wrapper = document.createElement("div");
	wrapper.innerHTML = get_dokotre_text(linkHtml);
	const anchor = wrapper.querySelector("a");
	if (!anchor) return "";
	const href = anchor.getAttribute("href") || "";
	if (!/^https:\/\/[^"\s]+$/i.test(href)) return "";
	const text = anchor.textContent || href;
	return "<a href='" + escape_dokotre_info_html(href) + "' target='_blank' rel='noopener noreferrer'>" +
		escape_dokotre_info_html(text) + "</a>";
}

function sanitize_jr_west_shinkansen_notice_text(text) {
	return escape_dokotre_info_html(get_dokotre_text(text)).replace(/\r?\n/g, "<br>");
}

function sanitize_jr_kyushu_shinkansen_notice_text(text) {
	return escape_dokotre_info_html(get_dokotre_text(text)).replace(/\r?\n/g, "<br>");
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
