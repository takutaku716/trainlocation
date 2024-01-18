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
		let lang = document.documentElement.dataset.lang;
		// ローディングアニメーションを表示
		loading_animation_display();

		// 列車情報ダイアログに値を設定する。
		{
			let dataset = this.dataset;
			// ヘッダータイトル
			$("#headerTitle").text(DETAILED_TRAIN_INFORMATION_DIALOG_TITLES[lang]);
			// 列車種別名
			if (lang == "ja") $("#resshaTypeName").text(dataset.ressha_type_name);
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

			let pos = dataset.pos;
			let senku = dataset.senku;
			let now = Date.now() >>> 16;
			$.when(
				$.getJSON("https://corsproxy.org/?https://takutaku716.web.fc2.com/JRH_TRAINLOC_NEW/original/location_master" + (lang === "ja" ? "" : "_" + lang) + ".json?" + now),
				$.getJSON("https://corsproxy.org/?https://www3.jrhokkaido.co.jp/webunkou/json/master/eki_master.json?" + now),
				$.getJSON("https://corsproxy.org/?https://www3.jrhokkaido.co.jp/webunkou/json/daiya/daiya_" + senku + (lang === "ja" ? "" : "_" + lang) + ".json?" + now)
			)
			.done(function(posNameMasterBase, ekiMasterBase, daiyaBase) {
				// 現在地
				$("#posDetail").text(posNameMasterBase[0][pos]);
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
});

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
	let findDaiya = _daiyaData[0].today.find((v) => v.cbango == _dataset.cbango);
	if (typeof findDaiya !== "undefined") {
		// 愛称名
		$("#aisho").text(findDaiya.name);

		// 時刻表
		if (findDaiya.stations.length > 0) {
			let html = "<table id='teisyaTable' border='1' width='80%'>";

			if (lang == "ja") html += "<tr><th width='65%'>停車駅</th><th width='35%'>定刻</th></tr>";
			if (lang == "en") html += "<tr><th width='65%'>Stops</th><th width='35%'>Scheduled time</th></tr>";
			if (lang == "tc") html += "<tr><th width='65%'>停靠站</th><th width='35%'>準點</th></tr>";
			if (lang == "sc") html += "<tr><th width='65%'>停靠站</th><th width='35%'>准点</th></tr>";
			if (lang == "kr") html += "<tr><th width='65%'>정차역</th><th width='35%'>통상 운행시각</th></tr>";

			for (let i of Object.keys(findDaiya.stations)) {
				let findRowEki = _ekiMaster[0].find((v) => v.key == findDaiya.stations[i].key);
				if (typeof findRowEki !== "undefined") {
					let time = findDaiya.stations[i].time ? findDaiya.stations[i].time : "";
					html += "<tr>";
					if (lang == "ja") {
						html += "<td>" + findRowEki.ja + "</td>";
						if (i == findDaiya.stations.length - 1) html += "<td align='center'>" + time + " 着</td>";
						else html += "<td align='center'>" + time + " 発</td>";
					} else if (lang == "en") {
						html += "<td>" + findRowEki.en + "</td>";
						if (i == findDaiya.stations.length - 1) html += "<td align='center'>" + time + " arr.</td>";
						else html += "<td align='center'>" + time + " dep.</td>";
					} else if (lang == "tc") {
						html += "<td>" + findRowEki.tc + "</td>";
						if (i == findDaiya.stations.length - 1) html += "<td align='center'>" + time + " 到</td>";
						else html += "<td align='center'>" + time + " 開</td>";
					} else if (lang == "sc") {
						html += "<td>" + findRowEki.sc + "</td>";
						if (i == findDaiya.stations.length - 1) html += "<td align='center'>" + time + " 到</td>";
						else html += "<td align='center'>" + time + " 开</td>";
					} else if (lang == "kr") {
						html += "<td>" + findRowEki.kr + "</td>";
						if (i == findDaiya.stations.length - 1) html += "<td align='center'>" + time + " 도착</td>";
						else html += "<td align='center'>" + time + " 출발</td>";
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
		// ダイヤデータ非表示
		$("#teisyaTableArea div").empty();
	}
}
