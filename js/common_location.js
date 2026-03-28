function is_test_mode() {
	const params = new URLSearchParams(location.search);
	return params.get("test") === "1";
}

function get_test_mode_search() {
	return is_test_mode() ? "?test=1" : "";
}

function build_page_url(_path, _hash) {
	return _path + get_test_mode_search() + (_hash ? "#" + _hash : "");
}

function get_testable_json_request(_testUrl, _remoteUrl) {
	if (!is_test_mode()) return $.getJSON(_remoteUrl);

	const deferred = $.Deferred();
	$.getJSON(_testUrl)
		.done((data) => deferred.resolve(data))
		.fail(() => {
			$.getJSON(_remoteUrl)
				.done((data) => deferred.resolve(data))
				.fail((jqXHR, textStatus, errorThrown) => deferred.reject(jqXHR, textStatus, errorThrown));
		});
	return deferred.promise();
}

function get_location_now_request(_rosen, _now) {
	const testUrl = "./testdata/location/location_" + _rosen + "_now.json?" + _now;
	const remoteUrl = "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/trainlocation/json/location/now/location_" + _rosen + "_now.json?" + _now;
	return get_testable_json_request(testUrl, remoteUrl);
}

function get_express_now_request(_now) {
	const testUrl = "./testdata/express/express_now.json?" + _now;
	const remoteUrl = "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/trainlocation/json/express/now/express_now.json?" + _now;
	return get_testable_json_request(testUrl, remoteUrl);
}

function get_express_core_request(_now) {
	const testUrl = "./testdata/express/express_core.json?" + _now;
	const remoteUrl = "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/trainlocation/json/express/core/express_core.json?" + _now;
	return get_testable_json_request(testUrl, remoteUrl);
}

function get_daiya_request(_senku, _lang, _now) {
	const suffix = _lang === "ja" ? "" : "_" + _lang;
	const testUrl = "./testdata/daiya/daiya_" + _senku + suffix + ".json?" + _now;
	const remoteUrl = "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/daiya/daiya_" + _senku + suffix + ".json?" + _now;
	return get_testable_json_request(testUrl, remoteUrl);
}

function get_rosen_now_request(_now) {
	const testUrl = "./testdata/rosen/rosen_now.json?" + _now;
	const remoteUrl = "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/trainlocation/json/rosen/now/rosen_now.json?" + _now;
	return get_testable_json_request(testUrl, remoteUrl);
}

/*
 * 繧ｵ繧､繝峨Γ繝九Η繝ｼ縲蜷・ｷｯ邱壹・驕・ｻｶ諠・ｱ縺ｮ險ｭ螳・ */
function set_side_area_chien() {
	let now = Date.now() >>> 10;
	const mergedRosenMap = {
		"51": ["01", "05"],
		"52": ["02", "07", "09"],
		"53": ["02", "13"]
	};
	// 繧ｨ繝ｪ繧｢蜷阪ｒ蜿門ｾ・	$.when(
		get_rosen_now_request(now)
	)
	.done(function(nowdata) {
		// 迴ｾ蝨ｨ譌･莉倩｡ｨ遉ｺ
		function setTimestamp(nowdata) {
			const now = new Date();
			const formatted =
				now.getFullYear() + "蟷ｴ" +
				(now.getMonth() + 1).toString().padStart(2, "0") + "譛・ +
				now.getDate().toString().padStart(2, "0") + "譌･" +
				now.getHours().toString().padStart(2, "0") + "譎・ +
				now.getMinutes().toString().padStart(2, "0") + "蛻・ +
				now.getSeconds().toString().padStart(2, "0") + "遘堤樟蝨ｨ";

			$("#timestamp").text(formatted);
		}

		$("#localTab .rosen-name-contents").each(function(i, row) {
			$(row).removeClass("has-chien");
			$(row).find(".unkou-label.chien").remove();
			const rosenValue = $(row).attr("value");
			let nowStatus = nowdata.lines.find((v) => v.rosen == rosenValue);
			if (typeof nowStatus === "undefined" && mergedRosenMap[rosenValue]) {
				nowStatus = getMergedRosenStatus(nowdata.lines, mergedRosenMap[rosenValue]);
			}
			if (typeof nowStatus !== "undefined") {
				const chienText = getRosenChienText(nowStatus);
				if (chienText) {
					$(row).addClass("has-chien");
					$(row).append(chienText);
				}
			}
		});
		// firefox逕ｨ縺ｫ驕ｩ逕ｨ縺励※縺・ｋmargin-right繧帝≦蟒ｶ譁・ｨ縺後↑縺・ｴ蜷育┌蜉ｹ縺ｫ縺吶ｋ縲・
		if ($('.rosen-name-contents[value="01"] .chien').length == 0) $('.rosen-name-contents[value="01"] .main').css("margin-right", "0px");
		if ($('.rosen-name-contents[value="03"] .chien').length == 0) $('.rosen-name-contents[value="03"] .main').css("margin-right", "0px");
		if ($('.rosen-name-contents[value="10"] .chien').length == 0) $('.rosen-name-contents[value="10"] .main').css("margin-right", "0px");
	})
	.fail(function() {
		var errormessage = `<h2 class='msg-bg'>${get_error_message()}</h2>`;
		$('#message').html(errormessage);
		$('#message').show();
	});

	function getMergedRosenStatus(lines, rosenList) {
		const targets = rosenList
			.map((rosen) => lines.find((line) => line.rosen == rosen))
			.filter(Boolean);
		if (targets.length < 1) return undefined;
		const merged = Object.assign({}, targets[0]);
		merged.maxChien = targets.reduce((maxValue, line) => {
			const value = typeof line.maxChien === "number" ? line.maxChien : Number(line.maxChien || 0);
			return value > maxValue ? value : maxValue;
		}, 0);
		return merged;
	}
}

/**
 * 蜷・ｷｯ邱壹・驕・ｻｶ蛻・焚縺ｫ蟇ｾ蠢懊＠縺滓枚險繧貞叙蠕励☆繧九・
 */
function getRosenChienText(_nowStatus) {
	const CHIEN_LABEL_DELAYED_HOUR = { "ja": "譛螟ｧ{0}譎る俣驕・ｌ", "en": "Delayed for <br>{0} hour(s) or less", "tc": "譛髟ｷ蟒ｶ驕ｲ{0}蟆乗凾髏・, "sc": "譛髟ｿ蟒ｶ霑毬0}蟆乗慮髓・, "kr": "・罹劇 {0}・懋ｰ・・・ｰ" };
	const CHIEN_LABEL_DELAYED_HR_MIN = { "ja": "譛螟ｧ{0}譎る俣{1}蛻・≦繧・, "en": "Delayed for <br>{0} hr {1} min or less", "tc": "譛髟ｷ蟒ｶ驕ｲ{0}蟆乗凾{1}蛻・据", "sc": "譛髟ｿ蟒ｶ霑毬0}蟆乗慮{1}蛻・帖", "kr": "・罹劇 {0}・懋ｰ・{1}・・・・ｰ" };
	const CHIEN_LABEL_DELAYED_MINUTES = { "ja": "譛螟ｧ{0}蛻・≦繧・, "en": "Delayed for <br>{0} minutes or less", "tc": "譛髟ｷ蟒ｶ驕ｲ{0}蛻・据", "sc": "譛髟ｿ蟒ｶ霑毬0}蛻・帖", "kr": "・罹劇 {0}・・・・ｰ" };
	const CHIEN_LABEL_VERY_LATE = { "ja": "螟ｧ蟷・↑驕・ｌ縺ゅｊ", "en": "Very late", "tc": "螟ｧ蟷・ｻｶ驕ｲ", "sc": "螟ｧ蟷・ｻｶ霑・, "kr": "・尞ｭ ・・ｰ ・溢搆" };
	const lang = document.documentElement.dataset.lang;

	if (!_nowStatus.maxChien || _nowStatus.maxChien <= 4) { // 蟷ｳ蟶ｸ驕玖ｻ｢縺ｮ蝣ｴ蜷医・菴輔ｂ陦ｨ遉ｺ縺励↑縺・
		return "";
	} else if (_nowStatus.maxChien >= 999) { // 100蛻・ｻ･荳翫↑繧峨悟､ｧ蟷・↑驕・ｌ縺ゅｊ縲・
		return `<span class="unkou-label chien very-late">${CHIEN_LABEL_VERY_LATE[lang]}</span>`;
	} else {
		// 驕・ｌ譎ょ・陦ｨ遉ｺ
		let chienHour = Math.floor(_nowStatus.maxChien / 60);
		let chienMin = _nowStatus.maxChien % 60;
		if (chienHour > 0){
			if (chienMin > 0) return `<span class="unkou-label chien">${CHIEN_LABEL_DELAYED_HR_MIN[lang].replace("{0}", chienHour).replace("{1}", chienMin)}</span>`; // 縲梧怙螟ｧ縲・凾髢薙・・驕・ｌ縲・
			else return `<span class="unkou-label chien">${CHIEN_LABEL_DELAYED_HOUR[lang].replace("{0}",chienHour)}</span>`; // 縲梧怙螟ｧ縲・凾髢馴≦繧後・
		} else {
			return `<span class="unkou-label chien">${CHIEN_LABEL_DELAYED_MINUTES[lang].replace("{0}", chienMin)}</span>`; // 縲梧怙螟ｧ縲・・驕・ｌ縲・
		}
	}
}

/**
 * 繧ｵ繧､繝峨Γ繝九Η繝ｼ縲蜷・音諤･蛻苓ｻ翫・繧ｿ繝ｳ縺ｮ菴懈・
 * @param onLabelClickEvent 迚ｹ諤･諢帷ｧｰ蜷阪・繝ｩ繝吶Ν繧偵け繝ｪ繝・け縺励◆縺ｨ縺阪↓螳溯｡後☆繧句・逅・ｒ險倩ｿｰ縺励◆髢｢謨ｰ縲・
 */
function createSideExpressList(onLabelClickEvent) {
	const lang = document.documentElement.dataset.lang;
	// 繝槭せ繧ｿ繝輔ぃ繧､繝ｫ逕ｨ縺ｮ繧ｭ繝｣繝・す繝･繝舌せ繧ｿ繝ｼ蛟､繧堤函謌舌☆繧九・UNIX蜈・悄縺九ｉ縺ｮ邨碁℃繝溘Μ遘呈焚繧貞承縺ｫ16繝薙ャ繝医す繝輔ヨ縺励◆蛟､縲・縺ｮ16荵暦ｼ・5536繝溘Μ遘停薗邏・蛻・俣髫斐〒繧ｭ繝｣繝・す繝･繧堤┌蜉ｹ蛹悶☆繧・
	const mstNow = Date.now() >>> 16;
	// 繝医Λ繝ｳ繝輔ぃ繧､繝ｫ逕ｨ縺ｮ繧ｭ繝｣繝・す繝･繝舌せ繧ｿ繝ｼ蛟､繧堤函謌舌☆繧九・UNIX蜈・悄縺九ｉ縺ｮ邨碁℃繝溘Μ遘呈焚繧貞承縺ｫ10繝薙ャ繝医す繝輔ヨ縺励◆蛟､縲・縺ｮ10荵暦ｼ・024繝溘Μ遘帝俣髫斐〒繧ｭ繝｣繝・す繝･繧堤┌蜉ｹ蛹悶☆繧・
	const trnNow = Date.now() >>> 10;
	// 迚ｹ諤･蛻苓ｻ翫↓髢｢縺吶ｋ諠・ｱ繧定ｪｭ縺ｿ霎ｼ繧薙〒縲∫音諤･蛻苓ｻ翫Μ繧ｹ繝医ｒ謠冗判縺吶ｋ縲・
	$.when(
		$.getJSON("https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/master/express_master.json?" + mstNow),
		get_express_core_request(mstNow),
		get_express_now_request(trnNow)
	)
	.done((expressMasterBase, coreDataBase, nowDataBase) => {
		const expressMaster = expressMasterBase[0];
		const coreData = coreDataBase[0];
		const nowData = nowDataBase[0];
		// 迚ｹ諤･諢帷ｧｰ蜷阪・繧ｰ繝ｫ繝ｼ繝怜腰菴阪↓縲∫音諤･蛻苓ｻ翫ｒ鬆・分縺ｫ逕ｻ髱｢縺ｫ霑ｽ蜉縺吶ｋ縲・
		const expressListElement = $("#expTab");
		expressMaster.forEach(express => {
			// 蠖捺律縺ｮ襍ｰ陦悟・霆翫・繝ｪ繧ｹ繝医ｒ蜿門ｾ励☆繧九・
			const coreTrains = coreData.expresses.find(trains => trains.key === express.key);
			// 蠖捺律縺ｮ襍ｰ陦悟・霆翫′縺ｪ縺・ｴ蜷医・縲∝・逅・ｵゆｺ・☆繧九・
			if (!coreTrains || !coreTrains.trains || coreTrains.trains.length === 0) return;

			// 迚ｹ諤･蛻苓ｻ翫・繝・Φ繝励Ξ繝ｼ繝医ｒ蜿門ｾ励＠縺ｦ縲∫判髱｢縺ｫ霑ｽ蜉縺吶ｋ縲・
			const expressElement = (function(key) {
				const cloneElement = $(expressListElement).find("template#expItemTemplate")[0].content.cloneNode(true);
				$(cloneElement).find(".area-contents").attr("data-key", key);
				$(expressListElement).append(cloneElement);
				return $(expressListElement).find(".area-contents[data-key='" + key +"']");
			}(express.key));
			// 諢帷ｧｰ蜷阪ｒ險ｭ螳壹☆繧九・
			$(expressElement).find(".express-name-label .main").text(express.name[lang]);
			// 蛹ｺ髢灘錐繧定ｨｭ螳壹☆繧九・
			$(expressElement).find(".express-name-label .sub").text(express.kukanText[lang]);
			// 繝ｩ繝吶Ν繧ｯ繝ｪ繝・け譎ゅ・蜃ｦ逅・う繝吶Φ繝医ｒ霑ｽ蜉縺吶ｋ縲・
			if (onLabelClickEvent) {
				$(expressElement).find(".express-name-label").on("click", {"kukanList": express.kukanList}, onLabelClickEvent);
			}

			// 繧ｹ繝槭・繝｢繝ｼ繝峨・迚ｹ諤･諢帷ｧｰ蜷阪・繧ｿ繝ｳ繧定ｿｽ蜉縺吶ｋ縲・
			if ($(expressListElement).find(".exp-operation-list").length) {
				// 繝・Φ繝励Ξ繝ｼ繝医ｒ蜿門ｾ励＠縺ｦ逕ｻ髱｢縺ｫ霑ｽ蜉縺吶ｋ縲・
				const spExpressElement = (function(key) {
					const cloneElement =$(expressListElement).find(".exp-operation-list ul template")[0].content.cloneNode(true);
					$(cloneElement).find(".sp-express-item").attr("data-key", key);
					$(expressListElement).find(".exp-operation-list ul").append(cloneElement);
					return $(expressListElement).find(".exp-operation-list ul li[data-key='" + key +"']");
				}(express.key));
				// 諢帷ｧｰ蜷阪ｒ險ｭ螳壹☆繧九・
				$(spExpressElement).find(".sp-express-name-label .main").text(express.name[lang]);
				// 蛹ｺ髢灘錐繧定ｨｭ螳壹☆繧九・
				$(spExpressElement).find(".sp-express-name-label .sub").text(express.kukanText[lang]);
				// 繝ｩ繝吶Ν繧ｭ繝ｼ繧定ｨｭ螳壹☆繧九・
				$(spExpressElement).find("input").attr("id", "exp" + express.key);
				$(spExpressElement).find("label").attr("for", "exp" + express.key);
			}

			// 蠖楢ｩｲ諢帷ｧｰ蜷阪げ繝ｫ繝ｼ繝励↓螻槭☆繧狗音諤･蛻苓ｻ翫・繝ｪ繧ｹ繝医ｒ菴懈・縺吶ｋ縲・
			coreTrains.trains.forEach(coreTrainInfo => {
				// 蛻苓ｻ翫・繝・Φ繝励Ξ繝ｼ繝医ｒ蜿門ｾ励＠縺ｦ縲∫判髱｢縺ｫ霑ｽ蜉縺吶ｋ縲・
				const trainElement = (function(cbango, type) {
					const cloneElement = $(expressElement).find("template")[0].content.cloneNode(true);
					$(cloneElement).find(".express-train-contents").attr("cbango", cbango);
					$(cloneElement).find(".express-train-contents").attr("type", type);
					$(expressElement).find(".express-train-list").append(cloneElement);
					return $(expressElement).find(".express-train-contents[cbango='" + cbango +"']");
				}(coreTrainInfo.cbango, coreTrainInfo.type));
				// 蛻苓ｻ雁錐繧定ｨｭ螳壹☆繧九・
				$(trainElement).find(".train-name").html(coreTrainInfo.name[lang]);
				// 驕玖｡檎憾豕√ｒ蜿門ｾ励☆繧九・
				const nowTrainInfo = nowData.trains.find(train => train.cbango === coreTrainInfo.cbango);
				if (nowTrainInfo) {
					// 襍ｰ陦瑚ｷｯ邱壹ｒ險ｭ螳壹☆繧九・					$(trainElement).attr("value", normalizeMergedRosen(nowTrainInfo.runRosen, coreTrainInfo.name[lang]));
					// 驕玖｡檎憾豕√ｒ險ｭ螳壹☆繧九・					$(trainElement).find(".unkou-label").text(getTrainChienText(nowTrainInfo));
					// 5蛻・ｻ･荳翫・驕・ｌ縺後≠繧句ｴ蜷医・縲・≦蟒ｶ譎ゅ・繧ｹ繧ｿ繧､繝ｫ繧帝←逕ｨ縺吶ｋ縲・
					if (nowTrainInfo.chien >= 5) {
						$(trainElement).find(".unkou-label").addClass("chien");
					}
				}
			});
			// 蠖楢ｩｲ諢帷ｧｰ蜷阪げ繝ｫ繝ｼ繝励↓螻槭☆繧狗音諤･蛻苓ｻ翫・繝ｪ繧ｹ繝医・菴懈・縺悟ｮ御ｺ・＠縺溘ｉ縲∝ｽ楢ｩｲ諢帷ｧｰ蜷阪げ繝ｫ繝ｼ繝励・蛻苓ｻ翫ユ繝ｳ繝励Ξ繝ｼ繝医ｒ蜑企勁縺吶ｋ縲・
			$(expressElement).find("template").remove();
		});
		// 縺吶∋縺ｦ縺ｮ迚ｹ諤･蛻苓ｻ翫・霑ｽ蜉縺悟ｮ御ｺ・＠縺溘ｉ縲∫音諤･諢帷ｧｰ蜷阪・繧ｰ繝ｫ繝ｼ繝怜腰菴阪・繝・Φ繝励Ξ繝ｼ繝医ｒ蜑企勁縺吶ｋ縲・
		$(expressListElement).find("template#expItemTemplate").remove();
		$(expressListElement).find(".exp-operation-list ul template").remove();
	}).fail(() => {
		var errormessage = `<h2 class='msg-bg'>${get_error_message()}</h2>`;
		$('#message').html(errormessage);
		$('#message').show();
	});
}

/**
 * 邨仙粋陦ｨ遉ｺ逕ｨ縺ｮ霍ｯ邱壹さ繝ｼ繝峨∈豁｣隕丞喧縺吶ｋ縲・ * @param runRosen 蛻苓ｻ企°陦梧ュ蝣ｱ縺ｮ霍ｯ邱壹さ繝ｼ繝峨・ * @param trainName 蛻苓ｻ雁錐縲・ * @return 驕ｷ遘ｻ蜈医→縺励※菴ｿ逕ｨ縺吶ｋ霍ｯ邱壹さ繝ｼ繝峨・ */
function normalizeMergedRosen(runRosen, trainName) {
	if (!runRosen) return runRosen;
	if (["51", "01", "05"].includes(runRosen)) return "51";
	if (["52", "07", "09"].includes(runRosen)) return "52";
	if (["53", "13"].includes(runRosen)) return "53";
	if (runRosen !== "02") return runRosen;

	const expressName = String(trainName || "").toLowerCase();
	if (/(縺翫♀縺槭ｉ|縺ｨ縺九■|oozora|tokachi)/.test(expressName)) return "53";
	if (/(蛹玲沫|縺吶★繧峨ｓ|hokuto|suzuran)/.test(expressName)) return "52";
	return "52";
}

/**
 * 蛻苓ｻ翫・驕・ｻｶ蛻・焚縺ｫ蟇ｾ蠢懊＠縺滓枚險繧貞叙蠕励☆繧九・ * @param trainNowInfo 蛻苓ｻ企°陦梧ュ蝣ｱ縲・
 * @return 蛻苓ｻ翫・驕・ｻｶ蛻・焚縺ｫ蟇ｾ蠢懊＠縺滓枚險縲・
 */
function getTrainChienText(trainNowInfo) {
	const CHIEN_LABEL_DELAYED_HOUR = { "ja": "{0}譎る俣驕・ｌ", "en": "{0} hour(s) late", "tc": "蟒ｶ驕ｲ{0}蟆乗凾", "sc": "蟒ｶ霑毬0}蟆乗慮", "kr": "{0}・懋ｰ・・・ｰ" };
	const CHIEN_LABEL_DELAYED_HR_MIN = { "ja": "{0}譎る俣{1}蛻・≦繧・, "en": "{0} hr {1} min late", "tc": "蟒ｶ驕ｲ{0}蟆乗凾{1}蛻・, "sc": "蟒ｶ霑毬0}蟆乗慮{1}蛻・, "kr": "{0}・懋ｰ・{1}・・・・ｰ" };
	const CHIEN_LABEL_DELAYED_MINUTES = { "ja": "{0}蛻・≦繧・, "en": "{0} minutes late", "tc": "蟒ｶ驕ｲ{0}蛻・, "sc": "蟒ｶ霑毬0}蛻・, "kr": "{0}・・・・ｰ" };
	const CHIEN_LABEL_VERY_LATE = { "ja": "螟ｧ蟷・≦繧・, "en": "Very late", "tc": "螟ｧ蟷・ｻｶ驕ｲ", "sc": "螟ｧ蟷・ｻｶ霑・, "kr": "・尞ｭ ・・ｰ" };
	const CHIEN_LABEL_RUNNING = { "ja": "襍ｰ陦御ｸｭ", "en": "Running", "tc": "陦碁ｧ帑ｸｭ", "sc": "陦碁ｩｶ荳ｭ", "kr": "・ｼ嵂・・・ };
	const lang = document.documentElement.dataset.lang;
	if (trainNowInfo.runStatus === 0) {
		// 襍ｰ陦檎ｵゆｺ・・蝣ｴ蜷医・陦ｨ遉ｺ縺ｪ縺励・
		return "";
	}
	if (typeof trainNowInfo.chien !== "number") {
		// 謨ｰ蛟､莉･螟悶′蜈･縺｣縺ｦ縺・ｋ蝣ｴ蜷医・陦ｨ遉ｺ縺ｪ縺励・
		return ""
	}
	if (trainNowInfo.status === 0) {
		// 蜈ｨ蛹ｺ髢馴°莨代・蝣ｴ蜷医・陦ｨ遉ｺ縺ｪ縺励・
		return ""
	}
	if (trainNowInfo.chien < 1) {
		// 驕・ｌ縺・蛻・悴貅縺ｧ襍ｰ陦御ｸｭ縺ｮ蝣ｴ蜷医・・｢襍ｰ陦御ｸｭ・｣縲・
		return trainNowInfo.runStatus === 1 ? CHIEN_LABEL_RUNNING[lang] : "";
	} else if (trainNowInfo.chien < 999) {
		// 驕・ｌ縺・蛻・ｻ･荳・00蛻・悴貅縺ｮ蝣ｴ蜷医・譎ょ・陦ｨ遉ｺ縲・
		let chienHour = Math.floor(trainNowInfo.chien / 60);
		let chienMin = trainNowInfo.chien % 60;
		if (chienHour > 0){
			if (chienMin > 0) return CHIEN_LABEL_DELAYED_HR_MIN[lang].replace("{0}", chienHour).replace("{1}", chienMin); // 縲後・凾髢薙・・驕・ｌ縲・
			else return CHIEN_LABEL_DELAYED_HOUR[lang].replace("{0}",chienHour); // 縲後・凾髢馴≦繧後・
		} else {
			return CHIEN_LABEL_DELAYED_MINUTES[lang].replace("{0}", chienMin); // 縲後・・驕・ｌ縲・
		}
	} else {
		// 驕・ｌ縺・00蛻・ｻ･荳翫・蝣ｴ蜷医・・｢螟ｧ蟷・≦繧鯉ｽ｣縲・
		return CHIEN_LABEL_VERY_LATE[lang];
	}
}

/*
 * 繝ｭ繝ｼ繝・ぅ繝ｳ繧ｰ繧｢繝九Γ繝ｼ繧ｷ繝ｧ繝ｳ繧帝撼陦ｨ遉ｺ
 */

function loading_animation_hidden() {
	$('.loader').fadeOut("fast");
	if($("#oshiraseDetail").css('display') == 'none'){ // 縺顔衍繧峨○繝繧､繧｢繝ｭ繧ｰ縺瑚｡ｨ遉ｺ縺輔ｌ縺ｦ縺・◆繧牙濠騾乗・縺ｮ閭梧勹縺ｯ豸医＆縺ｪ縺・
		$('#loaderBg').fadeOut("fast");
	}
}

/*
 * 繝ｭ繝ｼ繝・ぅ繝ｳ繧ｰ繧｢繝九Γ繝ｼ繧ｷ繝ｧ繝ｳ繧定｡ｨ遉ｺ
 */
function loading_animation_display() {
	$('.loader').fadeIn("fast");
	$('#loaderBg').fadeIn("fast");
	$('#loaderBg').css("display", "flex");
}

/*
 * 蛻苓ｻ願ｵｰ陦御ｽ咲ｽｮ逕ｨ縲霍ｯ邱壹い繧､繧ｳ繝ｳ菴懈・
 */
function get_rosen_eki_icon(paramKigo) {

	var html_icon = ""
	let kigo = paramKigo ? paramKigo : "";

	html_icon += "<span class='eki-icon icon-" + kigo +" kigo-bg'>";
	html_icon += "<span class='kigo'>" + kigo + "</span>";
	html_icon += "</span>";

	return html_icon
}

/*
 * 迴ｾ蝨ｨ譌･莉倩｡ｨ遉ｺ
 */
function setTimestamp(nowData) {
	const lang = document.documentElement.dataset.lang;
	const timestamp = nowData.time[lang];
	if (timestamp) {
		if ($("#timestamp").length) {
			// 繝倥ャ繝繝ｼ縺瑚ｪｭ縺ｿ霎ｼ縺ｿ貂医∩縺ｧ縺ゅｌ縺ｰ縲∫樟蝨ｨ譌･譎ゅｒ逶ｴ謗･蝓九ａ霎ｼ縺ｿ縺吶ｋ縲・
			$("#timestamp").text(timestamp);
		} else {
			// 繝倥ャ繝繝ｼ繧定ｪｭ縺ｿ霎ｼ縺ｿ荳ｭ縺ｮ蝣ｴ蜷医・縲‥ata 螻樊ｧ縺ｫ蛟､繧定ｨｭ螳壹☆繧九ゑｼ医・繝・ム繝ｼ縺ｮ隱ｭ縺ｿ霎ｼ縺ｿ蠕後↓縲‥ata 螻樊ｧ縺九ｉ蛟､繧貞叙蠕励＠縺ｦ陦ｨ遉ｺ縺吶ｋ・・
			$("header").data("timestamp", timestamp);
		}
	}
}

/*
 * 繧ｵ繧､繝峨Γ繝九Η繝ｼ險ｭ螳・
 */
function set_side_menu(_isTop) {
	let lang = document.documentElement.dataset.lang;
	let windowWidth = window.innerWidth;
	if (lang == "ja") {
		// 譌･譛ｬ隱槭・蝣ｴ蜷医∫判髱｢繧ｵ繧､繧ｺ縺ｫ蜷医ｏ縺帙※謾ｹ陦後ｒ險ｭ螳・
		// 縺吶★繧峨ｓ
		if ((windowWidth < 440 || 1000 < windowWidth) || !_isTop) {
			$("#expTab div[data-key='2'] .train-name").each(function(i, row) {
				if (row.innerHTML.indexOf("<br>") == -1) {
					row.innerHTML = row.innerHTML.replace("]・・, "]<br>・・);
				}
			});
		} else {
			$("#expTab div[data-key='2'] .train-name").each(function(i, row) {
				row.innerHTML = row.innerHTML.replace("<br>", "");
			});
		}

		// 繧ｵ繝ｭ繝吶ヤ縲√が繝帙・繝・け
		if ((windowWidth < 420 || 1000 < windowWidth) || !_isTop) {
			$("#expTab div[data-key='8'] .train-name").each(function(i, row) {
				if (row.innerHTML.indexOf("<br>") == -1) {
					row.innerHTML = row.innerHTML.replace("縲", "縲<br>");
				}
			});
			$("#expTab div[data-key='9'] .train-name").each(function(i, row) {
				if (row.innerHTML.indexOf("<br>") == -1) {
					row.innerHTML = row.innerHTML.replace("縲", "縲<br>");
				}
			});
		} else {
			$("#expTab div[data-key='8'] .train-name").each(function(i, row) {
				row.innerHTML = row.innerHTML.replace("<br>", "");
			});
			$("#expTab div[data-key='9'] .train-name").each(function(i, row) {
				row.innerHTML = row.innerHTML.replace("<br>", "");
			});
		}

		// 蜃ｽ鬢ｨ邱・貂｡蟲ｶ遐ょ次邨檎罰)
		if ($('.rosen-name-contents[value="10"] .chien').length > 0) {
			if ((windowWidth < 350 || 1000 < windowWidth) || !_isTop) {
				if ($("#localTab div[value='10'] .main").html().indexOf("<br>") == -1) {
					$("#localTab div[value='10'] .main").html($("#localTab div[value='10'] .main").html().replace("(", "<br>("));
				}
			} else {
				$("#localTab div[value='10'] .main").html($("#localTab div[value='10'] .main").html().replace("<br>", ""));
			}
		}
	} else if (lang == "en") {
		// 闍ｱ隱槭・蝣ｴ蜷医∫判髱｢繧ｵ繧､繧ｺ縺ｫ蜷医ｏ縺帙※謾ｹ陦後ｒ險ｭ螳・
		// 蜃ｽ鬢ｨ邱・貂｡蟲ｶ遐ょ次邨檎罰)
		if ((windowWidth < 420 || 1000 < windowWidth) || !_isTop) {
			if ($("#localTab div[value='10'] .main").html().indexOf("<br>") == -1) {
				$("#localTab div[value='10'] .main").html($("#localTab div[value='10'] .main").html().replace("(", "<br>("));
			}
		} else {
			$("#localTab div[value='10'] .main").html($("#localTab div[value='10'] .main").html().replace("<br>", ""));
		}

		// 遏ｳ蜍晉ｷ壹・譬ｹ螳､邱夲ｼ丞圏豬ｷ驕捺眠蟷ｹ邱・
		if ((windowWidth < 370 || 1000 < windowWidth) || !_isTop) {
			if ($("#localTab div[value='13'] .main").html().indexOf("<br>") == -1) {
				$("#localTab div[value='13'] .main").html($("#localTab div[value='13'] .main").html().replace("/", "/<br>"));
			}
			if ($("#localTab div[value='15'] .main").html().indexOf("<br>") == -1) {
				$("#localTab div[value='15'] .main").html($("#localTab div[value='15'] .main").html().replace(" ", " <br>"));
			}
		} else {
			$("#localTab div[value='13'] .main").html($("#localTab div[value='13'] .main").html().replace("<br>", ""));
			$("#localTab div[value='15'] .main").html($("#localTab div[value='15'] .main").html().replace("<br>", " "));
		}
	} else if (lang == "tc" || lang == "sc") {
		// 郢∽ｽ灘ｭ励・邁｡菴灘ｭ励・蝣ｴ蜷医∫判髱｢繧ｵ繧､繧ｺ縺ｫ蜷医ｏ縺帙※謾ｹ陦後ｒ險ｭ螳・
		if ($('.rosen-name-contents[value="10"] .chien').length > 0) {
			if ((windowWidth < 350 || 1000 < windowWidth) || !_isTop) {
			if ($("#localTab div[value='10'] .main").html().indexOf("<br>") == -1) {
				$("#localTab div[value='10'] .main").html($("#localTab div[value='10'] .main").html().replace("(", "<br>("));
			}
		} else {
			$("#localTab div[value='10'] .main").html($("#localTab div[value='10'] .main").html().replace("<br>", ""));
		}
		}
	} else if (lang == "kr") {
		// 髻灘嵜隱槭・蝣ｴ蜷医↓莉･荳九・霍ｯ邱壹〒謾ｹ陦後ｒ蜈･繧後ｋ
		// 郢∽ｽ灘ｭ励・邁｡菴灘ｭ励・蝣ｴ蜷医∫判髱｢繧ｵ繧､繧ｺ縺ｫ蜷医ｏ縺帙※謾ｹ陦後ｒ險ｭ螳・
		// 蜊・ｭｳ邱喙譛ｭ蟷鯉ｽ樊眠蜊・ｭｳ遨ｺ貂ｯ繝ｻ闍ｫ蟆冗鴬髢転
		if ((windowWidth < 335 || 1000 < windowWidth) || !_isTop) {
			if ($("#localTab div[value='02'] .sub").html().indexOf("<br>") == -1) {
				$("#localTab div[value='02'] .sub").html($("#localTab div[value='02'] .sub").html().replace("繝ｻ", "繝ｻ<br>"));
			}
		} else {
			$("#localTab div[value='02'] .sub").html($("#localTab div[value='02'] .sub").html().replace("<br>", ""));
		}

		// 蜃ｽ鬢ｨ邱・貂｡蟲ｶ遐ょ次邨檎罰)
		if ($('.rosen-name-contents[value="10"] .chien').length > 0) {
			if ((windowWidth < 385 || 1000 < windowWidth) || !_isTop) {
			if ($("#localTab div[value='10'] .main").html().indexOf("<br>") == -1) {
				$("#localTab div[value='10'] .main").html($("#localTab div[value='10'] .main").html().replace("(", "<br>("));
			}
		} else {
			$("#localTab div[value='10'] .main").html($("#localTab div[value='10'] .main").html().replace("<br>", ""));
			}
		}

		// 蛹玲ｵｷ驕捺眠蟷ｹ邱喙譁ｰ蜃ｽ鬢ｨ蛹玲沫・槫･･豢･霆ｽ縺・∪縺ｹ縺､髢転
		if ((windowWidth < 370 || 1000 < windowWidth) || !_isTop) {
			if ($("#localTab div[value='15'] .sub").html().indexOf("<br>") == -1) {
				$("#localTab div[value='15'] .sub").html($("#localTab div[value='15'] .sub").html().replace("・・, "・・br>"));
			}
		} else {
			$("#localTab div[value='15'] .sub").html($("#localTab div[value='15'] .sub").html().replace("<br>", ""));
		}
	}
}
