// 繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ縺ｮ鬮倥＆菫晄戟逕ｨ
let scrollY = 0;
// 驕ｷ遘ｻ蜑阪・霍ｯ邱壻ｿ晄戟逕ｨ
let befRosen = "";
// 繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ逕ｨ縺ｮ鬧・く繝ｼ菫晄戟逕ｨ
let scrollKey = "";
// 繧ｵ繧､繝峨Γ繝九Η繝ｼ繧ｯ繝ｪ繝・け譎・
let isSideMenuClick = false;
// 逕ｻ髱｢蛻晄悄陦ｨ遉ｺ譎ょ愛螳夂畑
let isLoad = true;
// 繝繧､繧｢繝ｭ繧ｰ陦ｨ遉ｺ譎ょ愛螳夂畑
let isDialogDisp = false;
// 繧ｵ繧､繝峨Γ繝九Η繝ｼ陦ｨ遉ｺ譎ょ愛螳夂畑
let isSideMenuDisp = false;
// 讓ｪ蟷・Μ繧ｵ繧､繧ｺ蛻､螳夂畑
let beforeWidth = 0;
// 逕ｻ髱｢陦ｨ遉ｺ蜃ｦ逅・ｮ溯｡悟愛螳夂畑
let isNotInitDisp = false;
// 襍ｰ陦御ｽ咲ｽｮ閾ｪ蜍墓峩譁ｰ縺ｮ譌｢螳夐俣髫・ms)
const LOCATION_AUTO_REFRESH_DEFAULT_INTERVAL = 15000;
// 閾ｪ蜍墓峩譁ｰ險ｭ螳壹・菫晏ｭ倥く繝ｼ
const LOCATION_AUTO_REFRESH_ENABLED_KEY = "location_auto_refresh_enabled";
const LOCATION_AUTO_REFRESH_INTERVAL_KEY = "location_auto_refresh_interval";
const LOCATION_JSON_SOURCE_MAP = {
	"51": ["01", "05"],
	"52": ["02", "07", "09"],
	"53": ["02", "13"]
};
// 襍ｰ陦御ｽ咲ｽｮ閾ｪ蜍墓峩譁ｰ繧ｿ繧､繝槭・
let locationAutoRefreshTimer = null;
// 蛻苓ｻ企∈謚槭い繝九Γ繝ｼ繧ｷ繝ｧ繝ｳ繧ｿ繧､繝槭・
let resshaAnimationTimer = null;
// 閾ｪ蜍墓峩譁ｰ逕ｨ縺ｮ霍ｯ邱壻ｿ晄戟
let autoRefreshRosen = "";
// 蛻苓ｻ雁・謠冗判逕ｨ繝槭せ繧ｿ縺ｮ繧ｭ繝｣繝・す繝･
let cachedResshaTypeData = null;
let cachedEkiData = null;
// 閾ｪ蜍墓峩譁ｰ險ｭ螳・
let locationAutoRefreshEnabled = false;
let locationAutoRefreshInterval = LOCATION_AUTO_REFRESH_DEFAULT_INTERVAL;
// 谺｡蝗櫁・蜍墓峩譁ｰ莠亥ｮ壽凾蛻ｻ
let nextLocationAutoRefreshAt = null;
// 蛻苓ｻ頑､懃ｴ｢逕ｨ繧ｭ繝｣繝・す繝･
let cachedTrainSearchData = null;
let trainSearchDataPromise = null;
let cachedTrainSearchLoadedAt = 0;
const TRAIN_SEARCH_CACHE_TTL = 30000;
// 追跡解除時のスクロール位置保持
let preserveScrollAfterHashChange = false;
let preservedScrollTop = 0;

function preserve_scroll_after_hash_change() {
	preserveScrollAfterHashChange = true;
	preservedScrollTop = $(window).scrollTop();
}

window.onload = function(){
	load_location_auto_refresh_settings();
	// 迴ｾ蝨ｨ陦ｨ遉ｺ荳ｭ縺ｮ霍ｯ邱壹ｒ蜿門ｾ・
	let param_rosen = get_param_rosen();
	// 襍ｰ陦御ｽ咲ｽｮ繧定｡ｨ遉ｺ
	if (param_rosen != "") set_station_list(param_rosen, null);
	// 繧ｨ繝ｪ繧｢蛻･迥ｶ豕゛SON繧定ｪｭ縺ｿ霎ｼ繧薙〒縲・°陦梧ュ蝣ｱ繧定ｨｭ螳壹☆繧九・
	set_unko_info(param_rosen);

	// 繝昴ャ繝励い繝・・html蛻､譁ｭ
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

	// 繧ｵ繧､繝峨Γ繝九Η繝ｼ縲蜷・ｷｯ邱壹・驕・ｻｶ諠・ｱ縺ｮ險ｭ螳・
	set_side_area_chien();
	// 繧ｵ繧､繝峨Γ繝九Η繝ｼ縲蜷・音諤･蛻苓ｻ翫・繧ｿ繝ｳ縺ｮ菴懈・
	createSideExpressList();

	hsize = $(window).height();
	$(".side-menu").css("height", hsize - 60 + "px");

	if (!is_reload()) {
		// 譛ｭ蟷瑚ｿ鷹リ縺ｮ霍ｯ邱壹・蝣ｴ蜷医∝・譛溯｡ｨ遉ｺ繧呈惆蟷碁ｧ・捉霎ｺ縺ｫ縺吶ｋ縲ゑｼ域峩譁ｰ譎ゆｻ･螟厄ｼ・
		if (!get_param_id() && !get_param_cbango()) {
			let rosen = get_param_rosen();
			if ((rosen == "01" || rosen == "02" || rosen == "03") && $("div[key='091']").length > 0) {
				$("body,html").animate({scrollTop: $("div[key='091']").offset().top - 310});
			}
		}
	}

	// 驕ｸ謚槭＆繧後※縺・ｋ繧ｿ繝悶↓陦ｨ遉ｺ繧貞粋繧上○繧・
	str = $('input:radio[name="sideSelect"]:checked').val();
	tab_select(str);
	// 繝倥ャ繝繝ｼ縺ｮ鬮倥＆蛻・・菴咏區繧定ｨｭ螳壹☆繧九・
	set_header_height();

	// 繧ｵ繧､繝峨Γ繝九Η繝ｼ險ｭ螳・
	set_side_menu(false);

	// 蛻晄悄陦ｨ遉ｺ譎ゅ・讓ｪ蟷・ｿ晄戟
	beforeWidth = window.innerWidth;

	$(function(){
		// 繝壹・繧ｸ縺ｮ譛蠕後′鬧・〒邨ゅｏ縺｣縺ｦ縺・ｋ霍ｯ邱夲ｼ・8縲・3・峨〒繧ｵ繝悶ヵ繝・ち繝ｼ縺ｮ陦ｨ遉ｺ縺後≠縺｣縺溷ｴ蜷医∽ｸ九↓菴咏區繧定ｿｽ蜉縺吶ｋ
		eki_end_margin();
	});
};

window.onresize = function () {
	// 繧ｵ繧､繝峨Γ繝九Η繝ｼ縺ｮ鬮倥＆繧堤判髱｢繧ｵ繧､繧ｺ縺ｫ蜷医ｏ縺帙※險ｭ螳・
	hsize = $(window).height();
	$(".side-menu").css("height", hsize - 60 + "px");
	if (beforeWidth != window.innerWidth && !isDialogDisp) {
		// 讓ｪ蟷・Μ繧ｵ繧､繧ｺ譎・
		scrollY = window.scrollY;
	}

	// 逕ｻ髱｢蟷・・繧ｵ繧､繧ｺ縺ｫ蜷医ｏ縺帙※逕ｻ髱｢鬆・岼繧貞宛蠕｡縺吶ｋ縲・繧｢繝峨Ξ繧ｹ繝舌・縺ｫ繧医ｋ鬮倥＆縺ｮ繝ｪ繧ｵ繧､繧ｺ縺ｧ縺ｯ螳溯｡後＠縺ｪ縺・
	if (beforeWidth != window.innerWidth) {
		set_responsive();
	}

	// 縺顔衍繧峨○縺ｮ繧ｵ繧､繧ｺ縺ｫ繧医▲縺ｦ蟄占ｦ∫ｴ縺ｮ讓ｪ蟷・ｒ險ｭ螳壹☆繧九・
	set_oshirase_width();

	// 繝倥ャ繝繝ｼ縺ｮ鬮倥＆蛻・・菴咏區繧定ｨｭ螳壹☆繧九・
	set_header_height();

	// PC逕ｨ陦ｨ遉ｺ縺ｮ蝣ｴ蜷医√ち繝夜∈謚槭→陦ｨ遉ｺ蜀・ｮｹ繧剃ｸ閾ｴ縺輔○繧・
	if (window.innerWidth > 1000) {
		str = $('input:radio[name="sideSelect"]:checked').val();
		tab_select_resize(str);
	}

	// 繝ｪ繧ｵ繧､繧ｺ蠕後・讓ｪ蟷・ｿ晄戟
	beforeWidth = window.innerWidth;

	// 繝壹・繧ｸ縺ｮ譛蠕後′鬧・〒邨ゅｏ縺｣縺ｦ縺・ｋ霍ｯ邱夲ｼ・8縲・3・峨〒繧ｵ繝悶ヵ繝・ち繝ｼ縺ｮ陦ｨ遉ｺ縺後≠縺｣縺溷ｴ蜷医∽ｸ九↓菴咏區繧定ｿｽ蜉縺吶ｋ
	eki_end_margin();
};

window.onscroll = function () {
	if (!(isLoad || isDialogDisp || isSideMenuDisp)) {
		// 繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ菴咲ｽｮ繧剃ｿ晏ｭ・
		window.sessionStorage.setItem("scrollY", window.scrollY - 50);
		scrollY = window.scrollY;
	}
};

window.onhashchange = function () {
	// 繝上ャ繧ｷ繝･縺九ｉid・磯ｧ・く繝ｼ・峨ｒ蜿門ｾ・
	let param_id = get_param_id();

	// 霍ｯ邱壹ｒ蛻・ｊ譖ｿ縺医◆髫帙∝・霆翫・襍､譫繧帝撼陦ｨ遉ｺ
	$(".ressha-animation").hide();

	// 逕ｻ髱｢陦ｨ遉ｺ蜃ｦ逅・
	if (!isNotInitDisp) init_disp(scrollKey, () => {

		if (param_id) {
			// 繝上ャ繧ｷ繝･縺ｫ鬧・D縺悟ｭ伜惠縺励◆蝣ｴ蜷医∝ｯｾ雎｡縺ｮ鬧・∪縺ｧ繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ
			let pos = $("div[key='" + param_id + "']").offset().top - 380;
			$("body,html").scrollTop(pos);
		}

		// 繝倥ャ繝繝ｼ縺ｮ鬮倥＆蛻・・菴咏區繧定ｨｭ螳壹☆繧九・
		set_header_height();
	})

	isNotInitDisp = false;
}

$(function ($) {
	sync_refresh_setting_controls();
	// 驕ｸ謚橸ｼ医お繝ｪ繧｢縺九ｉ驕ｸ謚橸ｼ冗音諤･蛻苓ｻ翫°繧蛾∈謚橸ｼ峨ち繝悶・驕ｸ謚槭ｒ蛻・ｊ譖ｿ縺医◆縺ｨ縺阪・蜍輔″
	$(document).on('change', 'input[name="sideSelect"]', function () {
		str = $('input:radio[name="sideSelect"]:checked').val();
		tab_select(str);
	});

	// 繧ｵ繧､繝峨Γ繝九Η繝ｼ縺ｮ蜷・お繝ｪ繧｢繧偵け繝ｪ繝・け縺励◆縺ｨ縺阪・蜍輔″
	$(document).on("click", ".side-menu .area-contents .area-name-label", function () {
		// 閾ｪ蛻・ｒ縺薙ｌ縺九ｉ髢九￥蝣ｴ蜷医∽ｻ悶・螻暮幕繧偵☆縺ｹ縺ｦ髢峨§繧・
		if ($(this).next().css("display") === "none") {
			$(".rosen-name-list").css("display", "none");
			$(".area-name-label").removeClass("open");
		}
		// 譏守ｴｰ繧帝幕縺擾ｼ城哩縺倥ｋ
		$(this).next().stop().slideToggle(100);
		$(this).toggleClass("open");
	});

	// 霍ｯ邱夐∈謚槭・繧ｿ繝ｳ繧偵け繝ｪ繝・け縺励◆縺ｨ縺阪・蜍輔″
	$("#localSelBtn").on("click", function() {
		let lang = document.documentElement.dataset.lang;
		$(".side-menu").css("transform", "translateX(0px)");
		$(".side-menu").css("box-shadow", "5px 5px 10px rgb(0 0 0 / 40%)");
		$("#localTab").show();
		$("#expTab").hide();
		$("#sideMenu .side-menu .area-contents-header").show();
		$("#sideMenu .side-menu-outer").show();
		if (lang == "ja") $("#sideHeader").text("霍ｯ邱夐∈謚・);
		if (lang == "en") $("#sideHeader").text("Select a line");
		if (lang == "tc") $("#sideHeader").text("驕ｸ謫・ｷｯ邱・);
		if (lang == "sc") $("#sideHeader").text("騾画叫霍ｯ郤ｿ");
		if (lang == "kr") $("#sideHeader").text("・ｸ・ ・夋・);
		// body縺ｮ繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ繧堤┌蜉ｹ縺ｫ縺吶ｋ縲・
		set_scroll_hide_side_menu();
	});

	// 迚ｹ諤･蛻苓ｻ企∈謚槭・繧ｿ繝ｳ繧偵け繝ｪ繝・け縺励◆縺ｨ縺阪・蜍輔″
	$("#expSelBtn").on("click", function() {
		let lang = document.documentElement.dataset.lang;
		$(".side-menu").css("transform", "translateX(0px)");
		$(".side-menu").css("box-shadow", "5px 5px 10px rgb(0 0 0 / 40%)");
		$("#localTab").hide();
		$("#expTab").show();
		$("#sideMenu .side-menu .area-contents-header").show();
		$("#sideMenu .side-menu-outer").show();
		if (lang == "ja") $("#sideHeader").text("迚ｹ諤･蛻苓ｻ企∈謚・);
		if (lang == "en") $("#sideHeader").text("Select a limited express");
		if (lang == "tc") $("#sideHeader").text("驕ｸ謫・音諤･蛻苓ｻ・);
		if (lang == "sc") $("#sideHeader").text("騾画叫迚ｹ諤･蛻苓ｽｦ");
		if (lang == "kr") $("#sideHeader").text("孖ｹ・餓龍・ｨ ・夋・);
		// body縺ｮ繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ繧堤┌蜉ｹ縺ｫ縺吶ｋ縲・
		set_scroll_hide_side_menu();
	});

	// 迴ｾ蝨ｨ蝨ｰ驕ｸ謚槭・繧ｿ繝ｳ繧偵け繝ｪ繝・け縺励◆縺ｨ縺阪・蜍輔″
	$(".header-btn.pos").on("click", function() {
		// 繝ｭ繝ｼ繝・ぅ繝ｳ繧ｰ繧｢繝九Γ繝ｼ繧ｷ繝ｧ繝ｳ繧定｡ｨ遉ｺ
		loading_animation_display();
		// 迴ｾ蝨ｨ蝨ｰ縺九ｉ荳逡ｪ霑代＞鬧・ｒ陦ｨ遉ｺ
		get_pos_info(false);
	});

	// 閾ｪ蜍墓峩譁ｰ險ｭ螳壹・繧ｿ繝ｳ繧偵け繝ｪ繝・け縺励◆縺ｨ縺阪・蜍輔″
	$("#refreshSettingBtn, #refreshSettingBtnSub").on("click", function() {
		sync_refresh_setting_controls();
		$("#refreshSettingDetail").fadeIn("fast");
		set_scroll_hide($("#refreshSettingDetail .dialog"));
	});

	// 蛻苓ｻ頑､懃ｴ｢繝懊ち繝ｳ繧偵け繝ｪ繝・け縺励◆縺ｨ縺阪・蜍輔″
	$("#trainSearchBtn, #trainSearchBtnSub").on("click", function() {
		reset_train_search_dialog();
		$("#trainSearchDetail").fadeIn("fast");
		set_scroll_hide($("#trainSearchDetail .dialog"));
		$("#trainSearchResultInfo").text("隱ｭ縺ｿ霎ｼ縺ｿ荳ｭ...");
		load_train_search_data()
			.then((searchData) => {
				populate_train_search_name_select(searchData);
				$("#trainSearchResultInfo").empty();
				$("#trainSearchNumberInput").trigger("focus");
			})
			.catch(() => {
				$("#trainSearchResultInfo").text("讀懃ｴ｢繝・・繧ｿ繧貞叙蠕励〒縺阪∪縺帙ｓ縺ｧ縺励◆縲・);
			});
	});

	// 鬧・∈謚槭ｒ繧ｯ繝ｪ繝・け縺励◆縺ｨ縺阪・蜍輔″
	$(document).on("click", ".header-btn.eki", function() {
		// 繝・Φ繝励Ξ繝ｼ繝医・html縺九ｉ鬧・ｒ蜿門ｾ・
		let list = $("#stationList .eki-panel .eki-contents a");
		// 蜿門ｾ励＠縺滄ｧ・°繧峨・繧ｿ繝ｳ繧偵ム繧､繧｢繝ｭ繧ｰ縺ｫ陦ｨ遉ｺ縺吶ｋ蜀・ｮｹ繧剃ｽ懈・
		let html = "<ul>";
		for(let row of list){
			html += "<li>";
			html += row.children[0].children[0].outerHTML;
			html += "<div value='" + row.href.slice(-3) + "'>" + row.children[0].children[1].innerText.replace("\n", "") + "</div></li>";
			html += "</li>";
		}
		html += "</ul>";

		// 鬧・∈謚槭ム繧､繧｢繝ｭ繧ｰ蜀・↓鬧・・繝ｪ繧ｹ繝医ｒ陦ｨ遉ｺ
		$("#searchDetail .train-link").html(html);

		// 鬧・∈謚槭ム繧､繧｢繝ｭ繧ｰ繧帝幕縺上・
		$("#searchDetail").fadeIn("fast");
		$("#searchDetailMain").scrollTop(0);
		// 繝繧､繧｢繝ｭ繧ｰ繧帝幕縺上→縺阪・body縺ｮ繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ縺ｮ蛻ｶ蠕｡
		set_scroll_hide($("#searchDetail .dialog"));
	});

	// 鬧・∈謚槭ム繧､繧｢繝ｭ繧ｰ蜀・・・｢髢峨§繧具ｽ｣繝懊ち繝ｳ繧偵け繝ｪ繝・け縺励◆縺ｨ縺阪・蜍輔″
	$(document).on("click", "#searchDetail, #searchDetail .common-subtitle.header", function() {
		// 鬧・∈謚槭ム繧､繧｢繝ｭ繧ｰ繧帝哩縺倥ｋ縲・		$("#searchDetail").fadeOut("fast");
		// 繝繧､繧｢繝ｭ繧ｰ繧帝哩縺倥◆縺ｨ縺阪・body縺ｮ繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ縺ｮ蛻ｶ蠕｡
		set_scroll_show($("#searchDetail .dialog"));
	});

	// 蛻苓ｻ頑､懃ｴ｢繝繧､繧｢繝ｭ繧ｰ繧帝哩縺倥ｋ
	$(document).on("click", "#trainSearchDetail, #trainSearchDetail .common-subtitle.header", function() {
		close_train_search_dialog();
	});

	// 閾ｪ蜍墓峩譁ｰ險ｭ螳壹ム繧､繧｢繝ｭ繧ｰ繧帝哩縺倥ｋ
	$(document).on("click", "#refreshSettingDetail, #refreshSettingDetail .close", function() {
		$("#refreshSettingDetail").fadeOut("fast");
		set_scroll_show($("#refreshSettingDetail .dialog"));
	});

	// 閾ｪ蜍墓峩譁ｰ險ｭ螳壹ｒ驕ｩ逕ｨ縺吶ｋ
	$(document).on("click", "#refreshSettingApplyBtn", function() {
		const enabled = $("#refreshEnabledSelect").val() === "on";
		const intervalSeconds = Number($("#refreshIntervalSelect").val());
		apply_location_auto_refresh_settings(enabled, intervalSeconds * 1000);
		$("#refreshSettingDetail").fadeOut("fast");
		set_scroll_show($("#refreshSettingDetail .dialog"));
	});

	// 鬧・∈謚槭ム繧､繧｢繝ｭ繧ｰ蜀・・蜷・ｧ・・繝懊ち繝ｳ繧偵け繝ｪ繝・け縺励◆縺ｨ縺阪・蜍輔″
	$(document).on("click", "#searchDetail .train-link li" , function() {
		// 鬧・∈謚槭ム繧､繧｢繝ｭ繧ｰ繧帝哩縺倥ｋ縲・
		$("#searchDetail").fadeOut("fast");
		// 繝繧､繧｢繝ｭ繧ｰ繧帝哩縺倥◆縺ｨ縺阪・body縺ｮ繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ縺ｮ蛻ｶ蠕｡
		set_scroll_show($("#searchDetail .dialog"));

		// 鬧・さ繝ｼ繝峨ｒ蜿門ｾ・
		let id = this.children[1].getAttribute("value");
		// 蟇ｾ雎｡縺ｮ鬧・∪縺ｧ繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ
		let pos = $("div[key='" + id + "']").offset().top - 380;
		$("body,html").animate({scrollTop: pos});
	});

	// 蛻苓ｻ頑､懃ｴ｢縺ｮ螳溯｡・	$(document).on("click", "#trainSearchNumberBtn", function() {
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

	// 驥崎ｦ√↑縺顔衍繧峨○繧偵け繝ｪ繝・け縺励◆縺ｨ縺阪・蜍輔″
	$(document).on("click", "#popupDetailBtn", function() {
		// 繝昴ャ繝励い繝・・繝繧､繧｢繝ｭ繧ｰ蜀・・驥崎ｦ√↑縺顔衍繧峨○繧帝幕縺上・
		$("#popupDetail").fadeIn("fast");
		$("#popupDetailMain .popup-detail-main").scrollTop(0);
		$("#dialogOshirase").hide();
		$("#popupOshirase").show();
		// 繝繧､繧｢繝ｭ繧ｰ繧帝幕縺上→縺阪・body縺ｮ繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ縺ｮ蛻ｶ蠕｡
		set_scroll_hide($("#popupDetail .dialog"));
	});

	// 繝昴ャ繝励い繝・・繝繧､繧｢繝ｭ繧ｰ蜀・・・｢髢峨§繧具ｽ｣繝懊ち繝ｳ繧偵け繝ｪ繝・け縺励◆縺ｨ縺阪・蜍輔″
	$(document).on("click", "#popupDetail, #popupDetail .close", function() {
		// 繝昴ャ繝励い繝・・繝繧､繧｢繝ｭ繧ｰ繧帝哩縺倥ｋ縲・
		$("#popupDetail").fadeOut("fast");
		// 繝繧､繧｢繝ｭ繧ｰ繧帝哩縺倥◆縺ｨ縺阪・body縺ｮ繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ縺ｮ蛻ｶ蠕｡
		set_scroll_show($("#popupDetail .dialog"));
	});

	// 繝舌ヶ繝ｪ繝ｳ繧ｰ繧貞●豁｢
	$(document).on("click", "#guideDetail .dialog, #searchDetail .dialog, #trainSearchDetail .dialog, #popupDetail .dialog, #refreshSettingDetail .dialog", function(event) {
		event.stopPropagation();
	});

	// 繝壹・繧ｸ縺ｮ陦ｨ遉ｺ迥ｶ諷九↓蠢懊§縺ｦ閾ｪ蜍墓峩譁ｰ繧貞宛蠕｡縺吶ｋ
	document.addEventListener("visibilitychange", handle_page_visibility_change);

	// 繧ｵ繧､繝峨Γ繝九Η繝ｼ縺ｮ髢峨§繧九・繧ｿ繝ｳ繧偵け繝ｪ繝・け縺励◆縺ｨ縺阪・蜍輔″
	$("#sideMenu .side-menu .area-contents-header, #sideMenu .side-menu-outer").on("click", function() {
		$("#sideMenu .side-menu").css("transform", "translateX(-327px)");
		$("#sideMenu .side-menu").css("box-shadow", "none");
		$("#sideMenu .side-menu-outer").hide();
		// 繧ｵ繧､繝峨Γ繝九Η繝ｼ蜀・・謚倥ｊ逡ｳ縺ｿ繧帝哩縺倥ｋ縲・
		toggle_close();
		// body縺ｮ繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ繧呈怏蜉ｹ縺ｫ縺吶ｋ縲・
		set_scroll_show_side_menu();
	});

	// 蛹ｺ髢薙ｒ繧ｯ繝ｪ繝・け縺励◆縺ｨ縺阪・蜍輔″
	$(document).on("click"
	, ".rosen-name-list div, .hoka-rosen-link a, .up-rosen-link a, .down-rosen-link a, .shin-link a"
	,  function() {
		$("#sideMenu .side-menu-outer").hide();

		// 繝ｭ繝ｼ繝・ぅ繝ｳ繧ｰ繧｢繝九Γ繝ｼ繧ｷ繝ｧ繝ｳ繧定｡ｨ遉ｺ
		loading_animation_display();

		// 迴ｾ蝨ｨ陦ｨ遉ｺ荳ｭ縺ｮ霍ｯ邱壹ｒ蜿門ｾ・
		befRosen = get_param_rosen();
		if ($(this).attr("class") == "rosen-name-contents") {
			// 繧ｵ繧､繝峨Γ繝九Η繝ｼ繧ｯ繝ｪ繝・け蛻､螳夂畑縺ｮ繝輔Λ繧ｰ繧稚rue
			isSideMenuClick = true;
		}

		let rosen = $(this).attr("value");
		if (!rosen) return;
		scrollKey = $(this).attr("key");

		if (befRosen == rosen) {
			// 陦ｨ遉ｺ荳ｭ縺ｮ霍ｯ邱壹→驕ｷ遘ｻ蜈医・霍ｯ邱壹′蜷後§蝣ｴ蜷・
			// 繝上ャ繧ｷ繝･縺九ｉid・磯ｧ・く繝ｼ・峨∝・霆顔分蜿ｷ繧貞叙蠕・
			let param_id = get_param_id();
			let param_cbango = get_param_cbango();
			location.hash = "rosen=" + rosen;
			// 鬧・く繝ｼ縲∝・霆顔分蜿ｷ縺瑚ｨｭ螳壹＆繧後※縺・◆蝣ｴ蜷医∫判髱｢陦ｨ遉ｺ蜃ｦ逅・ｒ陦後≧
			if (!param_id && !param_cbango) init_disp(scrollKey);
		} else {
			// 繝上ャ繧ｷ繝･繧帝∈謚槭＠縺溯ｷｯ邱壹↓螟画峩
			location.hash = "rosen=" + rosen;
		}

		$(function(){
			if (window.innerWidth <= 1000) {
				// 繧ｵ繧､繝峨Γ繝九Η繝ｼ蜀・・謚倥ｊ逡ｳ縺ｿ繧帝哩縺倥ｋ縲・
				toggle_close();
				// body縺ｮ繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ繧呈怏蜉ｹ縺ｫ縺吶ｋ縲・
				if (isSideMenuClick) set_scroll_show_side_menu();
			}
		});
	});

	// 迚ｹ諤･蜷阪ｒ繧ｯ繝ｪ繝・け縺励◆蝣ｴ蜷医・蜍輔″
	$(document).on("click", ".express-name-label", function () {

		// 閾ｪ蛻・ｒ縺薙ｌ縺九ｉ髢九￥蝣ｴ蜷医∽ｻ悶・螻暮幕繧偵☆縺ｹ縺ｦ髢峨§繧・
		if ($(this).next().css("display") === "none") {
			$(".express-train-list").css("display", "none");
			$(".express-name-label").removeClass("open");
		}
		// 譏守ｴｰ繧帝幕縺擾ｼ城哩縺倥ｋ
		$(this).next().stop().slideToggle(100, () => {
			// 閾ｪ蛻・ｒ縺薙ｌ縺九ｉ髢九￥蝣ｴ蜷医∝ｱ暮幕縺励◆繝ｪ繧ｹ繝医′隕九∴繧倶ｽ咲ｽｮ縺ｾ縺ｧ繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ縺吶ｋ縲・
			if ($(this).next().css("display") !== "none") {
				// 繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ菴咲ｽｮ繧定ｨ育ｮ励☆繧九・
				const pos = $(this).offset().top - $(this).parent().parent().first().offset().top;
				// 繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ縺吶ｋ縲・
				$(this).closest(".side-menu-scroll").animate({scrollTop: pos}, 100);
			}
		});
		$(this).toggleClass("open");
	});

	// 迚ｹ諤･蛻苓ｻ雁錐繧偵け繝ｪ繝・け縺励◆縺ｨ縺阪・蜍輔″
	$(document).on("click", ".express-train-contents", function() {
		let lang = document.documentElement.dataset.lang;
		// 繝ｭ繝ｼ繝・ぅ繝ｳ繧ｰ繧｢繝九Γ繝ｼ繧ｷ繝ｧ繝ｳ繧定｡ｨ遉ｺ縺吶ｋ縲・
		loading_animation_display();
		// 繧ｵ繧､繝峨Γ繝九Η繝ｼ繧ｯ繝ｪ繝・け蛻､螳夂畑縺ｮ繝輔Λ繧ｰ繧稚rue
		isSideMenuClick = true;
		// 蛻礼分繧貞叙蠕励☆繧九・
		const cbango = $(this).attr("cbango");
		// 蛻苓ｻ顔ｨｮ蛻･繧貞叙蠕励☆繧九・
		const type = $(this).attr("type");
		// 繝槭せ繧ｿ繝輔ぃ繧､繝ｫ逕ｨ縺ｮ繧ｭ繝｣繝・す繝･繝舌せ繧ｿ繝ｼ蛟､繧堤函謌舌☆繧九・UNIX蜈・悄縺九ｉ縺ｮ邨碁℃繝溘Μ遘呈焚繧貞承縺ｫ16繝薙ャ繝医す繝輔ヨ縺励◆蛟､縲・縺ｮ16荵暦ｼ・5536繝溘Μ遘停薗邏・蛻・俣髫斐〒繧ｭ繝｣繝・す繝･繧堤┌蜉ｹ蛹悶☆繧・
		const mstNow = Date.now() >>> 16;
		// 繝医Λ繝ｳ繝輔ぃ繧､繝ｫ逕ｨ縺ｮ繧ｭ繝｣繝・す繝･繝舌せ繧ｿ繝ｼ蛟､繧堤函謌舌☆繧九・UNIX蜈・悄縺九ｉ縺ｮ邨碁℃繝溘Μ遘呈焚繧貞承縺ｫ10繝薙ャ繝医す繝輔ヨ縺励◆蛟､縲・縺ｮ10荵暦ｼ・024繝溘Μ遘帝俣髫斐〒繧ｭ繝｣繝・す繝･繧堤┌蜉ｹ蛹悶☆繧・
		const trnNow = Date.now() >>> 10;
		// 譛譁ｰ縺ｮ蛻苓ｻ企°陦梧ュ蝣ｱ繧貞叙蠕励☆繧九・		$.when(
			get_daiya_request("00", lang, mstNow),
			get_express_now_request(trnNow)
		)
		.done((daiyaBase, expressNowBase) => {
			// 蟇ｾ雎｡縺ｮ蛻苓ｻ翫・驕玖｡梧ュ蝣ｱ繧貞叙蠕励☆繧九・			const expressNow = expressNowBase[0].trains.find(train => train.cbango === cbango);
			const targetRosen = $(this).attr("value") || normalizeMergedRosen(expressNow.runRosen, $(this).find(".train-name").text());
			// 蟇ｾ雎｡縺ｮ蛻苓ｻ翫↓譛牙柑縺ｪ霍ｯ邱壹く繝ｼ縺瑚ｨｭ螳壹＆繧後※縺・ｋ蝣ｴ蜷医・縲∝ｽ楢ｩｲ霍ｯ邱壹・繝ｼ繧ｸ縺ｮ隧ｲ蠖灘・霆贋ｽ咲ｽｮ縺ｫ驕ｷ遘ｻ縺吶ｋ縲・			if (targetRosen) {
				// 迴ｾ蝨ｨ陦ｨ遉ｺ縺励※縺・ｋ霍ｯ邱壹ｒ蜿門ｾ励☆繧九・				const currentRosen = get_param_rosen();
				// 迴ｾ蝨ｨhash縺ｫ險ｭ螳壹＠縺ｦ縺・ｋ蛻苓ｻ顔分蜿ｷ繧貞叙蠕励☆繧九・				const currentCbango = get_param_cbango();
				if (currentRosen === targetRosen && currentCbango === cbango) {
					// 陦ｨ遉ｺ荳ｭ縺ｮ霍ｯ邱夲ｼ丞・霆顔分蜿ｷ縺ｨ驕ｷ遘ｻ蜈医・霍ｯ邱夲ｼ丞・霆顔分蜿ｷ縺悟酔縺伜ｴ蜷医〒縺ゅｌ縺ｰ縲∫判髱｢陦ｨ遉ｺ蜃ｦ逅・ｒ蜻ｼ縺ｳ蜃ｺ縺吶・					init_disp();

				} else {
					// 蛻･縺ｮ霍ｯ邱夲ｼ丞・霆顔分蜿ｷ縺ｧ縺ゅｌ縺ｰ縲√ワ繝・す繝･繧帝∈謚槭＠縺溯ｷｯ邱夲ｼ丞・霆顔分蜿ｷ縺ｫ螟画峩縺吶ｋ縲・					location.hash = "rosen=" + targetRosen + "&cbango=" + cbango;
				}
				return;
			}
			// 蟇ｾ雎｡縺ｮ蛻苓ｻ翫・繝繧､繝､繝・・繧ｿ繧貞叙蠕励☆繧九・
			const daiya = daiyaBase[0].today.find(train => train.cbango === cbango);
			// 驕玖｡檎憾諷九・隧ｳ邏ｰ繧定｡ｨ縺呎枚險繧貞叙蠕励☆繧九・
			const statuDetail =
				lang === "ja" ? expressNow.statusDetail :
				lang === "en" ? expressNow.statusDetailEn :
				lang === "tc" ? expressNow.statusDetailTc :
				lang === "sc" ? expressNow.statusDetailSc :
				lang === "kr" ? expressNow.statusDetailKr : "";
			// 蛻苓ｻ願ｩｳ邏ｰ諠・ｱ繝繧､繧｢繝ｭ繧ｰ繧定｡ｨ遉ｺ縺吶ｋ縲・
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
			// 繝・・繧ｿ縺ｮ蜿門ｾ励↓螟ｱ謨励＠縺溷ｴ蜷医・縲√お繝ｩ繝ｼ繝｡繝・そ繝ｼ繧ｸ繧定｡ｨ遉ｺ縺吶ｋ縲・
			showTrainDetailDialog($("#trainDetail"), undefined, true);
		});
	});
});

/*
 * 逕ｻ髱｢陦ｨ遉ｺ蜃ｦ逅・
 */
function init_disp(_scrollKey, _callback) {
	// 迴ｾ蝨ｨ陦ｨ遉ｺ荳ｭ縺ｮ霍ｯ邱壹ｒ蜿門ｾ・
	let param_rosen = get_param_rosen();
	// 隕∫ｴ繧偵☆縺ｹ縺ｦ蜑企勁
	$("#stationList").empty();

	// 繝｡繝・そ繝ｼ繧ｸ繧貞炎髯､
	$("#message").empty();
	$("#message").hide();

	$(".main-contents").css("transition", "transform .0s ease-out 0s,-webkit-transform .0s ease-out 0s");
	$(".main-contents").css("transform", "translateX(0px)");
	$(".sub-footer #subFooterContents").css("transition", "transform .0s ease-out 0s,-webkit-transform .0s ease-out 0s");
	$(".sub-footer #subFooterContents").css("transform", "translateX(0px)");

	// 驕ｸ謚槭＆繧後◆蛹ｺ髢薙ｒ蝓ｺ縺ｫ襍ｰ陦御ｽ咲ｽｮ繧貞・陦ｨ遉ｺ
	set_station_list(param_rosen, _scrollKey, _callback);

	// 繧ｨ繝ｪ繧｢蛻･迥ｶ豕゛SON繧定ｪｭ縺ｿ霎ｼ繧薙〒縲・°陦梧ュ蝣ｱ繧定ｨｭ螳壹☆繧九・
	set_unko_info(param_rosen);

	// 繝昴ャ繝励い繝・・html蛻､譁ｭ
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

	// 繝壹・繧ｸ縺ｮ譛蠕後′鬧・〒邨ゅｏ縺｣縺ｦ縺・ｋ霍ｯ邱夲ｼ・8縲・3・峨〒繧ｵ繝悶ヵ繝・ち繝ｼ縺ｮ陦ｨ遉ｺ縺後≠縺｣縺溷ｴ蜷医∽ｸ九↓菴咏區繧定ｿｽ蜉縺吶ｋ
	eki_end_margin();
}

/*
 * 蛻苓ｻ翫い繧､繧ｳ繝ｳ縺ｮ襍､譫繧堤せ貊・＆縺帙ｋ
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
 * JSON繝・・繧ｿ繧定ｪｭ縺ｿ霎ｼ縺ｿ縲・ｧ・・鬧・俣繧呈緒逕ｻ縺吶ｋ
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
	const seenCbangoMap = new Map();
	const mergedTrains = [];

	_nowDataList.forEach((nowData) => {
		if (!nowData || !Array.isArray(nowData.trains)) return;

		nowData.trains.forEach((row) => {
			if (!row || !row.cbango) {
				mergedTrains.push(row);
				return;
			}
			const cbango = String(row.cbango);
			if (seenCbangoMap.has(cbango)) return;
			seenCbangoMap.set(cbango, true);
			mergedTrains.push(row);
		});
	});

	return { trains: mergedTrains };
}

function load_location_now_data(_param_rosen, _now) {
	const sourceRosens = get_location_json_source_list(_param_rosen);
	return Promise.all(
		sourceRosens.map((rosen) => jqxhr_to_promise(get_location_now_request(rosen, _now)).catch(() => null))
	).then((nowDataList) => {
		const successDataList = nowDataList.filter((nowData) => nowData && Array.isArray(nowData.trains));
		if (successDataList.length < 1) throw new Error("location now json load failed");
		return merge_location_now_data(successDataList);
	});
}

function set_station_list(_param_rosen, _scrollKey, _callback) {
	stop_location_auto_refresh();
	// 縺顔衍繧峨○谺・ｽ懈・
	disp_oshirase(_param_rosen);

	// 蜷・玄髢薙・html繧定ｪｭ縺ｿ霎ｼ縺ｿ
	const lang = document.documentElement.dataset.lang;

	// 襍ｰ陦御ｽ咲ｽｮ繝壹・繧ｸ繝｡繝ｳ繝・リ繝ｳ繧ｹJSON繝輔ぃ繧､繝ｫ繧定ｪｭ縺ｿ霎ｼ繧薙〒縲√Γ繝ｳ繝・リ繝ｳ繧ｹ繝壹・繧ｸ縺ｫ蛻・ｊ譖ｿ縺医ｋ縺句愛螳壹ｒ陦後≧縲・
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

		// 迴ｾ蝨ｨ譌･莉倥ｒ險ｭ螳・
		const now = new Date();
		const formatted =
			now.getFullYear() + "蟷ｴ" +
			(now.getMonth() + 1) + "譛・ +
			now.getDate() + "譌･" +
			now.getHours() + "譎・ +
			now.getMinutes() + "蛻・ +
			now.getSeconds() + "遘堤樟蝨ｨ";

		$("#timestamp").text(formatted);

		// 霍ｯ邱壼錐繧定ｨｭ螳・
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
			// 陦ｨ遉ｺ蟇ｾ雎｡縺ｮ霍ｯ邱壹・繧ｹ繝・・繧ｿ繧ｹ縺・縺ｮ蝣ｴ蜷医√Γ繝ｳ繝・リ繝ｳ繧ｹ繝壹・繧ｸ繧定｡ｨ遉ｺ
			$("#stationList").html(maintenance[0]);
			// 譁ｹ髱｢縺ｮ險ｭ螳・
			$(".homen-header-contents").hide();
			$(".homen-footer-contents").hide();

			// 鬧・∈謚槭・繧ｿ繝ｳ繧帝撼陦ｨ遉ｺ
			$(".btn-header-contents .header-btn.eki").hide();
			// 繝輔ャ繧ｿ繝ｼ縺ｮ縺顔衍繧峨○繝ｻ驕玖｡梧ュ蝣ｱ繧定｡ｨ遉ｺ
			$("#subFooterContents").hide();

			$(".maintenance-title").show();

			// 鬧・・鬧・俣謠冗判蠕後・蠕悟・逅・
			set_post_station_list(_param_rosen, _scrollKey);
		} else {
			load_location_now_data(_param_rosen, nowQuery)
			.then(function(nowData) {
			autoRefreshRosen = _param_rosen;
			cachedResshaTypeData = typeData[0];
			cachedEkiData = ekiData[0];
			$("#stationList").html(rosen[0]);
			// 蛻苓ｻ翫い繧､繧ｳ繝ｳ繧呈緒逕ｻ縺吶ｋ
			create_ressha_icon(_param_rosen, nowData, typeData[0], ekiData[0]);
			// 蛻苓ｻ翫い繧､繧ｳ繝ｳ縺ｮ陦ｨ遉ｺ鬆・ｒ荳ｦ縺ｳ譖ｿ縺医ｋ
			ressha_pos_sort();

			// 譁ｹ髱｢縺ｮ險ｭ螳・
			let homenUp = $("#homenNameUpText");
			let homenDown = $("#homenNameDownText");
			if (homenUp) $("#homenNameUp").html(homenUp.text());
			if (homenDown) $("#homenNameDown").html(homenDown.text());
			$(".homen-header-contents").show();
			$(".homen-footer-contents").show();

			// 鬧・∈謚槭・繧ｿ繝ｳ繧定｡ｨ遉ｺ
			$(".btn-header-contents .header-btn.eki").show();
			// 繝輔ャ繧ｿ繝ｼ縺ｮ縺顔衍繧峨○繝ｻ驕玖｡梧ュ蝣ｱ繧定｡ｨ遉ｺ
			$("#subFooterContents").show();

			// 鬧・・鬧・俣謠冗判蠕後・蠕悟・逅・
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
 * 襍ｰ陦御ｽ咲ｽｮ縺ｮ閾ｪ蜍墓峩譁ｰ繧帝幕蟋九☆繧・
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
 * 襍ｰ陦御ｽ咲ｽｮ縺ｮ閾ｪ蜍墓峩譁ｰ繧貞●豁｢縺吶ｋ
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
 * 襍ｰ陦御ｽ咲ｽｮJSON縺ｮ縺ｿ繧貞・蜿門ｾ励＠縺ｦ縲∝・霆翫い繧､繧ｳ繝ｳ縺縺大・謠冗判縺吶ｋ
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
		// 閾ｪ蜍墓峩譁ｰ螟ｱ謨玲凾縺ｯ谺｡蝗樊峩譁ｰ繧貞ｾ・▽
	});
}

/*
 * 襍ｰ陦御ｽ咲ｽｮ繧｢繧､繧ｳ繝ｳ繧貞ｷｮ縺玲崛縺医※蜀肴緒逕ｻ縺吶ｋ
 */
function redraw_location_positions(_param_rosen, _nowData) {
	clear_location_positions(_param_rosen);
	create_ressha_icon(_param_rosen, _nowData, cachedResshaTypeData, cachedEkiData);
	ressha_pos_sort();
	update_location_timestamp();
	restore_selected_train_marker(true);
}

/*
 * 譌｢蟄倥・襍ｰ陦御ｽ咲ｽｮ繧｢繧､繧ｳ繝ｳ繧偵け繝ｪ繧｢縺吶ｋ
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
 * 迴ｾ蝨ｨ譎ょ綾陦ｨ遉ｺ繧呈峩譁ｰ縺吶ｋ
 */
function update_location_timestamp() {
	const now = new Date();
	const formatted =
		now.getFullYear() + "蟷ｴ" +
		(now.getMonth() + 1) + "譛・ +
		now.getDate() + "譌･" +
		now.getHours() + "譎・ +
		now.getMinutes() + "蛻・ +
		now.getSeconds() + "遘堤樟蝨ｨ";
	$("#timestamp").text(formatted);
}

/*
 * 驕ｸ謚樔ｸｭ縺ｮ蛻苓ｻ翫′縺ゅｋ蝣ｴ蜷医∝・謠冗判蠕後↓襍､譫繧剃ｻ倥￠逶ｴ縺・
 */
function restore_selected_train_marker(_follow = false) {
	const param_cbango = get_param_cbango();
	if (!param_cbango) return;
	const ressha = $("div[data-cbango='" + param_cbango + "']");
	if (!ressha.length) return;
	ressha.append("<img class='ressha-animation' src='./images/home/ressha_mark.svg' alt>");
	set_ressha_icon_animation();
	if (_follow) {
		scroll_selected_train_into_view(ressha);
	}
}

function scroll_selected_train_into_view(_ressha) {
	if (!_ressha || !_ressha.length) return;
	if ($("#guideDetail").is(":visible") || $("#searchDetail").is(":visible") || $("#trainSearchDetail").is(":visible") || $("#popupDetail").is(":visible") || $("#refreshSettingDetail").is(":visible") || $("#resshaDetail").is(":visible") || $(".trainDetailDialog").is(":visible") || $("#oshiraseDetail").is(":visible")) {
		return;
	}
	const currentScroll = $(window).scrollTop();
	const viewportHeight = window.innerHeight || $(window).height();
	const targetScroll = Math.max(0, _ressha.offset().top - (viewportHeight / 2) + (_ressha.outerHeight() / 2));
	if (Math.abs(currentScroll - targetScroll) < 4) return;
	$("html, body").stop(true).animate({ scrollTop: targetScroll }, 250);
	window.sessionStorage.setItem("scrollY", Math.max(0, targetScroll - 50));
}

/*
 * 閾ｪ蜍墓峩譁ｰ險ｭ螳壹ｒ隱ｭ縺ｿ霎ｼ繧
 */
function load_location_auto_refresh_settings() {
	const storedEnabled = localStorage.getItem(LOCATION_AUTO_REFRESH_ENABLED_KEY);
	const storedInterval = Number(localStorage.getItem(LOCATION_AUTO_REFRESH_INTERVAL_KEY));
	locationAutoRefreshEnabled = storedEnabled === null ? false : storedEnabled === "true";
	locationAutoRefreshInterval = [15000, 30000, 60000].includes(storedInterval) ? storedInterval : LOCATION_AUTO_REFRESH_DEFAULT_INTERVAL;
	update_refresh_status_label();
}

/*
 * 閾ｪ蜍墓峩譁ｰ險ｭ螳壼・蜉帶ｬ・↓迴ｾ蝨ｨ蛟､繧貞渚譏縺吶ｋ
 */
function sync_refresh_setting_controls() {
	$("#refreshEnabledSelect").val(locationAutoRefreshEnabled ? "on" : "off");
	$("#refreshIntervalSelect").val(String(locationAutoRefreshInterval / 1000));
}

/*
 * 閾ｪ蜍墓峩譁ｰ迥ｶ諷九・陦ｨ遉ｺ繧呈峩譁ｰ縺吶ｋ
 */
function update_refresh_status_label() {
	const lang = document.documentElement.dataset.lang;
	const intervalSeconds = locationAutoRefreshInterval / 1000;
	const messages = {
		ja: "閾ｪ蜍墓峩譁ｰON (" + intervalSeconds + "遘帝俣髫・",
		en: "Auto refresh ON (" + intervalSeconds + " sec)",
		tc: "閾ｪ蜍墓峩譁ｰON・域ｯ・ + intervalSeconds + "遘抵ｼ・,
		sc: "閾ｪ蜉ｨ譖ｴ譁ｰON・域ｯ・ + intervalSeconds + "遘抵ｼ・,
		kr: "・尖徐 ・ｱ・ ON (" + intervalSeconds + "・・"
	};
	const nextMessages = {
		ja: "谺｡蝗樊峩譁ｰ・・ + format_refresh_time(nextLocationAutoRefreshAt),
		en: "Next: " + format_refresh_time(nextLocationAutoRefreshAt),
		tc: "荳区ｬ｡譖ｴ譁ｰ・・ + format_refresh_time(nextLocationAutoRefreshAt),
		sc: "荳区ｬ｡譖ｴ譁ｰ・・ + format_refresh_time(nextLocationAutoRefreshAt),
		kr: "・､・・・ｱ・: " + format_refresh_time(nextLocationAutoRefreshAt)
	};
	if (locationAutoRefreshEnabled) {
		const message = (messages[lang] || messages.ja) + (nextLocationAutoRefreshAt ? "  " + (nextMessages[lang] || nextMessages.ja) : "");
		$("#refreshStatusLabel").text(message).removeAttr("hidden");
	} else {
		$("#refreshStatusLabel").text("").attr("hidden", "hidden");
	}
}

/*
 * 谺｡蝗櫁・蜍墓峩譁ｰ莠亥ｮ壽凾蛻ｻ繧定ｨｭ螳壹☆繧・
 */
function set_next_location_auto_refresh_time(_delay = locationAutoRefreshInterval) {
	nextLocationAutoRefreshAt = new Date(Date.now() + _delay);
	update_refresh_status_label();
}

/*
 * 繝倥ャ繝繝ｼ陦ｨ遉ｺ逕ｨ縺ｫ譎ょ綾繧呈紛蠖｢縺吶ｋ
 */
function format_refresh_time(_date) {
	if (!_date) return "";
	const hours = String(_date.getHours()).padStart(2, "0");
	const minutes = String(_date.getMinutes()).padStart(2, "0");
	const seconds = String(_date.getSeconds()).padStart(2, "0");
	return hours + "譎・ + minutes + "蛻・ + seconds + "遘・;
}

/*
 * 閾ｪ蜍墓峩譁ｰ險ｭ螳壹ｒ驕ｩ逕ｨ縺吶ｋ
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
 * 繝壹・繧ｸ縺ｮ陦ｨ遉ｺ迥ｶ諷九↓蠢懊§縺ｦ閾ｪ蜍墓峩譁ｰ繧貞●豁｢繝ｻ蜀埼幕縺吶ｋ
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
 * 鬧・・鬧・俣謠冗判蠕後・蠕悟・逅・
 */
function set_post_station_list(_param_rosen, _scrollKey) {
	if (["09", "52"].includes(_param_rosen)) {
		// 蜃ｽ鬢ｨ邱喙髟ｷ荳・Κ・槫・鬢ｨ髢転縺ｮ蝣ｴ蜷・
		if ($(".fujishiro-panel").height() > 800){
			$("#fujishiro1").hide();
			$("#fujishiro2").hide();
			$("#fujishiro1Long").show();
			$("#fujishiro2Long").show();
		}
	}

	set_responsive();

	// 繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ菴咲ｽｮ縺悟・鬆ｭ縺ｫ縺ゅｋ蝣ｴ蜷医∬ｷｯ邱壽緒逕ｻ繧ｿ繧､繝溘Φ繧ｰ縺ｧ繝倥ャ繝繝ｼ縺ｮ菴咏區縺ｮ鬮倥＆繧定ｨｭ螳・
	if ($("body,html").scrollTop() == 0) set_header_height();

	// 蛻晄悄陦ｨ遉ｺ譎ゅ・縺ｿ
	if (isLoad) {
		let param_cbango = get_param_cbango();
		if (param_cbango) {
			// 繝上ャ繧ｷ繝･縺ｫcbango縺悟ｭ伜惠縺励◆蝣ｴ蜷亥・逅・ｒ螳溯｡・
			ressha_run_check();
			window.sessionStorage.setItem("scrollY", window.scrollY - 50);
		} else if (is_reload()) {
			// 繧ｻ繝・す繝ｧ繝ｳ縺ｫ菫晏ｭ倥＠縺溘せ繧ｯ繝ｭ繝ｼ繝ｫ菴咲ｽｮ繧貞叙蠕・
			let scroll = Number(window.sessionStorage.getItem("scrollY"));
			if (!isNaN(scroll)) {
				// 譖ｴ譁ｰ譎ゅ√せ繧ｯ繝ｭ繝ｼ繝ｫ菴咲ｽｮ繧定ｨｭ螳・
				$("body,html").scrollTop(scroll + 50);
			}
		} else {
			let param_id = get_param_id();
			if (param_id) {
				// 繝上ャ繧ｷ繝･縺ｫ鬧・D縺悟ｭ伜惠縺励◆蝣ｴ蜷医∝ｯｾ雎｡縺ｮ鬧・∪縺ｧ繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ
				let pos = $("div[key='" + param_id + "']").offset().top - 380;
				$("body,html").animate({scrollTop: pos});
				window.sessionStorage.setItem("scrollY", pos - 50);
			} else {
				// 譛ｭ蟷瑚ｿ鷹リ縺ｮ霍ｯ邱壹・蝣ｴ蜷医∝・譛溯｡ｨ遉ｺ繧呈惆蟷碁ｧ・捉霎ｺ縺ｫ縺吶ｋ縲・
				set_disp_scroll_spo();
			}
		}

		// 蛻晄悄陦ｨ遉ｺ縺ｮ繝輔Λ繧ｰ繧断alse
		isLoad = false;
	} else {
		let param_cbango = get_param_cbango();
		if (param_cbango) {
			// 繝上ャ繧ｷ繝･縺ｫcbango縺悟ｭ伜惠縺励◆蝣ｴ蜷亥・逅・ｒ螳溯｡・
			ressha_run_check();
		} else if (preserveScrollAfterHashChange) {
			$("body,html").scrollTop(preservedScrollTop);
			scrollY = preservedScrollTop;
			preserveScrollAfterHashChange = false;
		} else {
			// 逕ｻ髱｢繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ菴咲ｽｮ險ｭ螳・
			set_disp_scroll(_param_rosen, _scrollKey);
		}
	}

	scrollKey = "";
	isSideMenuClick = false;

	// 繝ｭ繝ｼ繝・ぅ繝ｳ繧ｰ繧｢繝九Γ繝ｼ繧ｷ繝ｧ繝ｳ繧帝撼陦ｨ遉ｺ縺ｫ縺吶ｋ
	loading_animation_hidden();
}

/*
 * 逕ｻ髱｢繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ菴咲ｽｮ險ｭ螳・
 */
function set_disp_scroll(_param_rosen, _scrollKey) {
	// 莉冶ｷｯ邱壹°繧蛾・遘ｻ縺励※縺阪◆蝣ｴ蜷医・・遘ｻ蜈・・邱夊ｷｯ縺ｮ繝ｪ繝ｳ繧ｯ縺ｮ邂・園縺ｾ縺ｧ繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ
	let doc = $("a[value='" + befRosen + "']");
	if (_scrollKey && _scrollKey != "") {
		// 鬧・・邂・園縺ｾ縺ｧ繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ
		doc = $("div[key='" + _scrollKey + "']");
	}

	if (isSideMenuClick) {
		// 譛ｭ蟷瑚ｿ鷹リ縺ｮ霍ｯ邱壹・蝣ｴ蜷医∝・譛溯｡ｨ遉ｺ繧呈惆蟷碁ｧ・捉霎ｺ縺ｫ縺吶ｋ縲・
		set_disp_scroll_spo();
	} else if (doc.length > 0) {
		let scroll = doc.offset().top - 310;
		if (_param_rosen == "01" && _scrollKey == "090") scroll -= 120; // SP1 譯大恍鬧・∈縺ｮ驕ｷ遘ｻ
		if (_param_rosen == "03" && _scrollKey == "090") scroll -= 120; // SP3 譯大恍鬧・∈縺ｮ驕ｷ遘ｻ
		if (_param_rosen == "06" && _scrollKey == "227") scroll += 80;  // DO3 蠢玲枚鬧・∈縺ｮ驕ｷ遘ｻ
		if (_param_rosen == "13" && _scrollKey == "220") scroll -= 110; // DT1 霑ｽ蛻・ｧ・∈縺ｮ驕ｷ遘ｻ
		if (_param_rosen == "01" && befRosen == "02") scroll -= 120;	// SP2縺九ｉSP1縺ｸ縺ｮ驕ｷ遘ｻ
		if (_param_rosen == "13" && befRosen == "14") scroll -= 120;	// DT2縺九ｉDT1縺ｸ縺ｮ驕ｷ遘ｻ
		if (_param_rosen == "02" && befRosen == "01") scroll -= 120;	// SP1縺九ｉSP2縺ｸ縺ｮ驕ｷ遘ｻ
		$("body,html").scrollTop(scroll);
		scrollY = scroll;
	} else {
		// 繝壹・繧ｸ繝医ャ繝励∈繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ
		$("body,html").scrollTop(0);
	}
}

/*
 * 譛ｭ蟷瑚ｿ鷹リ縺ｮ霍ｯ邱壹・蝣ｴ蜷医∝・譛溯｡ｨ遉ｺ繧呈惆蟷碁ｧ・捉霎ｺ縺ｫ縺吶ｋ縲・
 */
function set_disp_scroll_spo() {
	if (!get_param_id() && !get_param_cbango()) {
		let rosen = get_param_rosen();
		if ((rosen == "01" || rosen == "02" || rosen == "03") && $("div[key='091']").length > 0) {
			let scroll = $("div[key='091']").offset().top - 310;
			$("body,html").scrollTop(scroll);
			scrollY = scroll;
		} else {
			// 繝壹・繧ｸ繝医ャ繝励∈繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ
			$("body,html").scrollTop(0);
			scrollY = 0;
		}
	}
}

/*
 * 逕ｻ髱｢蟷・・繧ｵ繧､繧ｺ縺ｫ蜷医ｏ縺帙※逕ｻ髱｢鬆・岼繧貞宛蠕｡縺吶ｋ縲・
 */
function set_responsive() {
	let userAgent = navigator.userAgent;
	let windowWidth = window.innerWidth;
	let scrollbarWidth; // 繧ｰ繝ｭ繝ｼ繝舌Ν繧ｹ繧ｳ繝ｼ繝励〒螳｣險
	document.addEventListener('DOMContentLoaded', (event) => {
   	scrollbarWidth = window.innerWidth - document.body.clientWidth;
    	// 縺薙・繧ｹ繧ｳ繝ｼ繝怜・縺ｧscrollbarWidth縺ｮ蛟､繧定ｨｭ螳・
	});
	let margin = 0;
	let lang = document.documentElement.dataset.lang;
	if (!(userAgent.indexOf('iPhone') > 0 || userAgent.indexOf('iPad') > 0 || userAgent.indexOf('Android') > 0 || userAgent.indexOf('Mobile') > 0 )) {
		if ($("#guideDetail").is(":visible") || $("#searchDetail").is(":visible") || $("#trainSearchDetail").is(":visible") || $("#popupDetail").is(":visible") || $("#refreshSettingDetail").is(":visible") || $("#resshaDetail").is(":visible") || $("#oshiraseDetail").is(":visible")) {
			// 縺・★繧後°縺ｮ繝繧､繧｢繝ｭ繧ｰ縺瑚｡ｨ遉ｺ縺輔ｌ縺ｦ縺・◆蝣ｴ蜷・
			margin = scrollbarWidth;
		}

		// PC縺ｮ蝣ｴ蜷・
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

		// 逕ｻ髱｢繧ｵ繧､繧ｺ縺御ｸ闊ｬ逧・↑繧ｹ繝槭・繧ｵ繧､繧ｺ莉･荳九→縺ｪ縺｣縺溷ｴ蜷医∫判髱｢繧堤ｸｮ蟆上＆縺帙ｋ
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

		// 逕ｻ髱｢繧ｵ繧､繧ｺ縺御ｸ闊ｬ逧・↑繧ｹ繝槭・繧ｵ繧､繧ｺ莉･荳九→縺ｪ縺｣縺溷ｴ蜷医∫判髱｢繧堤ｸｮ蟆上＆縺帙ｋ
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
		// 繧ｵ繧､繝峨Γ繝九Η繝ｼ繧帝國縺・
		$("#sideMenu .side-menu").css("transform", "translateX(-327px)");
		$("#sideMenu .side-menu").css("box-shadow", "none");
		$("#sideMenu .side-menu-outer").hide();
		$(".sub-header").css("width", "calc(100% - " + margin + "px)");
		$(".sub-footer .homen-footer-contents").css("width", "calc(100% - " + margin + "px)");
		if (lang == "ja") $(".sub-footer .sub-footer-contents.popup .sub-footer-unkou-msg").html("驥崎ｦ√↑<br>縺顔衍繧峨○");
		// 繧ｵ繧､繝峨Γ繝九Η繝ｼ蜀・・謚倥ｊ逡ｳ縺ｿ繧帝哩縺倥ｋ縲・
		toggle_close();
		if (!($("#guideDetail").is(":visible") || $("#searchDetail").is(":visible") || $("#trainSearchDetail").is(":visible") || $("#popupDetail").is(":visible") || $("#refreshSettingDetail").is(":visible") || $("#resshaDetail").is(":visible") || $(".trainDetailDialog").is(":visible") || $("#oshiraseDetail").is(":visible"))) {
			// 繝繧､繧｢繝ｭ繧ｰ縺瑚｡ｨ遉ｺ縺輔ｌ縺ｦ縺・↑縺・ｴ蜷・
			// body縺ｮ繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ繧呈怏蜉ｹ縺ｫ縺吶ｋ縲・
			set_scroll_show_side_menu();
		}

		// 繝｡繝ｳ繝・リ繝ｳ繧ｹ繝壹・繧ｸ縺ｮ繧ｿ繧､繝医Ν縺ｮ蛻ｶ蠕｡
		if (windowWidth <= 575) {
			let text = $(".maintenance-title").html();
			if (text && text.indexOf("<br>") == -1) {
				$(".maintenance-title").html(text.replace("繝｡繝ｳ繝・リ繝ｳ繧ｹ", "<br>繝｡繝ｳ繝・リ繝ｳ繧ｹ"));
			}
		} else {
			let text = $(".maintenance-title").html();
			if (text && text.indexOf("<br>") > 0) {
				$(".maintenance-title").html(text.replace("<br>", ""));
			}
		}
	} else {
		// 繧ｵ繧､繝峨Γ繝九Η繝ｼ繧定｡ｨ遉ｺ縺吶ｋ
		margin += 325;
		$("#sideMenu .side-menu").css("transform", "translateX(0px)");
		$("#sideMenu .side-menu .area-contents-header").hide();
		$("#sideMenu .side-menu-outer").hide();
		$(".sub-header").css("width", "calc(100% - " + margin + "px)");
		$(".sub-footer .homen-footer-contents").css("width", "calc(100% - " + margin + "px)");
		if (lang == "ja") $(".sub-footer .sub-footer-contents.popup .sub-footer-unkou-msg").html("驥崎ｦ√↑縺顔衍繧峨○");
		if (!($("#guideDetail").is(":visible") || $("#searchDetail").is(":visible") || $("#trainSearchDetail").is(":visible") || $("#popupDetail").is(":visible") || $("#refreshSettingDetail").is(":visible") || $("#resshaDetail").is(":visible") || $(".trainDetailDialog").is(":visible") || $("#oshiraseDetail").is(":visible"))) {
			// 繝繧､繧｢繝ｭ繧ｰ縺瑚｡ｨ遉ｺ縺輔ｌ縺ｦ縺・↑縺・ｴ蜷・
			// body縺ｮ繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ繧呈怏蜉ｹ縺ｫ縺吶ｋ縲・
			set_scroll_show_side_menu();
		}
	}
}

/*
 * 蛻苓ｻ翫い繧､繧ｳ繝ｳ繧呈緒逕ｻ縺吶ｋ縲・
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
				// 譁ｰ蜃ｽ鬢ｨ蛹玲沫鬧・ｷｦ蛛ｴ・・9P11U・・
				// 譁ｰ蜃ｽ鬢ｨ蛹玲沫・樔ｻ∝ｱｱ髢灘ｷｦ蛛ｴ・・9P10U・・
				// 莉∝ｱｱ鬧・ｷｦ蛛ｴ・・9P9U・・
				// 譁ｰ蜊・ｭｳ遨ｺ貂ｯ・槫漉蜊・ｭｳ髢灘ｷｦ蛛ｴ・・1P160U・峨・蝣ｴ蜷・
				$("." + nowRow.pos).append(create_html_up_ressha_icon(nowRow, _typeData, _ekiData));
				$("." + nowRow.pos).addClass("up");
			} else if (pos == "R9P11D" || pos == "R9P10D" || pos == "R9P9D" || pos == "R1P160D") {
				// 譁ｰ蜃ｽ鬢ｨ蛹玲沫鬧・承蛛ｴ・・9P11D・・
				// 譁ｰ蜃ｽ鬢ｨ蛹玲沫・樔ｻ∝ｱｱ髢灘承蛛ｴ・・9P10D・・
				// 莉∝ｱｱ鬧・承蛛ｴ・・9P9D・・
				// 譁ｰ蜊・ｭｳ遨ｺ貂ｯ・槫漉蜊・ｭｳ髢灘承蛛ｴ・・1P160D・・
				if ($("." + nowRow.pos).children(".ressha").length < 4) {
					$(create_html_down_ressha_icon(nowRow, _typeData, _ekiData)).prependTo("." + nowRow.pos);
				} else {
					$("." + nowRow.pos).append(create_html_down_ressha_icon(nowRow, _typeData, _ekiData));
				}
			} else if (pos == "R9P26U") {
				// 阯､蝓守ｷ夲ｼ・9P26U・・
				if ($("." + nowRow.pos).children(".ressha").length < 4) {
					$(create_html_up_ressha_icon(nowRow, _typeData, _ekiData)).prependTo("." + nowRow.pos);
					$("." + nowRow.pos).addClass("up");
				} else {
					$("." + nowRow.pos).append(create_html_up_ressha_icon(nowRow, _typeData, _ekiData));
					$("." + nowRow.pos).addClass("up");
				}
			} else if (pos == "R1P119U") {
				// 譁ｰ蜊・ｭｳ遨ｺ貂ｯ鬧・ｷｦ蛛ｴ・・1P119U・峨・蝣ｴ蜷・
				$("." + nowRow.pos).append(create_html_up_ressha_icon(nowRow, _typeData, _ekiData));
				$("." + nowRow.pos).addClass("up");
			} else if (pos == "R1P119D") {
				// 譁ｰ蜊・ｭｳ遨ｺ貂ｯ鬧・承蛛ｴ・・1P119D・峨・蝣ｴ蜷・
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
				// 繧｢繧､繧ｳ繝ｳ陦ｨ遉ｺ菴咲ｽｮ縺檎判髱｢蜊雁・繧医ｊ蟾ｦ縺ｮ蝣ｴ蜷・
				$("." + nowRow.pos).append(create_html_up_ressha_icon(nowRow, _typeData, _ekiData));
				$("." + nowRow.pos).addClass("up");
			} else {
				// 繧｢繧､繧ｳ繝ｳ陦ｨ遉ｺ菴咲ｽｮ縺檎判髱｢蜊雁・繧医ｊ蜿ｳ縺ｮ蝣ｴ蜷・
				if ($("." + nowRow.pos).children(".ressha").length < 6) {
					if ($("." + nowRow.pos).parent().parent().parent(".eki").length > 0) {
						// 鬧・・蝣ｴ蜷・
						if ($("." + nowRow.pos).children(".ressha").length < 3) {
							$("." + nowRow.pos).append(create_html_down_ressha_icon(nowRow, _typeData, _ekiData));
						} else {
							if ($("." + nowRow.pos).children(".ressha").length == 3) $("<div class='dummy'></div><div class='dummy'></div><div class='dummy'></div>").prependTo(("." + nowRow.pos));
							let idx = $("." + nowRow.pos).children(".ressha").length - 3;
							let test = $("." + nowRow.pos).children()[idx];
							test.outerHTML = create_html_down_ressha_icon(nowRow, _typeData, _ekiData);
						}
					} else {
						// 鬧・俣縺ｮ蝣ｴ蜷・
						$(create_html_down_ressha_icon(nowRow, _typeData, _ekiData)).prependTo("." + nowRow.pos);
					}
				} else {
					$("." + nowRow.pos).append(create_html_down_ressha_icon(nowRow, _typeData, _ekiData));
				}
			}
		}
	});

	// TID蛹ｺ髢灘､悶・鬮倥＆繧定ｨｭ螳・
	set_hirendo_height();

	// 蜃ｽ鬢ｨ鬧・捉霎ｺ縺ｮ鬮倥＆繧定ｨｭ螳・
	if (["09", "52"].includes(_param_rosen)) set_hakodate_height();
}

/*
 * TID蛹ｺ髢灘､悶・鬮倥＆繧定ｨｭ螳・
 */
function set_hirendo_height() {
	// TID蛹ｺ髢灘､悶・轤ｹ邱壼・縺ｫ蛻苓ｻ翫い繧､繧ｳ繝ｳ繧定｡ｨ遉ｺ縺吶ｋ鬆伜沺縺鯉ｼ偵▽ or ・薙▽ or ・斐▽蟄伜惠縺吶ｋ繝代ち繝ｼ繝ｳ繧定・・縺鈴ｫ倥＆繧定ｨｭ螳壹・
	// 蛻苓ｻ翫い繧､繧ｳ繝ｳ陦ｨ遉ｺ鬆伜沺・偵▽
	$(".hirendo-contents.two-ressha-contents").each(function(i, row) {
		let ressha = row.getElementsByClassName("hirendo-ressha-panel");
		if (ressha[0].children[0].childElementCount >= 2 || ressha[1].children[0].childElementCount >= 2) {
			// ・偵▽縺ｮ鬆伜沺荳ｭ縺ｮ荳翫・隕∫ｴ蜀・↓蛻苓ｻ翫′・偵▽莉･荳雁ｭ伜惠縺吶ｋ蝣ｴ蜷・
			let resshaCount = 0;
			if (ressha[0].children[0].childElementCount > ressha[1].children[0].childElementCount) {
				resshaCount = ressha[0].children[0].childElementCount;
			} else {
				resshaCount = ressha[1].children[0].childElementCount;
			}

			if (resshaCount > 6) resshaCount = 6;

			let eki = row.getElementsByClassName("hirendo-eki-contents")[0];
			if (eki.classList[1] == "one-eki") {
				// 鬧・′・代▽縺ｮ蝣ｴ蜷・
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
				// 鬧・′・薙▽縺ｮ蝣ｴ蜷・
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
			// ・偵▽縺ｮ鬆伜沺荳ｭ縺ｮ荳九・隕∫ｴ蜀・↓蛻苓ｻ翫′・偵▽莉･荳雁ｭ伜惠縺吶ｋ蝣ｴ蜷・
			let resshaCount = 0;
			if (ressha[0].children[1].childElementCount > ressha[1].children[1].childElementCount) {
				resshaCount = ressha[0].children[1].childElementCount;
			} else {
				resshaCount = ressha[1].children[1].childElementCount;
			}

			if (resshaCount > 6) resshaCount = 6;

			let eki = row.getElementsByClassName("hirendo-eki-contents")[0];
			if (eki.classList[1] == "one-eki") {
				// 鬧・′・代▽縺ｮ蝣ｴ蜷・
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
				// 鬧・′・薙▽縺ｮ蝣ｴ蜷・
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

	// 蛻苓ｻ翫い繧､繧ｳ繝ｳ陦ｨ遉ｺ鬆伜沺・薙▽
	$(".hirendo-contents.three-ressha-contents").each(function(i, row) {
		let ressha = row.getElementsByClassName("hirendo-ressha-panel");
		if (ressha[0].children[0].childElementCount >= 2 || ressha[1].children[0].childElementCount >= 2) {
			// ・薙▽縺ｮ鬆伜沺荳ｭ縺ｮ荳翫・隕∫ｴ蜀・↓蛻苓ｻ翫′・偵▽莉･荳雁ｭ伜惠縺吶ｋ蝣ｴ蜷・
			let resshaCount = 0;
			if (ressha[0].children[0].childElementCount > ressha[1].children[0].childElementCount) {
				resshaCount = ressha[0].children[0].childElementCount;
			} else {
				resshaCount = ressha[1].children[0].childElementCount;
			}

			if (resshaCount > 6) resshaCount = 6;

			let eki = row.getElementsByClassName("hirendo-eki-contents")[0];
			if (eki.classList[1] == "two-eki") {
				// 鬧・′・偵▽縺ｮ蝣ｴ蜷・
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
			// ・薙▽縺ｮ鬆伜沺荳ｭ縺ｮ逵溘ｓ荳ｭ縺ｮ隕∫ｴ蜀・↓蛻苓ｻ翫′・偵▽莉･荳雁ｭ伜惠縺吶ｋ蝣ｴ蜷・
			let resshaCount = 0;
			if (ressha[0].children[1].childElementCount > ressha[1].children[1].childElementCount) {
				resshaCount = ressha[0].children[1].childElementCount;
			} else {
				resshaCount = ressha[1].children[1].childElementCount;
			}

			if (resshaCount > 6) resshaCount = 6;

			let eki = row.getElementsByClassName("hirendo-eki-contents")[0];
			if (eki.classList[1] == "two-eki") {
				// 鬧・′・偵▽縺ｮ蝣ｴ蜷・
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
			// ・薙▽縺ｮ鬆伜沺荳ｭ縺ｮ荳九・隕∫ｴ蜀・↓蛻苓ｻ翫′・偵▽莉･荳雁ｭ伜惠縺吶ｋ蝣ｴ蜷・
			let resshaCount = 0;
			if (ressha[0].children[2].childElementCount > ressha[1].children[2].childElementCount) {
				resshaCount = ressha[0].children[2].childElementCount;
			} else {
				resshaCount = ressha[1].children[2].childElementCount;
			}

			if (resshaCount > 6) resshaCount = 6;

			let eki = row.getElementsByClassName("hirendo-eki-contents")[0];
			if (eki.classList[1] == "two-eki") {
				// 鬧・′・偵▽縺ｮ蝣ｴ蜷・
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

	// 蛻苓ｻ翫い繧､繧ｳ繝ｳ陦ｨ遉ｺ鬆伜沺・斐▽
	$(".hirendo-contents.four-ressha-contents").each(function(i, row) {
		let ressha = row.getElementsByClassName("hirendo-ressha-panel");
		if (ressha[0].children[0].childElementCount >= 2 || ressha[1].children[0].childElementCount >= 2) {
			// ・斐▽縺ｮ鬆伜沺荳ｭ縺ｮ荳逡ｪ荳翫・隕∫ｴ蜀・↓蛻苓ｻ翫′・偵▽莉･荳雁ｭ伜惠縺吶ｋ蝣ｴ蜷・
			let resshaCount = 0;
			if (ressha[0].children[0].childElementCount > ressha[1].children[0].childElementCount) {
				resshaCount = ressha[0].children[0].childElementCount;
			} else {
				resshaCount = ressha[1].children[0].childElementCount;
			}

			if (resshaCount > 6) resshaCount = 6;

			let eki = row.getElementsByClassName("hirendo-eki-contents")[0];
			if (eki.classList[1] == "three-eki") {
				// 鬧・′・薙▽縺ｮ蝣ｴ蜷・
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
			// ・斐▽縺ｮ鬆伜沺荳ｭ縺ｮ荳翫°繧会ｼ堤分逶ｮ縺ｮ隕∫ｴ蜀・↓蛻苓ｻ翫′・偵▽莉･荳雁ｭ伜惠縺吶ｋ蝣ｴ蜷・
			let resshaCount = 0;
			if (ressha[0].children[1].childElementCount > ressha[1].children[1].childElementCount) {
				resshaCount = ressha[0].children[1].childElementCount;
			} else {
				resshaCount = ressha[1].children[1].childElementCount;
			}

			if (resshaCount > 6) resshaCount = 6;

			let eki = row.getElementsByClassName("hirendo-eki-contents")[0];
			if (eki.classList[1] == "three-eki") {
				// 鬧・′・薙▽縺ｮ蝣ｴ蜷・
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
			// ・斐▽縺ｮ鬆伜沺荳ｭ縺ｮ荳翫°繧会ｼ鍋分逶ｮ縺ｮ隕∫ｴ蜀・↓蛻苓ｻ翫′・偵▽莉･荳雁ｭ伜惠縺吶ｋ蝣ｴ蜷・
			let resshaCount = 0;
			if (ressha[0].children[2].childElementCount > ressha[1].children[2].childElementCount) {
				resshaCount = ressha[0].children[2].childElementCount;
			} else {
				resshaCount = ressha[1].children[2].childElementCount;
			}

			if (resshaCount > 6) resshaCount = 6;

			let eki = row.getElementsByClassName("hirendo-eki-contents")[0];
			if (eki.classList[1] == "three-eki") {
				// 鬧・′・薙▽縺ｮ蝣ｴ蜷・
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
			// ・斐▽縺ｮ鬆伜沺荳ｭ縺ｮ荳逡ｪ荳九・隕∫ｴ蜀・↓蛻苓ｻ翫′・偵▽莉･荳雁ｭ伜惠縺吶ｋ蝣ｴ蜷・
			let resshaCount = 0;
			if (ressha[0].children[3].childElementCount > ressha[1].children[3].childElementCount) {
				resshaCount = ressha[0].children[3].childElementCount;
			} else {
				resshaCount = ressha[1].children[3].childElementCount;
			}

			if (resshaCount > 6) resshaCount = 6;

			let eki = row.getElementsByClassName("hirendo-eki-contents")[0];
			if (eki.classList[1] == "three-eki") {
				// 鬧・′・薙▽縺ｮ蝣ｴ蜷・
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
 * 蜃ｽ鬢ｨ鬧・捉霎ｺ縺ｮ鬮倥＆繧定ｨｭ螳・
 */
function set_hakodate_height() {
	let countUH = document.querySelector(".R10P41U").childElementCount;
	let countDH = document.querySelector(".R10P41D").childElementCount;
	if ((countUH >= 3 || countDH >= 3)) {
			// 蜃ｽ鬢ｨ鬧・↓蛻苓ｻ翫′・薙▽莉･荳雁ｭ伜惠縺吶ｋ蝣ｴ蜷・
			let resshaCount = countDH > countUH ? countDH : countUH;
			if (resshaCount > 6) resshaCount = 6;
			let height = 210 + (resshaCount - 2) * 65;
			$("#stationList .item.hakodate").css("height", height + "px");
	}

	let countUG = document.querySelector(".R10P1U").childElementCount;
	let countDG = document.querySelector(".R10P1D").childElementCount;
	if ((countUG >= 4 || countDG >= 4)) {
			// 莠皮ｨ憺Ο鬧・↓蛻苓ｻ翫′・斐▽莉･荳雁ｭ伜惠縺吶ｋ蝣ｴ蜷・
			$("#stationList .item.goryokaku").css("height", "136px");
			$("#goryokaku").hide();
			$("#goryokakuLong").show();
	}
}

/*
 *縲荳翫ｊ蛻苓ｻ翫・繧｢繧､繧ｳ繝ｳ縺ｮhtml繧堤函謌舌☆繧九・
 */
function create_html_up_ressha_icon(_nowRow, _typeData, _ekiData) {
	let lang = document.documentElement.dataset.lang;
	let objItem = document.createElement("div");
	objItem.classList.add("ressha");

	// 蛻苓ｻ顔ｨｮ蛻･繝槭せ繧ｿ縺九ｉ蛻苓ｻ顔ｨｮ蛻･繧貞叙蠕・
	let type = _typeData.find((v) => v.type == _nowRow.type);
	// 繧｢繧､繧ｳ繝ｳ蜀・・蛻苓ｻ顔ｨｮ蛻･繧定ｨｭ螳・
	let iconArea = document.createElement("div");
	iconArea.classList.add("icon-img");
	// 譁ｰ蟷ｹ邱壻ｻ･螟悶↓縺ｯ蛻苓ｻ顔ｨｮ蛻･縺ｮ譁・ｭ励ｒ繧｢繧､繧ｳ繝ｳ縺ｫ蜈･繧後ｋ
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

	// 驕・ｻｶ繧定ｨｭ螳・
	let chienText = "";
	if (_nowRow.chien > 0) {
		if (_nowRow.chien >= 999) {
			if (lang == "ja") chienText = "+螟ｧ蟷・;
			if (lang == "en") chienText = "+Very";
			if (lang == "tc") chienText = "+螟ｧ蟷・;
			if (lang == "sc") chienText = "+螟ｧ蟷・;
			if (lang == "kr") chienText = "+・尞ｭ";
		} else {
			chienText = "+" + _nowRow.chien;
		}
	}
	let objOkure = document.createElement("span");
	objOkure.classList.add("okure-label");
	objOkure.textContent = chienText;
	objItem.appendChild(objOkure);

	// 蛻苓ｻ翫い繧､繧ｳ繝ｳ縺ｮ遏｢蜊ｰ繧定ｨｭ螳・
	let objArrow = document.createElement("img");
	objArrow.classList.add("arrow");
	objArrow.setAttribute("src", "./images/home/train_icon_arrow_up.svg");
	objArrow.setAttribute("alt", "");
	objItem.appendChild(objArrow);

	// 陦悟・繧定ｨｭ螳・
	if (lang == "ja") {
		let objYukisaki = document.createElement("span");
		objYukisaki.classList.add("yukisaki-label");
		objYukisaki.textContent = _nowRow.shuEkiSimple;
		objItem.appendChild(objYukisaki);
	}

	// 驛ｨ蛻・°莨代・・√ｒ險ｭ螳・
	if (_nowRow.status == "2") {
		let objExclamation = document.createElement("img");
		objExclamation.classList.add("exclamation");
		objExclamation.setAttribute("src", "./images/home/exclamation.svg");
		objExclamation.setAttribute("alt", "");
		objItem.appendChild(objExclamation);
	}

	// 蛻苓ｻ願ｩｳ邏ｰ縺ｫ陦ｨ遉ｺ縺吶ｋ蜀・ｮｹ縺ｮ險ｭ螳・
	create_ressha_detail(objItem, _nowRow, _typeData, _ekiData);

	return objItem.outerHTML;
}

/*
 * 荳九ｊ蛻苓ｻ翫・繧｢繧､繧ｳ繝ｳ縺ｮhtml繧堤函謌舌☆繧九・
 */
function create_html_down_ressha_icon(_nowRow, _typeData, _ekiData) {
	let lang = document.documentElement.dataset.lang;
	let objItem = document.createElement("div");
	objItem.classList.add("ressha");

	// 驕・ｻｶ繧定ｨｭ螳・
	let chienText = "";
	if (_nowRow.chien > 0) {
		if (_nowRow.chien >= 999) {
			if (lang == "ja") chienText = "+螟ｧ蟷・;
			if (lang == "en") chienText = "+Very";
			if (lang == "tc") chienText = "+螟ｧ蟷・;
			if (lang == "sc") chienText = "+螟ｧ蟷・;
			if (lang == "kr") chienText = "+・尞ｭ";
		} else {
			chienText = "+" + _nowRow.chien;
		}
	}
	let objOkure = document.createElement("span");
	objOkure.classList.add("okure-label");
	objOkure.textContent = chienText;
	objItem.appendChild(objOkure);

	// 蛻苓ｻ顔ｨｮ蛻･繝槭せ繧ｿ縺九ｉ蛻苓ｻ顔ｨｮ蛻･繧貞叙蠕・
	let type = _typeData.find((v) => v.type == _nowRow.type);
	// 繧｢繧､繧ｳ繝ｳ蜀・・蛻苓ｻ顔ｨｮ蛻･繧定ｨｭ螳・
	let iconArea = document.createElement("div");
	iconArea.classList.add("icon-img");
	// 譁ｰ蟷ｹ邱壻ｻ･螟悶↓縺ｯ蛻苓ｻ顔ｨｮ蛻･縺ｮ譁・ｭ励ｒ繧｢繧､繧ｳ繝ｳ縺ｫ蜈･繧後ｋ
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

	// 蛻苓ｻ翫い繧､繧ｳ繝ｳ縺ｮ遏｢蜊ｰ繧定ｨｭ螳・
	let objArrow = document.createElement("img");
	objArrow.classList.add("arrow");
	objArrow.setAttribute("src", "./images/home/train_icon_arrow_down.svg");
	objArrow.setAttribute("alt", "");
	objItem.appendChild(objArrow);

	// 陦悟・繧定ｨｭ螳・
	if (lang == "ja") {
		let objYukisaki = document.createElement("span");
		objYukisaki.classList.add("yukisaki-label");
		objYukisaki.textContent = _nowRow.shuEkiSimple;
		objItem.appendChild(objYukisaki);
	}

	// 驛ｨ蛻・°莨代・・√ｒ險ｭ螳・
	if (_nowRow.status == "2") {
		let objExclamation = document.createElement("img");
		objExclamation.classList.add("exclamation");
		objExclamation.setAttribute("src", "./images/home/exclamation.svg");
		objExclamation.setAttribute("alt", "");
		objItem.appendChild(objExclamation);
	}

	// 蛻苓ｻ願ｩｳ邏ｰ縺ｫ陦ｨ遉ｺ縺吶ｋ蜀・ｮｹ縺ｮ險ｭ螳・
	create_ressha_detail(objItem, _nowRow, _typeData, _ekiData);

	return objItem.outerHTML;
}

/*
 * 蛻苓ｻ願ｩｳ邏ｰ逕ｨ縺ｮ髫縺苓ｦ∫ｴ繧定ｨｭ螳壹☆繧九・
 */
function create_ressha_detail(_objItem, _nowRow, _typeData, _ekiData) {
	let lang = document.documentElement.dataset.lang;
	// 蛻苓ｻ顔ｨｮ蛻･繝槭せ繧ｿ縺九ｉ蛻苓ｻ顔ｨｮ蛻･繧貞叙蠕・
	let type = _typeData.find((v) => v.type == _nowRow.type);

	// 髫縺怜ｱ樊ｧ繧定ｨｭ螳壹☆繧九ゑｼ磯°陦梧ュ蝣ｱ隧ｳ邏ｰ繧定｡ｨ遉ｺ縺吶ｋ髫帙↓菴ｿ逕ｨ縺吶ｋ・・
	{
		// 蛻苓ｻ顔分蜿ｷ
		{
			_objItem.dataset.cbango = _nowRow.cbango;
		}

		// 蛻苓ｻ顔ｨｮ蛻･繧定｡ｨ縺呵牡繧定ｨｭ螳壹・
		{
			if (type && type.labelColor) {
				_objItem.dataset.ressha_type = type.labelColor;
			} else {
				_objItem.dataset.ressha_type = "";
			}
		}

		// 蛻苓ｻ顔ｨｮ蛻･蜷・
		{
			if (type) {
				if (type.type === 8) {
					_objItem.dataset.ressha_type_name = "蠢ｫ騾・;
				} else {
					_objItem.dataset.ressha_type_name = type.typeText[lang];
				}
			}

		}

		// 驕玖｡檎憾諷九さ繝ｼ繝・窶ｻ0=蜈ｨ蛹ｺ髢馴°莨代・=驕玖ｻ｢縲・=驛ｨ蛻・°莨・
		_objItem.dataset.unkou = _nowRow.status;

		if (lang == "ja") {
			// 驕玖｡檎憾諷句錐
			{
				if (_nowRow.status == "0") _objItem.dataset.unkou_name = "蜈ｨ蛹ｺ髢馴°莨・;
				if (_nowRow.status == "1") _objItem.dataset.unkou_name = "";
				if (_nowRow.status == "2") _objItem.dataset.unkou_name = "驛ｨ蛻・°莨・;
			}
			// 驕玖｡檎憾諷玖ｩｳ邏ｰ
			{
				if (!_nowRow.statusDetail || _nowRow.statusDetail == "") _objItem.dataset.unkou_detail = "笏";
				else _objItem.dataset.unkou_detail = _nowRow.statusDetail;
			}
		}
		else if (lang == "en") {
			// 驕玖｡檎憾諷句錐
			{
				if (_nowRow.status == "0") _objItem.dataset.unkou_name = "All sections cancelled";
				if (_nowRow.status == "1") _objItem.dataset.unkou_name = "";
				if (_nowRow.status == "2") _objItem.dataset.unkou_name = "Partially cancelled";
			}
			// 驕玖｡檎憾諷玖ｩｳ邏ｰ
			{
				if (!_nowRow.statusDetailEn || _nowRow.statusDetailEn == "") _objItem.dataset.unkou_detail = "笏";
				else _objItem.dataset.unkou_detail = _nowRow.statusDetailEn;
			}
		}
		else if (lang == "tc") {
			// 驕玖｡檎憾諷句錐
			{
				if (_nowRow.status == "0") _objItem.dataset.unkou_name = "蜈ｨ蜊髢灘●鬧・;
				if (_nowRow.status == "1") _objItem.dataset.unkou_name = "";
				if (_nowRow.status == "2") _objItem.dataset.unkou_name = "驛ｨ蛻・●鬧・;
			}
			// 驕玖｡檎憾諷玖ｩｳ邏ｰ
			{
				if (!_nowRow.statusDetailTc || _nowRow.statusDetailTc == "") _objItem.dataset.unkou_detail = "笏";
				else _objItem.dataset.unkou_detail = _nowRow.statusDetailTc;
			}
		}
		else if (lang == "sc") {
			// 驕玖｡檎憾諷句錐
			{
				if (_nowRow.status == "0") _objItem.dataset.unkou_name = "蜈ｨ蛹ｺ髣ｴ蛛憺ｩｶ";
				if (_nowRow.status == "1") _objItem.dataset.unkou_name = "";
				if (_nowRow.status == "2") _objItem.dataset.unkou_name = "驛ｨ蛻・●鬩ｶ";
			}
			// 驕玖｡檎憾諷玖ｩｳ邏ｰ
			{
				if (!_nowRow.statusDetailSc || _nowRow.statusDetailSc == "") _objItem.dataset.unkou_detail = "笏";
				else _objItem.dataset.unkou_detail = _nowRow.statusDetailSc;
			}
		}
		else if (lang == "kr") {
			// 驕玖｡檎憾諷句錐
			{
				if (_nowRow.status == "0") _objItem.dataset.unkou_name = "・・・ｬ・・br>・ｴ嵂・・卓ｧ";
				if (_nowRow.status == "1") _objItem.dataset.unkou_name = "";
				if (_nowRow.status == "2") _objItem.dataset.unkou_name = "・・・・ｴ嵂・br>・卓ｧ";
			}
			// 驕玖｡檎憾諷玖ｩｳ邏ｰ
			{
				if (!_nowRow.statusDetailKr || _nowRow.statusDetailKr == "") _objItem.dataset.unkou_detail = "笏";
				else _objItem.dataset.unkou_detail = _nowRow.statusDetailKr;
			}
		}

		// 驕・ｌ
		_objItem.dataset.chien = _nowRow.chien ? _nowRow.chien : "0";
		if (_nowRow.yokuStatus == 1 || _nowRow.yokuStatus == 2) {
			_objItem.dataset.chien_text = _nowRow.yokuDetail[lang];
		} else if (_nowRow.chien >= 1) {
			const CHIEN_LABEL_DELAYED_HOUR = { "ja": "{0}譎る俣驕・ｌ", "en": "{0} hour(s) late", "tc": "蟒ｶ驕ｲ{0}蟆乗凾", "sc": "蟒ｶ霑毬0}蟆乗慮", "kr": "{0}・懋ｰ・・・ｰ" };
			const CHIEN_LABEL_DELAYED_HR_MIN = { "ja": "{0}譎る俣{1}蛻・≦繧・, "en": "{0} hr {1} min late", "tc": "蟒ｶ驕ｲ{0}蟆乗凾{1}蛻・, "sc": "蟒ｶ霑毬0}蟆乗慮{1}蛻・, "kr": "{0}・懋ｰ・{1}・・・・ｰ" };
			const CHIEN_LABEL_DELAYED_MINUTES = { "ja": "{0}蛻・≦繧・, "en": "{0} minutes late", "tc": "蟒ｶ驕ｲ{0}蛻・, "sc": "蟒ｶ霑毬0}蛻・, "kr": "{0}・・・・ｰ" };
			let chienHour = Math.floor(_nowRow.chien / 60);
			let chienMin = _nowRow.chien % 60;
			if (chienHour > 0){
				if (chienMin > 0) _objItem.dataset.chien_text = CHIEN_LABEL_DELAYED_HR_MIN[lang].replace("{0}", chienHour).replace("{1}", chienMin); // 縲後・凾髢薙・・驕・ｌ縲・
				else _objItem.dataset.chien_text = CHIEN_LABEL_DELAYED_HOUR[lang].replace("{0}",chienHour); // 縲後・凾髢馴≦繧後・
			} else {
				// 闍ｱ隱槭〒1蛻・≦繧後・蝣ｴ蜷医・ minute late縲阪↓縺ｪ繧・
				if (lang == "en" && chienMin == 1)_objItem.dataset.chien_text = chienMin + " minute late";
				else _objItem.dataset.chien_text = CHIEN_LABEL_DELAYED_MINUTES[lang].replace("{0}", chienMin); // 縲後・・驕・ｌ縲・
			}
		} else {
			_objItem.dataset.chien_status = "0"
		}

		// 邱壼玄
		_objItem.dataset.senku = _nowRow.senku;

		// 蝨ｰ轤ｹ繧ｭ繝ｼ
		_objItem.dataset.pos = _nowRow.pos;

		// 鬧・・繧ｹ繧ｿ縺九ｉ繝繧､繝､繝・・繧ｿ縺ｮ邨ら捩鬧・ｒ蜿門ｾ励☆繧・
		let findEki = _ekiData.find((v) => v.key == _nowRow.shuEkiKey);

		// 陦悟・
		if (lang == "ja") _objItem.dataset.shu_eki = typeof findEki !== "undefined" ? findEki.ja + " 陦後″" : "陦後″";
		if (lang == "en") _objItem.dataset.shu_eki = typeof findEki !== "undefined" ? "For " + findEki.en : "For ";
		if (lang == "tc") _objItem.dataset.shu_eki = typeof findEki !== "undefined" ? "髢句ｾ" + findEki.tc : "髢句ｾ";
		if (lang == "sc") _objItem.dataset.shu_eki = typeof findEki !== "undefined" ? "蠑蠕" + findEki.sc : "蠑蠕";
		if (lang == "kr") _objItem.dataset.shu_eki = typeof findEki !== "undefined" ? findEki.kr + "嵂・ : "嵂・;

		// 霆贋ｸ｡謨ｰ
		_objItem.dataset.ryosu = _nowRow.ryosu && _nowRow.ryosu != 0 ? _nowRow.ryosu : "";
		if (_objItem.dataset.ryosu != "") {
			if (lang == "ja") _objItem.dataset.ryosu += "荳｡";
			if (lang == "en") _objItem.dataset.ryosu += " car(s)";
			if (lang == "tc") _objItem.dataset.ryosu += "遽霆雁ｻ・;
			if (lang == "sc") _objItem.dataset.ryosu += "闃りｽｦ蜴｢";
			if (lang == "kr") _objItem.dataset.ryosu += "・・寬ｸ・ｱ";
		}
	}
}

/*
 * 繝倥ャ繝繝ｼ縺ｮ鬮倥＆蛻・・菴咏區繧定ｨｭ螳壹☆繧九・
 */
function set_header_height() {
	let height = $(".train-guide-contents .sub-header").height();
	$(".station-list-contents").css("marginTop", 5 + height + "px");
}

/*
 * 繝繧､繧｢繝ｭ繧ｰ繧帝幕縺上→縺阪・body縺ｮ繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ繧堤┌蜉ｹ縺ｫ縺吶ｋ縲・
 */
function set_scroll_hide(dialog) {
	let userAgent = navigator.userAgent;
	let windowWidth = window.innerWidth;
	let scrollbarWidth = window.innerWidth - document.body.clientWidth;
	let width = 0;
	if (windowWidth > 1000) width = 325;

	if (!$("#sideMenu .side-menu-outer").is(":visible")) scrollY = window.scrollY; // 繧ｵ繧､繝峨Γ繝九Η繝ｼ髱櫁｡ｨ遉ｺ譎・
	$("body").css("overflow-y", "hidden");
	$("body").css("position", "fixed");
	$(".station-list-contents").css("position", "relative");
	if (!$("#sideMenu .side-menu-outer").is(":visible")) $(".station-list-contents").css("top",  scrollY * -1 + "px"); // 繧ｵ繧､繝峨Γ繝九Η繝ｼ髱櫁｡ｨ遉ｺ譎・

	if (!(userAgent.indexOf('iPhone') > 0 || userAgent.indexOf('iPad') > 0 || userAgent.indexOf('Android') > 0 || userAgent.indexOf('Mobile') > 0 )) {
		// PC縺ｮ蝣ｴ蜷・
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
 * 繝繧､繧｢繝ｭ繧ｰ繧帝哩縺倥ｋ縺ｨ縺阪・body縺ｮ繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ繧呈怏蜉ｹ縺ｫ縺吶ｋ縲・
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
		// PC縺ｮ蝣ｴ蜷・
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
 * 繧ｵ繧､繝峨Γ繝九Η繝ｼ繧帝幕縺上→縺阪・body縺ｮ繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ繧堤┌蜉ｹ縺ｫ縺吶ｋ縲・
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
		// PC縺ｮ蝣ｴ蜷・
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
 * 繧ｵ繧､繝峨Γ繝九Η繝ｼ繧帝哩縺倥ｋ縺ｨ縺阪・body縺ｮ繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ繧呈怏蜉ｹ縺ｫ縺吶ｋ縲・
 */
function set_scroll_show_side_menu() {
	let userAgent = navigator.userAgent;
	let windowWidth = window.innerWidth;
	let width = 0;
	if (windowWidth > 1000) width = 325;

	$("body").css("overflow-y", "scroll");
	$("body").css("position", "static");
	$(".station-list-contents").css("position", "static");
	// 繧ｵ繧､繝峨Γ繝九Η繝ｼ縺ｮ陦ｨ遉ｺ縺後≠繧句ｴ蜷医・縺ｿ(莉冶ｷｯ邱壹∈縺ｮ遘ｻ蜍輔・蝣ｴ蜷医・繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ縺ｮ遘ｻ蜍輔ｒ陦後ｏ縺ｪ縺・
	if (isSideMenuDisp) window.scrollTo(0, scrollY);

	if (!(userAgent.indexOf('iPhone') > 0 || userAgent.indexOf('iPad') > 0 || userAgent.indexOf('Android') > 0 || userAgent.indexOf('Mobile') > 0 )) {
		// PC縺ｮ蝣ｴ蜷・
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
 * 繧ｿ繝夜∈謚樊凾縺ｮ蛻ｶ蠕｡蜃ｦ逅・
 */
function tab_select(_str) {

	// 繧ｿ繝門・縺ｮ謚倥ｊ逡ｳ縺ｿ繧帝哩縺倥ｋ縲・
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
 * 繧ｿ繝夜∈謚樊凾縺ｮ蛻ｶ蠕｡蜃ｦ逅・ｼ医Μ繧ｵ繧､繧ｺ譎ゑｼ・
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
 * 繧ｿ繝門・縺ｮ謚倥ｊ逡ｳ縺ｿ繧帝哩縺倥ｋ縲・
 */
function toggle_close() {
	// 迚ｹ諤･繝ｪ繧ｹ繝医ｒ縺溘◆繧
	$(".express-train-list").css("display", "none");
	// 迚ｹ諤･繝ｪ繧ｹ繝医・隕句・縺暦ｼ井ｸ芽ｧ抵ｼ峨ｒ蛻晄悄蛹・
	$(".express-name-label").removeClass("open");
	// 繧ｵ繧､繝峨Γ繝九Η繝ｼ繧偵◆縺溘・
	$(".rosen-name-list").css("display", "none");
	// 繧ｵ繧､繝峨Γ繝九Η繝ｼ縺ｮ隕句・縺暦ｼ井ｸ芽ｧ抵ｼ峨ｒ蛻晄悄蛹・
	$(".area-name-label").removeClass("open");
}

/*
 * 繝上ャ繧ｷ繝･縺ｫ菫晄戟縺励◆蛻苓ｻ顔分蜿ｷ縺ｮ蛻苓ｻ翫′襍ｰ陦御ｸｭ縺狗｢ｺ隱阪ｒ陦後≧
 */
function ressha_run_check() {
	// 繝ｭ繝ｼ繝・ぅ繝ｳ繧ｰ繧｢繝九Γ繝ｼ繧ｷ繝ｧ繝ｳ繧定｡ｨ遉ｺ
	loading_animation_display();
	$("body,html").scrollTop(0);

	let param_cbango = get_param_cbango();
	let ressha = $("div[data-cbango='" + param_cbango + "']");
	if (ressha.length > 0) {
		let pos = ressha.offset().top - 260;
		// 繝ｪ繝ｭ繝ｼ繝峨＆繧後◆蝣ｴ蜷医い繝九Γ繝ｼ繧ｷ繝ｧ繝ｳ繧定｡後ｏ縺ｪ縺・
		if (!is_reload()) {
			$("body,html").animate({scrollTop: pos});
		} else {
			$("body,html").scrollTop(pos);
		}
		window.sessionStorage.setItem("scrollY", pos - 50);

		let html = "<img class='ressha-animation' src='./images/home/ressha_mark.svg' alt>"
		ressha.append(html);

		// 驕ｸ謚槭＠縺溷・霆翫↓襍､譫繧偵▽縺代※蠑ｷ隱ｿ縺吶ｋ
		set_ressha_icon_animation();

		// 繝ｭ繝ｼ繝・ぅ繝ｳ繧ｰ繧｢繝九Γ繝ｼ繧ｷ繝ｧ繝ｳ繧帝撼陦ｨ遉ｺ縺ｫ縺吶ｋ
		loading_animation_hidden();

	} else {
		// 迴ｾ蝨ｨ陦ｨ遉ｺ荳ｭ縺ｮ霍ｯ邱壹ｒ蜿門ｾ・
		isNotInitDisp = true;
		let rosen = get_param_rosen();
		location.hash = "rosen=" + rosen;
		// 繝壹・繧ｸ縺ｮ隱ｭ縺ｿ霎ｼ縺ｿ縺檎ｵゅｏ縺｣縺ｦ縺九ｉ繝繧､繧｢繝ｭ繧ｰ陦ｨ遉ｺ
		$("#oshiraseDetail").fadeIn("fast");
		let lang = document.documentElement.dataset.lang;
		if (lang == "ja") $("#oshiraseDetailMain .text").text("迴ｾ蝨ｨ縺ｯ縺薙・蛻苓ｻ翫・蝟ｶ讌ｭ譎る俣螟悶〒縺吶・);
		if (lang == "en") $("#oshiraseDetailMain .text").text("This train is not in operation now.");
		if (lang == "tc") $("#oshiraseDetailMain .text").text("迴ｾ蝨ｨ髱樊悽蛻苓ｻ顔・驕区凾髢薙・);
		if (lang == "sc") $("#oshiraseDetailMain .text").text("邇ｰ蝨ｨ髱樊悽蛻苓ｽｦ關･霑先慮髣ｴ縲・);
		if (lang == "kr") $("#oshiraseDetailMain .text").text("嶸・椪 ・ｴ ・ｴ・ｨ・・・ｼ嵂駕葺・ ・溢ｧ ・喜慣・壱共.");
		set_scroll_hide($("#oshiraseDetail .dialog"));
	}

	if (window.innerWidth <= 1000) {
		// 繧ｵ繧､繝峨Γ繝九Η繝ｼ繧帝哩縺倥ｋ
		$("#sideMenu .side-menu").css("transform", "translateX(-327px)");
		$("#sideMenu .side-menu").css("box-shadow", "none");
		$("#localTab").show();
		$("#expTab").show();
		$("#sideMenu .side-menu-outer").hide();
		// 繧ｵ繧､繝峨Γ繝九Η繝ｼ蜀・・謚倥ｊ逡ｳ縺ｿ繧帝哩縺倥ｋ縲・
		toggle_close();
	}
}

/*
 * 繝上ャ繧ｷ繝･縺九ｉ霍ｯ邱壹ｒ蜿門ｾ・
 */
function get_param_rosen() {
	let params = location.hash.slice(1).split('&');
	if (params.length > 0) {
		if (params[0].indexOf("rosen=") >= 0) return params[0].slice(-2);
		else return "";
	}
}

/*
 * 繝上ャ繧ｷ繝･縺九ｉid・磯ｧ・く繝ｼ・峨ｒ蜿門ｾ・
 */
function get_param_id() {
	let params = location.hash.slice(1).split('&');
	if (params.length > 1) {
		if (params[1].indexOf("id=") >= 0) return params[1].slice(-3);
		else return "";
	}
}

/*
 * 繝上ャ繧ｷ繝･縺九ｉcbango繧貞叙蠕・
 */
function get_param_cbango() {
	let params = location.hash.slice(1).split('&');
	if (params.length > 1) {
		if (params[1].indexOf("cbango=") >= 0) return params[1].substring(7);
		else return "";
	}
}

/*
 * 蛻苓ｻ頑､懃ｴ｢繝繧､繧｢繝ｭ繧ｰ繧貞・譛溽憾諷九↓謌ｻ縺・ */
function reset_train_search_dialog() {
	$("#trainSearchNumberInput").val("");
	$("#trainSearchNameNumberInput").val("");
	$("#trainSearchResultInfo").empty();
	$("#trainSearchResult").empty();
}

/*
 * 蛻苓ｻ頑､懃ｴ｢繝繧､繧｢繝ｭ繧ｰ繧帝哩縺倥ｋ
 */
function close_train_search_dialog() {
	$("#trainSearchDetail").fadeOut("fast");
	set_scroll_show($("#trainSearchDetail .dialog"));
}

/*
 * 迴ｾ蝨ｨ襍ｰ陦後＠縺ｦ縺・↑縺・・霆翫ｒ驕ｸ謚槭＠縺滄圀縺ｮ繝｡繝・そ繝ｼ繧ｸ繧定｡ｨ遉ｺ縺吶ｋ
 */
function show_train_not_running_message() {
	$("#oshiraseDetail").fadeIn("fast");
	let lang = document.documentElement.dataset.lang;
	if (lang == "ja") $("#oshiraseDetailMain .text").text("縺薙・蛻苓ｻ翫・迴ｾ蝨ｨ襍ｰ陦後＠縺ｦ縺・∪縺帙ｓ縲・);
	if (lang == "en") $("#oshiraseDetailMain .text").text("This train is not currently running.");
	if (lang == "tc") $("#oshiraseDetailMain .text").text("譛ｬ蛻苓ｻ顔岼蜑肴悴陦碁ｧ帙・);
	if (lang == "sc") $("#oshiraseDetailMain .text").text("譛ｬ蛻苓ｽｦ逶ｮ蜑肴悴霑占｡後・);
	if (lang == "kr") $("#oshiraseDetailMain .text").text("・ｴ ・ｴ・ｨ・・嶸・椪 ・ｼ嵂駕葺・ ・溢ｧ ・喜慣・壱共.");
	set_scroll_hide($("#oshiraseDetail .dialog"));
}

/*
 * 蛻苓ｻ頑､懃ｴ｢繝・・繧ｿ繧定ｪｭ縺ｿ霎ｼ繧
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
	const expressCorePromise = jqxhr_to_promise(get_express_core_request(mstNow));
	const expressNowPromise = jqxhr_to_promise(get_express_now_request(trnNow))
		.catch(() => ({ "trains": [] }));
	const typePromise = cachedResshaTypeData ? Promise.resolve(cachedResshaTypeData) : jqxhr_to_promise($.getJSON("https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/master/ressha_type_master.json?" + mstNow));
	const ekiPromise = cachedEkiData ? Promise.resolve(cachedEkiData) : jqxhr_to_promise($.getJSON("https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/master/eki_master.json?" + mstNow));
	const locationPromises = searchSourceRosens.map((rosen) =>
		jqxhr_to_promise(get_location_now_request(rosen, trnNow))
			.then((data) => ({ "rosen": rosen, "data": data }))
			.catch(() => null)
	);
	const daiyaPromises = daiyaSourceSenkus.map((senku) =>
		jqxhr_to_promise(get_daiya_request(senku, lang, mstNow))
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
				"status": "縺薙・蛻苓ｻ翫・迴ｾ蝨ｨ襍ｰ陦後＠縺ｦ縺・∪縺帙ｓ縲・,
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
		const expressNames = Array.from(new Set(
			(expressMaster && Array.isArray(expressMaster) ? expressMaster : [])
				.filter((row) => activeExpressKeys.has(row.key))
				.map((row) => row.name && row.name[lang] ? row.name[lang] : "")
				.filter(Boolean)
		));
		const shinkansenNames = Array.from(new Set(
			Array.from(daiyaMap.values())
				.filter((row) => row && String(row.senku || "") === "19")
				.map((row) => parse_train_name(row.name).baseName)
				.filter(Boolean)
		));
		const names = Array.from(new Set(expressNames.concat(shinkansenNames))).sort((a, b) => a.localeCompare(b, "ja"));
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
 * 蛻苓ｻ雁錐繝励Ν繝繧ｦ繝ｳ繧呈ｧ狗ｯ峨☆繧・ */
function populate_train_search_name_select(searchData) {
	const select = $("#trainSearchNameSelect");
	select.empty();
	select.append($("<option>").val("").text("蛻苓ｻ雁錐繧帝∈謚・));
	if (searchData && Array.isArray(searchData.names)) {
		searchData.names.forEach((name) => {
			select.append($("<option>").val(name).text(name));
		});
	}
}

/*
 * 蛻苓ｻ雁錐縺ｨ蜿ｷ謨ｰ繧貞・隗｣縺吶ｋ
 */
function parse_train_name(name) {
	const text = String(name || "")
		.replace(/[・・・兢/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xFEE0))
		.replace(/\u3000/g, " ")
		.trim();
	if (!text) return { "baseName": "", "goNumber": "" };
	const match = text.match(/^(.*?)(\d+)蜿ｷ?$/);
	if (!match) return { "baseName": text, "goNumber": "" };
	return {
		"baseName": match[1].trim(),
		"goNumber": match[2]
	};
}

/*
 * 蛻苓ｻ頑､懃ｴ｢逕ｨ縺ｮ陦ｨ遉ｺ蜷阪ｒ菴懈・縺吶ｋ
 */
function build_train_search_display_name(train, daiya, typeData, ekiData) {
	const lang = document.documentElement.dataset.lang;
	const destKey = train.shuEkiKey || (daiya ? daiya.shuEkiKey : "");
	const dest = ekiData.find((row) => row.key == destKey);
	const destName = dest ? (dest[lang] || dest.ja || "") : "";
	const destText = destName ? " " + destName + "陦・ : "";
	const nameInfo = parse_train_name(daiya && daiya.name ? daiya.name : "");
	if (nameInfo.baseName) return (daiya.name + destText).trim();
	const resolvedType = resolve_train_search_type(train.type, daiya ? daiya.name : "", typeData, train.cbango, daiya ? daiya.senku : "");
	const type = typeData.find((row) => String(row.type) == String(resolvedType));
	let typeName = "";
	if (type) {
		typeName = type.type === 8 ? "蠢ｫ騾・ : (type.typeText[lang] || type.typeText.ja || "");
	}
	const displayName = (typeName + destText).trim();
	if (displayName) return displayName;
	if (daiya && daiya.name) return (daiya.name + destText).trim();
	return String(train.cbango || "");
}

/*
 * HTML繧ｨ繧ｹ繧ｱ繝ｼ繝・ */
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
	if (trainName.indexOf("迚ｹ蛻･蠢ｫ騾・) >= 0) return "5";
	if (trainName.indexOf("蠢ｫ騾・) >= 0) return "8";
	if (trainName.indexOf("譎ｮ騾・) >= 0) return "3";
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
 * 蛻礼分讀懃ｴ｢繧定｡後≧
 */
function run_train_number_search() {
	const digits = $("#trainSearchNumberInput").val().replace(/[^\d]/g, "");
	const suffix = ($("#trainSearchSuffixSelect").val() || "D").toUpperCase();
	if (!digits) {
		render_train_search_results([], "蛻礼分繧貞・蜉帙＠縺ｦ縺上□縺輔＞縲・, "蛻礼分繧貞・蜉帙＠縺ｦ縺上□縺輔＞縲・);
		return;
	}
	const keyword = normalize_train_search_cbango(digits + suffix);
	load_train_search_data()
		.then((searchData) => {
			const results = searchData.trains.filter((train) => normalize_train_search_cbango(train.cbango) === keyword);
			render_train_search_results(results, "讀懃ｴ｢邨先棡");
		})
		.catch(() => {
			render_train_search_results([], "讀懃ｴ｢繝・・繧ｿ繧貞叙蠕励〒縺阪∪縺帙ｓ縺ｧ縺励◆縲・, "讀懃ｴ｢繝・・繧ｿ繧貞叙蠕励〒縺阪∪縺帙ｓ縺ｧ縺励◆縲・);
		});
}

/*
 * 蛻苓ｻ雁錐讀懃ｴ｢繧定｡後≧
 */
function run_train_name_search() {
	const selectedName = $("#trainSearchNameSelect").val();
	const goNumber = $("#trainSearchNameNumberInput").val().replace(/[^\d]/g, "");
	if (!selectedName) {
		render_train_search_results([], "蛻苓ｻ雁錐繧帝∈謚槭＠縺ｦ縺上□縺輔＞縲・, "蛻苓ｻ雁錐繧帝∈謚槭＠縺ｦ縺上□縺輔＞縲・);
		return;
	}
	load_train_search_data()
		.then((searchData) => {
			const results = searchData.trains.filter((train) => {
				if (train.baseName !== selectedName) return false;
				if (!goNumber) return true;
				return train.goNumber === goNumber;
			});
			render_train_search_results(results, "讀懃ｴ｢邨先棡");
		})
		.catch(() => {
			render_train_search_results([], "讀懃ｴ｢繝・・繧ｿ繧貞叙蠕励〒縺阪∪縺帙ｓ縺ｧ縺励◆縲・, "讀懃ｴ｢繝・・繧ｿ繧貞叙蠕励〒縺阪∪縺帙ｓ縺ｧ縺励◆縲・);
		});
}

/*
 * 讀懃ｴ｢逕ｨ譁・ｭ怜・繧呈ｭ｣隕丞喧
 */
function normalize_train_search_text(text) {
	return String(text || "").toLowerCase().replace(/[\s\u3000]+/g, "");
}

/*
 * 蛻苓ｻ頑､懃ｴ｢邨先棡繧呈緒逕ｻ
 */
function render_train_search_results(results, headerText, emptyMessage) {
	$("#trainSearchResultInfo").text(headerText || "");
	if (!results.length) {
		$("#trainSearchResult").html("<div class='train-search-empty'>" + (emptyMessage || "隧ｲ蠖薙☆繧句・霆翫・縺ゅｊ縺ｾ縺帙ｓ縲・) + "</div>");
		return;
	}
	let html = "";
	results.forEach(train => {
		html += "<div class='express-train-contents train-search-result-item' cbango='" + escape_train_search_html(train.cbango) + "' type='" + escape_train_search_html(train.type) + "' value='" + escape_train_search_html(train.value) + "' data-running='" + (train.isRunning === false ? "0" : "1") + "'>";
		html += "<div class='search-result-main'>";
		html += "<span class='search-result-cbango'>" + escape_train_search_html(train.cbango) + "</span>";
		html += "<span class='train-name'>" + escape_train_search_html(train.name) + "</span>";
		html += "</div>";
		html += "<span class='unkou-label" + (train.status && train.status.indexOf("驕・ｌ") >= 0 ? " chien" : "") + "'>" + escape_train_search_html(train.status || "") + "</span>";
		html += "</div>";
	});
	$("#trainSearchResult").html(html);
}

/*
 * rosen_xx.html縺ｫ陦ｨ險倥＆繧後◆蝨ｰ轤ｹ繧ｳ繝ｼ繝峨・鬆・↓蛻苓ｻ翫い繧､繧ｳ繝ｳ縺ｮ陦ｨ遉ｺ繧剃ｸｦ縺ｳ譖ｿ縺医ｋ
 */
function ressha_pos_sort() {
	let resshaIconArray =  Array.from($("#stationList .ressha-icon"));
	// 蛻苓ｻ翫′2縺､莉･荳翫≠繧句慍轤ｹ繧貞叙蠕・
	let result = resshaIconArray.filter((v) => v.childElementCount > 1);
	result.forEach(posArea => {
		// 荳ｦ縺ｳ譖ｿ縺医ｋ蝓ｺ貅悶→縺ｪ繧句慍轤ｹ繧ｳ繝ｼ繝峨ｒclass縺九ｉ蜿門ｾ・
		let sortArray = Array.from(posArea.classList);
		// 荳ｦ縺ｳ譖ｿ縺医ｋ蟇ｾ雎｡縺ｮ蛻苓ｻ翫ｒ蜿門ｾ・
		let resshaArray =Array.from(posArea.childNodes);
		resshaArray.sort((a, b) => sortArray.indexOf(a.dataset.pos) - sortArray.indexOf(b.dataset.pos));
		// 荳句髄縺榊・霆翫い繧､繧ｳ繝ｳ縺ｮ荳ｦ縺ｳ譖ｿ縺・
		resshaArray.filter((v) => v.className == "dummy").forEach(row => {
			resshaArray = resshaArray.splice(1);
			resshaArray.splice(2, 0, row);
		});
		// 蛻苓ｻ翫ｒ荳ｦ縺ｳ譖ｿ縺亥ｾ後・繧ゅ・縺ｫ鄂ｮ縺肴鋤縺医ｋ
		while(posArea.firstChild) {
			posArea.removeChild(posArea.firstChild);
		}
		for(const ressha of resshaArray) {
			posArea.appendChild(ressha);
		}
	});
}

/*
 * 繝壹・繧ｸ縺ｮ譛蠕後′鬧・〒邨ゅｏ縺｣縺ｦ縺・ｋ霍ｯ邱夲ｼ・8縲・3・峨〒繧ｵ繝悶ヵ繝・ち繝ｼ縺ｮ陦ｨ遉ｺ縺後≠縺｣縺溷ｴ蜷医∽ｸ九↓菴咏區繧定ｿｽ蜉縺吶ｋ
 */
function eki_end_margin() {
	if ($(".sub-footer").height() <= 0) return;
	let paramRosen = get_param_rosen();
	let marginHeight = $(".sub-footer").height() + 10;
	if (paramRosen == "08") {
		// end-eki-sub-footer-margin縺梧里縺ｫ霑ｽ蜉貂医∩縺縺｣縺溷ｴ蜷医↓縺ｯ鬮倥＆縺ｮ縺ｿ繧貞､画峩縺吶ｋ
		if($(".end-eki-sub-footer-margin").length > 0) {
			$(".end-eki-sub-footer-margin").css("height", marginHeight + "px");
		} else {
			// 菴咏區逕ｨ縺ｮHTML繧定ｿｽ蜉縺吶ｋ
			let add_html = document.createElement("div");
			add_html.className = "end-eki-sub-footer-margin";
			$(".eki-panel.eki.end").after(add_html);
			$(".end-eki-sub-footer-margin").css("height", marginHeight + "px");
		}
	}
	if (paramRosen == "13") {
		// 陦ｨ遉ｺ蟇ｾ雎｡螟悶お繝ｪ繧｢縺ｫ繧ｵ繝悶ヵ繝・ち繝ｼ蛻・・菴咏區繧定ｿｽ蜉縺吶ｋ
		$(".eki-panel.non-service-area .hirendo-contents").css("padding", "8px 0 " + marginHeight + "px 0");
	}
}

/*
 * 逕ｻ髱｢譖ｴ譁ｰ蛻､螳壼・逅・
 */
function is_reload() {
	if (window.performance) {
		if (window.performance.getEntriesByType('navigation').length) {
			if (window.performance.getEntriesByType('navigation')[0].type === 'reload') {
				// 譖ｴ譁ｰ譎・
				return true;
			}
		}
	}
	return false;
}


