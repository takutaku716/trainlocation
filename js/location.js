// スクロールの高さ保持用
let scrollY = 0;
// 遷移前の路線保持用
let befRosen = "";
// スクロール用の駅キー保持用
let scrollKey = "";
// サイドメニュークリック時
let isSideMenuClick = false;
// 画面初期表示時判定用
let isLoad = true;
// ダイアログ表示時判定用
let isDialogDisp = false;
// サイドメニュー表示時判定用
let isSideMenuDisp = false;
// 横幅リサイズ判定用
let beforeWidth = 0;
// 画面表示処理実行判定用
let isNotInitDisp = false;
// 走行位置自動更新の既定間隔(ms)
const LOCATION_AUTO_REFRESH_DEFAULT_INTERVAL = 15000;
// 自動更新設定の保存キー
const LOCATION_AUTO_REFRESH_ENABLED_KEY = "location_auto_refresh_enabled";
const LOCATION_AUTO_REFRESH_INTERVAL_KEY = "location_auto_refresh_interval";
const LOCATION_JSON_SOURCE_MAP = {
	"51": ["01", "05"],
	"52": ["02", "07", "09"],
	"53": ["02", "13"]
};
// 走行位置自動更新タイマー
let locationAutoRefreshTimer = null;
// 列車選択アニメーションタイマー
let resshaAnimationTimer = null;
// 自動更新用の路線保持
let autoRefreshRosen = "";
// 列車再描画用マスタのキャッシュ
let cachedResshaTypeData = null;
let cachedEkiData = null;
// 自動更新設定
let locationAutoRefreshEnabled = false;
let locationAutoRefreshInterval = LOCATION_AUTO_REFRESH_DEFAULT_INTERVAL;
// 次回自動更新予定時刻
let nextLocationAutoRefreshAt = null;
// 列車検索用キャッシュ
let cachedTrainSearchData = null;
let trainSearchDataPromise = null;
let cachedTrainSearchLoadedAt = 0;
const TRAIN_SEARCH_CACHE_TTL = 30000;

window.onload = function(){
	load_location_auto_refresh_settings();
	// 現在表示中の路線を取得
	let param_rosen = get_param_rosen();
	// 走行位置を表示
	if (param_rosen != "") set_station_list(param_rosen, null);
	// エリア別状況JSONを読み込んで、運行情報を設定する。
	set_unko_info(param_rosen);

	// ポップアップhtml判断
	let now = Date.now() >>> 16;
	let lang = document.documentElement.dataset.lang;
	let popup_url = lang == "ja" ? "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/trainlocation/CMUNKOU/inc_location_popup.html?" + now : "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/trainlocation/CMUNKOU/inc_location_popup_" + lang + ".html?" + now;
	$.ajax({
		url: popup_url,
		detaType: "html",
		success: function (data) {
			if (data != "") {
				let popupDiv = document.createElement("div");
				popupDiv.innerHTML = data;
				$("#popupOshirase").html(popupDiv);
				$(".sub-footer-contents.popup").show();
			} else {
				$(".sub-footer-contents.popup").hide();
			}
		}
	})

	// サイドメニュー　各路線の遅延情報の設定
	set_side_area_chien();
	// サイドメニュー　各特急列車ボタンの作成
	createSideExpressList();

	hsize = $(window).height();
	$(".side-menu").css("height", hsize - 60 + "px");

	if (!is_reload()) {
		// 札幌近郊の路線の場合、初期表示を札幌駅周辺にする。（更新時以外）
		if (!get_param_id() && !get_param_cbango()) {
			let rosen = get_param_rosen();
			if ((rosen == "01" || rosen == "02" || rosen == "03") && $("div[key='091']").length > 0) {
				$("body,html").animate({scrollTop: $("div[key='091']").offset().top - 310});
			}
		}
	}

	// 選択されているタブに表示を合わせる
	str = $('input:radio[name="sideSelect"]:checked').val();
	tab_select(str);
	// ヘッダーの高さ分の余白を設定する。
	set_header_height();

	// サイドメニュー設定
	set_side_menu(false);

	// 初期表示時の横幅保持
	beforeWidth = window.innerWidth;

	$(function(){
		// ページの最後が駅で終わっている路線（08、13）でサブフッターの表示があった場合、下に余白を追加する
		eki_end_margin();
	});
};

window.onresize = function () {
	// サイドメニューの高さを画面サイズに合わせて設定
	hsize = $(window).height();
	$(".side-menu").css("height", hsize - 60 + "px");
	if (beforeWidth != window.innerWidth && !isDialogDisp) {
		// 横幅リサイズ時
		scrollY = window.scrollY;
	}

	// 画面幅のサイズに合わせて画面項目を制御する。(アドレスバーによる高さのリサイズでは実行しない)
	if (beforeWidth != window.innerWidth) {
		set_responsive();
	}

	// お知らせのサイズによって子要素の横幅を設定する。
	set_oshirase_width();

	// ヘッダーの高さ分の余白を設定する。
	set_header_height();

	// PC用表示の場合、タブ選択と表示内容を一致させる
	if (window.innerWidth > 1000) {
		str = $('input:radio[name="sideSelect"]:checked').val();
		tab_select_resize(str);
	}

	// リサイズ後の横幅保持
	beforeWidth = window.innerWidth;

	// ページの最後が駅で終わっている路線（08、13）でサブフッターの表示があった場合、下に余白を追加する
	eki_end_margin();
};

window.onscroll = function () {
	if (!(isLoad || isDialogDisp || isSideMenuDisp)) {
		// スクロール位置を保存
		window.sessionStorage.setItem("scrollY", window.scrollY - 50);
		scrollY = window.scrollY;
	}
};

window.onhashchange = function () {
	// ハッシュからid（駅キー）を取得
	let param_id = get_param_id();

	// 路線を切り替えた際、列車の赤枠を非表示
	$(".ressha-animation").hide();

	// 画面表示処理
	if (!isNotInitDisp) init_disp(scrollKey, () => {

		if (param_id) {
			// ハッシュに駅IDが存在した場合、対象の駅までスクロール
			let pos = $("div[key='" + param_id + "']").offset().top - 380;
			$("body,html").scrollTop(pos);
		}

		// ヘッダーの高さ分の余白を設定する。
		set_header_height();
	})

	isNotInitDisp = false;
}

$(function ($) {
	sync_refresh_setting_controls();
	// 選択（エリアから選択／特急列車から選択）タブの選択を切り替えたときの動き
	$(document).on('change', 'input[name="sideSelect"]', function () {
		str = $('input:radio[name="sideSelect"]:checked').val();
		tab_select(str);
	});

	// サイドメニューの各エリアをクリックしたときの動き
	$(document).on("click", ".side-menu .area-contents .area-name-label", function () {
		// 自分をこれから開く場合、他の展開をすべて閉じる
		if ($(this).next().css("display") === "none") {
			$(".rosen-name-list").css("display", "none");
			$(".area-name-label").removeClass("open");
		}
		// 明細を開く／閉じる
		$(this).next().stop().slideToggle(100);
		$(this).toggleClass("open");
	});

	// 路線選択ボタンをクリックしたときの動き
	$("#localSelBtn").on("click", function() {
		let lang = document.documentElement.dataset.lang;
		$(".side-menu").css("transform", "translateX(0px)");
		$(".side-menu").css("box-shadow", "5px 5px 10px rgb(0 0 0 / 40%)");
		$("#localTab").show();
		$("#expTab").hide();
		$("#sideMenu .side-menu .area-contents-header").show();
		$("#sideMenu .side-menu-outer").show();
		if (lang == "ja") $("#sideHeader").text("路線選択");
		if (lang == "en") $("#sideHeader").text("Select a line");
		if (lang == "tc") $("#sideHeader").text("選擇路線");
		if (lang == "sc") $("#sideHeader").text("选择路线");
		if (lang == "kr") $("#sideHeader").text("노선 선택");
		// bodyのスクロールを無効にする。
		set_scroll_hide_side_menu();
	});

	// 特急列車選択ボタンをクリックしたときの動き
	$("#expSelBtn").on("click", function() {
		let lang = document.documentElement.dataset.lang;
		$(".side-menu").css("transform", "translateX(0px)");
		$(".side-menu").css("box-shadow", "5px 5px 10px rgb(0 0 0 / 40%)");
		$("#localTab").hide();
		$("#expTab").show();
		$("#sideMenu .side-menu .area-contents-header").show();
		$("#sideMenu .side-menu-outer").show();
		if (lang == "ja") $("#sideHeader").text("特急列車選択");
		if (lang == "en") $("#sideHeader").text("Select a limited express");
		if (lang == "tc") $("#sideHeader").text("選擇特急列車");
		if (lang == "sc") $("#sideHeader").text("选择特急列车");
		if (lang == "kr") $("#sideHeader").text("특급열차 선택");
		// bodyのスクロールを無効にする。
		set_scroll_hide_side_menu();
	});

	// 現在地選択ボタンをクリックしたときの動き
	$(".header-btn.pos").on("click", function() {
		// ローディングアニメーションを表示
		loading_animation_display();
		// 現在地から一番近い駅を表示
		get_pos_info(false);
	});

	// 自動更新設定ボタンをクリックしたときの動き
	$("#refreshSettingBtn, #refreshSettingBtnSub").on("click", function() {
		sync_refresh_setting_controls();
		$("#refreshSettingDetail").fadeIn("fast");
		set_scroll_hide($("#refreshSettingDetail .dialog"));
	});

	// 列車検索ボタンをクリックしたときの動き
	$("#trainSearchBtn, #trainSearchBtnSub").on("click", function() {
		reset_train_search_dialog();
		$("#trainSearchDetail").fadeIn("fast");
		set_scroll_hide($("#trainSearchDetail .dialog"));
		$("#trainSearchResultInfo").text("読み込み中...");
		load_train_search_data()
			.then((searchData) => {
				populate_train_search_name_select(searchData);
				$("#trainSearchResultInfo").empty();
				$("#trainSearchNumberInput").trigger("focus");
			})
			.catch(() => {
				$("#trainSearchResultInfo").text("検索データを取得できませんでした。");
			});
	});

	// 駅選択をクリックしたときの動き
	$(document).on("click", ".header-btn.eki", function() {
		// テンプレートのhtmlから駅を取得
		let list = $("#stationList .eki-panel .eki-contents a");
		// 取得した駅からボタンをダイアログに表示する内容を作成
		let html = "<ul>";
		for(let row of list){
			html += "<li>";
			html += row.children[0].children[0].outerHTML;
			html += "<div value='" + row.href.slice(-3) + "'>" + row.children[0].children[1].innerText.replace("\n", "") + "</div></li>";
			html += "</li>";
		}
		html += "</ul>";

		// 駅選択ダイアログ内に駅のリストを表示
		$("#searchDetail .train-link").html(html);

		// 駅選択ダイアログを開く。
		$("#searchDetail").fadeIn("fast");
		$("#searchDetailMain").scrollTop(0);
		// ダイアログを開くときのbodyのスクロールの制御
		set_scroll_hide($("#searchDetail .dialog"));
	});

	// 駅選択ダイアログ内の｢閉じる｣ボタンをクリックしたときの動き
	$(document).on("click", "#searchDetail, #searchDetail .common-subtitle.header", function() {
		// 駅選択ダイアログを閉じる。
		$("#searchDetail").fadeOut("fast");
		// ダイアログを閉じたときのbodyのスクロールの制御
		set_scroll_show($("#searchDetail .dialog"));
	});

	// 列車検索ダイアログを閉じる
	$(document).on("click", "#trainSearchDetail, #trainSearchDetail .common-subtitle.header", function() {
		close_train_search_dialog();
	});

	// 自動更新設定ダイアログを閉じる
	$(document).on("click", "#refreshSettingDetail, #refreshSettingDetail .close", function() {
		$("#refreshSettingDetail").fadeOut("fast");
		set_scroll_show($("#refreshSettingDetail .dialog"));
	});

	// 自動更新設定を適用する
	$(document).on("click", "#refreshSettingApplyBtn", function() {
		const enabled = $("#refreshEnabledSelect").val() === "on";
		const intervalSeconds = Number($("#refreshIntervalSelect").val());
		apply_location_auto_refresh_settings(enabled, intervalSeconds * 1000);
		$("#refreshSettingDetail").fadeOut("fast");
		set_scroll_show($("#refreshSettingDetail .dialog"));
	});

	// 駅選択ダイアログ内の各駅のボタンをクリックしたときの動き
	$(document).on("click", "#searchDetail .train-link li" , function() {
		// 駅選択ダイアログを閉じる。
		$("#searchDetail").fadeOut("fast");
		// ダイアログを閉じたときのbodyのスクロールの制御
		set_scroll_show($("#searchDetail .dialog"));

		// 駅コードを取得
		let id = this.children[1].getAttribute("value");
		// 対象の駅までスクロール
		let pos = $("div[key='" + id + "']").offset().top - 380;
		$("body,html").animate({scrollTop: pos});
	});

	// 列車検索の実行
	$(document).on("click", "#trainSearchNumberBtn", function() {
		run_train_number_search();
	});
	$(document).on("click", "#trainSearchNameBtn", function() {
		run_train_name_search();
	});
	$(document).on("keydown", "#trainSearchNumberInput", function(event) {
		if (event.key === "Enter") run_train_number_search();
	});
	$(document).on("keydown", "#trainSearchNameNumberInput", function(event) {
		if (event.key === "Enter") run_train_name_search();
	});
	$(document).on("click", "#trainSearchResult .train-search-result-item", function(event) {
		event.preventDefault();
		event.stopImmediatePropagation();
		const targetRosen = $(this).attr("value");
		const cbango = $(this).attr("cbango");
		const isRunning = $(this).attr("data-running") !== "0";
		close_train_search_dialog();
		if (!isRunning) {
			const searchTrain = find_train_search_result(cbango);
			if (searchTrain && searchTrain.detailTrain) {
				showTrainDetailDialog($("#trainDetail"), searchTrain.detailTrain);
				return;
			}
			show_train_not_running_message();
			return;
		}
		if (!targetRosen || !cbango) return;
		const currentRosen = get_param_rosen();
		const currentCbango = get_param_cbango();
		if (currentRosen === targetRosen && currentCbango === cbango) {
			init_disp();
		} else {
			location.hash = "rosen=" + targetRosen + "&cbango=" + cbango;
		}
	});

	// 重要なお知らせをクリックしたときの動き
	$(document).on("click", "#popupDetailBtn", function() {
		// ポップアップダイアログ内の重要なお知らせを開く。
		$("#popupDetail").fadeIn("fast");
		$("#popupDetailMain .popup-detail-main").scrollTop(0);
		$("#dialogOshirase").hide();
		$("#popupOshirase").show();
		// ダイアログを開くときのbodyのスクロールの制御
		set_scroll_hide($("#popupDetail .dialog"));
	});

	// ポップアップダイアログ内の｢閉じる｣ボタンをクリックしたときの動き
	$(document).on("click", "#popupDetail, #popupDetail .close", function() {
		// ポップアップダイアログを閉じる。
		$("#popupDetail").fadeOut("fast");
		// ダイアログを閉じたときのbodyのスクロールの制御
		set_scroll_show($("#popupDetail .dialog"));
	});

	// バブリングを停止
	$(document).on("click", "#guideDetail .dialog, #searchDetail .dialog, #trainSearchDetail .dialog, #popupDetail .dialog, #refreshSettingDetail .dialog", function(event) {
		event.stopPropagation();
	});

	// ページの表示状態に応じて自動更新を制御する
	document.addEventListener("visibilitychange", handle_page_visibility_change);

	// サイドメニューの閉じるボタンをクリックしたときの動き
	$("#sideMenu .side-menu .area-contents-header, #sideMenu .side-menu-outer").on("click", function() {
		$("#sideMenu .side-menu").css("transform", "translateX(-327px)");
		$("#sideMenu .side-menu").css("box-shadow", "none");
		$("#sideMenu .side-menu-outer").hide();
		// サイドメニュー内の折り畳みを閉じる。
		toggle_close();
		// bodyのスクロールを有効にする。
		set_scroll_show_side_menu();
	});

	// 区間をクリックしたときの動き
	$(document).on("click"
	, ".rosen-name-list div, .hoka-rosen-link a, .up-rosen-link a, .down-rosen-link a, .shin-link a"
	,  function() {
		$("#sideMenu .side-menu-outer").hide();

		// ローディングアニメーションを表示
		loading_animation_display();

		// 現在表示中の路線を取得
		befRosen = get_param_rosen();
		if ($(this).attr("class") == "rosen-name-contents") {
			// サイドメニュークリック判定用のフラグをtrue
			isSideMenuClick = true;
		}

		let rosen = $(this).attr("value");
		if (!rosen) return;
		scrollKey = $(this).attr("key");

		if (befRosen == rosen) {
			// 表示中の路線と遷移先の路線が同じ場合
			// ハッシュからid（駅キー）、列車番号を取得
			let param_id = get_param_id();
			let param_cbango = get_param_cbango();
			location.hash = "rosen=" + rosen;
			// 駅キー、列車番号が設定されていた場合、画面表示処理を行う
			if (!param_id && !param_cbango) init_disp(scrollKey);
		} else {
			// ハッシュを選択した路線に変更
			location.hash = "rosen=" + rosen;
		}

		$(function(){
			if (window.innerWidth <= 1000) {
				// サイドメニュー内の折り畳みを閉じる。
				toggle_close();
				// bodyのスクロールを有効にする。
				if (isSideMenuClick) set_scroll_show_side_menu();
			}
		});
	});

	// 特急名をクリックした場合の動き
	$(document).on("click", ".express-name-label", function () {

		// 自分をこれから開く場合、他の展開をすべて閉じる
		if ($(this).next().css("display") === "none") {
			$(".express-train-list").css("display", "none");
			$(".express-name-label").removeClass("open");
		}
		// 明細を開く／閉じる
		$(this).next().stop().slideToggle(100, () => {
			// 自分をこれから開く場合、展開したリストが見える位置までスクロールする。
			if ($(this).next().css("display") !== "none") {
				// スクロール位置を計算する。
				const pos = $(this).offset().top - $(this).parent().parent().first().offset().top;
				// スクロールする。
				$(this).closest(".side-menu-scroll").animate({scrollTop: pos}, 100);
			}
		});
		$(this).toggleClass("open");
	});

	// 特急列車名をクリックしたときの動き
	$(document).on("click", ".express-train-contents", function() {
		let lang = document.documentElement.dataset.lang;
		// ローディングアニメーションを表示する。
		loading_animation_display();
		// サイドメニュークリック判定用のフラグをtrue
		isSideMenuClick = true;
		// 列番を取得する。
		const cbango = $(this).attr("cbango");
		// 列車種別を取得する。
		const type = $(this).attr("type");
		// マスタファイル用のキャッシュバスター値を生成する。(UNIX元期からの経過ミリ秒数を右に16ビットシフトした値。2の16乗＝65536ミリ秒≒約1分間隔でキャッシュを無効化する)
		const mstNow = Date.now() >>> 16;
		// トランファイル用のキャッシュバスター値を生成する。(UNIX元期からの経過ミリ秒数を右に10ビットシフトした値。2の10乗＝1024ミリ秒間隔でキャッシュを無効化する)
		const trnNow = Date.now() >>> 10;
		// 最新の列車運行情報を取得する。
		$.when(
			$.getJSON("https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/daiya/daiya_00" + (lang === "ja" ? "" : "_" + lang) + ".json?" + mstNow),
			$.getJSON("https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/trainlocation/json/express/now/express_now.json?" + trnNow)
		)
		.done((daiyaBase, expressNowBase) => {
			// 対象の列車の運行情報を取得する。
			const expressNow = expressNowBase[0].trains.find(train => train.cbango === cbango);
			const targetRosen = $(this).attr("value") || normalizeMergedRosen(expressNow.runRosen, $(this).find(".train-name").text());
			// 対象の列車に有効な路線キーが設定されている場合は、当該路線ページの該当列車位置に遷移する。
			if (targetRosen) {
				// 現在表示している路線を取得する。
				const currentRosen = get_param_rosen();
				// 現在hashに設定している列車番号を取得する。
				const currentCbango = get_param_cbango();
				if (currentRosen === targetRosen && currentCbango === cbango) {
					// 表示中の路線／列車番号と遷移先の路線／列車番号が同じ場合であれば、画面表示処理を呼び出す。
					init_disp();

				} else {
					// 別の路線／列車番号であれば、ハッシュを選択した路線／列車番号に変更する。
					location.hash = "rosen=" + targetRosen + "&cbango=" + cbango;
				}
				return;
			}
			// 対象の列車のダイヤデータを取得する。
			const daiya = daiyaBase[0].today.find(train => train.cbango === cbango);
			// 運行状態の詳細を表す文言を取得する。
			const statuDetail =
				lang === "ja" ? expressNow.statusDetail :
				lang === "en" ? expressNow.statusDetailEn :
				lang === "tc" ? expressNow.statusDetailTc :
				lang === "sc" ? expressNow.statusDetailSc :
				lang === "kr" ? expressNow.statusDetailKr : "";
			// 列車詳細情報ダイアログを表示する。
			showTrainDetailDialog($("#trainDetail"), {
				"cbango": cbango,
				"name": daiya.name,
				"type": type,
				"shuEki": daiya.shuEkiKey,
				"ryosu": daiya.ryosu,
				"senku": "00",
				"runStatus": expressNow.runStatus,
				"yokuStatus": expressNow.yokuStatus,
				"yokuDetail": expressNow.yokuDetail,
				"status": expressNow.status,
				"statusDetail": statuDetail,
				"chien": expressNow.chien
			});
		})
		.fail(() => {
			// データの取得に失敗した場合は、エラーメッセージを表示する。
			showTrainDetailDialog($("#trainDetail"), undefined, true);
		});
	});
});

/*
 * 画面表示処理
 */
function init_disp(_scrollKey, _callback) {
	// 現在表示中の路線を取得
	let param_rosen = get_param_rosen();
	// 要素をすべて削除
	$("#stationList").empty();

	// メッセージを削除
	$("#message").empty();
	$("#message").hide();

	$(".main-contents").css("transition", "transform .0s ease-out 0s,-webkit-transform .0s ease-out 0s");
	$(".main-contents").css("transform", "translateX(0px)");
	$(".sub-footer #subFooterContents").css("transition", "transform .0s ease-out 0s,-webkit-transform .0s ease-out 0s");
	$(".sub-footer #subFooterContents").css("transform", "translateX(0px)");

	// 選択された区間を基に走行位置を再表示
	set_station_list(param_rosen, _scrollKey, _callback);

	// エリア別状況JSONを読み込んで、運行情報を設定する。
	set_unko_info(param_rosen);

	// ポップアップhtml判断
	let now = Date.now() >>> 16;
	let lang = document.documentElement.dataset.lang;
	let popup_url = lang == "ja" ? "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/trainlocation/CMUNKOU/inc_location_popup.html?" + now : "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/trainlocation/CMUNKOU/inc_location_popup_" + lang + ".html?" + now;
	$.ajax({
		url: popup_url,
		detaType: "html",
		success: function (data) {
			if (data != "") {
				let popupDiv = document.createElement("div");
				popupDiv.innerHTML = data;
				$("#popupOshirase").html(popupDiv);
				$(".sub-footer-contents.popup").show();
			} else {
				$(".sub-footer-contents.popup").hide();
			}
		}
	})

	// ページの最後が駅で終わっている路線（08、13）でサブフッターの表示があった場合、下に余白を追加する
	eki_end_margin();
}

/*
 * 列車アイコンの赤枠を点滅させる
 */
function set_ressha_icon_animation() {
	let doc = document.querySelector('.ressha-animation');

	if (doc) {
		if (resshaAnimationTimer) {
			clearInterval(resshaAnimationTimer);
			resshaAnimationTimer = null;
		}
		function blink() {
			doc.classList.toggle('hidden');
		}

		resshaAnimationTimer = setInterval(blink, 1000);
	}
}

/*
 * JSONデータを読み込み、駅・駅間を描画する
 */
function get_location_json_source_list(_param_rosen) {
	const sourceList = LOCATION_JSON_SOURCE_MAP[_param_rosen];
	if (!Array.isArray(sourceList) || sourceList.length < 1) return [_param_rosen];

	const uniqueSources = [...new Set(sourceList.map(String).filter(Boolean))];
	return uniqueSources.length > 0 ? uniqueSources : [_param_rosen];
}

function get_location_json_url(_rosen, _now) {
	return "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/trainlocation/json/location/now/location_" + _rosen + "_now.json?" + _now;
}

function jqxhr_to_promise(_jqxhr) {
	return new Promise((resolve, reject) => {
		_jqxhr.done((data) => resolve(data)).fail((error) => reject(error));
	});
}

function merge_location_now_data(_nowDataList) {
	const cbangoCountMap = new Map();
	const mergedTrains = [];

	_nowDataList.forEach((nowData) => {
		if (!nowData || !Array.isArray(nowData.trains)) return;

		nowData.trains.forEach((row) => {
			mergedTrains.push(row);
			if (!row || !row.cbango) return;

			const cbango = String(row.cbango);
			cbangoCountMap.set(cbango, (cbangoCountMap.get(cbango) || 0) + 1);
		});
	});

	return {
		trains: mergedTrains.filter((row) => {
		if (!row || !row.cbango) return true;
		return cbangoCountMap.get(String(row.cbango)) === 1;
		})
	};
}

function load_location_now_data(_param_rosen, _now) {
	const sourceRosens = get_location_json_source_list(_param_rosen);
	return Promise.all(
		sourceRosens.map((rosen) => jqxhr_to_promise($.getJSON(get_location_json_url(rosen, _now))).catch(() => null))
	).then((nowDataList) => {
		const successDataList = nowDataList.filter((nowData) => nowData && Array.isArray(nowData.trains));
		if (successDataList.length < 1) throw new Error("location now json load failed");
		return merge_location_now_data(successDataList);
	});
}

function set_station_list(_param_rosen, _scrollKey, _callback) {
	stop_location_auto_refresh();
	// お知らせ欄作成
	disp_oshirase(_param_rosen);

	// 各区間のhtmlを読み込み
	const lang = document.documentElement.dataset.lang;

	// 走行位置ページメンテナンスJSONファイルを読み込んで、メンテナンスページに切り替えるか判定を行う。
	let mstNow = Date.now() >>> 16;
	let nowQuery = Date.now() >>> 10;
	let rosen_html = lang == "ja" ? `./rosen/rosen_${_param_rosen}.html` : `https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/trainlocation/rosen_${_param_rosen}_${lang}.html`;
	let maintenance_html = lang == "ja" ? "./mainte/rosen_maintenance.html" : "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/trainlocation/mainte/rosen_maintenance_" + lang + ".html";

	$.when(
		$.getJSON("./master/rosen_name_master.json?" + mstNow),
		$.getJSON("./mainte/rosen_maintenance.json?" + mstNow),
		$.getJSON("https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/master/ressha_type_master.json?" + mstNow),
		$.getJSON("https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/master/eki_master.json?" + mstNow),
		$.get(rosen_html),
		$.get(maintenance_html)
	)
	.done(function(rosenNameData, maintenanceData, typeData, ekiData, rosen, maintenance) {

		// 現在日付を設定
		const now = new Date();
		const formatted =
			now.getFullYear() + "年" +
			(now.getMonth() + 1) + "月" +
			now.getDate() + "日" +
			now.getHours() + "時" +
			now.getMinutes() + "分" +
			now.getSeconds() + "秒現在";

		$("#timestamp").text(formatted);

		// 路線名を設定
		let findRosenName = rosenNameData[0].find((v) => v.rosen == _param_rosen);
		if (typeof findRosenName !== "undefined") {
			if (lang == "ja") $("#title").html(findRosenName.rosenName.ja + findRosenName.kukanName.ja);
			if (lang == "en") $("#title").html(`<span>${findRosenName.rosenName.en}</span><span>${findRosenName.kukanName.en}</span>`);
			if (lang == "tc") $("#title").html(findRosenName.rosenName.tc + findRosenName.kukanName.tc);
			if (lang == "sc") $("#title").html(findRosenName.rosenName.sc + findRosenName.kukanName.sc);
			if (lang == "kr") $("#title").html(`<span>${findRosenName.rosenName.kr}</span><span>${findRosenName.kukanName.kr}</span>`);
		}

		let result = maintenanceData[0].lines.filter((v) => v.status == "1" && v.rosen == _param_rosen);
		if (result.length > 0) {
			cachedResshaTypeData = null;
			cachedEkiData = null;
			// 表示対象の路線のステータスが1の場合、メンテナンスページを表示
			$("#stationList").html(maintenance[0]);
			// 方面の設定
			$(".homen-header-contents").hide();
			$(".homen-footer-contents").hide();

			// 駅選択ボタンを非表示
			$(".btn-header-contents .header-btn.eki").hide();
			// フッターのお知らせ・運行情報を表示
			$("#subFooterContents").hide();

			$(".maintenance-title").show();

			// 駅・駅間描画後の後処理
			set_post_station_list(_param_rosen, _scrollKey);
		} else {
			load_location_now_data(_param_rosen, nowQuery)
			.then(function(nowData) {
			autoRefreshRosen = _param_rosen;
			cachedResshaTypeData = typeData[0];
			cachedEkiData = ekiData[0];
			$("#stationList").html(rosen[0]);
			// 列車アイコンを描画する
			create_ressha_icon(_param_rosen, nowData, typeData[0], ekiData[0]);
			// 列車アイコンの表示順を並び替える
			ressha_pos_sort();

			// 方面の設定
			let homenUp = $("#homenNameUpText");
			let homenDown = $("#homenNameDownText");
			if (homenUp) $("#homenNameUp").html(homenUp.text());
			if (homenDown) $("#homenNameDown").html(homenDown.text());
			$(".homen-header-contents").show();
			$(".homen-footer-contents").show();

			// 駅選択ボタンを表示
			$(".btn-header-contents .header-btn.eki").show();
			// フッターのお知らせ・運行情報を表示
			$("#subFooterContents").show();

			// 駅・駅間描画後の後処理
			set_post_station_list(_param_rosen, _scrollKey);
			start_location_auto_refresh(_param_rosen);

			if (_callback) _callback();
			})
			.catch(function() {
				var errormessage = `<h2 class='msg-bg'>${get_error_message()}</h2>`;
				$('#message').html(errormessage);
				$('#message').show();
			});
		}
	})
	.fail(function() {
		var errormessage = `<h2 class='msg-bg'>${get_error_message()}</h2>`;
		$('#message').html(errormessage);
		$('#message').show();
	});
}

/*
 * 走行位置の自動更新を開始する
 */
function start_location_auto_refresh(_param_rosen, _delay = locationAutoRefreshInterval) {
	stop_location_auto_refresh(true);
	if (!_param_rosen || !locationAutoRefreshEnabled) return;
	set_next_location_auto_refresh_time(_delay);
	locationAutoRefreshTimer = setTimeout(() => {
		if (document.visibilityState === "visible") {
			refresh_location_positions(_param_rosen);
		}
		start_location_auto_refresh(_param_rosen, locationAutoRefreshInterval);
	}, _delay);
}

/*
 * 走行位置の自動更新を停止する
 */
function stop_location_auto_refresh(_preserveNextRefresh = false) {
	if (locationAutoRefreshTimer) {
		clearTimeout(locationAutoRefreshTimer);
		locationAutoRefreshTimer = null;
	}
	if (!_preserveNextRefresh) {
		nextLocationAutoRefreshAt = null;
	}
	update_refresh_status_label();
}

/*
 * 走行位置JSONのみを再取得して、列車アイコンだけ再描画する
 */
function refresh_location_positions(_param_rosen) {
	if (!_param_rosen || _param_rosen !== get_param_rosen()) return;
	if (!cachedResshaTypeData || !cachedEkiData) return;
	if (!$("#stationList .ressha-icon").length) return;

	const now = Date.now() >>> 10;
	load_location_now_data(_param_rosen, now)
	.then(function(nowData) {
		redraw_location_positions(_param_rosen, nowData);
	})
	.catch(function() {
		// 自動更新失敗時は次回更新を待つ
	});
}

/*
 * 走行位置アイコンを差し替えて再描画する
 */
function redraw_location_positions(_param_rosen, _nowData) {
	clear_location_positions(_param_rosen);
	create_ressha_icon(_param_rosen, _nowData, cachedResshaTypeData, cachedEkiData);
	ressha_pos_sort();
	update_location_timestamp();
	restore_selected_train_marker();
}

/*
 * 既存の走行位置アイコンをクリアする
 */
function clear_location_positions(_param_rosen) {
	$("#stationList .ressha-animation").remove();
	if (resshaAnimationTimer) {
		clearInterval(resshaAnimationTimer);
		resshaAnimationTimer = null;
	}
	$("#stationList .ressha-icon").removeClass("up");
	$("#stationList .ressha-icon .ressha, #stationList .ressha-icon .dummy").remove();

	if (["09", "52"].includes(_param_rosen)) {
		$("#fujishiro1").show();
		$("#fujishiro2").show();
		$("#fujishiro1Long").hide();
		$("#fujishiro2Long").hide();
		$("#stationList .item.hakodate").css("height", "");
		$("#stationList .item.goryokaku").css("height", "");
		$("#goryokaku").show();
		$("#goryokakuLong").hide();
	}
}

/*
 * 現在時刻表示を更新する
 */
function update_location_timestamp() {
	const now = new Date();
	const formatted =
		now.getFullYear() + "年" +
		(now.getMonth() + 1) + "月" +
		now.getDate() + "日" +
		now.getHours() + "時" +
		now.getMinutes() + "分" +
		now.getSeconds() + "秒現在";
	$("#timestamp").text(formatted);
}

/*
 * 選択中の列車がある場合、再描画後に赤枠を付け直す
 */
function restore_selected_train_marker() {
	const param_cbango = get_param_cbango();
	if (!param_cbango) return;
	const ressha = $("div[data-cbango='" + param_cbango + "']");
	if (!ressha.length) return;
	ressha.append("<img class='ressha-animation' src='./images/home/ressha_mark.svg' alt>");
	set_ressha_icon_animation();
}

/*
 * 自動更新設定を読み込む
 */
function load_location_auto_refresh_settings() {
	const storedEnabled = localStorage.getItem(LOCATION_AUTO_REFRESH_ENABLED_KEY);
	const storedInterval = Number(localStorage.getItem(LOCATION_AUTO_REFRESH_INTERVAL_KEY));
	locationAutoRefreshEnabled = storedEnabled === null ? false : storedEnabled === "true";
	locationAutoRefreshInterval = [15000, 30000, 60000].includes(storedInterval) ? storedInterval : LOCATION_AUTO_REFRESH_DEFAULT_INTERVAL;
	update_refresh_status_label();
}

/*
 * 自動更新設定入力欄に現在値を反映する
 */
function sync_refresh_setting_controls() {
	$("#refreshEnabledSelect").val(locationAutoRefreshEnabled ? "on" : "off");
	$("#refreshIntervalSelect").val(String(locationAutoRefreshInterval / 1000));
}

/*
 * 自動更新状態の表示を更新する
 */
function update_refresh_status_label() {
	const lang = document.documentElement.dataset.lang;
	const intervalSeconds = locationAutoRefreshInterval / 1000;
	const messages = {
		ja: "自動更新ON (" + intervalSeconds + "秒間隔)",
		en: "Auto refresh ON (" + intervalSeconds + " sec)",
		tc: "自動更新ON（每" + intervalSeconds + "秒）",
		sc: "自动更新ON（每" + intervalSeconds + "秒）",
		kr: "자동 갱신 ON (" + intervalSeconds + "초)"
	};
	const nextMessages = {
		ja: "次回更新：" + format_refresh_time(nextLocationAutoRefreshAt),
		en: "Next: " + format_refresh_time(nextLocationAutoRefreshAt),
		tc: "下次更新：" + format_refresh_time(nextLocationAutoRefreshAt),
		sc: "下次更新：" + format_refresh_time(nextLocationAutoRefreshAt),
		kr: "다음 갱신: " + format_refresh_time(nextLocationAutoRefreshAt)
	};
	if (locationAutoRefreshEnabled) {
		const message = (messages[lang] || messages.ja) + (nextLocationAutoRefreshAt ? "  " + (nextMessages[lang] || nextMessages.ja) : "");
		$("#refreshStatusLabel").text(message).removeAttr("hidden");
	} else {
		$("#refreshStatusLabel").text("").attr("hidden", "hidden");
	}
}

/*
 * 次回自動更新予定時刻を設定する
 */
function set_next_location_auto_refresh_time(_delay = locationAutoRefreshInterval) {
	nextLocationAutoRefreshAt = new Date(Date.now() + _delay);
	update_refresh_status_label();
}

/*
 * ヘッダー表示用に時刻を整形する
 */
function format_refresh_time(_date) {
	if (!_date) return "";
	const hours = String(_date.getHours()).padStart(2, "0");
	const minutes = String(_date.getMinutes()).padStart(2, "0");
	const seconds = String(_date.getSeconds()).padStart(2, "0");
	return hours + "時" + minutes + "分" + seconds + "秒";
}

/*
 * 自動更新設定を適用する
 */
function apply_location_auto_refresh_settings(_enabled, _interval, _persist = true) {
	const wasEnabled = locationAutoRefreshEnabled;
	locationAutoRefreshEnabled = _enabled;
	locationAutoRefreshInterval = [15000, 30000, 60000].includes(_interval) ? _interval : LOCATION_AUTO_REFRESH_DEFAULT_INTERVAL;
	if (_persist) {
		localStorage.setItem(LOCATION_AUTO_REFRESH_ENABLED_KEY, String(locationAutoRefreshEnabled));
		localStorage.setItem(LOCATION_AUTO_REFRESH_INTERVAL_KEY, String(locationAutoRefreshInterval));
	}
	sync_refresh_setting_controls();
	update_refresh_status_label();
	if (locationAutoRefreshEnabled) {
		const currentRosen = get_param_rosen();
		start_location_auto_refresh(currentRosen);
		if (currentRosen && document.visibilityState === "visible" && (!wasEnabled || _persist)) {
			refresh_location_positions(currentRosen);
		}
	} else {
		stop_location_auto_refresh();
	}
}

/*
 * ページの表示状態に応じて自動更新を停止・再開する
 */
function handle_page_visibility_change() {
	const currentRosen = get_param_rosen();
	if (document.visibilityState === "hidden") {
		stop_location_auto_refresh(true);
		return;
	}
	if (document.visibilityState === "visible" && locationAutoRefreshEnabled && currentRosen) {
		if (!nextLocationAutoRefreshAt) {
			start_location_auto_refresh(currentRosen);
			return;
		}
		const remaining = nextLocationAutoRefreshAt.getTime() - Date.now();
		if (remaining <= 0) {
			refresh_location_positions(currentRosen);
			start_location_auto_refresh(currentRosen);
		} else {
			start_location_auto_refresh(currentRosen, remaining);
		}
	}
}

/*
 * 駅・駅間描画後の後処理
 */
function set_post_station_list(_param_rosen, _scrollKey) {
	if (["09", "52"].includes(_param_rosen)) {
		// 函館線[長万部～函館間]の場合
		if ($(".fujishiro-panel").height() > 800){
			$("#fujishiro1").hide();
			$("#fujishiro2").hide();
			$("#fujishiro1Long").show();
			$("#fujishiro2Long").show();
		}
	}

	set_responsive();

	// スクロール位置が先頭にある場合、路線描画タイミングでヘッダーの余白の高さを設定
	if ($("body,html").scrollTop() == 0) set_header_height();

	// 初期表示時のみ
	if (isLoad) {
		let param_cbango = get_param_cbango();
		if (param_cbango) {
			// ハッシュにcbangoが存在した場合処理を実行
			ressha_run_check();
			window.sessionStorage.setItem("scrollY", window.scrollY - 50);
		} else if (is_reload()) {
			// セッションに保存したスクロール位置を取得
			let scroll = Number(window.sessionStorage.getItem("scrollY"));
			if (!isNaN(scroll)) {
				// 更新時、スクロール位置を設定
				$("body,html").scrollTop(scroll + 50);
			}
		} else {
			let param_id = get_param_id();
			if (param_id) {
				// ハッシュに駅IDが存在した場合、対象の駅までスクロール
				let pos = $("div[key='" + param_id + "']").offset().top - 380;
				$("body,html").animate({scrollTop: pos});
				window.sessionStorage.setItem("scrollY", pos - 50);
			} else {
				// 札幌近郊の路線の場合、初期表示を札幌駅周辺にする。
				set_disp_scroll_spo();
			}
		}

		// 初期表示のフラグをfalse
		isLoad = false;
	} else {
		let param_cbango = get_param_cbango();
		if (param_cbango) {
			// ハッシュにcbangoが存在した場合処理を実行
			ressha_run_check();
		} else {
			// 画面スクロール位置設定
			set_disp_scroll(_param_rosen, _scrollKey);
		}
	}

	scrollKey = "";
	isSideMenuClick = false;

	// ローディングアニメーションを非表示にする
	loading_animation_hidden();
}

/*
 * 画面スクロール位置設定
 */
function set_disp_scroll(_param_rosen, _scrollKey) {
	// 他路線から遷移してきた場合、遷移元の線路のリンクの箇所までスクロール
	let doc = $("a[value='" + befRosen + "']");
	if (_scrollKey && _scrollKey != "") {
		// 駅の箇所までスクロール
		doc = $("div[key='" + _scrollKey + "']");
	}

	if (isSideMenuClick) {
		// 札幌近郊の路線の場合、初期表示を札幌駅周辺にする。
		set_disp_scroll_spo();
	} else if (doc.length > 0) {
		let scroll = doc.offset().top - 310;
		if (_param_rosen == "01" && _scrollKey == "090") scroll -= 120; // SP1 桑園駅への遷移
		if (_param_rosen == "03" && _scrollKey == "090") scroll -= 120; // SP3 桑園駅への遷移
		if (_param_rosen == "06" && _scrollKey == "227") scroll += 80;  // DO3 志文駅への遷移
		if (_param_rosen == "13" && _scrollKey == "220") scroll -= 110; // DT1 追分駅への遷移
		if (_param_rosen == "01" && befRosen == "02") scroll -= 120;	// SP2からSP1への遷移
		if (_param_rosen == "13" && befRosen == "14") scroll -= 120;	// DT2からDT1への遷移
		if (_param_rosen == "02" && befRosen == "01") scroll -= 120;	// SP1からSP2への遷移
		$("body,html").scrollTop(scroll);
		scrollY = scroll;
	} else {
		// ページトップへスクロール
		$("body,html").scrollTop(0);
	}
}

/*
 * 札幌近郊の路線の場合、初期表示を札幌駅周辺にする。
 */
function set_disp_scroll_spo() {
	if (!get_param_id() && !get_param_cbango()) {
		let rosen = get_param_rosen();
		if ((rosen == "01" || rosen == "02" || rosen == "03") && $("div[key='091']").length > 0) {
			let scroll = $("div[key='091']").offset().top - 310;
			$("body,html").scrollTop(scroll);
			scrollY = scroll;
		} else {
			// ページトップへスクロール
			$("body,html").scrollTop(0);
			scrollY = 0;
		}
	}
}

/*
 * 画面幅のサイズに合わせて画面項目を制御する。
 */
function set_responsive() {
	let userAgent = navigator.userAgent;
	let windowWidth = window.innerWidth;
	let scrollbarWidth; // グローバルスコープで宣言
	document.addEventListener('DOMContentLoaded', (event) => {
   	scrollbarWidth = window.innerWidth - document.body.clientWidth;
    	// このスコープ内でscrollbarWidthの値を設定
	});
	let margin = 0;
	let lang = document.documentElement.dataset.lang;
	if (!(userAgent.indexOf('iPhone') > 0 || userAgent.indexOf('iPad') > 0 || userAgent.indexOf('Android') > 0 || userAgent.indexOf('Mobile') > 0 )) {
		if ($("#guideDetail").is(":visible") || $("#searchDetail").is(":visible") || $("#trainSearchDetail").is(":visible") || $("#popupDetail").is(":visible") || $("#refreshSettingDetail").is(":visible") || $("#resshaDetail").is(":visible") || $("#oshiraseDetail").is(":visible")) {
			// いずれかのダイアログが表示されていた場合
			margin = scrollbarWidth;
		}

		// PCの場合
		if (windowWidth <= 550) {
			$("#guideDetail .dialog").css("margin", "0px " + scrollbarWidth + "px 0px 0px");
			$("#searchDetail .dialog").css("margin", "0px " + scrollbarWidth + "px 0px 0px");
			$("#trainSearchDetail .dialog").css("margin", "0px " + scrollbarWidth + "px 0px 0px");
			$("#popupDetail .dialog").css("margin", "0px " + scrollbarWidth + "px 0px 0px");
			$("#refreshSettingDetail .dialog").css("margin", "0px " + scrollbarWidth + "px 0px 0px");
			$("#resshaDetail .dialog").css("margin", "0px " + scrollbarWidth + "px 0px 0px");
			$("#oshiraseDetail .dialog").css("margin", "0px " + scrollbarWidth + "px 0px 0px");
		} else {
			if (631 <= windowWidth <= 920) {
				$("#guideDetail .dialog").css("marginLeft", "0px");
			} else {
				$("#guideDetail .dialog").css("marginLeft", scrollbarWidth + "px");
			}
			$("#searchDetail .dialog").css("marginLeft", scrollbarWidth + "px");
			$("#trainSearchDetail .dialog").css("marginLeft", scrollbarWidth + "px");
			$("#popupDetail .dialog").css("marginLeft", scrollbarWidth + "px");
			$("#refreshSettingDetail .dialog").css("marginLeft", scrollbarWidth + "px");
			$("#resshaDetail .dialog").css("marginLeft", scrollbarWidth + "px");
			$("#oshiraseDetail .dialog").css("marginLeft", scrollbarWidth + "px");
		}

		// 画面サイズが一般的なスマホサイズ以下となった場合、画面を縮小させる
		if (windowWidth <= 385) {
			let tr = (385 - windowWidth + 5) * 0.00275;
			$(".main-contents").css("transform", `scale(${1 - tr})`);
			$(".main-contents").css("width", "370px");
		} else {
			$(".main-contents").css("transform", "scale(1)");
			$(".main-contents").css("width", "100%");
		}
	} else {
		$("#guideDetail .dialog").css("margin", "0px");
		$("#searchDetail .dialog").css("margin", "0px");
		$("#trainSearchDetail .dialog").css("margin", "0px");
		$("#popupDetail .dialog").css("margin", "0px");
		$("#refreshSettingDetail .dialog").css("margin", "0px");
		$("#resshaDetail .dialog").css("margin", "0px");
		$("#oshiraseDetail .dialog").css("margin", "0px");

		// 画面サイズが一般的なスマホサイズ以下となった場合、画面を縮小させる
		if (windowWidth <= 375) {
			let tr = (375 - windowWidth) * 0.00265;
			$(".main-contents").css("transform", `scale(${1 - tr})`);
			$(".main-contents").css("width", "370px");
		} else {
			$(".main-contents").css("transform", "scale(1)");
			$(".main-contents").css("width", "100%");
		}
	}

	if (windowWidth <= 1000) {
		// サイドメニューを隠す
		$("#sideMenu .side-menu").css("transform", "translateX(-327px)");
		$("#sideMenu .side-menu").css("box-shadow", "none");
		$("#sideMenu .side-menu-outer").hide();
		$(".sub-header").css("width", "calc(100% - " + margin + "px)");
		$(".sub-footer .homen-footer-contents").css("width", "calc(100% - " + margin + "px)");
		if (lang == "ja") $(".sub-footer .sub-footer-contents.popup .sub-footer-unkou-msg").html("重要な<br>お知らせ");
		// サイドメニュー内の折り畳みを閉じる。
		toggle_close();
		if (!($("#guideDetail").is(":visible") || $("#searchDetail").is(":visible") || $("#trainSearchDetail").is(":visible") || $("#popupDetail").is(":visible") || $("#refreshSettingDetail").is(":visible") || $("#resshaDetail").is(":visible") || $(".trainDetailDialog").is(":visible") || $("#oshiraseDetail").is(":visible"))) {
			// ダイアログが表示されていない場合
			// bodyのスクロールを有効にする。
			set_scroll_show_side_menu();
		}

		// メンテナンスページのタイトルの制御
		if (windowWidth <= 575) {
			let text = $(".maintenance-title").html();
			if (text && text.indexOf("<br>") == -1) {
				$(".maintenance-title").html(text.replace("メンテナンス", "<br>メンテナンス"));
			}
		} else {
			let text = $(".maintenance-title").html();
			if (text && text.indexOf("<br>") > 0) {
				$(".maintenance-title").html(text.replace("<br>", ""));
			}
		}
	} else {
		// サイドメニューを表示する
		margin += 325;
		$("#sideMenu .side-menu").css("transform", "translateX(0px)");
		$("#sideMenu .side-menu .area-contents-header").hide();
		$("#sideMenu .side-menu-outer").hide();
		$(".sub-header").css("width", "calc(100% - " + margin + "px)");
		$(".sub-footer .homen-footer-contents").css("width", "calc(100% - " + margin + "px)");
		if (lang == "ja") $(".sub-footer .sub-footer-contents.popup .sub-footer-unkou-msg").html("重要なお知らせ");
		if (!($("#guideDetail").is(":visible") || $("#searchDetail").is(":visible") || $("#trainSearchDetail").is(":visible") || $("#popupDetail").is(":visible") || $("#refreshSettingDetail").is(":visible") || $("#resshaDetail").is(":visible") || $(".trainDetailDialog").is(":visible") || $("#oshiraseDetail").is(":visible"))) {
			// ダイアログが表示されていない場合
			// bodyのスクロールを有効にする。
			set_scroll_show_side_menu();
		}
	}
}

/*
 * 列車アイコンを描画する。
 */
function create_ressha_icon(_param_rosen, _nowData, _typeData, _ekiData) {
	_nowData.trains.forEach(nowRow => {
		let windowWidth = window.innerWidth;
		let pos = nowRow.pos;
		let width = $("#stationList").width();
		let add = 0;
		if (windowWidth > 1000) add = 325;

		if (pos != "" && $("." + pos).length > 0) {
			if (pos == "R9P11U" || pos == "R9P10U" || pos == "R9P9U" || pos == "R1P160U") {
				// 新函館北斗駅左側（R9P11U）
				// 新函館北斗～仁山間左側（R9P10U）
				// 仁山駅左側（R9P9U）
				// 新千歳空港～南千歳間左側（R1P160U）の場合
				$("." + nowRow.pos).append(create_html_up_ressha_icon(nowRow, _typeData, _ekiData));
				$("." + nowRow.pos).addClass("up");
			} else if (pos == "R9P11D" || pos == "R9P10D" || pos == "R9P9D" || pos == "R1P160D") {
				// 新函館北斗駅右側（R9P11D）
				// 新函館北斗～仁山間右側（R9P10D）
				// 仁山駅右側（R9P9D）
				// 新千歳空港～南千歳間右側（R1P160D）
				if ($("." + nowRow.pos).children(".ressha").length < 4) {
					$(create_html_down_ressha_icon(nowRow, _typeData, _ekiData)).prependTo("." + nowRow.pos);
				} else {
					$("." + nowRow.pos).append(create_html_down_ressha_icon(nowRow, _typeData, _ekiData));
				}
			} else if (pos == "R9P26U") {
				// 藤城線（R9P26U）
				if ($("." + nowRow.pos).children(".ressha").length < 4) {
					$(create_html_up_ressha_icon(nowRow, _typeData, _ekiData)).prependTo("." + nowRow.pos);
					$("." + nowRow.pos).addClass("up");
				} else {
					$("." + nowRow.pos).append(create_html_up_ressha_icon(nowRow, _typeData, _ekiData));
					$("." + nowRow.pos).addClass("up");
				}
			} else if (pos == "R1P119U") {
				// 新千歳空港駅左側（R1P119U）の場合
				$("." + nowRow.pos).append(create_html_up_ressha_icon(nowRow, _typeData, _ekiData));
				$("." + nowRow.pos).addClass("up");
			} else if (pos == "R1P119D") {
				// 新千歳空港駅右側（R1P119D）の場合
				if ($("." + nowRow.pos).children().length < 2) {
					if ($("." + nowRow.pos).children(".ressha").length < 1) {
						$("." + nowRow.pos).append(create_html_down_ressha_icon(nowRow, _typeData, _ekiData));
					} else {
						$(create_html_down_ressha_icon(nowRow, _typeData, _ekiData)).prependTo("." + nowRow.pos);
					}
				} else {
					$("." + nowRow.pos).append(create_html_down_ressha_icon(nowRow, _typeData, _ekiData));
				}
			} else if ($("." + pos).offset().left < width / 2 + add) {
				// アイコン表示位置が画面半分より左の場合
				$("." + nowRow.pos).append(create_html_up_ressha_icon(nowRow, _typeData, _ekiData));
				$("." + nowRow.pos).addClass("up");
			} else {
				// アイコン表示位置が画面半分より右の場合
				if ($("." + nowRow.pos).children(".ressha").length < 6) {
					if ($("." + nowRow.pos).parent().parent().parent(".eki").length > 0) {
						// 駅の場合
						if ($("." + nowRow.pos).children(".ressha").length < 3) {
							$("." + nowRow.pos).append(create_html_down_ressha_icon(nowRow, _typeData, _ekiData));
						} else {
							if ($("." + nowRow.pos).children(".ressha").length == 3) $("<div class='dummy'></div><div class='dummy'></div><div class='dummy'></div>").prependTo(("." + nowRow.pos));
							let idx = $("." + nowRow.pos).children(".ressha").length - 3;
							let test = $("." + nowRow.pos).children()[idx];
							test.outerHTML = create_html_down_ressha_icon(nowRow, _typeData, _ekiData);
						}
					} else {
						// 駅間の場合
						$(create_html_down_ressha_icon(nowRow, _typeData, _ekiData)).prependTo("." + nowRow.pos);
					}
				} else {
					$("." + nowRow.pos).append(create_html_down_ressha_icon(nowRow, _typeData, _ekiData));
				}
			}
		}
	});

	// TID区間外の高さを設定
	set_hirendo_height();

	// 函館駅周辺の高さを設定
	if (["09", "52"].includes(_param_rosen)) set_hakodate_height();
}

/*
 * TID区間外の高さを設定
 */
function set_hirendo_height() {
	// TID区間外の点線内に列車アイコンを表示する領域が２つ or ３つ or ４つ存在するパターンを考慮し高さを設定。
	// 列車アイコン表示領域２つ
	$(".hirendo-contents.two-ressha-contents").each(function(i, row) {
		let ressha = row.getElementsByClassName("hirendo-ressha-panel");
		if (ressha[0].children[0].childElementCount >= 2 || ressha[1].children[0].childElementCount >= 2) {
			// ２つの領域中の上の要素内に列車が２つ以上存在する場合
			let resshaCount = 0;
			if (ressha[0].children[0].childElementCount > ressha[1].children[0].childElementCount) {
				resshaCount = ressha[0].children[0].childElementCount;
			} else {
				resshaCount = ressha[1].children[0].childElementCount;
			}

			if (resshaCount > 6) resshaCount = 6;

			let eki = row.getElementsByClassName("hirendo-eki-contents")[0];
			if (eki.classList[1] == "one-eki") {
				// 駅が１つの場合
				let margin = 50 * resshaCount + 12 * (resshaCount - 2);
				let height = 70 * resshaCount;
				eki.children[0].style.marginTop = margin + "px";
				ressha[0].style.gap = "35px";
				ressha[1].style.gap = "35px";
				ressha[0].children[0].style.height = height + "px";
				ressha[1].children[0].style.height = height + "px";
				ressha[0].children[0].style.padding = "8px 0";
				ressha[1].children[0].style.padding = "8px 0";
			} else if (eki.classList[1] == "three-eki") {
				// 駅が３つの場合
				let margin = 23 * resshaCount + 5 * (resshaCount - 2);
				let height = 65 * resshaCount;
				eki.children[0].style.marginTop = margin + "px";
				eki.children[1].style.marginTop = margin + "px";
				ressha[0].children[0].style.height = height + "px";
				ressha[1].children[0].style.height = height + "px";
				ressha[0].children[0].style.padding = "8px 0";
				ressha[1].children[0].style.padding = "8px 0";
			}
		}

		if (ressha[0].children[1].childElementCount >= 2 || ressha[1].children[1].childElementCount >= 2) {
			// ２つの領域中の下の要素内に列車が２つ以上存在する場合
			let resshaCount = 0;
			if (ressha[0].children[1].childElementCount > ressha[1].children[1].childElementCount) {
				resshaCount = ressha[0].children[1].childElementCount;
			} else {
				resshaCount = ressha[1].children[1].childElementCount;
			}

			if (resshaCount > 6) resshaCount = 6;

			let eki = row.getElementsByClassName("hirendo-eki-contents")[0];
			if (eki.classList[1] == "one-eki") {
				// 駅が１つの場合
				let margin = 50 * resshaCount + 12 * (resshaCount - 2);
				let height = 70 * resshaCount;
				eki.children[0].style.marginBottom = margin + "px";
				ressha[0].style.gap = "35px";
				ressha[1].style.gap = "35px";
				ressha[0].children[1].style.height = height + "px";
				ressha[1].children[1].style.height = height + "px";
				ressha[0].children[1].style.padding = "8px 0";
				ressha[1].children[1].style.padding = "8px 0";
			} else if (eki.classList[1] == "three-eki") {
				// 駅が３つの場合
				let margin = 23 * resshaCount + 5 * (resshaCount - 2);
				let height = 65 * resshaCount;
				eki.children[2].style.marginTop = margin + "px";
				eki.children[2].style.marginBottom = margin + "px";
				ressha[0].children[1].style.height = height + "px";
				ressha[1].children[1].style.height = height + "px";
				ressha[0].children[1].style.padding = "8px 0";
				ressha[1].children[1].style.padding = "8px 0";
			}
		}
	});

	// 列車アイコン表示領域３つ
	$(".hirendo-contents.three-ressha-contents").each(function(i, row) {
		let ressha = row.getElementsByClassName("hirendo-ressha-panel");
		if (ressha[0].children[0].childElementCount >= 2 || ressha[1].children[0].childElementCount >= 2) {
			// ３つの領域中の上の要素内に列車が２つ以上存在する場合
			let resshaCount = 0;
			if (ressha[0].children[0].childElementCount > ressha[1].children[0].childElementCount) {
				resshaCount = ressha[0].children[0].childElementCount;
			} else {
				resshaCount = ressha[1].children[0].childElementCount;
			}

			if (resshaCount > 6) resshaCount = 6;

			let eki = row.getElementsByClassName("hirendo-eki-contents")[0];
			if (eki.classList[1] == "two-eki") {
				// 駅が２つの場合
				let margin = 50 * resshaCount + 12 * (resshaCount - 2);
				let height = 70 * resshaCount;
				eki.children[0].style.marginTop = margin + "px";
				ressha[0].style.gap = "35px";
				ressha[1].style.gap = "35px";
				ressha[0].children[0].style.height = height + "px";
				ressha[1].children[0].style.height = height + "px";
				ressha[0].children[0].style.padding = "8px 0";
				ressha[1].children[0].style.padding = "8px 0";
			}
		}

		if (ressha[0].children[1].childElementCount >= 2 || ressha[1].children[1].childElementCount >= 2) {
			// ３つの領域中の真ん中の要素内に列車が２つ以上存在する場合
			let resshaCount = 0;
			if (ressha[0].children[1].childElementCount > ressha[1].children[1].childElementCount) {
				resshaCount = ressha[0].children[1].childElementCount;
			} else {
				resshaCount = ressha[1].children[1].childElementCount;
			}

			if (resshaCount > 6) resshaCount = 6;

			let eki = row.getElementsByClassName("hirendo-eki-contents")[0];
			if (eki.classList[1] == "two-eki") {
				// 駅が２つの場合
				let margin = 33 * resshaCount;
				let height = 70 * resshaCount;
				eki.children[0].style.marginBottom = margin + "px";
				eki.children[1].style.marginTop = margin + "px";
				ressha[0].style.gap = "35px";
				ressha[1].style.gap = "35px";
				ressha[0].children[1].style.height = height + "px";
				ressha[1].children[1].style.height = height + "px";
				ressha[0].children[1].style.padding = "8px 0";
				ressha[1].children[1].style.padding = "8px 0";
			}
		}

		if (ressha[0].children[2].childElementCount >= 2 || ressha[1].children[2].childElementCount >= 2) {
			// ３つの領域中の下の要素内に列車が２つ以上存在する場合
			let resshaCount = 0;
			if (ressha[0].children[2].childElementCount > ressha[1].children[2].childElementCount) {
				resshaCount = ressha[0].children[2].childElementCount;
			} else {
				resshaCount = ressha[1].children[2].childElementCount;
			}

			if (resshaCount > 6) resshaCount = 6;

			let eki = row.getElementsByClassName("hirendo-eki-contents")[0];
			if (eki.classList[1] == "two-eki") {
				// 駅が２つの場合
				let margin = 50 * resshaCount + 12 * (resshaCount - 2);
				let height = 70 * resshaCount;
				ressha[0].style.gap = "35px";
				ressha[1].style.gap = "35px";
				eki.children[1].style.marginBottom = margin + "px";
				ressha[0].children[2].style.height = height + "px";
				ressha[1].children[2].style.height = height + "px";
				ressha[0].children[2].style.padding = "8px 0";
				ressha[1].children[2].style.padding = "8px 0";
			}
		}
	});

	// 列車アイコン表示領域４つ
	$(".hirendo-contents.four-ressha-contents").each(function(i, row) {
		let ressha = row.getElementsByClassName("hirendo-ressha-panel");
		if (ressha[0].children[0].childElementCount >= 2 || ressha[1].children[0].childElementCount >= 2) {
			// ４つの領域中の一番上の要素内に列車が２つ以上存在する場合
			let resshaCount = 0;
			if (ressha[0].children[0].childElementCount > ressha[1].children[0].childElementCount) {
				resshaCount = ressha[0].children[0].childElementCount;
			} else {
				resshaCount = ressha[1].children[0].childElementCount;
			}

			if (resshaCount > 6) resshaCount = 6;

			let eki = row.getElementsByClassName("hirendo-eki-contents")[0];
			if (eki.classList[1] == "three-eki") {
				// 駅が３つの場合
				let margin = 50 * resshaCount+ 12 * (resshaCount - 2);
				let height = 70 * resshaCount;
				ressha[0].style.gap = "35px";
				ressha[1].style.gap = "35px";
				eki.children[0].style.marginTop = margin + "px";
				ressha[0].children[0].style.height = height + "px";
				ressha[1].children[0].style.height = height + "px";
				ressha[0].children[0].style.padding = "8px 0";
				ressha[1].children[0].style.padding = "8px 0";
			}
		}

		if (ressha[0].children[1].childElementCount >= 2 || ressha[1].children[1].childElementCount >= 2) {
			// ４つの領域中の上から２番目の要素内に列車が２つ以上存在する場合
			let resshaCount = 0;
			if (ressha[0].children[1].childElementCount > ressha[1].children[1].childElementCount) {
				resshaCount = ressha[0].children[1].childElementCount;
			} else {
				resshaCount = ressha[1].children[1].childElementCount;
			}

			if (resshaCount > 6) resshaCount = 6;

			let eki = row.getElementsByClassName("hirendo-eki-contents")[0];
			if (eki.classList[1] == "three-eki") {
				// 駅が３つの場合
				let margin = 35 * resshaCount;
				let height = 70 * resshaCount;
				ressha[0].style.gap = "35px";
				ressha[1].style.gap = "35px";
				eki.children[0].style.marginBottom = margin + "px";
				eki.children[1].style.marginTop = margin + "px";
				ressha[0].children[1].style.height = height + "px";
				ressha[1].children[1].style.height = height + "px";
				ressha[0].children[1].style.padding = "8px 0";
				ressha[1].children[1].style.padding = "8px 0";
			}
		}

		if (ressha[0].children[2].childElementCount >= 2 || ressha[1].children[2].childElementCount >= 2) {
			// ４つの領域中の上から３番目の要素内に列車が２つ以上存在する場合
			let resshaCount = 0;
			if (ressha[0].children[2].childElementCount > ressha[1].children[2].childElementCount) {
				resshaCount = ressha[0].children[2].childElementCount;
			} else {
				resshaCount = ressha[1].children[2].childElementCount;
			}

			if (resshaCount > 6) resshaCount = 6;

			let eki = row.getElementsByClassName("hirendo-eki-contents")[0];
			if (eki.classList[1] == "three-eki") {
				// 駅が３つの場合
				let margin = 35 * resshaCount;
				let height = 70 * resshaCount;
				ressha[0].style.gap = "35px";
				ressha[1].style.gap = "35px";
				eki.children[1].style.marginBottom = margin + "px";
				eki.children[2].style.marginTop = margin + "px";
				ressha[0].children[2].style.height = height + "px";
				ressha[1].children[2].style.height = height + "px";
				ressha[0].children[2].style.padding = "8px 0";
				ressha[1].children[2].style.padding = "8px 0";
			}
		}

		if (ressha[0].children[3].childElementCount >= 2 || ressha[1].children[3].childElementCount >= 2) {
			// ４つの領域中の一番下の要素内に列車が２つ以上存在する場合
			let resshaCount = 0;
			if (ressha[0].children[3].childElementCount > ressha[1].children[3].childElementCount) {
				resshaCount = ressha[0].children[3].childElementCount;
			} else {
				resshaCount = ressha[1].children[3].childElementCount;
			}

			if (resshaCount > 6) resshaCount = 6;

			let eki = row.getElementsByClassName("hirendo-eki-contents")[0];
			if (eki.classList[1] == "three-eki") {
				// 駅が３つの場合
				let margin = 50 * resshaCount+ 12 * (resshaCount - 2);
				let height = 70 * resshaCount;
				ressha[0].style.gap = "35px";
				ressha[1].style.gap = "35px";
				eki.children[2].style.marginBottom = margin + "px";
				ressha[0].children[3].style.height = height + "px";
				ressha[1].children[3].style.height = height + "px";
				ressha[0].children[3].style.padding = "8px 0";
				ressha[1].children[3].style.padding = "8px 0";
			}
		}
	});
}

/*
 * 函館駅周辺の高さを設定
 */
function set_hakodate_height() {
	let countUH = document.querySelector(".R10P41U").childElementCount;
	let countDH = document.querySelector(".R10P41D").childElementCount;
	if ((countUH >= 3 || countDH >= 3)) {
			// 函館駅に列車が３つ以上存在する場合
			let resshaCount = countDH > countUH ? countDH : countUH;
			if (resshaCount > 6) resshaCount = 6;
			let height = 210 + (resshaCount - 2) * 65;
			$("#stationList .item.hakodate").css("height", height + "px");
	}

	let countUG = document.querySelector(".R10P1U").childElementCount;
	let countDG = document.querySelector(".R10P1D").childElementCount;
	if ((countUG >= 4 || countDG >= 4)) {
			// 五稜郭駅に列車が４つ以上存在する場合
			$("#stationList .item.goryokaku").css("height", "136px");
			$("#goryokaku").hide();
			$("#goryokakuLong").show();
	}
}

/*
 *　上り列車のアイコンのhtmlを生成する。
 */
function create_html_up_ressha_icon(_nowRow, _typeData, _ekiData) {
	let lang = document.documentElement.dataset.lang;
	let objItem = document.createElement("div");
	objItem.classList.add("ressha");

	// 列車種別マスタから列車種別を取得
	let type = _typeData.find((v) => v.type == _nowRow.type);
	// アイコン内の列車種別を設定
	let iconArea = document.createElement("div");
	iconArea.classList.add("icon-img");
	// 新幹線以外には列車種別の文字をアイコンに入れる
	if(_nowRow.type != "4") {
		let objSbt = document.createElement("span");
		objSbt.classList.add("ressha-sbt");
		if (typeof type !== "undefined") {
			objSbt.textContent = type.typeSimple[lang];
			objSbt.setAttribute("sbt", type.typeSimple[lang]);
		}
		iconArea.appendChild(objSbt);
	}
	objItem.appendChild(iconArea);

	// 遅延を設定
	let chienText = "";
	if (_nowRow.chien > 0) {
		if (_nowRow.chien >= 999) {
			if (lang == "ja") chienText = "+大幅";
			if (lang == "en") chienText = "+Very";
			if (lang == "tc") chienText = "+大幅";
			if (lang == "sc") chienText = "+大幅";
			if (lang == "kr") chienText = "+대폭";
		} else {
			chienText = "+" + _nowRow.chien;
		}
	}
	let objOkure = document.createElement("span");
	objOkure.classList.add("okure-label");
	objOkure.textContent = chienText;
	objItem.appendChild(objOkure);

	// 列車アイコンの矢印を設定
	let objArrow = document.createElement("img");
	objArrow.classList.add("arrow");
	objArrow.setAttribute("src", "./images/home/train_icon_arrow_up.svg");
	objArrow.setAttribute("alt", "");
	objItem.appendChild(objArrow);

	// 行先を設定
	if (lang == "ja") {
		let objYukisaki = document.createElement("span");
		objYukisaki.classList.add("yukisaki-label");
		objYukisaki.textContent = _nowRow.shuEkiSimple;
		objItem.appendChild(objYukisaki);
	}

	// 部分運休の！を設定
	if (_nowRow.status == "2") {
		let objExclamation = document.createElement("img");
		objExclamation.classList.add("exclamation");
		objExclamation.setAttribute("src", "./images/home/exclamation.svg");
		objExclamation.setAttribute("alt", "");
		objItem.appendChild(objExclamation);
	}

	// 列車詳細に表示する内容の設定
	create_ressha_detail(objItem, _nowRow, _typeData, _ekiData);

	return objItem.outerHTML;
}

/*
 * 下り列車のアイコンのhtmlを生成する。
 */
function create_html_down_ressha_icon(_nowRow, _typeData, _ekiData) {
	let lang = document.documentElement.dataset.lang;
	let objItem = document.createElement("div");
	objItem.classList.add("ressha");

	// 遅延を設定
	let chienText = "";
	if (_nowRow.chien > 0) {
		if (_nowRow.chien >= 999) {
			if (lang == "ja") chienText = "+大幅";
			if (lang == "en") chienText = "+Very";
			if (lang == "tc") chienText = "+大幅";
			if (lang == "sc") chienText = "+大幅";
			if (lang == "kr") chienText = "+대폭";
		} else {
			chienText = "+" + _nowRow.chien;
		}
	}
	let objOkure = document.createElement("span");
	objOkure.classList.add("okure-label");
	objOkure.textContent = chienText;
	objItem.appendChild(objOkure);

	// 列車種別マスタから列車種別を取得
	let type = _typeData.find((v) => v.type == _nowRow.type);
	// アイコン内の列車種別を設定
	let iconArea = document.createElement("div");
	iconArea.classList.add("icon-img");
	// 新幹線以外には列車種別の文字をアイコンに入れる
	if(_nowRow.type != "4") {
		let objSbt = document.createElement("span");
		objSbt.classList.add("ressha-sbt");
		if (typeof type !== "undefined") {
			objSbt.textContent = type.typeSimple[lang];
			objSbt.setAttribute("sbt", type.typeSimple[lang]);
		}
		iconArea.appendChild(objSbt);
	}
	objItem.appendChild(iconArea);

	// 列車アイコンの矢印を設定
	let objArrow = document.createElement("img");
	objArrow.classList.add("arrow");
	objArrow.setAttribute("src", "./images/home/train_icon_arrow_down.svg");
	objArrow.setAttribute("alt", "");
	objItem.appendChild(objArrow);

	// 行先を設定
	if (lang == "ja") {
		let objYukisaki = document.createElement("span");
		objYukisaki.classList.add("yukisaki-label");
		objYukisaki.textContent = _nowRow.shuEkiSimple;
		objItem.appendChild(objYukisaki);
	}

	// 部分運休の！を設定
	if (_nowRow.status == "2") {
		let objExclamation = document.createElement("img");
		objExclamation.classList.add("exclamation");
		objExclamation.setAttribute("src", "./images/home/exclamation.svg");
		objExclamation.setAttribute("alt", "");
		objItem.appendChild(objExclamation);
	}

	// 列車詳細に表示する内容の設定
	create_ressha_detail(objItem, _nowRow, _typeData, _ekiData);

	return objItem.outerHTML;
}

/*
 * 列車詳細用の隠し要素を設定する。
 */
function create_ressha_detail(_objItem, _nowRow, _typeData, _ekiData) {
	let lang = document.documentElement.dataset.lang;
	// 列車種別マスタから列車種別を取得
	let type = _typeData.find((v) => v.type == _nowRow.type);

	// 隠し属性を設定する。（運行情報詳細を表示する際に使用する）
	{
		// 列車番号
		{
			_objItem.dataset.cbango = _nowRow.cbango;
		}

		// 列車種別を表す色を設定。
		{
			if (type && type.labelColor) {
				_objItem.dataset.ressha_type = type.labelColor;
			} else {
				_objItem.dataset.ressha_type = "";
			}
		}

		// 列車種別名
		{
			if (type) {
				if (type.type === 8) {
					_objItem.dataset.ressha_type_name = "快速";
				} else {
					_objItem.dataset.ressha_type_name = type.typeText[lang];
				}
			}

		}

		// 運行状態コード ※0=全区間運休、1=運転、2=部分運休
		_objItem.dataset.unkou = _nowRow.status;

		if (lang == "ja") {
			// 運行状態名
			{
				if (_nowRow.status == "0") _objItem.dataset.unkou_name = "全区間運休";
				if (_nowRow.status == "1") _objItem.dataset.unkou_name = "";
				if (_nowRow.status == "2") _objItem.dataset.unkou_name = "部分運休";
			}
			// 運行状態詳細
			{
				if (!_nowRow.statusDetail || _nowRow.statusDetail == "") _objItem.dataset.unkou_detail = "─";
				else _objItem.dataset.unkou_detail = _nowRow.statusDetail;
			}
		}
		else if (lang == "en") {
			// 運行状態名
			{
				if (_nowRow.status == "0") _objItem.dataset.unkou_name = "All sections cancelled";
				if (_nowRow.status == "1") _objItem.dataset.unkou_name = "";
				if (_nowRow.status == "2") _objItem.dataset.unkou_name = "Partially cancelled";
			}
			// 運行状態詳細
			{
				if (!_nowRow.statusDetailEn || _nowRow.statusDetailEn == "") _objItem.dataset.unkou_detail = "─";
				else _objItem.dataset.unkou_detail = _nowRow.statusDetailEn;
			}
		}
		else if (lang == "tc") {
			// 運行状態名
			{
				if (_nowRow.status == "0") _objItem.dataset.unkou_name = "全區間停駛";
				if (_nowRow.status == "1") _objItem.dataset.unkou_name = "";
				if (_nowRow.status == "2") _objItem.dataset.unkou_name = "部分停駛";
			}
			// 運行状態詳細
			{
				if (!_nowRow.statusDetailTc || _nowRow.statusDetailTc == "") _objItem.dataset.unkou_detail = "─";
				else _objItem.dataset.unkou_detail = _nowRow.statusDetailTc;
			}
		}
		else if (lang == "sc") {
			// 運行状態名
			{
				if (_nowRow.status == "0") _objItem.dataset.unkou_name = "全区间停驶";
				if (_nowRow.status == "1") _objItem.dataset.unkou_name = "";
				if (_nowRow.status == "2") _objItem.dataset.unkou_name = "部分停驶";
			}
			// 運行状態詳細
			{
				if (!_nowRow.statusDetailSc || _nowRow.statusDetailSc == "") _objItem.dataset.unkou_detail = "─";
				else _objItem.dataset.unkou_detail = _nowRow.statusDetailSc;
			}
		}
		else if (lang == "kr") {
			// 運行状態名
			{
				if (_nowRow.status == "0") _objItem.dataset.unkou_name = "전 구간<br>운행 중지";
				if (_nowRow.status == "1") _objItem.dataset.unkou_name = "";
				if (_nowRow.status == "2") _objItem.dataset.unkou_name = "부분 운행<br>중지";
			}
			// 運行状態詳細
			{
				if (!_nowRow.statusDetailKr || _nowRow.statusDetailKr == "") _objItem.dataset.unkou_detail = "─";
				else _objItem.dataset.unkou_detail = _nowRow.statusDetailKr;
			}
		}

		// 遅れ
		_objItem.dataset.chien = _nowRow.chien ? _nowRow.chien : "0";
		if (_nowRow.yokuStatus == 1 || _nowRow.yokuStatus == 2) {
			_objItem.dataset.chien_text = _nowRow.yokuDetail[lang];
		} else if (_nowRow.chien >= 1) {
			const CHIEN_LABEL_DELAYED_HOUR = { "ja": "{0}時間遅れ", "en": "{0} hour(s) late", "tc": "延遲{0}小時", "sc": "延迟{0}小时", "kr": "{0}시간 지연" };
			const CHIEN_LABEL_DELAYED_HR_MIN = { "ja": "{0}時間{1}分遅れ", "en": "{0} hr {1} min late", "tc": "延遲{0}小時{1}分", "sc": "延迟{0}小时{1}分", "kr": "{0}시간 {1}분 지연" };
			const CHIEN_LABEL_DELAYED_MINUTES = { "ja": "{0}分遅れ", "en": "{0} minutes late", "tc": "延遲{0}分", "sc": "延迟{0}分", "kr": "{0}분 지연" };
			let chienHour = Math.floor(_nowRow.chien / 60);
			let chienMin = _nowRow.chien % 60;
			if (chienHour > 0){
				if (chienMin > 0) _objItem.dataset.chien_text = CHIEN_LABEL_DELAYED_HR_MIN[lang].replace("{0}", chienHour).replace("{1}", chienMin); // 「〇時間〇分遅れ」
				else _objItem.dataset.chien_text = CHIEN_LABEL_DELAYED_HOUR[lang].replace("{0}",chienHour); // 「〇時間遅れ」
			} else {
				// 英語で1分遅れの場合「1 minute late」になる
				if (lang == "en" && chienMin == 1)_objItem.dataset.chien_text = chienMin + " minute late";
				else _objItem.dataset.chien_text = CHIEN_LABEL_DELAYED_MINUTES[lang].replace("{0}", chienMin); // 「〇分遅れ」
			}
		} else {
			_objItem.dataset.chien_status = "0"
		}

		// 線区
		_objItem.dataset.senku = _nowRow.senku;

		// 地点キー
		_objItem.dataset.pos = _nowRow.pos;

		// 駅マスタからダイヤデータの終着駅を取得する
		let findEki = _ekiData.find((v) => v.key == _nowRow.shuEkiKey);

		// 行先
		if (lang == "ja") _objItem.dataset.shu_eki = typeof findEki !== "undefined" ? findEki.ja + " 行き" : "行き";
		if (lang == "en") _objItem.dataset.shu_eki = typeof findEki !== "undefined" ? "For " + findEki.en : "For ";
		if (lang == "tc") _objItem.dataset.shu_eki = typeof findEki !== "undefined" ? "開往" + findEki.tc : "開往";
		if (lang == "sc") _objItem.dataset.shu_eki = typeof findEki !== "undefined" ? "开往" + findEki.sc : "开往";
		if (lang == "kr") _objItem.dataset.shu_eki = typeof findEki !== "undefined" ? findEki.kr + "행" : "행";

		// 車両数
		_objItem.dataset.ryosu = _nowRow.ryosu && _nowRow.ryosu != 0 ? _nowRow.ryosu : "";
		if (_objItem.dataset.ryosu != "") {
			if (lang == "ja") _objItem.dataset.ryosu += "両";
			if (lang == "en") _objItem.dataset.ryosu += " car(s)";
			if (lang == "tc") _objItem.dataset.ryosu += "節車廂";
			if (lang == "sc") _objItem.dataset.ryosu += "节车厢";
			if (lang == "kr") _objItem.dataset.ryosu += "량 편성";
		}
	}
}

/*
 * ヘッダーの高さ分の余白を設定する。
 */
function set_header_height() {
	let height = $(".train-guide-contents .sub-header").height();
	$(".station-list-contents").css("marginTop", 5 + height + "px");
}

/*
 * ダイアログを開くときのbodyのスクロールを無効にする。
 */
function set_scroll_hide(dialog) {
	let userAgent = navigator.userAgent;
	let windowWidth = window.innerWidth;
	let scrollbarWidth = window.innerWidth - document.body.clientWidth;
	let width = 0;
	if (windowWidth > 1000) width = 325;

	if (!$("#sideMenu .side-menu-outer").is(":visible")) scrollY = window.scrollY; // サイドメニュー非表示時
	$("body").css("overflow-y", "hidden");
	$("body").css("position", "fixed");
	$(".station-list-contents").css("position", "relative");
	if (!$("#sideMenu .side-menu-outer").is(":visible")) $(".station-list-contents").css("top",  scrollY * -1 + "px"); // サイドメニュー非表示時

	if (!(userAgent.indexOf('iPhone') > 0 || userAgent.indexOf('iPad') > 0 || userAgent.indexOf('Android') > 0 || userAgent.indexOf('Mobile') > 0 )) {
		// PCの場合
		width += scrollbarWidth;
		$("body").css("width", "calc(100% - " + scrollbarWidth + "px)");
		$("header").css("width", "calc(100% - " + scrollbarWidth + "px)");
		$(".sub-header").css("width", "calc(100% - " + width + "px)");
		$(".sub-footer").css("paddingRight", scrollbarWidth + "px");
		$(".sub-footer .homen-footer-contents").css("width", "calc(100% - " + width + "px)");
		$(".sub-footer .homen-footer-contents").css("marginRight", scrollbarWidth + "px");
		$("#menuLayer .menu").css("marginRight", scrollbarWidth + "px");
		$("#menuLayer .menu").css("width", "calc(99.3% - " + scrollbarWidth + "px)");
		if (windowWidth <= 550) {
			dialog.css("marginLeft", "0px");
			dialog.css("marginRight", scrollbarWidth + "px");
		} else {
			if (dialog.parent().parent().attr("id") == "guideDetail" && 631 <= windowWidth <= 920) {
				dialog.css("marginLeft", "0px");
				dialog.css("marginRight", scrollbarWidth + "px");
			} else {
				dialog.css("marginLeft", scrollbarWidth + "px");
			}
		}
	} else {
		dialog.css("marginLeft", "0px");
	}

	isDialogDisp = true;
}

/*
 * ダイアログを閉じるときのbodyのスクロールを有効にする。
 */
function set_scroll_show(dialog) {
	let userAgent = navigator.userAgent;
	let windowWidth = window.innerWidth;
	let scrollbarWidth = window.innerWidth - document.body.clientWidth;
	let width = 0;
	if (windowWidth > 1000) width = 325;

	$("body").css("overflow-y", "scroll");
	$("body").css("position", "static");
	$(".station-list-contents").css("position", "static");
	window.scrollTo(0, scrollY);

	if (!(userAgent.indexOf('iPhone') > 0 || userAgent.indexOf('iPad') > 0 || userAgent.indexOf('Android') > 0 || userAgent.indexOf('Mobile') > 0 )) {
		// PCの場合
		$("body").css("width", "100%");
		$("header").css("width", "100%");
		$(".sub-header").css("width", "calc(100% - " + width + "px)");
		$(".sub-footer").css("paddingRight", "0px");
		$(".sub-footer .homen-footer-contents").css("width", "calc(100% - " + width + "px)");
		$(".sub-footer .homen-footer-contents").css("marginRight", "0px");
		$("#menuLayer .menu").css("margin", "0");
		$("#menuLayer .menu").css("width", "99.3%");
		if (windowWidth <= 550) {
			dialog.css("marginLeft", "0px");
			dialog.css("marginRight", "0px");
		} else {
			if (dialog.parent().parent().attr("id") == "guideDetail") {
				if (631 <= windowWidth <= 920) {
					dialog.css("marginLeft", "0px");
					dialog.css("marginRight", "0px");
				} else {
					dialog.css("marginLeft", scrollbarWidth + "px");
				}
			} else {
				dialog.css("marginLeft", (scrollbarWidth * 2) + "px");
			}
		}
	}

	isDialogDisp = false;
}

/*
 * サイドメニューを開くときのbodyのスクロールを無効にする。
 */
function set_scroll_hide_side_menu() {
	let userAgent = navigator.userAgent;
	let scrollbarWidth = window.innerWidth - document.body.clientWidth;
	scrollY = window.scrollY;
	$("body").css("overflow-y", "hidden");
	$("body").css("position", "fixed");
	$(".station-list-contents").css("position", "relative");
	$(".station-list-contents").css("top",  scrollY * -1 + "px");

	if (!(userAgent.indexOf('iPhone') > 0 || userAgent.indexOf('iPad') > 0 || userAgent.indexOf('Android') > 0 || userAgent.indexOf('Mobile') > 0 )) {
		// PCの場合
		$("body").css("width", "calc(100% - " + scrollbarWidth + "px)");
		$("header").css("width", "calc(100% - " + scrollbarWidth + "px)");
		$(".sub-header").css("width", "calc(100% - " + scrollbarWidth + "px)");
		$(".sub-footer").css("paddingRight", scrollbarWidth + "px");
		$(".sub-footer .homen-footer-contents").css("width", "calc(100% - " + scrollbarWidth + "px)");
		$(".sub-footer .homen-footer-contents").css("marginRight", scrollbarWidth + "px");
		$("#menuLayer .menu").css("marginRight", scrollbarWidth + "px");
		$("#menuLayer .menu").css("width", "calc(99.3% - " + scrollbarWidth + "px)");
	}

	isSideMenuDisp = true;
}

/*
 * サイドメニューを閉じるときのbodyのスクロールを有効にする。
 */
function set_scroll_show_side_menu() {
	let userAgent = navigator.userAgent;
	let windowWidth = window.innerWidth;
	let width = 0;
	if (windowWidth > 1000) width = 325;

	$("body").css("overflow-y", "scroll");
	$("body").css("position", "static");
	$(".station-list-contents").css("position", "static");
	// サイドメニューの表示がある場合のみ(他路線への移動の場合はスクロールの移動を行わない)
	if (isSideMenuDisp) window.scrollTo(0, scrollY);

	if (!(userAgent.indexOf('iPhone') > 0 || userAgent.indexOf('iPad') > 0 || userAgent.indexOf('Android') > 0 || userAgent.indexOf('Mobile') > 0 )) {
		// PCの場合
		$("body").css("width", "100%");
		$("header").css("width", "100%");
		$(".sub-header").css("width", "calc(100% - " + width + "px)");
		$(".sub-footer").css("paddingRight", "0px");
		$(".sub-footer .homen-footer-contents").css("width", "calc(100% - " + width + "px)");
		$(".sub-footer .homen-footer-contents").css("marginRight", "0px");
		$("#menuLayer .menu").css("margin", "0");
		$("#menuLayer .menu").css("width", "99.3%");
	}

	isSideMenuDisp = false;
}

/*
 * タブ選択時の制御処理
 */
function tab_select(_str) {

	// タブ内の折り畳みを閉じる。
	toggle_close();

	if (_str == "Exp") {
		$('#localTab').hide();
		$('#expTab').show();
	} else {
		$('#localTab').show();
		$('#expTab').hide();
	}
}

/*
 * タブ選択時の制御処理（リサイズ時）
 */
function tab_select_resize(_str) {

	if (_str == "Exp") {
		$('#localTab').hide();
		$('#expTab').show();
	} else {
		$('#localTab').show();
		$('#expTab').hide();
	}
}

/*
 * タブ内の折り畳みを閉じる。
 */
function toggle_close() {
	// 特急リストをたたむ
	$(".express-train-list").css("display", "none");
	// 特急リストの見出し（三角）を初期化
	$(".express-name-label").removeClass("open");
	// サイドメニューをたたむ
	$(".rosen-name-list").css("display", "none");
	// サイドメニューの見出し（三角）を初期化
	$(".area-name-label").removeClass("open");
}

/*
 * ハッシュに保持した列車番号の列車が走行中か確認を行う
 */
function ressha_run_check() {
	// ローディングアニメーションを表示
	loading_animation_display();
	$("body,html").scrollTop(0);

	let param_cbango = get_param_cbango();
	let ressha = $("div[data-cbango='" + param_cbango + "']");
	if (ressha.length > 0) {
		let pos = ressha.offset().top - 260;
		// リロードされた場合アニメーションを行わない
		if (!is_reload()) {
			$("body,html").animate({scrollTop: pos});
		} else {
			$("body,html").scrollTop(pos);
		}
		window.sessionStorage.setItem("scrollY", pos - 50);

		let html = "<img class='ressha-animation' src='./images/home/ressha_mark.svg' alt>"
		ressha.append(html);

		// 選択した列車に赤枠をつけて強調する
		set_ressha_icon_animation();

		// ローディングアニメーションを非表示にする
		loading_animation_hidden();

	} else {
		// 現在表示中の路線を取得
		isNotInitDisp = true;
		let rosen = get_param_rosen();
		location.hash = "rosen=" + rosen;
		// ページの読み込みが終わってからダイアログ表示
		$("#oshiraseDetail").fadeIn("fast");
		let lang = document.documentElement.dataset.lang;
		if (lang == "ja") $("#oshiraseDetailMain .text").text("現在はこの列車の営業時間外です。");
		if (lang == "en") $("#oshiraseDetailMain .text").text("This train is not in operation now.");
		if (lang == "tc") $("#oshiraseDetailMain .text").text("現在非本列車營運時間。");
		if (lang == "sc") $("#oshiraseDetailMain .text").text("现在非本列车营运时间。");
		if (lang == "kr") $("#oshiraseDetailMain .text").text("현재 이 열차는 주행하고 있지 않습니다.");
		set_scroll_hide($("#oshiraseDetail .dialog"));
	}

	if (window.innerWidth <= 1000) {
		// サイドメニューを閉じる
		$("#sideMenu .side-menu").css("transform", "translateX(-327px)");
		$("#sideMenu .side-menu").css("box-shadow", "none");
		$("#localTab").show();
		$("#expTab").show();
		$("#sideMenu .side-menu-outer").hide();
		// サイドメニュー内の折り畳みを閉じる。
		toggle_close();
	}
}

/*
 * ハッシュから路線を取得
 */
function get_param_rosen() {
	let params = location.hash.slice(1).split('&');
	if (params.length > 0) {
		if (params[0].indexOf("rosen=") >= 0) return params[0].slice(-2);
		else return "";
	}
}

/*
 * ハッシュからid（駅キー）を取得
 */
function get_param_id() {
	let params = location.hash.slice(1).split('&');
	if (params.length > 1) {
		if (params[1].indexOf("id=") >= 0) return params[1].slice(-3);
		else return "";
	}
}

/*
 * ハッシュからcbangoを取得
 */
function get_param_cbango() {
	let params = location.hash.slice(1).split('&');
	if (params.length > 1) {
		if (params[1].indexOf("cbango=") >= 0) return params[1].substring(7);
		else return "";
	}
}

/*
 * 列車検索ダイアログを初期状態に戻す
 */
function reset_train_search_dialog() {
	$("#trainSearchNumberInput").val("");
	$("#trainSearchNameNumberInput").val("");
	$("#trainSearchResultInfo").empty();
	$("#trainSearchResult").empty();
}

/*
 * 列車検索ダイアログを閉じる
 */
function close_train_search_dialog() {
	$("#trainSearchDetail").fadeOut("fast");
	set_scroll_show($("#trainSearchDetail .dialog"));
}

/*
 * 現在走行していない列車を選択した際のメッセージを表示する
 */
function show_train_not_running_message() {
	$("#oshiraseDetail").fadeIn("fast");
	let lang = document.documentElement.dataset.lang;
	if (lang == "ja") $("#oshiraseDetailMain .text").text("この列車は現在走行していません。");
	if (lang == "en") $("#oshiraseDetailMain .text").text("This train is not currently running.");
	if (lang == "tc") $("#oshiraseDetailMain .text").text("本列車目前未行駛。");
	if (lang == "sc") $("#oshiraseDetailMain .text").text("本列车目前未运行。");
	if (lang == "kr") $("#oshiraseDetailMain .text").text("이 열차는 현재 주행하고 있지 않습니다.");
	set_scroll_hide($("#oshiraseDetail .dialog"));
}

/*
 * 列車検索データを読み込む
 */
function find_train_search_result(cbango) {
	if (!cachedTrainSearchData || !Array.isArray(cachedTrainSearchData.trains)) return undefined;
	const normalizedCbango = normalize_train_search_cbango(cbango);
	return cachedTrainSearchData.trains.find((train) => normalize_train_search_cbango(train.cbango) === normalizedCbango);
}

function load_train_search_data() {
	if (cachedTrainSearchData && (Date.now() - cachedTrainSearchLoadedAt) < TRAIN_SEARCH_CACHE_TTL) {
		return Promise.resolve(cachedTrainSearchData);
	}
	if (trainSearchDataPromise) return trainSearchDataPromise;

	const lang = document.documentElement.dataset.lang;
	const mstNow = Date.now() >>> 16;
	const trnNow = Date.now() >>> 10;
	const searchSourceRosens = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15"];
	const daiyaSourceSenkus = ["00"].concat(searchSourceRosens, ["19"]);
	const expressMasterPromise = jqxhr_to_promise($.getJSON("https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/master/express_master.json?" + mstNow));
	const expressCorePromise = jqxhr_to_promise($.getJSON("https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/trainlocation/json/express/core/express_core.json?" + mstNow));
	const expressNowPromise = jqxhr_to_promise($.getJSON("https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/trainlocation/json/express/now/express_now.json?" + trnNow))
		.catch(() => ({ "trains": [] }));
	const typePromise = cachedResshaTypeData ? Promise.resolve(cachedResshaTypeData) : jqxhr_to_promise($.getJSON("https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/master/ressha_type_master.json?" + mstNow));
	const ekiPromise = cachedEkiData ? Promise.resolve(cachedEkiData) : jqxhr_to_promise($.getJSON("https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/master/eki_master.json?" + mstNow));
	const locationPromises = searchSourceRosens.map((rosen) =>
		jqxhr_to_promise($.getJSON(get_location_json_url(rosen, trnNow)))
			.then((data) => ({ "rosen": rosen, "data": data }))
			.catch(() => null)
	);
	const daiyaPromises = daiyaSourceSenkus.map((senku) =>
		jqxhr_to_promise($.getJSON("https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/daiya/daiya_" + senku + (lang === "ja" ? "" : "_" + lang) + ".json?" + mstNow))
			.then((data) => ({ "senku": senku, "data": data }))
			.catch(() => null)
	);

	trainSearchDataPromise = Promise.all([
		expressMasterPromise,
		expressCorePromise,
		expressNowPromise,
		typePromise,
		ekiPromise,
		Promise.all(daiyaPromises),
		Promise.all(locationPromises)
	]).then(([expressMaster, expressCore, expressNowData, typeData, ekiData, daiyaDataList, locationDataList]) => {
		cachedResshaTypeData = typeData;
		cachedEkiData = ekiData;
		const daiyaMap = new Map();
		const expressNowMap = new Map();
		const expressCoreTrainMap = new Map();
		daiyaDataList.filter(Boolean).forEach((entry) => {
			if (!entry.data || !Array.isArray(entry.data.today)) return;
			entry.data.today.forEach((row) => {
				if (!row || !row.cbango) return;
				const cbango = String(row.cbango);
				const current = daiyaMap.get(cbango);
				const candidate = Object.assign({ "senku": entry.senku }, row);
				if (!current) {
					daiyaMap.set(cbango, candidate);
					return;
				}
				const merged = Object.assign({}, current);
				Object.keys(candidate).forEach((key) => {
					const value = candidate[key];
					if (value === "" || value === null || typeof value === "undefined") return;
					if (key === "senku") {
						if (!merged.senku || (merged.senku !== "00" && value === "00")) merged.senku = value;
						return;
					}
					if (key === "stations") {
						if (!Array.isArray(merged.stations) || merged.stations.length === 0 || (Array.isArray(value) && value.length > merged.stations.length)) {
							merged.stations = value;
						}
						return;
					}
					if (merged[key] === "" || merged[key] === null || typeof merged[key] === "undefined") {
						merged[key] = value;
					}
				});
				daiyaMap.set(cbango, merged);
			});
		});
		if (expressNowData && Array.isArray(expressNowData.trains)) {
			expressNowData.trains.forEach((train) => {
				if (!train || !train.cbango) return;
				expressNowMap.set(String(train.cbango).toUpperCase(), train);
			});
		}
		if (expressCore && Array.isArray(expressCore.expresses)) {
			expressCore.expresses.forEach((express) => {
				if (!express || !Array.isArray(express.trains)) return;
				express.trains.forEach((train) => {
					if (!train || !train.cbango) return;
					expressCoreTrainMap.set(String(train.cbango).toUpperCase(), train);
				});
			});
		}

		const trainMap = new Map();
		locationDataList.filter(Boolean).forEach((entry) => {
			if (!entry.data || !Array.isArray(entry.data.trains)) return;
			entry.data.trains.forEach((train) => {
				if (!train || !train.cbango) return;
				const cbango = String(train.cbango).toUpperCase();
				const daiya = daiyaMap.get(String(train.cbango));
				const nameInfo = parse_train_name(daiya && daiya.name ? daiya.name : "");
				const displayName = build_train_search_display_name(train, daiya, typeData, ekiData);
				const targetRosen = normalizeMergedRosen(entry.rosen, nameInfo.baseName || displayName);
				const candidate = {
					"cbango": cbango,
					"type": String(train.type || ""),
					"value": targetRosen,
					"name": displayName,
					"status": getTrainChienText(train),
					"baseName": nameInfo.baseName,
					"goNumber": nameInfo.goNumber,
					"hasCustomName": !!nameInfo.baseName,
					"isRunning": true
				};
				const current = trainMap.get(cbango);
				if (!current || (!current.hasCustomName && candidate.hasCustomName)) {
					trainMap.set(cbango, candidate);
				}
			});
		});
		daiyaMap.forEach((daiya, cbangoKey) => {
			const cbango = String(cbangoKey).toUpperCase();
			if (trainMap.has(cbango)) return;
			const nameInfo = parse_train_name(daiya && daiya.name ? daiya.name : "");
			const expressNow = expressNowMap.get(cbango);
			const expressCoreTrain = expressCoreTrainMap.get(cbango);
			const statusDetail = expressNow ? (
				lang === "ja" ? expressNow.statusDetail :
				lang === "en" ? expressNow.statusDetailEn :
				lang === "tc" ? expressNow.statusDetailTc :
				lang === "sc" ? expressNow.statusDetailSc :
				lang === "kr" ? expressNow.statusDetailKr : ""
			) : "";
			const resolvedType = resolve_train_search_type(
				expressCoreTrain && typeof expressCoreTrain.type !== "undefined" ? String(expressCoreTrain.type) : (daiya && typeof daiya.type !== "undefined" ? String(daiya.type) : ""),
				daiya ? daiya.name : "",
				typeData,
				cbango,
				daiya ? daiya.senku : ""
			);
			const displayName = build_train_search_display_name({
				"type": resolvedType,
				"shuEkiKey": daiya ? daiya.shuEkiKey : "",
				"cbango": cbango
			}, daiya, typeData, ekiData);
			const detailTrain = daiya ? {
				"cbango": cbango,
				"name": daiya.name || "",
				"type": resolvedType,
				"shuEki": daiya.shuEkiKey || "",
				"ryosu": daiya.ryosu || "",
				"senku": daiya.senku || "00"
			} : null;
			if (detailTrain && expressNow) {
				detailTrain.runStatus = expressNow.runStatus;
				detailTrain.yokuStatus = expressNow.yokuStatus;
				detailTrain.yokuDetail = expressNow.yokuDetail;
				detailTrain.status = expressNow.status;
				detailTrain.statusDetail = statusDetail;
				detailTrain.chien = expressNow.chien;
			}
			trainMap.set(cbango, {
				"cbango": cbango,
				"type": resolvedType,
				"value": "",
				"name": displayName,
				"status": "この列車は現在走行していません。",
				"baseName": nameInfo.baseName,
				"goNumber": nameInfo.goNumber,
				"hasCustomName": !!nameInfo.baseName,
				"isRunning": false,
				"detailTrain": detailTrain
			});
		});
		const trains = Array.from(trainMap.values()).sort((a, b) => a.cbango.localeCompare(b.cbango, "ja"));
		const activeExpressKeys = new Set(
			(expressCore && Array.isArray(expressCore.expresses) ? expressCore.expresses : [])
				.filter((row) => row && Array.isArray(row.trains) && row.trains.length > 0)
				.map((row) => row.key)
		);
		const names = Array.from(new Set(
			(expressMaster && Array.isArray(expressMaster) ? expressMaster : [])
				.filter((row) => activeExpressKeys.has(row.key))
				.map((row) => row.name && row.name[lang] ? row.name[lang] : "")
				.filter(Boolean)
		)).sort((a, b) => a.localeCompare(b, "ja"));
		cachedTrainSearchData = { "trains": trains, "names": names };
		cachedTrainSearchLoadedAt = Date.now();
		trainSearchDataPromise = null;
		return cachedTrainSearchData;
	}).catch((error) => {
		trainSearchDataPromise = null;
		throw error;
	});

	return trainSearchDataPromise;
}

/*
 * 列車名プルダウンを構築する
 */
function populate_train_search_name_select(searchData) {
	const select = $("#trainSearchNameSelect");
	select.empty();
	select.append($("<option>").val("").text("列車名を選択"));
	if (searchData && Array.isArray(searchData.names)) {
		searchData.names.forEach((name) => {
			select.append($("<option>").val(name).text(name));
		});
	}
}

/*
 * 列車名と号数を分解する
 */
function parse_train_name(name) {
	const text = String(name || "")
		.replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xFEE0))
		.replace(/\u3000/g, " ")
		.trim();
	if (!text) return { "baseName": "", "goNumber": "" };
	const match = text.match(/^(.*?)(\d+)号?$/);
	if (!match) return { "baseName": text, "goNumber": "" };
	return {
		"baseName": match[1].trim(),
		"goNumber": match[2]
	};
}

/*
 * 列車検索用の表示名を作成する
 */
function build_train_search_display_name(train, daiya, typeData, ekiData) {
	const lang = document.documentElement.dataset.lang;
	const destKey = train.shuEkiKey || (daiya ? daiya.shuEkiKey : "");
	const dest = ekiData.find((row) => row.key == destKey);
	const destName = dest ? (dest[lang] || dest.ja || "") : "";
	const destText = destName ? " " + destName + "行" : "";
	const nameInfo = parse_train_name(daiya && daiya.name ? daiya.name : "");
	if (nameInfo.baseName) return (daiya.name + destText).trim();
	const resolvedType = resolve_train_search_type(train.type, daiya ? daiya.name : "", typeData, train.cbango, daiya ? daiya.senku : "");
	const type = typeData.find((row) => String(row.type) == String(resolvedType));
	let typeName = "";
	if (type) {
		typeName = type.type === 8 ? "快速" : (type.typeText[lang] || type.typeText.ja || "");
	}
	const displayName = (typeName + destText).trim();
	if (displayName) return displayName;
	if (daiya && daiya.name) return (daiya.name + destText).trim();
	return String(train.cbango || "");
}

/*
 * HTMLエスケープ
 */
function resolve_train_search_type(type, name, typeData, cbango, senku) {
	if (String(senku || "") === "19") return "4";
	const resolvedType = String(type || "");
	if (resolvedType) return resolvedType;
	const normalizedCbango = normalize_train_search_cbango(cbango);
	if (normalizedCbango.endsWith("B")) return "4";
	const trainName = String(name || "");
	if (trainName && Array.isArray(typeData)) {
		let matchedType = "";
		let matchedLength = 0;
		typeData.forEach((row) => {
			if (!row) return;
			const labels = [];
			if (row.labelText) {
				if (row.labelText.ja) labels.push(String(row.labelText.ja));
				if (row.labelText[document.documentElement.dataset.lang]) labels.push(String(row.labelText[document.documentElement.dataset.lang]));
			}
			if (row.typeText) {
				if (row.typeText.ja) labels.push(String(row.typeText.ja));
				if (row.typeText[document.documentElement.dataset.lang]) labels.push(String(row.typeText[document.documentElement.dataset.lang]));
			}
			labels.forEach((label) => {
				if (!label || trainName.indexOf(label) < 0) return;
				if (label.length > matchedLength) {
					matchedType = String(row.type || "");
					matchedLength = label.length;
				}
			});
		});
		if (matchedType) return matchedType;
	}
	if (trainName.indexOf("特別快速") >= 0) return "5";
	if (trainName.indexOf("快速") >= 0) return "8";
	if (trainName.indexOf("普通") >= 0) return "3";
	return "";
}

function normalize_train_search_cbango(cbango) {
	const text = String(cbango || "").trim().toUpperCase();
	const match = text.match(/^0*(\d+)([A-Z]+)$/);
	if (!match) return text;
	return String(Number(match[1])) + match[2];
}

function escape_train_search_html(text) {
	return String(text || "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

/*
 * 列番検索を行う
 */
function run_train_number_search() {
	const digits = $("#trainSearchNumberInput").val().replace(/[^\d]/g, "");
	const suffix = ($("#trainSearchSuffixSelect").val() || "D").toUpperCase();
	if (!digits) {
		render_train_search_results([], "列番を入力してください。", "列番を入力してください。");
		return;
	}
	const keyword = normalize_train_search_cbango(digits + suffix);
	load_train_search_data()
		.then((searchData) => {
			const results = searchData.trains.filter((train) => normalize_train_search_cbango(train.cbango) === keyword);
			render_train_search_results(results, "検索結果");
		})
		.catch(() => {
			render_train_search_results([], "検索データを取得できませんでした。", "検索データを取得できませんでした。");
		});
}

/*
 * 列車名検索を行う
 */
function run_train_name_search() {
	const selectedName = $("#trainSearchNameSelect").val();
	const goNumber = $("#trainSearchNameNumberInput").val().replace(/[^\d]/g, "");
	if (!selectedName) {
		render_train_search_results([], "列車名を選択してください。", "列車名を選択してください。");
		return;
	}
	load_train_search_data()
		.then((searchData) => {
			const results = searchData.trains.filter((train) => {
				if (train.baseName !== selectedName) return false;
				if (!goNumber) return true;
				return train.goNumber === goNumber;
			});
			render_train_search_results(results, "検索結果");
		})
		.catch(() => {
			render_train_search_results([], "検索データを取得できませんでした。", "検索データを取得できませんでした。");
		});
}

/*
 * 検索用文字列を正規化
 */
function normalize_train_search_text(text) {
	return String(text || "").toLowerCase().replace(/[\s\u3000]+/g, "");
}

/*
 * 列車検索結果を描画
 */
function render_train_search_results(results, headerText, emptyMessage) {
	$("#trainSearchResultInfo").text(headerText || "");
	if (!results.length) {
		$("#trainSearchResult").html("<div class='train-search-empty'>" + (emptyMessage || "該当する列車はありません。") + "</div>");
		return;
	}
	let html = "";
	results.forEach(train => {
		html += "<div class='express-train-contents train-search-result-item' cbango='" + escape_train_search_html(train.cbango) + "' type='" + escape_train_search_html(train.type) + "' value='" + escape_train_search_html(train.value) + "' data-running='" + (train.isRunning === false ? "0" : "1") + "'>";
		html += "<div class='search-result-main'>";
		html += "<span class='search-result-cbango'>" + escape_train_search_html(train.cbango) + "</span>";
		html += "<span class='train-name'>" + escape_train_search_html(train.name) + "</span>";
		html += "</div>";
		html += "<span class='unkou-label" + (train.status && train.status.indexOf("遅れ") >= 0 ? " chien" : "") + "'>" + escape_train_search_html(train.status || "") + "</span>";
		html += "</div>";
	});
	$("#trainSearchResult").html(html);
}

/*
 * rosen_xx.htmlに表記された地点コードの順に列車アイコンの表示を並び替える
 */
function ressha_pos_sort() {
	let resshaIconArray =  Array.from($("#stationList .ressha-icon"));
	// 列車が2つ以上ある地点を取得
	let result = resshaIconArray.filter((v) => v.childElementCount > 1);
	result.forEach(posArea => {
		// 並び替える基準となる地点コードをclassから取得
		let sortArray = Array.from(posArea.classList);
		// 並び替える対象の列車を取得
		let resshaArray =Array.from(posArea.childNodes);
		resshaArray.sort((a, b) => sortArray.indexOf(a.dataset.pos) - sortArray.indexOf(b.dataset.pos));
		// 下向き列車アイコンの並び替え
		resshaArray.filter((v) => v.className == "dummy").forEach(row => {
			resshaArray = resshaArray.splice(1);
			resshaArray.splice(2, 0, row);
		});
		// 列車を並び替え後のものに置き換える
		while(posArea.firstChild) {
			posArea.removeChild(posArea.firstChild);
		}
		for(const ressha of resshaArray) {
			posArea.appendChild(ressha);
		}
	});
}

/*
 * ページの最後が駅で終わっている路線（08、13）でサブフッターの表示があった場合、下に余白を追加する
 */
function eki_end_margin() {
	if ($(".sub-footer").height() <= 0) return;
	let paramRosen = get_param_rosen();
	let marginHeight = $(".sub-footer").height() + 10;
	if (paramRosen == "08") {
		// end-eki-sub-footer-marginが既に追加済みだった場合には高さのみを変更する
		if($(".end-eki-sub-footer-margin").length > 0) {
			$(".end-eki-sub-footer-margin").css("height", marginHeight + "px");
		} else {
			// 余白用のHTMLを追加する
			let add_html = document.createElement("div");
			add_html.className = "end-eki-sub-footer-margin";
			$(".eki-panel.eki.end").after(add_html);
			$(".end-eki-sub-footer-margin").css("height", marginHeight + "px");
		}
	}
	if (paramRosen == "13") {
		// 表示対象外エリアにサブフッター分の余白を追加する
		$(".eki-panel.non-service-area .hirendo-contents").css("padding", "8px 0 " + marginHeight + "px 0");
	}
}

/*
 * 画面更新判定処理
 */
function is_reload() {
	if (window.performance) {
		if (window.performance.getEntriesByType('navigation').length) {
			if (window.performance.getEntriesByType('navigation')[0].type === 'reload') {
				// 更新時
				return true;
			}
		}
	}
	return false;
}
