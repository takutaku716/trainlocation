const TRAIN_LIST_DISPLAY_ROSENS = ["51", "52", "53", "03", "04", "06", "08", "10", "11", "12", "14", "15"];
const TRAIN_LIST_SOURCE_MAP = {
	"51": ["01", "05"],
	"52": ["02", "07", "09"],
	"53": ["02", "13"]
};
const TRAIN_LIST_DEFAULT_ROSEN = "51";
const TRAIN_LIST_AUTO_REFRESH_INTERVAL = 15000;
const LOCATION_AUTO_REFRESH_ENABLED_KEY = "location_auto_refresh_enabled";
const LOCATION_AUTO_REFRESH_INTERVAL_KEY = "location_auto_refresh_interval";
const LOCATION_SLEEP_PREVENT_ENABLED_KEY = "location_sleep_prevent_enabled";

let trainListRosenMaster = [];
let trainListLocationMaster = {};
let trainListAutoRefreshTimer = null;
let trainListCommMarkTimer = null;
let trainListPreservedScrollTop = null;
let trainListAutoRefreshEnabled = true;
let trainListAutoRefreshInterval = TRAIN_LIST_AUTO_REFRESH_INTERVAL;
let trainListSleepPreventEnabled = false;
let trainListWakeLock = null;

window.onload = function() {
	load_train_list_page();
	document.addEventListener("visibilitychange", function() {
		if (document.hidden) {
			release_train_list_wake_lock();
			stop_train_list_auto_refresh();
		} else {
			update_train_list_wake_lock();
			render_train_list_page();
		}
	});
	document.addEventListener("click", handle_train_list_wake_lock_user_activation);
};

window.onhashchange = function() {
	render_train_list_page();
};

function load_train_list_page() {
	const mstNow = Date.now() >>> 16;

	load_train_list_auto_refresh_settings();
	initialize_train_list_refresh_setting();

	$("#loaderBg").fadeIn("fast").css("display", "flex");

	$.when(
		$.getJSON("./master/rosen_name_master.json?" + mstNow),
		$.getJSON("./original/location_master.json?" + mstNow)
	)
	.done(function(rosenMasterBase, locationMasterBase) {
		trainListRosenMaster = rosenMasterBase[0] || [];
		trainListLocationMaster = locationMasterBase[0] || {};
		initialize_train_list_selector();
		render_train_list_page();
	})
	.fail(function() {
		const errormessage = "<h2 class='msg-bg'>" + get_error_message() + "</h2>";
		$("#message").html(errormessage).show();
	})
	.always(function() {
		$("#loaderBg").fadeOut("fast");
	});
}

function initialize_train_list_selector() {
	const select = $("#trainListRosenSelect");
	if (!select.length) return;
	select.empty();

	TRAIN_LIST_DISPLAY_ROSENS.forEach(function(rosen) {
		const master = find_train_list_rosen_master(rosen);
		if (!master) return;
		const label = master.rosenName.ja + " " + master.kukanName.ja;
		select.append($("<option></option>").val(rosen).text(label));
	});

	select.off("change").on("change", function() {
		const rosen = $(this).val() || TRAIN_LIST_DEFAULT_ROSEN;
		location.hash = "rosen=" + rosen;
	});

	render_train_list_rosen_buttons();
	$("#trainListPrevBtn").off("click").on("click", function() {
		move_train_list_rosen(-1);
	});
	$("#trainListNextBtn").off("click").on("click", function() {
		move_train_list_rosen(1);
	});
	$("#trainListLineViewBtn").off("click").on("click", function() {
		location.href = build_page_url("./location.html", "rosen=" + get_train_list_param_rosen());
	});
}

function render_train_list_page() {
	const rosen = get_train_list_param_rosen();
	const sourceRosens = TRAIN_LIST_SOURCE_MAP[rosen] || [rosen];
	const trnNow = Date.now() >>> 10;
	const requests = sourceRosens.map(function(sourceRosen) {
		return get_location_now_request(sourceRosen, trnNow);
	});

	update_train_list_header(rosen);
	$("#trainListRosenSelect").val(rosen);
	update_train_list_rosen_buttons(rosen);
	$("#message").hide().empty();
	trainListPreservedScrollTop = $(window).scrollTop();

	show_train_list_comm_mark();
	$("#loaderBg").fadeIn("fast").css("display", "flex");

	$.when.apply($, requests)
		.done(function() {
			const args = normalize_train_list_request_args(arguments, requests.length);
			const rows = merge_train_list_rows(args, sourceRosens, rosen);
			render_train_list_tables(rows, rosen);
			restore_train_list_scroll();
		})
		.fail(function() {
			const errormessage = "<h2 class='msg-bg'>" + get_error_message() + "</h2>";
			$("#message").html(errormessage).show();
			restore_train_list_scroll();
		})
		.always(function() {
			$("#loaderBg").fadeOut("fast");
			start_train_list_auto_refresh();
		});
}

function restore_train_list_scroll() {
	if (trainListPreservedScrollTop === null) return;
	const scrollTop = trainListPreservedScrollTop;
	trainListPreservedScrollTop = null;
	window.requestAnimationFrame(function() {
		window.scrollTo(0, scrollTop);
		window.requestAnimationFrame(function() {
			window.scrollTo(0, scrollTop);
		});
	});
}

function start_train_list_auto_refresh() {
	stop_train_list_auto_refresh();
	if (document.hidden) return;
	if (!trainListAutoRefreshEnabled) return;
	trainListAutoRefreshTimer = window.setTimeout(function() {
		render_train_list_page();
	}, trainListAutoRefreshInterval);
}

function stop_train_list_auto_refresh() {
	if (!trainListAutoRefreshTimer) return;
	window.clearTimeout(trainListAutoRefreshTimer);
	trainListAutoRefreshTimer = null;
}

function show_train_list_comm_mark() {
	const mark = $("#trainListCommMark");
	if (!mark.length) return;
	mark.addClass("active");
	if (trainListCommMarkTimer) window.clearTimeout(trainListCommMarkTimer);
	trainListCommMarkTimer = window.setTimeout(function() {
		mark.removeClass("active");
	}, 900);
}

function load_train_list_auto_refresh_settings() {
	const storedEnabled = localStorage.getItem(LOCATION_AUTO_REFRESH_ENABLED_KEY);
	const storedInterval = Number(localStorage.getItem(LOCATION_AUTO_REFRESH_INTERVAL_KEY));
	const storedSleepPrevent = localStorage.getItem(LOCATION_SLEEP_PREVENT_ENABLED_KEY);
	trainListAutoRefreshEnabled = storedEnabled === null ? true : storedEnabled === "true";
	trainListAutoRefreshInterval = [15000, 30000, 60000].includes(storedInterval) ? storedInterval : TRAIN_LIST_AUTO_REFRESH_INTERVAL;
	trainListSleepPreventEnabled = storedSleepPrevent === null ? false : storedSleepPrevent === "true";
	sync_train_list_refresh_setting_controls();
	update_train_list_refresh_setting_button();
	update_train_list_wake_lock();
}

function initialize_train_list_refresh_setting() {
	$("#trainListRefreshSettingBtn").off("click").on("click", function() {
		sync_train_list_refresh_setting_controls();
		$("#trainListRefreshSettingDetail").fadeIn("fast");
	});

	$(document).off("click.trainListRefreshSettingClose").on("click.trainListRefreshSettingClose", "#trainListRefreshSettingDetail, #trainListRefreshSettingDetail .close", function() {
		$("#trainListRefreshSettingDetail").fadeOut("fast");
	});

	$(document).off("click.trainListRefreshSettingDialog").on("click.trainListRefreshSettingDialog", "#trainListRefreshSettingDetail .dialog", function(event) {
		event.stopPropagation();
	});

	$("#trainListRefreshSettingApplyBtn").off("click").on("click", function() {
		const enabled = $("#trainListRefreshEnabledSelect").val() === "on";
		const intervalSeconds = Number($("#trainListRefreshIntervalSelect").val()) || 15;
		const sleepPreventEnabled = $("#trainListSleepPreventSelect").val() === "on";
		apply_train_list_auto_refresh_settings(enabled, intervalSeconds * 1000, sleepPreventEnabled);
		$("#trainListRefreshSettingDetail").fadeOut("fast");
	});
}

function sync_train_list_refresh_setting_controls() {
	$("#trainListRefreshEnabledSelect").val(trainListAutoRefreshEnabled ? "on" : "off");
	$("#trainListRefreshIntervalSelect").val(String(trainListAutoRefreshInterval / 1000));
	$("#trainListSleepPreventSelect").val(trainListSleepPreventEnabled ? "on" : "off");
}

function update_train_list_refresh_setting_button() {
	const intervalSeconds = trainListAutoRefreshInterval / 1000;
	$("#trainListRefreshSettingBtn")
		.toggleClass("off", !trainListAutoRefreshEnabled)
		.attr("aria-label", trainListAutoRefreshEnabled ? "自動更新設定（ON、" + intervalSeconds + "秒間隔）" : "自動更新設定（OFF）");
}

async function update_train_list_wake_lock() {
	if (!trainListSleepPreventEnabled || document.visibilityState !== "visible") {
		release_train_list_wake_lock();
		return;
	}
	if (trainListWakeLock || !("wakeLock" in navigator)) return;
	try {
		trainListWakeLock = await navigator.wakeLock.request("screen");
		trainListWakeLock.addEventListener("release", function() {
			trainListWakeLock = null;
		});
	} catch (_error) {
		trainListWakeLock = null;
	}
}

function release_train_list_wake_lock() {
	if (!trainListWakeLock) return;
	const wakeLock = trainListWakeLock;
	trainListWakeLock = null;
	wakeLock.release().catch(function() {});
}

function handle_train_list_wake_lock_user_activation() {
	if (trainListSleepPreventEnabled && !trainListWakeLock) update_train_list_wake_lock();
}

function apply_train_list_auto_refresh_settings(enabled, interval, sleepPreventEnabled = trainListSleepPreventEnabled) {
	trainListAutoRefreshEnabled = enabled;
	trainListAutoRefreshInterval = [15000, 30000, 60000].includes(interval) ? interval : TRAIN_LIST_AUTO_REFRESH_INTERVAL;
	trainListSleepPreventEnabled = sleepPreventEnabled;
	localStorage.setItem(LOCATION_AUTO_REFRESH_ENABLED_KEY, String(trainListAutoRefreshEnabled));
	localStorage.setItem(LOCATION_AUTO_REFRESH_INTERVAL_KEY, String(trainListAutoRefreshInterval));
	localStorage.setItem(LOCATION_SLEEP_PREVENT_ENABLED_KEY, String(trainListSleepPreventEnabled));
	sync_train_list_refresh_setting_controls();
	update_train_list_refresh_setting_button();
	update_train_list_wake_lock();

	if (trainListAutoRefreshEnabled) {
		render_train_list_page();
	} else {
		stop_train_list_auto_refresh();
	}
}

function normalize_train_list_request_args(doneArguments, requestCount) {
	const args = Array.prototype.slice.call(doneArguments);
	if (requestCount === 1) return [[args[0], args[1], args[2]]];
	return args;
}

function update_train_list_header(rosen) {
	const master = find_train_list_rosen_master(rosen);
	const title = master ? master.rosenName.ja + master.kukanName.ja : "在線一覧";
	document.title = "列車走行位置 | " + title + " 在線一覧";
	$("#trainListTitle").text(title);
}

function merge_train_list_rows(responseArgs, sourceRosens, displayRosen) {
	const seenCbango = new Map();
	const rows = [];

	responseArgs.forEach(function(arg, index) {
		const nowData = Array.isArray(arg) ? arg[0] : arg;
		const sourceRosen = sourceRosens[index];
		const trains = nowData && Array.isArray(nowData.trains) ? nowData.trains : [];

		trains.forEach(function(train) {
			if (!train || !train.cbango) return;
			if (!should_include_train_list_train(train, sourceRosen, displayRosen)) return;
			const cbango = String(train.cbango);
			if (seenCbango.has(cbango)) return;
			seenCbango.set(cbango, true);

			rows.push({
				cbango: cbango,
				rosen: sourceRosen,
				direction: get_train_list_direction(train),
				delayText: get_train_list_delay_text(train),
				statusText: get_train_list_status_text(train),
				sectionText: get_train_list_section_text(train.pos, trainListLocationMaster)
			});
		});
	});

	return rows.sort(compare_train_list_rows);
}

function should_include_train_list_train(train, sourceRosen, displayRosen) {
	if (displayRosen !== "53" || sourceRosen !== "02") return true;

	const match = String((train && train.pos) || "").match(/^R1P(\d+)[UD]$/);
	if (!match) return true;

	const point = Number(match[1]);
	return point < 121 || point > 131;
}

function get_train_list_direction(train) {
	const pos = String((train && train.pos) || "");
	if (pos.slice(-1) === "U") return "up";
	if (pos.slice(-1) === "D") return "down";
	return get_train_list_direction_from_cbango(train.cbango);
}

function get_train_list_direction_from_cbango(cbango) {
	const match = String(cbango || "").match(/^0*([0-9]+)/);
	if (!match) return "down";
	return parseInt(match[1], 10) % 2 === 0 ? "up" : "down";
}

function get_train_list_delay_text(train) {
	const chien = Number(train && train.chien || 0);
	if (!chien || chien < 1) return "";
	if (chien >= 999) return "大";
	return String(chien);
}

function get_train_list_status_text(train) {
	const yokuStatus = String(train && train.yokuStatus || "0");
	if (yokuStatus === "1" || yokuStatus === "2") return "抑止";
	return "";
}

function get_train_list_section_text(pos, locationMaster) {
	const raw = locationMaster && pos ? String(locationMaster[pos] || "") : "";
	if (!raw) return "在線位置不明";
	return raw.replace(/\s*間$/, "").replace(/→/g, "～").trim();
}

function compare_train_list_rows(a, b) {
	const aKey = get_train_list_sort_key(a.cbango);
	const bKey = get_train_list_sort_key(b.cbango);
	if (a.direction !== b.direction) return a.direction === "up" ? -1 : 1;
	if (aKey.number !== bKey.number) return aKey.number - bKey.number;
	if (aKey.suffix !== bKey.suffix) return aKey.suffix.localeCompare(bKey.suffix);
	return a.cbango.localeCompare(b.cbango);
}

function get_train_list_sort_key(cbango) {
	const match = String(cbango).match(/^0*([0-9]+)([A-Za-z].*)?$/);
	if (!match) {
		return {
			number: Number.MAX_SAFE_INTEGER,
			suffix: String(cbango)
		};
	}
	return {
		number: parseInt(match[1], 10),
		suffix: match[2] || ""
	};
}

function render_train_list_tables(rows, rosen) {
	const upRows = rows.filter(function(row) { return row.direction === "up"; });
	const downRows = rows.filter(function(row) { return row.direction === "down"; });

	$("#trainListUpCount").text("上り(" + upRows.length + "本)");
	$("#trainListDownCount").text("下り(" + downRows.length + "本)");

	render_train_list_table("#trainListUpBody", upRows, rosen);
	render_train_list_table("#trainListDownBody", downRows, rosen);
}

function render_train_list_rosen_buttons() {
	const wrap = $("#trainListRosenButtons");
	if (!wrap.length) return;
	wrap.empty();

	TRAIN_LIST_DISPLAY_ROSENS.forEach(function(rosen) {
		const master = find_train_list_rosen_master(rosen);
		if (!master) return;
		const button = $("<button type='button' class='train-list-rosen-btn'></button>");
		button.attr("data-rosen", rosen);
		button.append($("<span class='name'></span>").text(master.rosenName.ja));
		button.append($("<span class='range'></span>").text(strip_train_list_kukan_brackets(master.kukanName.ja)));
		button.on("click", function() {
			location.hash = "rosen=" + rosen;
		});
		wrap.append(button);
	});
}

function update_train_list_rosen_buttons(currentRosen) {
	$("#trainListRosenButtons .train-list-rosen-btn").each(function() {
		$(this).toggleClass("active", $(this).attr("data-rosen") === currentRosen);
	});
}

function strip_train_list_kukan_brackets(text) {
	return String(text || "").replace(/^\[/, "").replace(/\]$/, "");
}

function move_train_list_rosen(step) {
	const current = get_train_list_param_rosen();
	const index = TRAIN_LIST_DISPLAY_ROSENS.indexOf(current);
	const nextIndex = index < 0
		? 0
		: (index + step + TRAIN_LIST_DISPLAY_ROSENS.length) % TRAIN_LIST_DISPLAY_ROSENS.length;
	location.hash = "rosen=" + TRAIN_LIST_DISPLAY_ROSENS[nextIndex];
}

function render_train_list_table(selector, rows, rosen) {
	const body = $(selector);
	body.empty();

	if (!rows.length) {
		body.append("<tr class='empty'><td colspan='4'>列車はありません</td></tr>");
		return;
	}

	rows.forEach(function(row) {
		const tr = $("<tr></tr>");
		tr.append($("<td class='cbango'></td>").text(row.cbango));
		tr.append($("<td class='delay'></td>").text(row.delayText));
		tr.append($("<td class='status'></td>").html(create_train_list_status_html(row.statusText)));
		tr.append($("<td class='section'></td>").text(row.sectionText));
		tr.on("click", function() {
			location.href = build_page_url("./location.html", "rosen=" + rosen + "&cbango=" + row.cbango);
		});
		body.append(tr);
	});
}

function create_train_list_status_html(statusText) {
	if (!statusText) return "";
	return "<span class='train-list-status-badge'>" + escape_train_list_html(statusText) + "</span>";
}

function escape_train_list_html(value) {
	return String(value || "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function find_train_list_rosen_master(rosen) {
	return trainListRosenMaster.find(function(row) {
		return row.rosen === rosen;
	});
}

function get_train_list_param_rosen() {
	const params = location.hash.slice(1).split("&");
	if (params.length > 0 && params[0].indexOf("rosen=") >= 0) {
		const rosen = params[0].slice(-2);
		if (TRAIN_LIST_DISPLAY_ROSENS.includes(rosen)) return rosen;
	}
	return TRAIN_LIST_DEFAULT_ROSEN;
}
