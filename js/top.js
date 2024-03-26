// スクロールの高さ保持用
let scrollY = 0;

// 各エリアに属するデータキー
const AREA_ROSEN_KEYS = {
	"spo": ["7", "8", "9", "10", "11", "12", "26", "30", "31", "32", "33", "34"],		// 札幌近郊
	"doo": ["5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "22",
			"23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34"],	// 道央エリア
	"donan": ["1", "2", "3", "4", "16"],												// 道南エリア
	"dohoku": ["17", "18", "19", "51"],													// 道北エリア
	"doto": ["35", "36", "40", "41", "42", "37", "38", "39"],							// 道東エリア
	"shin": ["57"]																		// 北海道新幹線
};

// 各路線に属するデータキー
const ROSEN_NUM_KEYS = {
	"01": ["7", "8", "9", "10", "11","12"],	// [岩見沢～小樽間]
	"02": ["10", "26", "30", "31", "32"],	// [札幌～新千歳空港・苫小牧間]
	"03": ["9", "33", "34"],				// [北海道医療大学～札幌間]
	"04": ["5", "6"],						// [小樽～長万部間]
	"05": ["13", "14", "15"],				// [旭川～岩見沢間]
	"06": ["26", "27", "28"],				// [岩見沢～苫小牧間]
	"07": ["22", "23", "24", "25"],			// [苫小牧～長万部間]
	"08": ["29"],							// [東室蘭～室蘭間]
	"09": ["1", "2", "3", "4"],				// [長万部～函館間]
	"10": ["16"],							// [森～大沼間(渡島砂原経由)]
	"11": ["17", "18", "19"],				// [名寄～旭川間]
	"12": ["17", "51"],						// [上川～旭川間]
	"13": ["35", "36", "40", "41", "42"],	// [南千歳～釧路間]
	"14": ["37", "38", "39"],				// [滝川～新得間]
	"15": ["57"],							// [新函館北斗～奥津軽いまべつ間]
};

/*
 * 画面ロード時
 */
window.onload = function () {
	// 選択されているタブに表示を合わせる
	str = $('input:radio[name="sideSelect"]:checked').val();
	tab_select(str);

	// パソコン表示の場合
	if (window.innerWidth > 1000) {
		// サイドメニューの高さを地図の大きさに合わせる
		var topmap = document.getElementById("svgTopMap");
		hsize = topmap.offsetHeight;
		let lang = document.documentElement.dataset.lang;
		if (lang == "en") $(".side-menu").css("max-height", hsize - 35 + "px");
		else $(".side-menu").css("max-height", hsize - 28 + "px");
	}
	else {
		$(".side-menu").css("max-height", "none");
	}

	// サイドメニュー設定
	set_side_menu(true);
};

/*
 * 画面サイズ変更時
 */
window.onresize = function () {

	// パソコン表示の場合
	if (window.innerWidth > 1000) {
		// スマホ用マップを全消去
		$(".area-map").css("display", "none");
		// マップ選択をすべて解除
		allSelectClear();
		// リストを閉じる
		$(".rosen-name-list").css("display", "none");
		$(".area-name-label").removeClass("open");
		$(".express-train-list").css("display", "none");
		$(".express-name-label").removeClass("open");

		// サイドメニューの高さを地図の大きさに合わせる
		var topmap = document.getElementById("svgTopMap");
		hsize = topmap.offsetHeight;
		let lang = document.documentElement.dataset.lang;
		if (lang == "en") $(".side-menu").css("max-height", hsize - 35 + "px");
		else $(".side-menu").css("max-height", hsize - 28 + "px");
	}
	else {
		$(".side-menu").css("max-height", "none");
	}

	// お知らせのサイズによって子要素の横幅を設定する。
	set_oshirase_width();

	// 画面サイズによってダイアログの余白を設定する。
	let userAgent = navigator.userAgent;
	if (!(userAgent.indexOf('iPhone') > 0 || userAgent.indexOf('iPad') > 0 || userAgent.indexOf('Android') > 0 || userAgent.indexOf('Mobile') > 0 )) {
		// PCの場合
		if (window.innerWidth <= 550) {
			$("#guideDetail .dialog").css("margin", "0px 23px 0px 0px");
			$("#oshiraseDetail .dialog").css("margin", "0px 23px 0px 0px");
		} else {
			if (631 <= window.innerWidth <= 920) {
				$("#guideDetail .dialog").css("marginLeft", "0px");
			} else {
				$("#guideDetail .dialog").css("marginLeft", "23px");
			}
			$("#oshiraseDetail .dialog").css("marginLeft", "23px");
		}
	} else {
		$("#guideDetail .dialog").css("margin", "0px");
		$("#oshiraseDetail .dialog").css("margin", "0px");
	}

	// サイドメニュー設定
	set_side_menu(true);
};

/*
 * ブラウザバック時
 */
window.addEventListener('pageshow',()=>{
	$('input:radio[id="sideSelectArea"]').prop("checked", true);
	str = $('input:radio[name="sideSelect"]:checked').val();
	tab_select(str);
});

$(function ($) {
	const lang = document.documentElement.dataset.lang;

	// 路線名をクリックしたときの動き
	$(document).on("click", ".rosen-name-contents", function () {

		//valueに設定されている路線を取得
		let param_rosen = $(this).attr("value");

		//路線が取得出来たらページ移動
		if (param_rosen != "") {
			if (lang === "ja") window.location.href = "./location.html#rosen=" + param_rosen;
			else window.location.href = "./location_" + lang + ".html#rosen=" + param_rosen;
		}
	});

	// 特急列車名をクリックしたときの動き
	$(document).on("click", ".express-train-contents", function() {
		// ローディングアニメーションを表示する。
		loading_animation_display();
		// 列番を取得しセッションに値を設定する。
		const cbango = $(this).attr("cbango");
		// 列車種別を取得する。
		const type = $(this).attr("type");
		// マスタファイル用のキャッシュバスター値を生成する。(UNIX元期からの経過ミリ秒数を右に16ビットシフトした値。2の16乗＝65536ミリ秒≒約1分間隔でキャッシュを無効化する)
		const mstNow = Date.now() >>> 16;
		// トランファイル用のキャッシュバスター値を生成する。(UNIX元期からの経過ミリ秒数を右に10ビットシフトした値。2の10乗＝1024ミリ秒間隔でキャッシュを無効化する)
		const trnNow = Date.now() >>> 10;
		// 最新の特車運行情報を取得する。
		$.when(
			$.getJSON("https://corsproxy.io/?https://www3.jrhokkaido.co.jp/webunkou/json/daiya/daiya_00" + (lang === "ja" ? "" : "_" + lang) + ".json?" + mstNow),
			$.getJSON("https://api.allorigins.win/raw?url=https://www3.jrhokkaido.co.jp/trainlocation/json/express/now/express_now.json?" + trnNow)
		)
		.done((daiyaBase, expressNowBase) => {
			// 対象の列車の運行情報を取得する。
			const expressNow = expressNowBase[0].trains.find(train => train.cbango === cbango);
			// 対象の列車に有効な路線キーが設定されている場合は、当該路線ページの該当列車位置に遷移する。
			if (expressNow.runRosen) {
				window.location.href = "./location" + (lang === "ja" ? "" : "_" + lang) + ".html#rosen=" + expressNow.runRosen + "&cbango=" + cbango;
				// ローディングアニメーション非表示
				loading_animation_hidden();
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

	//rosen-name-listのマウスホバーで路線を選択
	$(document).on("mouseover", ".rosen-name-list div", function () {

		let val = $(this).attr("value");
		let selectAreaName =  $(this)[0].parentElement.classList[1];
		// 路線図の路線選択
		selectRosen(val, selectAreaName);
	});

	//rosen-name-listでマウスが離れたとき路線選択を解除
	$(document).on("mouseleave", ".rosen-name-list div", function () {

		let val = $(this).attr("value");
		let selectAreaName =  $(this)[0].parentElement.classList[1];
		// 路線図の路線選択削除
		selectArea(rosenToArea(val, selectAreaName));
	});

	// パソコン用エリア選択
	$(document).on("click", ".area-name-label", function () {

		// マップ選択をすべて解除
		allSelectClear();

		// エリア名取得
		let areaName = $(this).attr('class').split(" ")[1];

		// 自分をこれから開く場合
		if ($(this).next().css('display') == 'none') {
			// ほかに開いているリストを閉じる
			$(".rosen-name-list").css("display", "none");
			$(".area-name-label").removeClass("open");
			// マップ上のエリア選択実行
			selectArea(areaName);
		}

		// 路線一覧を開く/閉じる
		$(this).next().stop().slideToggle(100);
		$(this).toggleClass("open");

	});

	// スマホ用エリア選択ボタンをクリックしたときの動き
	$(document).on("click", ".area-operation-list li", function () {

		// エリア名取得
		let area = $(this).attr('id').split(" ")[0];
		// 各エリアクリック時の表示制御を行う。
		area_tab_select(area);

		// 選択したエリアの路線が見えるようにスクロール
		let scrollPos = $('.side-select-panel').offset().top - 60;
		$("body,html").animate({scrollTop: scrollPos});

	});

	// スマホ用特急列車選択ボタンをクリックしたときの動き
	$(document).on("click", ".exp-operation-list li", function () {

		// 特急キー取得
		const key = $(this).attr("data-key");
		// 各特急列車選択時の表示制御を行う。
		exp_tab_select(key);

		// 特急列車タブ内の愛称名の選択状態を解除する。
		const onTab = $(".exp-operation-list li.on");
		onTab.removeClass("on");

		// 選択したタブを選択状態にする。
		$(this).addClass("on");

		// 選択した特急列車の列車番号が見えるようにスクロール
		let scrollPos = $('.side-select-panel').offset().top - 60;
		$("body,html").animate({scrollTop: scrollPos});
	});

	// 選択（エリア／特急列車）タブの選択を切り替えたときの動き
	$(document).on('change', 'input[name="sideSelect"]', function () {
		str = $('input:radio[name="sideSelect"]:checked').val();
		tab_select(str);
	});

	// 近くの駅に移動ボタンをクリックしたときの動き
	$(document).on("click", "#posEkiBtn", function () {
		// ローディングアニメーション表示
		loading_animation_display();
		// 現在地取得処理
		get_pos_info(true);
	});

	// お知らせ欄作成
	const now = Date.now() >>> 16;
	$("#commonOshiraseContents").load($("#commonOshiraseContents").data("url") + "?" + now, function() {
		if ($("#commonOshiraseContents").children().length) {

			// 表示する内容が存在する場合、｢お知らせ｣に表示／非表示切替イベントを追加する。
			$(document).on("click", "#commonOshirase .toggle", function() {
				$(this).next().stop().slideToggle();
				$(this).toggleClass("open");
			});

			$("#commonOshirase").show();

			// お知らせのサイズによって子要素の横幅を設定する。
			set_oshirase_width();
		}
	});

	// サイドメニュー　各路線の遅延情報の設定
	set_side_area_chien();
	// サイドメニューの｢特急列車選択｣を生成する。
	createSideExpressList(event => {
		// 特急愛称名のラベルをクリックしたときに実行する処理を追加する。
		// 路線図の選択をすべて解除する。
		allSelectClear();
		// 選択した特急列車が閉じ状態の場合、開き状態にする。
		if ($(event.target).closest(".area-contents").find(".express-train-list").css("display") === "none") {
			// 選択した路線を強調表示する。
			const selectMap = $(document.getElementById("svgTopMap").contentDocument);
			const kukanList = event.data.kukanList;
			event.data.kukanList.forEach(key => {
				selectMap.find("#kukan path[data-key='" + key + "']").attr("data-status", "2");
			});
			// 線を並べ替える。（選択されている路線の線が上になるようにする）
			selectMap[0].querySelectorAll("path:not([data-status='2']):not(.land):not(.area)").forEach(path => { path.parentElement.appendChild(path); });
			selectMap[0].querySelectorAll("path[data-status='2']").forEach(path => { path.parentElement.appendChild(path); });
			// 他の路線はすべて閉じる。
			$(".express-train-list").css("display", "none");
			$(".express-name-label").removeClass("open");
		}
		// 特急列車一覧を開閉状態を切り替える。
		$(event.target).closest(".area-contents").find(".express-train-list").stop().slideToggle(100, () => {
			$(event.target).closest(".area-contents").find(".express-name-label").toggleClass("open");
		});
	});

	// 選択されているタブに表示を合わせる
	str = $('input:radio[name="sideSelect"]:checked').val();
	tab_select(str);
});

/*
 * パソコン用マップの選択をすべて初期化する
 */
function allSelectClear() {

	//トップ画面のマップ上の選択クリア
	var selectMap = $(document.getElementById("svgTopMap").contentDocument);
	for (let i = 1; i < 58; i++) {
		selectMap.find("#kukan path[data-key='" + i + "']").removeAttr("data-status");
	}
}

/*
 * 路線の選択をマップに表示
 */
function selectRosen(rosen, selectAreaName) {

	//トップ画面のマップを設定
	var selectMap = $(document.getElementById("svgTopMap").contentDocument);

	// スマホ表示中ならば、各エリアのマップに変更
	if (window.innerWidth <= 1000) {
		var mapName = "areaMap" + rosenToArea(rosen, selectAreaName);
		selectMap = $(document.getElementById(mapName).contentDocument);
	}

	var rosenNumList = ROSEN_NUM_KEYS[rosen];
	for (var i = 0; i < rosenNumList.length; i++) {
		var pathname = "#kukan path[data-key='" + rosenNumList[i] + "']";
		selectMap.find(pathname).attr({ "data-status": "2" });
	}
	// 線を並べ替える。（選択されている路線の線が上になるようにする）
	selectMap[0].querySelectorAll("path:not([data-status='2']):not(.land):not(.area)").forEach(path => { path.parentElement.appendChild(path); });
	selectMap[0].querySelectorAll("path[data-status='2']").forEach(path => { path.parentElement.appendChild(path); });
}

/*
 * エリアの選択をマップに表示
 * （エリア選択初期状態なので路線選択のキャンセルとしても使用）
 */
function selectArea(area) {

	//トップ画面のマップを設定
	var selectMap = $(document.getElementById("svgTopMap").contentDocument);

	// スマホ表示中ならば、各エリアのマップに変更
	if (window.innerWidth <= 1000) {
		var mapName = "areaMap" + area;
		selectMap = $(document.getElementById(mapName).contentDocument);
	}

	var areaRosenList = AREA_ROSEN_KEYS[area];
	var dataStatus = "1";

	if (areaRosenList) {
		for (var i = 0; i < areaRosenList.length; i++) {
			var pathName = "#kukan path[data-key='" + areaRosenList[i] + "']";
			selectMap.find(pathName).attr({ "data-status": dataStatus });
		}
	}
}

/*
 * 選択（在来線／特急・新幹線）の表示切替を行う
 */
function tab_select(_str) {

	// スマホ用ボタンをすべて未選択とする
	var radioButtonList = document.getElementsByName("areaOperationTab");
	for (i = 0; i < radioButtonList.length; i++) {
		radioButtonList[i].checked = false;
	}

	if (!_str) {
		$('input:radio[id="sideSelectArea"]').prop("checked", true);
	}
	// 特急リストをたたむ
	$(".express-train-list").css("display", "none");
	// 特急リストの見出し（三角）を初期化
	$(".express-name-label").removeClass("open");
	// サイドメニューをたたむ
	$(".rosen-name-list").css("display", "none");
	// サイドメニューの見出し（三角）を初期化
	$(".area-name-label").removeClass("open");

	// スマホ用マップをすべて非表示
	$(".area-map").css("display", "none");

	// 特急列車タブ内の愛称名の選択状態を解除する。
	const onTab = $(".exp-operation-list li.on");
	onTab.removeClass("on");

	// 路線の選択を初期化
	allSelectClear();
	location.hash = "";

	$('#localTab').hide();
	$('#expTab').hide();

	if (_str == "Exp") {
		$('#expTab').show();
	} else {
		$('#localTab').show();
	}
}

/*
 * スマホ用エリア選択ボタンの表示制御を行う
 */
function area_tab_select(area) {

	// すべての路線リストを閉じる
	$(".rosen-name-list").css("display", "none");
	// すべてのスマホ用マップを閉じる
	$(".area-map").css("display", "none");
	// 開くリストのクラス名作成
	var areaListClassName = ".rosen-name-list." + area;
	// リストを開く
	$(areaListClassName).show();
	// スマホ用マップを開く
	var mapName = ".area-map." + area;
	$(mapName).toggle();
}

/*
 * スマホ用特急列車選択ボタンの表示制御を行う
 * @param key 特急キー。
 */
function exp_tab_select(key) {
	// すべての路線リストを閉じる。
	$(".express-train-list").css("display", "none");
	// 選択した特急列車のリストを開く。
	$(".area-contents[data-key='" + key + "'] .express-train-list").show();
}

/*
 *  路線からエリアを判断
 */
function rosenToArea(rosen, selectAreaName) {

	var area = "";
	if (["01", "02", "03"].includes(rosen)) {					// 札幌近郊
		area = "spo";
		// 選択しているエリアが道央エリアだった場合dooに変更
		if(selectAreaName == "doo") area = "doo";
	} else if (["04", "05", "06", "07", "08"].includes(rosen)) {// 道央エリア
		area = "doo";
	} else if (["09", "10"].includes(rosen)) {					// 道南エリア
		area = "donan";
	} else if (["11", "12"].includes(rosen)) {					// 道北エリア
		area = "dohoku";
	} else if (["13", "14"].includes(rosen)) {					// 道東エリア
		area = "doto";
	} else if (["15"].includes(rosen)) {						// 北海道新幹線
		area = "shin";
	}
	return area;
}

 /*
 * ダイアログを開くときのbodyのスクロールを無効にする。
 */
function set_scroll_hide(dialog) {
	let userAgent = navigator.userAgent;
	let windowWidth = window.innerWidth;
	let scrollbarWidth = window.innerWidth - document.body.clientWidth;
	scrollY = window.scrollY;
	$("body").css("overflow-y", "hidden");
	$("body").css("position", "fixed");
	$("#commonMainDiv").css("position", "relative");
	$("#commonMainDiv").css("top",  scrollY * -1 - 10 + "px");

	if (!(userAgent.indexOf('iPhone') > 0 || userAgent.indexOf('iPad') > 0 || userAgent.indexOf('Android') > 0 || userAgent.indexOf('Mobile') > 0 )) {
		// PCの場合
		$("body").css("width", "calc(100% - " + scrollbarWidth + "px)");
		$("header").css("width", "calc(100% - " + scrollbarWidth + "px)");
		$("#menuLayer .menu").css("marginRight", "16px");
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
	}
}

/*
 * ダイアログを閉じるときのbodyのスクロールを有効にする。
 */
function set_scroll_show(dialog) {
	let userAgent = navigator.userAgent;
	let windowWidth = window.innerWidth;
	let scrollbarWidth = window.innerWidth - document.body.clientWidth;

	$("body").css("overflow-y", "scroll");
	$("body").css("position", "static");
	$("#commonMainDiv").css("position", "static");
	window.scrollTo(0, scrollY);

	if (!(userAgent.indexOf('iPhone') > 0 || userAgent.indexOf('iPad') > 0 || userAgent.indexOf('Android') > 0 || userAgent.indexOf('Mobile') > 0 )) {
		// PCの場合
		$("body").css("width", "calc(100% - 10px)");
		$("header").css("width", "calc(100% - 10px)");
		$("#menuLayer .menu").css("marginRight", "0px");
		if (windowWidth <= 550) {
			dialog.css("marginLeft", "0px");
			dialog.css("marginRight", "10px");
		} else {
			if (dialog.parent().parent().attr("id") == "guideDetail") {
				if (631 <= windowWidth <= 920) {
					dialog.css("marginLeft", "0px");
					dialog.css("marginRight", "10px");
				} else {
					dialog.css("marginLeft", scrollbarWidth + "px");
				}
			} else {
				dialog.css("marginLeft", (scrollbarWidth * 2 - 10) + "px");
			}
		}
	}
}