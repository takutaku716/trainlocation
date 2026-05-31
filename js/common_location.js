function is_test_mode() {
	const params = new URLSearchParams(location.search);
	return params.get("test") === "1";
}

function get_test_scenario() {
	if (!is_test_mode()) return "";
	const params = new URLSearchParams(location.search);
	return params.get("scenario") || "default";
}

function get_test_mode_search() {
	if (!is_test_mode()) return "";
	const params = new URLSearchParams();
	params.set("test", "1");
	const scenario = get_test_scenario();
	if (scenario && scenario !== "default") params.set("scenario", scenario);
	return "?" + params.toString();
}

function build_page_url(_path, _hash) {
	return _path + get_test_mode_search() + (_hash ? "#" + _hash : "");
}

function get_test_urls(_relativePath) {
	const scenario = get_test_scenario();
	const urls = [];
	if (scenario && scenario !== "default") {
		urls.push("./testdata/" + scenario + "/" + _relativePath);
	}
	urls.push("./testdata/" + _relativePath);
	return urls;
}

function get_testable_json_request(_testUrl, _remoteUrl) {
	if (!is_test_mode()) return $.getJSON(_remoteUrl);

	const testUrls = Array.isArray(_testUrl) ? _testUrl : [_testUrl];
	const deferred = $.Deferred();

	function requestTestUrl(index) {
		if (index >= testUrls.length) {
			$.getJSON(_remoteUrl)
				.done((data) => deferred.resolve(data))
				.fail((jqXHR, textStatus, errorThrown) => deferred.reject(jqXHR, textStatus, errorThrown));
			return;
		}
		$.getJSON(testUrls[index])
			.done((data) => deferred.resolve(data))
			.fail(() => requestTestUrl(index + 1));
	}

	requestTestUrl(0);
	return deferred.promise();
}

function get_location_now_request(_rosen, _now) {
	const testUrl = get_test_urls("location/location_" + _rosen + "_now.json?" + _now);
	const remoteUrl = "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/trainlocation/json/location/now/location_" + _rosen + "_now.json?" + _now;
	return get_testable_json_request(testUrl, remoteUrl);
}

function get_express_now_request(_now) {
	const testUrl = get_test_urls("express/express_now.json?" + _now);
	const remoteUrl = "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/trainlocation/json/express/now/express_now.json?" + _now;
	return get_testable_json_request(testUrl, remoteUrl);
}

function get_express_core_request(_now) {
	const testUrl = get_test_urls("express/express_core.json?" + _now);
	const remoteUrl = "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/trainlocation/json/express/core/express_core.json?" + _now;
	return get_testable_json_request(testUrl, remoteUrl);
}

function get_daiya_request(_senku, _lang, _now) {
	const suffix = _lang === "ja" ? "" : "_" + _lang;
	const testUrl = get_test_urls("daiya/daiya_" + _senku + suffix + ".json?" + _now);
	const remoteUrl = "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/daiya/daiya_" + _senku + suffix + ".json?" + _now;
	return get_testable_json_request(testUrl, remoteUrl);
}

function get_rosen_now_request(_now) {
	const testUrl = get_test_urls("rosen/rosen_now.json?" + _now);
	const remoteUrl = "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/trainlocation/json/rosen/now/rosen_now.json?" + _now;
	return get_testable_json_request(testUrl, remoteUrl);
}

function get_dokotre_delay_section_request(_now) {
	const testUrl = get_test_urls("dokotre/delay_section.json?" + _now);
	const remoteUrl = "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://doko-train.jp/json/trainstatus/delay_section.json?" + _now;
	return get_testable_json_request(testUrl, remoteUrl);
}

function get_optional_dokotre_delay_section_request(_now) {
	const deferred = $.Deferred();
	get_dokotre_delay_section_request(_now)
		.done((data) => deferred.resolve(data))
		.fail(() => deferred.resolve(null));
	return deferred.promise();
}

/*
 * サイドメニュー　各路線の遅延情報の設定
 */
function set_side_area_chien() {
	let now = Date.now() >>> 10;
	const mergedRosenMap = {
		"51": ["01", "05"],
		"52": ["02", "07", "09"],
		"53": ["02", "13"]
	};
	const dokotreDelaySectionMap = {
		"57": ["90211", "90212", "90213", "902Y"],
		"58": ["110A", "1101", "1102", "90221", "90222"]
	};
	// エリア名を取得
	$.when(
		get_rosen_now_request(now),
		get_optional_dokotre_delay_section_request(now)
	)
	.done(function(nowdataBase, dokotreDelayDataBase) {
		const nowdata = get_json_data_from_jquery_when_result(nowdataBase);
		const dokotreDelayData = get_json_data_from_jquery_when_result(dokotreDelayDataBase);
		// 現在日付表示
		function setTimestamp(nowdata) {
			const now = new Date();
			const formatted =
				now.getFullYear() + "年" +
				(now.getMonth() + 1).toString().padStart(2, "0") + "月" +
				now.getDate().toString().padStart(2, "0") + "日" +
				now.getHours().toString().padStart(2, "0") + "時" +
				now.getMinutes().toString().padStart(2, "0") + "分" +
				now.getSeconds().toString().padStart(2, "0") + "秒現在";

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
			if (typeof nowStatus === "undefined" && dokotreDelaySectionMap[rosenValue]) {
				nowStatus = getDokotreDelaySectionStatus(dokotreDelayData, dokotreDelaySectionMap[rosenValue]);
			}
			if (typeof nowStatus !== "undefined") {
				// 遅延情報の表示
				const chienText = getRosenChienText(nowStatus);
				if (chienText) {
					$(row).addClass("has-chien");
					$(row).append(chienText);
				}
			}
		});
		// firefox用に適用しているmargin-rightを遅延文言がない場合無効にする。
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

	function getDokotreDelaySectionStatus(delayData, sectionIds) {
		const sections = delayData && delayData.current_hour && delayData.current_hour.sections ? delayData.current_hour.sections : null;
		if (!sections) return undefined;
		const maxChien = sectionIds.reduce((maxValue, sectionId) => {
			const value = normalizeSideChienMinutes(sections[sectionId]);
			return value > maxValue ? value : maxValue;
		}, 0);
		return { maxChien: maxChien };
	}

	function normalizeSideChienMinutes(value) {
		const minutes = Number(value || 0);
		if (!Number.isFinite(minutes) || minutes < 0) return 0;
		return minutes;
	}
}

function get_json_data_from_jquery_when_result(_result) {
	if (Array.isArray(_result) && typeof _result[1] === "string") return _result[0];
	return _result;
}

/**
 * 各路線の遅延分数に対応した文言を取得する。
 */
function getRosenChienText(_nowStatus) {
	const CHIEN_LABEL_DELAYED_HOUR = { "ja": "最大{0}時間遅れ", "en": "Delayed for <br>{0} hour(s) or less", "tc": "最長延遲{0}小時鐘", "sc": "最长延迟{0}小时钟", "kr": "최대 {0}시간 지연" };
	const CHIEN_LABEL_DELAYED_HR_MIN = { "ja": "最大{0}時間{1}分遅れ", "en": "Delayed for <br>{0} hr {1} min or less", "tc": "最長延遲{0}小時{1}分鐘", "sc": "最长延迟{0}小时{1}分钟", "kr": "최대 {0}시간 {1}분 지연" };
	const CHIEN_LABEL_DELAYED_MINUTES = { "ja": "最大{0}分遅れ", "en": "Delayed for <br>{0} minutes or less", "tc": "最長延遲{0}分鐘", "sc": "最长延迟{0}分钟", "kr": "최대 {0}분 지연" };
	const CHIEN_LABEL_VERY_LATE = { "ja": "大幅な遅れあり", "en": "Very late", "tc": "大幅延遲", "sc": "大幅延迟", "kr": "대폭 지연 있음" };
	const lang = document.documentElement.dataset.lang;
	const maxChien = Number(_nowStatus.maxChien || 0);

	if (maxChien < 1) { // 平常運転の場合は何も表示しない
		return "";
	} else if (maxChien >= 999) { // 100分以上なら「大幅な遅れあり」
		return `<span class="unkou-label chien very-late">${CHIEN_LABEL_VERY_LATE[lang]}</span>`;
	} else {
		// 遅れ時分表示
		let chienHour = Math.floor(maxChien / 60);
		let chienMin = maxChien % 60;
		if (chienHour > 0){
			if (chienMin > 0) return `<span class="unkou-label chien">${CHIEN_LABEL_DELAYED_HR_MIN[lang].replace("{0}", chienHour).replace("{1}", chienMin)}</span>`; // 「最大〇時間〇分遅れ」
			else return `<span class="unkou-label chien">${CHIEN_LABEL_DELAYED_HOUR[lang].replace("{0}",chienHour)}</span>`; // 「最大〇時間遅れ」
		} else {
			return `<span class="unkou-label chien">${CHIEN_LABEL_DELAYED_MINUTES[lang].replace("{0}", chienMin)}</span>`; // 「最大〇分遅れ」
		}
	}
}

/**
 * サイドメニュー　各特急列車ボタンの作成
 * @param onLabelClickEvent 特急愛称名のラベルをクリックしたときに実行する処理を記述した関数。
 */
function createSideExpressList(onLabelClickEvent) {
	const lang = document.documentElement.dataset.lang;
	// マスタファイル用のキャッシュバスター値を生成する。(UNIX元期からの経過ミリ秒数を右に16ビットシフトした値。2の16乗＝65536ミリ秒≒約1分間隔でキャッシュを無効化する)
	const mstNow = Date.now() >>> 16;
	// トランファイル用のキャッシュバスター値を生成する。(UNIX元期からの経過ミリ秒数を右に10ビットシフトした値。2の10乗＝1024ミリ秒間隔でキャッシュを無効化する)
	const trnNow = Date.now() >>> 10;
	// 特急列車に関する情報を読み込んで、特急列車リストを描画する。
	$.when(
		$.getJSON("https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/master/express_master.json?" + mstNow),
		get_express_core_request(mstNow),
		get_express_now_request(trnNow)
	)
	.done((expressMasterBase, coreDataBase, nowDataBase) => {
		const expressMaster = expressMasterBase[0];
		const coreData = coreDataBase[0];
		const nowData = nowDataBase[0];
		// 特急愛称名のグループ単位に、特急列車を順番に画面に追加する。
		const expressListElement = $("#expTab");
		expressMaster.forEach(express => {
			// 当日の走行列車のリストを取得する。
			const coreTrains = coreData.expresses.find(trains => trains.key === express.key);
			// 当日の走行列車がない場合は、処理終了する。
			if (!coreTrains || !coreTrains.trains || coreTrains.trains.length === 0) return;

			// 特急列車のテンプレートを取得して、画面に追加する。
			const expressElement = (function(key) {
				const cloneElement = $(expressListElement).find("template#expItemTemplate")[0].content.cloneNode(true);
				$(cloneElement).find(".area-contents").attr("data-key", key);
				$(expressListElement).append(cloneElement);
				return $(expressListElement).find(".area-contents[data-key='" + key +"']");
			}(express.key));
			// 愛称名を設定する。
			$(expressElement).find(".express-name-label .main").text(express.name[lang]);
			// 区間名を設定する。
			$(expressElement).find(".express-name-label .sub").text(express.kukanText[lang]);
			// ラベルクリック時の処理イベントを追加する。
			if (onLabelClickEvent) {
				$(expressElement).find(".express-name-label").on("click", {"kukanList": express.kukanList}, onLabelClickEvent);
			}

			// スマホモードの特急愛称名ボタンを追加する。
			if ($(expressListElement).find(".exp-operation-list").length) {
				// テンプレートを取得して画面に追加する。
				const spExpressElement = (function(key) {
					const cloneElement =$(expressListElement).find(".exp-operation-list ul template")[0].content.cloneNode(true);
					$(cloneElement).find(".sp-express-item").attr("data-key", key);
					$(expressListElement).find(".exp-operation-list ul").append(cloneElement);
					return $(expressListElement).find(".exp-operation-list ul li[data-key='" + key +"']");
				}(express.key));
				// 愛称名を設定する。
				$(spExpressElement).find(".sp-express-name-label .main").text(express.name[lang]);
				// 区間名を設定する。
				$(spExpressElement).find(".sp-express-name-label .sub").text(express.kukanText[lang]);
				// ラベルキーを設定する。
				$(spExpressElement).find("input").attr("id", "exp" + express.key);
				$(spExpressElement).find("label").attr("for", "exp" + express.key);
			}

			// 当該愛称名グループに属する特急列車のリストを作成する。
			coreTrains.trains.forEach(coreTrainInfo => {
				// 列車のテンプレートを取得して、画面に追加する。
				const trainElement = (function(cbango, type) {
					const cloneElement = $(expressElement).find("template")[0].content.cloneNode(true);
					$(cloneElement).find(".express-train-contents").attr("cbango", cbango);
					$(cloneElement).find(".express-train-contents").attr("type", type);
					$(expressElement).find(".express-train-list").append(cloneElement);
					return $(expressElement).find(".express-train-contents[cbango='" + cbango +"']");
				}(coreTrainInfo.cbango, coreTrainInfo.type));
				// 列車名を設定する。
				$(trainElement).find(".train-name").html(coreTrainInfo.name[lang]);
				// 運行状況を取得する。
				const nowTrainInfo = nowData.trains.find(train => train.cbango === coreTrainInfo.cbango);
				if (nowTrainInfo) {
					// 走行路線を設定する。
					$(trainElement).attr("value", normalizeMergedRosen(nowTrainInfo.runRosen, coreTrainInfo.name[lang]));
					// 運行状況を設定する。
					$(trainElement).find(".unkou-label").text(getTrainChienText(nowTrainInfo));
					// 5分以上の遅れがある場合は、遅延時のスタイルを適用する。
					if (nowTrainInfo.chien >= 5) {
						$(trainElement).find(".unkou-label").addClass("chien");
					}
				}
			});
			// 当該愛称名グループに属する特急列車のリストの作成が完了したら、当該愛称名グループの列車テンプレートを削除する。
			$(expressElement).find("template").remove();
		});
		// すべての特急列車の追加が完了したら、特急愛称名のグループ単位のテンプレートを削除する。
		$(expressListElement).find("template#expItemTemplate").remove();
		$(expressListElement).find(".exp-operation-list ul template").remove();
	}).fail(() => {
		var errormessage = `<h2 class='msg-bg'>${get_error_message()}</h2>`;
		$('#message').html(errormessage);
		$('#message').show();
	});
}

/**
 * 結合表示用の路線コードへ正規化する。
 * @param runRosen 列車運行情報の路線コード。
 * @param trainName 列車名。
 * @return 遷移先として使用する路線コード。
 */
function normalizeMergedRosen(runRosen, trainName) {
	if (!runRosen) return runRosen;
	if (["51", "01", "05"].includes(runRosen)) return "51";
	if (["52", "07", "09"].includes(runRosen)) return "52";
	if (["53", "13"].includes(runRosen)) return "53";
	if (runRosen !== "02") return runRosen;

	const expressName = String(trainName || "").toLowerCase();
	if (/(おおぞら|とかち|oozora|tokachi)/.test(expressName)) return "53";
	if (/(北斗|すずらん|hokuto|suzuran)/.test(expressName)) return "52";
	return "52";
}

/**
 * 列車の遅延分数に対応した文言を取得する。
 * @param trainNowInfo 列車運行情報。
 * @return 列車の遅延分数に対応した文言。
 */
function getTrainChienText(trainNowInfo) {
	const CHIEN_LABEL_DELAYED_HOUR = { "ja": "{0}時間遅れ", "en": "{0} hour(s) late", "tc": "延遲{0}小時", "sc": "延迟{0}小时", "kr": "{0}시간 지연" };
	const CHIEN_LABEL_DELAYED_HR_MIN = { "ja": "{0}時間{1}分遅れ", "en": "{0} hr {1} min late", "tc": "延遲{0}小時{1}分", "sc": "延迟{0}小时{1}分", "kr": "{0}시간 {1}분 지연" };
	const CHIEN_LABEL_DELAYED_MINUTES = { "ja": "{0}分遅れ", "en": "{0} minutes late", "tc": "延遲{0}分", "sc": "延迟{0}分", "kr": "{0}분 지연" };
	const CHIEN_LABEL_VERY_LATE = { "ja": "大幅遅れ", "en": "Very late", "tc": "大幅延遲", "sc": "大幅延迟", "kr": "대폭 지연" };
	const CHIEN_LABEL_RUNNING = { "ja": "走行中", "en": "Running", "tc": "行駛中", "sc": "行驶中", "kr": "주행 중" };
	const lang = document.documentElement.dataset.lang;
	if (trainNowInfo.runStatus === 0) {
		// 走行終了の場合は表示なし。
		return "";
	}
	if (typeof trainNowInfo.chien !== "number") {
		// 数値以外が入っている場合は表示なし。
		return ""
	}
	if (trainNowInfo.status === 0) {
		// 全区間運休の場合は表示なし。
		return ""
	}
	if (trainNowInfo.chien < 1) {
		// 遅れが5分未満で走行中の場合は｢走行中｣。
		return trainNowInfo.runStatus === 1 ? CHIEN_LABEL_RUNNING[lang] : "";
	} else if (trainNowInfo.chien < 999) {
		// 遅れが5分以上100分未満の場合は時分表示。
		let chienHour = Math.floor(trainNowInfo.chien / 60);
		let chienMin = trainNowInfo.chien % 60;
		if (chienHour > 0){
			if (chienMin > 0) return CHIEN_LABEL_DELAYED_HR_MIN[lang].replace("{0}", chienHour).replace("{1}", chienMin); // 「〇時間〇分遅れ」
			else return CHIEN_LABEL_DELAYED_HOUR[lang].replace("{0}",chienHour); // 「〇時間遅れ」
		} else {
			return CHIEN_LABEL_DELAYED_MINUTES[lang].replace("{0}", chienMin); // 「〇分遅れ」
		}
	} else {
		// 遅れが100分以上の場合は｢大幅遅れ｣。
		return CHIEN_LABEL_VERY_LATE[lang];
	}
}

/*
 * ローディングアニメーションを非表示
 */

function loading_animation_hidden() {
	$('.loader').fadeOut("fast");
	if($("#oshiraseDetail").css('display') == 'none'){ // お知らせダイアログが表示されていたら半透明の背景は消さない
		$('#loaderBg').fadeOut("fast");
	}
}

/*
 * ローディングアニメーションを表示
 */
function loading_animation_display() {
	$('.loader').fadeIn("fast");
	$('#loaderBg').fadeIn("fast");
	$('#loaderBg').css("display", "flex");
}

/*
 * 列車走行位置用　路線アイコン作成
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
 * 現在日付表示
 */
function setTimestamp(nowData) {
	const lang = document.documentElement.dataset.lang;
	const timestamp = nowData.time[lang];
	if (timestamp) {
		if ($("#timestamp").length) {
			// ヘッダーが読み込み済みであれば、現在日時を直接埋め込みする。
			$("#timestamp").text(timestamp);
		} else {
			// ヘッダーを読み込み中の場合は、data 属性に値を設定する。（ヘッダーの読み込み後に、data 属性から値を取得して表示する）
			$("header").data("timestamp", timestamp);
		}
	}
}

/*
 * サイドメニュー設定
 */
function set_side_menu(_isTop) {
	let lang = document.documentElement.dataset.lang;
	let windowWidth = window.innerWidth;
	if (lang == "ja") {
		// 日本語の場合、画面サイズに合わせて改行を設定
		// すずらん
		if ((windowWidth < 440 || 1000 < windowWidth) || !_isTop) {
			$("#expTab div[data-key='2'] .train-name").each(function(i, row) {
				if (row.innerHTML.indexOf("<br>") == -1) {
					row.innerHTML = row.innerHTML.replace("]（", "]<br>（");
				}
			});
		} else {
			$("#expTab div[data-key='2'] .train-name").each(function(i, row) {
				row.innerHTML = row.innerHTML.replace("<br>", "");
			});
		}

		// サロベツ、オホーツク
		if ((windowWidth < 420 || 1000 < windowWidth) || !_isTop) {
			$("#expTab div[data-key='8'] .train-name").each(function(i, row) {
				if (row.innerHTML.indexOf("<br>") == -1) {
					row.innerHTML = row.innerHTML.replace("　", "　<br>");
				}
			});
			$("#expTab div[data-key='9'] .train-name").each(function(i, row) {
				if (row.innerHTML.indexOf("<br>") == -1) {
					row.innerHTML = row.innerHTML.replace("　", "　<br>");
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

		// 函館線(渡島砂原経由)
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
		// 英語の場合、画面サイズに合わせて改行を設定
		// 函館線(渡島砂原経由)
		if ((windowWidth < 420 || 1000 < windowWidth) || !_isTop) {
			if ($("#localTab div[value='10'] .main").html().indexOf("<br>") == -1) {
				$("#localTab div[value='10'] .main").html($("#localTab div[value='10'] .main").html().replace("(", "<br>("));
			}
		} else {
			$("#localTab div[value='10'] .main").html($("#localTab div[value='10'] .main").html().replace("<br>", ""));
		}

		// 石勝線・根室線／北海道新幹線
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
		// 繁体字・簡体字の場合、画面サイズに合わせて改行を設定
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
		// 韓国語の場合に以下の路線で改行を入れる
		// 繁体字・簡体字の場合、画面サイズに合わせて改行を設定
		// 千歳線[札幌～新千歳空港・苫小牧間]
		if ((windowWidth < 335 || 1000 < windowWidth) || !_isTop) {
			if ($("#localTab div[value='02'] .sub").html().indexOf("<br>") == -1) {
				$("#localTab div[value='02'] .sub").html($("#localTab div[value='02'] .sub").html().replace("・", "・<br>"));
			}
		} else {
			$("#localTab div[value='02'] .sub").html($("#localTab div[value='02'] .sub").html().replace("<br>", ""));
		}

		// 函館線(渡島砂原経由)
		if ($('.rosen-name-contents[value="10"] .chien').length > 0) {
			if ((windowWidth < 385 || 1000 < windowWidth) || !_isTop) {
			if ($("#localTab div[value='10'] .main").html().indexOf("<br>") == -1) {
				$("#localTab div[value='10'] .main").html($("#localTab div[value='10'] .main").html().replace("(", "<br>("));
			}
		} else {
			$("#localTab div[value='10'] .main").html($("#localTab div[value='10'] .main").html().replace("<br>", ""));
			}
		}

		// 北海道新幹線[新函館北斗～奥津軽いまべつ間]
		if ((windowWidth < 370 || 1000 < windowWidth) || !_isTop) {
			if ($("#localTab div[value='15'] .sub").html().indexOf("<br>") == -1) {
				$("#localTab div[value='15'] .sub").html($("#localTab div[value='15'] .sub").html().replace("～", "～<br>"));
			}
		} else {
			$("#localTab div[value='15'] .sub").html($("#localTab div[value='15'] .sub").html().replace("<br>", ""));
		}
	}
}
