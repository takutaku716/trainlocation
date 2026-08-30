/**
 * ｢列車詳細情報｣ダイアログのタイトル。
 */
const DETAILED_TRAIN_INFORMATION_DIALOG_TITLES = {
	"ja": "列車詳細情報",
	"en": "Detailed train information",
	"tc": "列車詳細資訊",
	"sc": "列车详细信息",
	"kr": "열차 상세 정보"
};

$(function ($) {
	let lang = document.documentElement.dataset.lang;
	// 列車のアイコンをクリックしたときの動き
	$(document).on("click", ".ressha-icon .ressha", function() {
		const clickedItem = this;
		const clickedDataset = clickedItem.dataset;
		if (clickedDataset.jrkyushu_train_navi_request && clickedDataset.jrkyushu_timetable_loaded !== "1") {
			if (clickedDataset.jrkyushu_timetable_loading === "1") return;
			clickedDataset.jrkyushu_timetable_loading = "1";
			loading_animation_display();
			prepare_jrkyushu_train_navi_dataset(clickedDataset)
				.catch(function() {
					clickedDataset.jrkyushu_timetable = "[]";
					return null;
				})
				.then(function(response) {
					const targetItem = clickedItem.isConnected ? clickedItem : Array.from(document.querySelectorAll(".ressha-icon .ressha")).find(function(item) {
						return item.dataset.cbango === clickedDataset.cbango && item.dataset.source === clickedDataset.source;
					});
					if (!targetItem) {
						loading_animation_hidden();
						return;
					}
					if (response && targetItem !== clickedItem && window.JrKyushuTrainNaviAdapter) {
						window.JrKyushuTrainNaviAdapter.applyResponseToDataset(targetItem.dataset, response, document.documentElement.dataset.lang || "ja");
					} else {
						targetItem.dataset.jrkyushu_timetable = clickedDataset.jrkyushu_timetable || "[]";
					}
					targetItem.dataset.jrkyushu_timetable_loading = "0";
					targetItem.dataset.jrkyushu_timetable_loaded = "1";
					$(targetItem).trigger("click");
				});
			return;
		}
		if (clickedDataset.source === "jrcentral" && clickedDataset.jrcentral_timetable_loaded !== "1") {
			if (clickedDataset.jrcentral_timetable_loading === "1") return;
			clickedDataset.jrcentral_timetable_loading = "1";
			loading_animation_display();
			prepare_jrcentral_timetable_dataset(clickedDataset)
				.catch(function() {
					clickedDataset.jrcentral_timetable = "[]";
				})
				.then(function() {
					const trainKey = clickedDataset.jrcentral_train_key || "";
					const targetItem = clickedItem.isConnected ? clickedItem : Array.from(document.querySelectorAll(".ressha-icon .ressha")).find(function(item) {
						return item.dataset.source === "jrcentral" && item.dataset.jrcentral_train_key === trainKey;
					});
					if (!targetItem) {
						loading_animation_hidden();
						return;
					}
					targetItem.dataset.jrcentral_timetable = clickedDataset.jrcentral_timetable || "[]";
					targetItem.dataset.jrcentral_timetable_loading = "0";
					targetItem.dataset.jrcentral_timetable_loaded = "1";
					$(targetItem).trigger("click");
				});
			return;
		}
		let lang = document.documentElement.dataset.lang;
		// ローディングアニメーションを表示
		loading_animation_display();

		// 列車情報ダイアログに値を設定する。
		{
			let dataset = this.dataset;
			// ヘッダータイトル
			$("#headerTitle").text(DETAILED_TRAIN_INFORMATION_DIALOG_TITLES[lang]);
			// 列車種別名
			if (lang == "ja") {
				const typeName = dataset.ressha_type_name || "";
				const typeNameLength = Array.from(typeName).length;
				$("#resshaTypeName")
					.text(typeName)
					.toggleClass("long-label", typeNameLength >= 6)
					.toggleClass("very-long-label", typeNameLength >= 9);
			}
			// 行先
			$("#shuEki").html(dataset.shu_eki);
			// 両数
			$("#ryosu").html(dataset.ryosu);
			// 運行状態名
			$("#resshaDetailUnkouName").html(dataset.unkou_name);
			// 運行状態詳細
			$("#resshaDetailUnkouText").text(dataset.unkou_detail);
			if (dataset.unkou_detail === "─") { //運行状態詳細が「─」なら非表示にする
				$("#resshaDetailUnkouName").hide();
				$("#resshaDetailUnkouText").hide();

				if (dataset.chien_status == "0") {
					$("#dialogsSurface .text.pos").css("borderBottomWidth", "0px");
				} else {
					$("#dialogsSurface .text.pos").css("borderBottomWidth", "1px");
				}
			} else {
				$("#resshaDetailUnkouName").show();
				$("#resshaDetailUnkouText").show();
				$("#dialogsSurface .text.pos").css("borderBottomWidth", "1px");
			}
			// 列車種別コード
			if (lang == "ja") $("#resshaDetail").attr("dataResshaTypeColor", dataset.ressha_type);
			// 運行状態コード
			$("#resshaDetail").attr("dataUnkou", dataset.unkou);
			// 遅れ詳細
			$("#chienDetail").text(dataset.chien_text);
			// 抑止・停車中などの運行状況
			$("#yokuDetail").text(dataset.yoku_text || "");
			$("#trackTrainBtn").attr("data-cbango", dataset.cbango);
			const isTracking = get_param_cbango() === dataset.cbango;
			$("#trackTrainBtn").attr("data-tracking", isTracking ? "1" : "0");
			if (isTracking) {
				if (lang == "ja") $("#trackTrainBtn").text("追跡解除");
				if (lang == "en") $("#trackTrainBtn").text("Untrack");
				if (lang == "tc") $("#trackTrainBtn").text("解除追蹤");
				if (lang == "sc") $("#trackTrainBtn").text("解除追踪");
				if (lang == "kr") $("#trackTrainBtn").text("추적 해제");
			} else {
				if (lang == "ja") $("#trackTrainBtn").text("追跡");
				if (lang == "en") $("#trackTrainBtn").text("Track");
				if (lang == "tc") $("#trackTrainBtn").text("追蹤");
				if (lang == "sc") $("#trackTrainBtn").text("追踪");
				if (lang == "kr") $("#trackTrainBtn").text("추적");
			}

			if (dataset.chien_status == "0") {
				$("#chienIcon").hide();
				$("#chienDetail").hide();
				$("#dialogsSurface .text.chien").css("borderBottomWidth", "1px");
			} else {
				$("#chienIcon").show();
				$("#chienDetail").show();

				if (dataset.unkou_detail === "─") {
					$("#dialogsSurface .text.chien").css("borderBottomWidth", "0px");
				} else {
					$("#dialogsSurface .text.chien").css("borderBottomWidth", "1px");
				}
			}
			if (dataset.yoku_text) {
				$("#yokuIcon").show();
				$("#yokuDetail").show();
			} else {
				$("#yokuIcon").hide();
				$("#yokuDetail").hide();
			}
			const hasChien = dataset.chien_status != "0";
			const hasYoku = !!dataset.yoku_text;
			const hasUnkouDetail = dataset.unkou_detail !== "─";
			$("#dialogsSurface .text.pos").css("borderBottomWidth", hasChien || hasYoku || hasUnkouDetail ? "1px" : "0px");
			$("#dialogsSurface .text.chien").css("borderBottomWidth", hasYoku || hasUnkouDetail ? "1px" : "0px");
			$("#dialogsSurface .text.yoku").css("borderBottomWidth", hasUnkouDetail ? "1px" : "0px");

			let pos = dataset.pos;
			let senku = dataset.senku;
			let now = Date.now() >>> 16;
			//運行番号
			// 運行番号（列車番号のラベルと数値を分けて制御）
			$("#cbangoDetail").text(Object.prototype.hasOwnProperty.call(dataset, "display_cbango") ? dataset.display_cbango : dataset.cbango);
			$("#cbangoIcon").removeClass("hide");
			$("#cbangoDetail").removeClass("hide");

			if (dataset.source === "jreast" || dataset.source === "dokotre" || dataset.source === "jrshinkansen" || dataset.source === "jrwest" || dataset.source === "jrshikoku" || dataset.source === "jrcentral" || dataset.source === "jrkyushu" || dataset.jrkyushu_train_navi_request) {
				$("#unkouDetailMain").hide();
				$.getJSON("./original/location_master" + (lang === "ja" ? "" : "_" + lang) + ".json?" + now)
					.done(function(posNameMasterBase) {
						const posKey = String(dataset.pos || "").trim();
						$("#posDetailText").text(posNameMasterBase[posKey] || dataset.pos_name || posKey || "");
						$("#aisho").text(get_detail_train_name_text(dataset));
						create_jreast_daiya(dataset);
						$('#resshaDetailMessage').empty();
						$('#resshaDetailMessage').hide();
						$('#resshaDetailMain').show();
						$("#resshaDetail").fadeIn("fast");
						$("#teisyaTableArea").scrollTop(0);
						loading_animation_hidden();
					})
					.fail(function() {
						const posKey = String(dataset.pos || "").trim();
						$("#posDetailText").text(dataset.pos_name || posKey || "");
						$("#aisho").text(get_detail_train_name_text(dataset));
						create_jreast_daiya(dataset);
						$('#resshaDetailMessage').empty();
						$('#resshaDetailMessage').hide();
						$('#resshaDetailMain').show();
						$("#resshaDetail").fadeIn("fast");
						$("#teisyaTableArea").scrollTop(0);
						loading_animation_hidden();
					});
				set_scroll_hide($("#resshaDetail .dialog"));
				return;
			}

			$.when(
				$.getJSON("./original/location_master" + (lang === "ja" ? "" : "_" + lang) + ".json?" + now),
				$.getJSON("https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/master/eki_master.json?" + now),
				$.getJSON("https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/daiya/daiya_" + senku + (lang === "ja" ? "" : "_" + lang) + ".json?" + now)
			)
			.done(function(posNameMasterBase, ekiMasterBase, daiyaBase) {
				// 現在地
				$("#posDetailText").text(posNameMasterBase[0][pos]);
				// ダイヤデータ作成
				create_daiya(dataset, ekiMasterBase, daiyaBase);
				$('#resshaDetailMessage').empty();
				$('#resshaDetailMessage').hide();
				$('#resshaDetailMain').show();
				// 列車詳細ボックスを開く。
				$("#resshaDetail").fadeIn("fast");
				$("#teisyaTableArea").scrollTop(0);
			})
			.fail(function() {
				// JSONファイルの読み込みに失敗したときの処理
				$("#resshaDetailMessage").html(`<h3 class="ressha-detail-message">${get_error_message()}</h3>`);
				$("#resshaDetailMessage").show();
				$("#resshaDetailMain").hide();
				// 列車詳細ボックスを開く。
				$("#resshaDetail").fadeIn("fast");
				$("#teisyaTableArea").scrollTop(0);
			});
		}

		$("#unkouDetailMain").hide();
		// ダイアログを開くときのbodyのスクロールの制御
		set_scroll_hide($("#resshaDetail .dialog"));
	});

	// 運行情報をクリックしたときの動き
	$(document).on("click", "#unkouInfoBtn", function() {
		// ローディングアニメーションを表示
		loading_animation_display();
		// ヘッダータイトル
		if (lang == "ja") $("#headerTitle").text("列車運行情報");
		if (lang == "en") $("#headerTitle").text("Train Operation Information");
		if (lang == "tc") $("#headerTitle").text("列車運行狀態");
		if (lang == "sc") $("#headerTitle").text("列车运行信息");
		if (lang == "kr") $("#headerTitle").text("열차 운행 정보");

		// 運行詳細ボックスを開く。
		$("#resshaDetail").fadeIn("fast");
		$("#unkouDetailMain").scrollTop(0);
		$("#resshaDetailMain").hide();
		$("#unkouDetailMain").show();
		// ダイアログを開くときのbodyのスクロールの制御
		set_scroll_hide($("#resshaDetail .dialog"));
	});

	// 運行詳細ボックス内の｢閉じる｣ボタンをクリックしたときの動き
	$(document).on("click", "#resshaDetail, #resshaDetail .close", function() {
		// 運行情報ボックスを閉じる。
		$("#resshaDetail").fadeOut("fast");
		$('#resshaDetailMain').fadeOut("fast");
		$('#resshaDetailMessage').fadeOut("fast");
		// ダイアログを閉じたときのbodyのスクロールの制御
		set_scroll_show($("#resshaDetail .dialog"));
		// ローディングアニメーションを非表示
		loading_animation_hidden();
	});

	// バブリングを停止
	$(document).on("click", "#resshaDetail .dialog", function(event) {
		event.stopPropagation();
	});

	$(document).on("click", "#trackTrainBtn", function(event) {
		event.preventDefault();
		event.stopPropagation();
		const cbango = $(this).attr("data-cbango");
		const rosen = get_param_rosen();
		const isTracking = $(this).attr("data-tracking") === "1";
		if (!cbango || !rosen) return;
		$("#resshaDetail").fadeOut("fast");
		$('#resshaDetailMain').fadeOut("fast");
		$('#resshaDetailMessage').fadeOut("fast");
		set_scroll_show($("#resshaDetail .dialog"));
		if (isTracking) {
			if (typeof preserve_scroll_after_hash_change === "function") preserve_scroll_after_hash_change();
			location.hash = "rosen=" + rosen;
			return;
		}
		if (typeof suppress_track_scroll_once === "function") suppress_track_scroll_once();
		location.hash = "rosen=" + rosen + "&cbango=" + cbango;
	});
});

function get_detail_train_name_text(_dataset) {
	const baseText = _dataset.aisho || _dataset.ressha_type_name || "";
	const typeChange = _dataset.source === "jrwest" ? (_dataset.jrwest_type_change || "") : "";
	return [baseText, typeChange].filter(Boolean).join("　");
}

/*
 * JR東日本形式の時刻表データを表示する
 */
function create_jreast_daiya(_dataset) {
	$("#teisyaTableArea div").empty();
	let timetable = [];
	try {
		const timetableText =
			_dataset.source === "dokotre" ? _dataset.dokotre_timetable :
			_dataset.source === "jrshinkansen" ? _dataset.jrshinkansen_timetable :
			_dataset.source === "jrwest" ? _dataset.jrwest_timetable :
			_dataset.source === "jrshikoku" ? _dataset.jrshikoku_timetable :
			_dataset.source === "jrcentral" ? _dataset.jrcentral_timetable :
			_dataset.source === "jrkyushu" || _dataset.jrkyushu_train_navi_request ? _dataset.jrkyushu_timetable :
			_dataset.jreast_timetable;
		timetable = JSON.parse(timetableText || "[]");
	} catch (_error) {
		timetable = [];
	}
	timetable = unique_jreast_timetable_rows(timetable);

	let lang = document.documentElement.dataset.lang;
	const chien = Number(_dataset.chien || 0);
	const hasDelay = chien > 0;
	$("#teisyaTableArea .adjusted-notice").toggle(hasDelay);

	if (!Array.isArray(timetable) || timetable.length < 1) return;

	let html = "<table id='teisyaTable' border='1' width='80%'>";
	if (hasDelay) {
		if (lang == "ja") html += "<tr><th width='50%'>停車駅</th><th width='25%'>定刻</th><th width='25%'>遅延考慮</th></tr>";
		if (lang == "en") html += "<tr><th width='50%'>Stops</th><th width='25%'>Scheduled time</th><th width='25%'>Adjusted</th></tr>";
		if (lang == "tc") html += "<tr><th width='50%'>停靠站</th><th width='25%'>準點</th><th width='25%'>延遲後</th></tr>";
		if (lang == "sc") html += "<tr><th width='50%'>停靠站</th><th width='25%'>准点</th><th width='25%'>晚点后</th></tr>";
		if (lang == "kr") html += "<tr><th width='50%'>정차역</th><th width='25%'>통상 운행시각</th><th width='25%'>지연 반영</th></tr>";
	} else {
		if (lang == "ja") html += "<tr><th width='65%'>停車駅</th><th width='35%'>定刻</th></tr>";
		if (lang == "en") html += "<tr><th width='65%'>Stops</th><th width='35%'>Scheduled time</th></tr>";
		if (lang == "tc") html += "<tr><th width='65%'>停靠站</th><th width='35%'>準點</th></tr>";
		if (lang == "sc") html += "<tr><th width='65%'>停靠站</th><th width='35%'>准点</th></tr>";
		if (lang == "kr") html += "<tr><th width='65%'>정차역</th><th width='35%'>통상 운행시각</th></tr>";
	}

	timetable.forEach(function(row, index) {
		if (row && row.note) {
			html += "<tr><td colspan='" + (hasDelay ? "3" : "2") + "' align='center'>" + escape_detail_html(row.note) + "</td></tr>";
			return;
		}
		const stationName = row && row.stationName ? row.stationName : "";
		const time = select_jreast_daiya_time(row);
		if (!stationName || !time) return;
		const adjustedTime = calc_adjusted_time(time, chien);
		const isLast = index == timetable.length - 1;
		html += "<tr>";
		html += "<td>" + escape_detail_html(stationName) + "</td>";
		html += "<td align='center'>" + escape_detail_html(time) + " " + get_jreast_time_suffix(lang, isLast) + "</td>";
		if (hasDelay) html += "<td align='center' style='color:#f00;font-weight:bold;'>" + escape_detail_html(adjustedTime) + " " + get_jreast_time_suffix(lang, isLast) + "</td>";
		html += "</tr>";
	});
	html += "</table>";
	$("#teisyaTableArea div").html(html);
}

function unique_jreast_timetable_rows(_timetable) {
	const seen = new Set();
	return (Array.isArray(_timetable) ? _timetable : []).filter(function(row) {
		if (row && row.note) return true;
		const stationName = row && row.stationName ? row.stationName : "";
		const time = select_jreast_daiya_time(row);
		const key = stationName;
		if (!stationName || !time || seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

function select_jreast_daiya_time(_row) {
	if (!_row) return "";
	return _row.planDeparture || _row.planArrival || _row.prospectDeparture || _row.prospectArrival || "";
}

function get_jreast_time_suffix(_lang, _isLast) {
	if (_lang == "en") return _isLast ? "arr." : "dep.";
	if (_lang == "tc") return _isLast ? "到" : "開";
	if (_lang == "sc") return _isLast ? "到" : "开";
	if (_lang == "kr") return _isLast ? "도착" : "출발";
	return _isLast ? "着" : "発";
}

function escape_detail_html(_text) {
	return String(_text || "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

/*
 * ダイヤデータ作成
 */
function create_daiya(_dataset, _ekiMaster, _daiyaData) {
	// 処理が終わるまでダイヤデータは非表示
	$("#teisyaTableArea div").empty();
	if (_dataset.senku == "") {
		// 愛称名に列車種別を設定
		$("#aisho").text(_dataset.ressha_type_name);
		return;
	}

	let lang = document.documentElement.dataset.lang;
	const chien = Number(_dataset.chien || 0);
	const hasDelay = chien > 0;
	let findDaiya = _daiyaData[0].today.find((v) => v.cbango == _dataset.cbango);
	if (typeof findDaiya !== "undefined") {
		// 愛称名
		$("#aisho").text(findDaiya.name);
		$("#teisyaTableArea .adjusted-notice").toggle(hasDelay);

		// 時刻表
		if (findDaiya.stations.length > 0) {
			let html = "<table id='teisyaTable' border='1' width='80%'>";

			if (hasDelay) {
				if (lang == "ja") html += "<tr><th width='50%'>停車駅</th><th width='25%'>定刻</th><th width='25%'>遅延考慮</th></tr>";
				if (lang == "en") html += "<tr><th width='50%'>Stops</th><th width='25%'>Scheduled time</th><th width='25%'>Adjusted</th></tr>";
				if (lang == "tc") html += "<tr><th width='50%'>停靠站</th><th width='25%'>準點</th><th width='25%'>延遲後</th></tr>";
				if (lang == "sc") html += "<tr><th width='50%'>停靠站</th><th width='25%'>准点</th><th width='25%'>晚点后</th></tr>";
				if (lang == "kr") html += "<tr><th width='50%'>정차역</th><th width='25%'>통상 운행시각</th><th width='25%'>지연 반영</th></tr>";
			} else {
				if (lang == "ja") html += "<tr><th width='65%'>停車駅</th><th width='35%'>定刻</th></tr>";
				if (lang == "en") html += "<tr><th width='65%'>Stops</th><th width='35%'>Scheduled time</th></tr>";
				if (lang == "tc") html += "<tr><th width='65%'>停靠站</th><th width='35%'>準點</th></tr>";
				if (lang == "sc") html += "<tr><th width='65%'>停靠站</th><th width='35%'>准点</th></tr>";
				if (lang == "kr") html += "<tr><th width='65%'>정차역</th><th width='35%'>통상 운행시각</th></tr>";
			}

			for (let i of Object.keys(findDaiya.stations)) {
				let findRowEki = _ekiMaster[0].find((v) => v.key == findDaiya.stations[i].key);
				if (typeof findRowEki !== "undefined") {
					let time = findDaiya.stations[i].time ? findDaiya.stations[i].time : "";
					let adjustedTime = calc_adjusted_time(time, chien);
					html += "<tr>";
					if (lang == "ja") {
						html += "<td>" + findRowEki.ja + "</td>";
						if (i == findDaiya.stations.length - 1) {
							html += "<td align='center'>" + time + " 着</td>";
							if (hasDelay) html += "<td align='center' style='color:#f00;font-weight:bold;'>" + adjustedTime + " 着</td>";
						}
						else {
							html += "<td align='center'>" + time + " 発</td>";
							if (hasDelay) html += "<td align='center' style='color:#f00;font-weight:bold;'>" + adjustedTime + " 発</td>";
						}
					} else if (lang == "en") {
						html += "<td>" + findRowEki.en + "</td>";
						if (i == findDaiya.stations.length - 1) {
							html += "<td align='center'>" + time + " arr.</td>";
							if (hasDelay) html += "<td align='center' style='color:#f00;font-weight:bold;'>" + adjustedTime + " arr.</td>";
						}
						else {
							html += "<td align='center'>" + time + " dep.</td>";
							if (hasDelay) html += "<td align='center' style='color:#f00;font-weight:bold;'>" + adjustedTime + " dep.</td>";
						}
					} else if (lang == "tc") {
						html += "<td>" + findRowEki.tc + "</td>";
						if (i == findDaiya.stations.length - 1) {
							html += "<td align='center'>" + time + " 到</td>";
							if (hasDelay) html += "<td align='center' style='color:#f00;font-weight:bold;'>" + adjustedTime + " 到</td>";
						}
						else {
							html += "<td align='center'>" + time + " 開</td>";
							if (hasDelay) html += "<td align='center' style='color:#f00;font-weight:bold;'>" + adjustedTime + " 開</td>";
						}
					} else if (lang == "sc") {
						html += "<td>" + findRowEki.sc + "</td>";
						if (i == findDaiya.stations.length - 1) {
							html += "<td align='center'>" + time + " 到</td>";
							if (hasDelay) html += "<td align='center' style='color:#f00;font-weight:bold;'>" + adjustedTime + " 到</td>";
						}
						else {
							html += "<td align='center'>" + time + " 开</td>";
							if (hasDelay) html += "<td align='center' style='color:#f00;font-weight:bold;'>" + adjustedTime + " 开</td>";
						}
					} else if (lang == "kr") {
						html += "<td>" + findRowEki.kr + "</td>";
						if (i == findDaiya.stations.length - 1) {
							html += "<td align='center'>" + time + " 도착</td>";
							if (hasDelay) html += "<td align='center' style='color:#f00;font-weight:bold;'>" + adjustedTime + " 도착</td>";
						}
						else {
							html += "<td align='center'>" + time + " 출발</td>";
							if (hasDelay) html += "<td align='center' style='color:#f00;font-weight:bold;'>" + adjustedTime + " 출발</td>";
						}
					}
					html += "</tr>";
				}
			}
			html += "</table>";
			$("#teisyaTableArea div").html(html);
		} else {
			// ダイヤデータ非表示
			$("#teisyaTableArea div").empty();
		}
	} else {
		// 愛称名に列車種別を設定
		$("#aisho").text(_dataset.ressha_type_name);
		$("#teisyaTableArea .adjusted-notice").hide();
		// ダイヤデータ非表示
		$("#teisyaTableArea div").empty();
	}
}

function calc_adjusted_time(_time, _chien) {
	if (!/^\d{1,2}:\d{2}$/.test(_time)) return "";
	const [hour, minute] = _time.split(":").map(Number);
	const totalMinutes = hour * 60 + minute + _chien;
	const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
	const adjustedHour = String(Math.floor(normalizedMinutes / 60)).padStart(2, "0");
	const adjustedMinute = String(normalizedMinutes % 60).padStart(2, "0");
	return adjustedHour + ":" + adjustedMinute;
}
