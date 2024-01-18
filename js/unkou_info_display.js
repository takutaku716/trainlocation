/*
 * フッターの運行情報に表示する情報を設定する。
 */
function set_unko_info(_param_rosen) {
	let now = Date.now() >>> 10;
	let lang = document.documentElement.dataset.lang;

	if (_param_rosen == "01" || _param_rosen == "02" || _param_rosen == "03") {
		// 札幌近郊
		let fileName = lang === "ja" ? "https://corsproxy.org/?https://www3.jrhokkaido.co.jp/webunkou/json/area/area_01.json?" : "https://corsproxy.org/?https://www3.jrhokkaido.co.jp/webunkou/json/area/area_01_" + lang + ".json?";
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
		let fileName = lang === "ja" ? "https://corsproxy.org/?https://www3.jrhokkaido.co.jp/webunkou/json/area/area_02.json?" : "https://corsproxy.org/?https://www3.jrhokkaido.co.jp/webunkou/json/area/area_02_" + lang + ".json?";
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
		let fileName = lang === "ja" ? "https://corsproxy.org/?https://www3.jrhokkaido.co.jp/webunkou/json/area/area_03.json?" : "https://corsproxy.org/?https://www3.jrhokkaido.co.jp/webunkou/json/area/area_03_" + lang + ".json?";
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
		let fileName = lang === "ja" ? "https://corsproxy.org/?https://www3.jrhokkaido.co.jp/webunkou/json/area/area_04.json?" : "https://corsproxy.org/?https://www3.jrhokkaido.co.jp/webunkou/json/area/area_04_" + lang + ".json?";
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
		let fileName = lang === "ja" ? "https://corsproxy.org/?https://www3.jrhokkaido.co.jp/webunkou/json/area/area_05.json?" : "https://corsproxy.org/?https://www3.jrhokkaido.co.jp/webunkou/json/area/area_05_" + lang + ".json?";
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
		let fileName = lang === "ja" ? "https://corsproxy.org/?https://www3.jrhokkaido.co.jp/webunkou/json/senku/senku_24.json?" : "https://corsproxy.org/?https://www3.jrhokkaido.co.jp/webunkou/json/senku/senku_24_" + lang + ".json?";
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