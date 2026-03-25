/**
 * ・｢蛻苓ｻ願ｩｳ邏ｰ諠・ｱ・｣繝繧､繧｢繝ｭ繧ｰ縺ｮ繧ｿ繧､繝医Ν縲・
 */
const DETAILED_TRAIN_INFORMATION_DIALOG_TITLES = {
	"ja": "蛻苓ｻ願ｩｳ邏ｰ諠・ｱ",
	"en": "Detailed train information",
	"tc": "蛻苓ｻ願ｩｳ邏ｰ雉・ｨ・,
	"sc": "蛻苓ｽｦ隸ｦ扈・ｿ｡諱ｯ",
	"kr": "・ｴ・ｨ ・・┷ ・簿ｳｴ"
};

$(function ($) {
	let lang = document.documentElement.dataset.lang;
	// 蛻苓ｻ翫・繧｢繧､繧ｳ繝ｳ繧偵け繝ｪ繝・け縺励◆縺ｨ縺阪・蜍輔″
	$(document).on("click", ".ressha-icon .ressha", function() {
		let lang = document.documentElement.dataset.lang;
		// 繝ｭ繝ｼ繝・ぅ繝ｳ繧ｰ繧｢繝九Γ繝ｼ繧ｷ繝ｧ繝ｳ繧定｡ｨ遉ｺ
		loading_animation_display();

		// 蛻苓ｻ頑ュ蝣ｱ繝繧､繧｢繝ｭ繧ｰ縺ｫ蛟､繧定ｨｭ螳壹☆繧九・
		{
			let dataset = this.dataset;
			// 繝倥ャ繝繝ｼ繧ｿ繧､繝医Ν
			$("#headerTitle").text(DETAILED_TRAIN_INFORMATION_DIALOG_TITLES[lang]);
			// 蛻苓ｻ顔ｨｮ蛻･蜷・
			if (lang == "ja") $("#resshaTypeName").text(dataset.ressha_type_name);
			// 陦悟・
			$("#shuEki").html(dataset.shu_eki);
			// 荳｡謨ｰ
			$("#ryosu").html(dataset.ryosu);
			// 驕玖｡檎憾諷句錐
			$("#resshaDetailUnkouName").html(dataset.unkou_name);
			// 驕玖｡檎憾諷玖ｩｳ邏ｰ
			$("#resshaDetailUnkouText").text(dataset.unkou_detail);
			if (dataset.unkou_detail === "笏") { //驕玖｡檎憾諷玖ｩｳ邏ｰ縺後娯楳縲阪↑繧蛾撼陦ｨ遉ｺ縺ｫ縺吶ｋ
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
			// 蛻苓ｻ顔ｨｮ蛻･繧ｳ繝ｼ繝・
			if (lang == "ja") $("#resshaDetail").attr("dataResshaTypeColor", dataset.ressha_type);
			// 驕玖｡檎憾諷九さ繝ｼ繝・			$("#resshaDetail").attr("dataUnkou", dataset.unkou);
			// 驕・ｌ隧ｳ邏ｰ
			$("#chienDetail").text(dataset.chien_text);
			$("#trackTrainBtn").attr("data-cbango", dataset.cbango);
			const isTracking = get_param_cbango() === dataset.cbango;
			$("#trackTrainBtn").attr("data-tracking", isTracking ? "1" : "0");
			if (isTracking) {
				if (lang == "ja") $("#trackTrainBtn").text("霑ｽ霍｡隗｣髯､");
				if (lang == "en") $("#trackTrainBtn").text("Untrack");
				if (lang == "tc") $("#trackTrainBtn").text("隗｣髯､霑ｽ雹､");
				if (lang == "sc") $("#trackTrainBtn").text("隗｣髯､霑ｽ雕ｪ");
				if (lang == "kr") $("#trackTrainBtn").text("・肥・﨑ｴ・・);
			} else {
				if (lang == "ja") $("#trackTrainBtn").text("霑ｽ霍｡");
				if (lang == "en") $("#trackTrainBtn").text("Track");
				if (lang == "tc") $("#trackTrainBtn").text("霑ｽ雹､");
				if (lang == "sc") $("#trackTrainBtn").text("霑ｽ雕ｪ");
				if (lang == "kr") $("#trackTrainBtn").text("・肥・);
			}

			if (dataset.chien_status == "0") {
				$("#chienIcon").hide();
				$("#chienDetail").hide();
				$("#dialogsSurface .text.chien").css("borderBottomWidth", "1px");
			} else {
				$("#chienIcon").show();
				$("#chienDetail").show();

				if (dataset.unkou_detail === "笏") {
					$("#dialogsSurface .text.chien").css("borderBottomWidth", "0px");
				} else {
					$("#dialogsSurface .text.chien").css("borderBottomWidth", "1px");
				}
			}

			let pos = dataset.pos;
			let senku = dataset.senku;
			let now = Date.now() >>> 16;
			//驕玖｡檎分蜿ｷ
			// 驕玖｡檎分蜿ｷ・亥・霆顔分蜿ｷ縺ｮ繝ｩ繝吶Ν縺ｨ謨ｰ蛟､繧貞・縺代※蛻ｶ蠕｡・・
			$("#cbangoDetail").text(dataset.cbango);
			$("#cbangoIcon").removeClass("hide");
			$("#cbangoDetail").removeClass("hide");

			$.when(
				$.getJSON("./original/location_master" + (lang === "ja" ? "" : "_" + lang) + ".json?" + now),
				$.getJSON("https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/master/eki_master.json?" + now),
				$.getJSON("https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/daiya/daiya_" + senku + (lang === "ja" ? "" : "_" + lang) + ".json?" + now)
			)
			.done(function(posNameMasterBase, ekiMasterBase, daiyaBase) {
				// 迴ｾ蝨ｨ蝨ｰ
				$("#posDetailText").text(posNameMasterBase[0][pos]);
				// 繝繧､繝､繝・・繧ｿ菴懈・
				create_daiya(dataset, ekiMasterBase, daiyaBase);
				$('#resshaDetailMessage').empty();
				$('#resshaDetailMessage').hide();
				$('#resshaDetailMain').show();
				// 蛻苓ｻ願ｩｳ邏ｰ繝懊ャ繧ｯ繧ｹ繧帝幕縺上・
				$("#resshaDetail").fadeIn("fast");
				$("#teisyaTableArea").scrollTop(0);
			})
			.fail(function() {
				// JSON繝輔ぃ繧､繝ｫ縺ｮ隱ｭ縺ｿ霎ｼ縺ｿ縺ｫ螟ｱ謨励＠縺溘→縺阪・蜃ｦ逅・
				$("#resshaDetailMessage").html(`<h3 class="ressha-detail-message">${get_error_message()}</h3>`);
				$("#resshaDetailMessage").show();
				$("#resshaDetailMain").hide();
				// 蛻苓ｻ願ｩｳ邏ｰ繝懊ャ繧ｯ繧ｹ繧帝幕縺上・
				$("#resshaDetail").fadeIn("fast");
				$("#teisyaTableArea").scrollTop(0);
			});
		}

		$("#unkouDetailMain").hide();
		// 繝繧､繧｢繝ｭ繧ｰ繧帝幕縺上→縺阪・body縺ｮ繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ縺ｮ蛻ｶ蠕｡
		set_scroll_hide($("#resshaDetail .dialog"));
	});

	// 驕玖｡梧ュ蝣ｱ繧偵け繝ｪ繝・け縺励◆縺ｨ縺阪・蜍輔″
	$(document).on("click", "#unkouInfoBtn", function() {
		// 繝ｭ繝ｼ繝・ぅ繝ｳ繧ｰ繧｢繝九Γ繝ｼ繧ｷ繝ｧ繝ｳ繧定｡ｨ遉ｺ
		loading_animation_display();
		// 繝倥ャ繝繝ｼ繧ｿ繧､繝医Ν
		if (lang == "ja") $("#headerTitle").text("蛻苓ｻ企°陦梧ュ蝣ｱ");
		if (lang == "en") $("#headerTitle").text("Train Operation Information");
		if (lang == "tc") $("#headerTitle").text("蛻苓ｻ企°陦檎朽諷・);
		if (lang == "sc") $("#headerTitle").text("蛻苓ｽｦ霑占｡御ｿ｡諱ｯ");
		if (lang == "kr") $("#headerTitle").text("・ｴ・ｨ ・ｴ嵂・・簿ｳｴ");

		// 驕玖｡瑚ｩｳ邏ｰ繝懊ャ繧ｯ繧ｹ繧帝幕縺上・
		$("#resshaDetail").fadeIn("fast");
		$("#unkouDetailMain").scrollTop(0);
		$("#resshaDetailMain").hide();
		$("#unkouDetailMain").show();
		// 繝繧､繧｢繝ｭ繧ｰ繧帝幕縺上→縺阪・body縺ｮ繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ縺ｮ蛻ｶ蠕｡
		set_scroll_hide($("#resshaDetail .dialog"));
	});

	// 驕玖｡瑚ｩｳ邏ｰ繝懊ャ繧ｯ繧ｹ蜀・・・｢髢峨§繧具ｽ｣繝懊ち繝ｳ繧偵け繝ｪ繝・け縺励◆縺ｨ縺阪・蜍輔″
	$(document).on("click", "#resshaDetail, #resshaDetail .close", function() {
		// 驕玖｡梧ュ蝣ｱ繝懊ャ繧ｯ繧ｹ繧帝哩縺倥ｋ縲・
		$("#resshaDetail").fadeOut("fast");
		$('#resshaDetailMain').fadeOut("fast");
		$('#resshaDetailMessage').fadeOut("fast");
		// 繝繧､繧｢繝ｭ繧ｰ繧帝哩縺倥◆縺ｨ縺阪・body縺ｮ繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ縺ｮ蛻ｶ蠕｡
		set_scroll_show($("#resshaDetail .dialog"));
		// 繝ｭ繝ｼ繝・ぅ繝ｳ繧ｰ繧｢繝九Γ繝ｼ繧ｷ繝ｧ繝ｳ繧帝撼陦ｨ遉ｺ
		loading_animation_hidden();
	});

	// 繝舌ヶ繝ｪ繝ｳ繧ｰ繧貞●豁｢
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
		location.hash = "rosen=" + rosen + "&cbango=" + cbango;
	});
});

/*
 * 繝繧､繝､繝・・繧ｿ菴懈・
 */
function create_daiya(_dataset, _ekiMaster, _daiyaData) {
	// 蜃ｦ逅・′邨ゅｏ繧九∪縺ｧ繝繧､繝､繝・・繧ｿ縺ｯ髱櫁｡ｨ遉ｺ
	$("#teisyaTableArea div").empty();
	if (_dataset.senku == "") {
		// 諢帷ｧｰ蜷阪↓蛻苓ｻ顔ｨｮ蛻･繧定ｨｭ螳・		$("#aisho").text(_dataset.ressha_type_name);
		return;
	}

	let lang = document.documentElement.dataset.lang;
	const chien = Number(_dataset.chien || 0);
	const hasDelay = chien > 0;
	let findDaiya = _daiyaData[0].today.find((v) => v.cbango == _dataset.cbango);
	if (typeof findDaiya !== "undefined") {
		// 諢帷ｧｰ蜷・		$("#aisho").text(findDaiya.name);
		$("#teisyaTableArea .adjusted-notice").toggle(hasDelay);

		// 譎ょ綾陦ｨ
		if (findDaiya.stations.length > 0) {
			let html = "<table id='teisyaTable' border='1' width='80%'>";

			if (hasDelay) {
				if (lang == "ja") html += "<tr><th width='50%'>蛛懆ｻ企ｧ・/th><th width='25%'>螳壼綾</th><th width='25%'>驕・ｻｶ閠・・</th></tr>";
				if (lang == "en") html += "<tr><th width='50%'>Stops</th><th width='25%'>Scheduled time</th><th width='25%'>Adjusted</th></tr>";
				if (lang == "tc") html += "<tr><th width='50%'>蛛憺擒遶・/th><th width='25%'>貅夜ｻ・/th><th width='25%'>蟒ｶ驕ｲ蠕・/th></tr>";
				if (lang == "sc") html += "<tr><th width='50%'>蛛憺擒遶・/th><th width='25%'>蜃・せ</th><th width='25%'>譎夂せ蜷・/th></tr>";
				if (lang == "kr") html += "<tr><th width='50%'>・菩ｰｨ・ｭ</th><th width='25%'>奝ｵ・・・ｴ嵂餓亨・・/th><th width='25%'>・・ｰ ・們・</th></tr>";
			} else {
				if (lang == "ja") html += "<tr><th width='65%'>蛛懆ｻ企ｧ・/th><th width='35%'>螳壼綾</th></tr>";
				if (lang == "en") html += "<tr><th width='65%'>Stops</th><th width='35%'>Scheduled time</th></tr>";
				if (lang == "tc") html += "<tr><th width='65%'>蛛憺擒遶・/th><th width='35%'>貅夜ｻ・/th></tr>";
				if (lang == "sc") html += "<tr><th width='65%'>蛛憺擒遶・/th><th width='35%'>蜃・せ</th></tr>";
				if (lang == "kr") html += "<tr><th width='65%'>・菩ｰｨ・ｭ</th><th width='35%'>奝ｵ・・・ｴ嵂餓亨・・/th></tr>";
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
							html += "<td align='center'>" + time + " 逹</td>";
							if (hasDelay) html += "<td align='center' style='color:#f00;font-weight:bold;'>" + adjustedTime + " 逹</td>";
						}
						else {
							html += "<td align='center'>" + time + " 逋ｺ</td>";
							if (hasDelay) html += "<td align='center' style='color:#f00;font-weight:bold;'>" + adjustedTime + " 逋ｺ</td>";
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
							html += "<td align='center'>" + time + " 蛻ｰ</td>";
							if (hasDelay) html += "<td align='center' style='color:#f00;font-weight:bold;'>" + adjustedTime + " 蛻ｰ</td>";
						}
						else {
							html += "<td align='center'>" + time + " 髢・/td>";
							if (hasDelay) html += "<td align='center' style='color:#f00;font-weight:bold;'>" + adjustedTime + " 髢・/td>";
						}
					} else if (lang == "sc") {
						html += "<td>" + findRowEki.sc + "</td>";
						if (i == findDaiya.stations.length - 1) {
							html += "<td align='center'>" + time + " 蛻ｰ</td>";
							if (hasDelay) html += "<td align='center' style='color:#f00;font-weight:bold;'>" + adjustedTime + " 蛻ｰ</td>";
						}
						else {
							html += "<td align='center'>" + time + " 蠑</td>";
							if (hasDelay) html += "<td align='center' style='color:#f00;font-weight:bold;'>" + adjustedTime + " 蠑</td>";
						}
					} else if (lang == "kr") {
						html += "<td>" + findRowEki.kr + "</td>";
						if (i == findDaiya.stations.length - 1) {
							html += "<td align='center'>" + time + " ・・ｰｩ</td>";
							if (hasDelay) html += "<td align='center' style='color:#f00;font-weight:bold;'>" + adjustedTime + " ・・ｰｩ</td>";
						}
						else {
							html += "<td align='center'>" + time + " ・罹ｰ・/td>";
							if (hasDelay) html += "<td align='center' style='color:#f00;font-weight:bold;'>" + adjustedTime + " ・罹ｰ・/td>";
						}
					}
					html += "</tr>";
				}
			}
			html += "</table>";
			$("#teisyaTableArea div").html(html);
		} else {
			// 繝繧､繝､繝・・繧ｿ髱櫁｡ｨ遉ｺ
			$("#teisyaTableArea div").empty();
		}
	} else {
		// 諢帷ｧｰ蜷阪↓蛻苓ｻ顔ｨｮ蛻･繧定ｨｭ螳・		$("#aisho").text(_dataset.ressha_type_name);
		$("#teisyaTableArea .adjusted-notice").hide();
		// 繝繧､繝､繝・・繧ｿ髱櫁｡ｨ遉ｺ
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

