const TRAIN_LIST_DISPLAY_ROSENS = ["51", "52", "53", "03", "04", "06", "08", "10", "11", "12", "14", "15"];
const TRAIN_LIST_SOURCE_MAP = {
	"51": ["01", "05"],
	"52": ["02", "07", "09"],
	"53": ["02", "13"]
};
const TRAIN_LIST_DEFAULT_ROSEN = "51";

let trainListRosenMaster = [];
let trainListLocationMaster = {};

window.onload = function() {
	load_train_list_page();
};

window.onhashchange = function() {
	render_train_list_page();
};

function load_train_list_page() {
	const mstNow = Date.now() >>> 16;

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
	$("#trainListUpBody").empty();
	$("#trainListDownBody").empty();
	$("#message").hide().empty();

	$("#loaderBg").fadeIn("fast").css("display", "flex");

	$.when.apply($, requests)
		.done(function() {
			const args = normalize_train_list_request_args(arguments, requests.length);
			const rows = merge_train_list_rows(args, sourceRosens);
			render_train_list_tables(rows, rosen);
		})
		.fail(function() {
			const errormessage = "<h2 class='msg-bg'>" + get_error_message() + "</h2>";
			$("#message").html(errormessage).show();
		})
		.always(function() {
			$("#loaderBg").fadeOut("fast");
		});
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

function merge_train_list_rows(responseArgs, sourceRosens) {
	const seenCbango = new Map();
	const rows = [];

	responseArgs.forEach(function(arg, index) {
		const nowData = Array.isArray(arg) ? arg[0] : arg;
		const sourceRosen = sourceRosens[index];
		const trains = nowData && Array.isArray(nowData.trains) ? nowData.trains : [];

		trains.forEach(function(train) {
			if (!train || !train.cbango) return;
			const cbango = String(train.cbango);
			if (seenCbango.has(cbango)) return;
			seenCbango.set(cbango, true);

			rows.push({
				cbango: cbango,
				rosen: sourceRosen,
				direction: get_train_list_direction(train),
				delayText: get_train_list_delay_text(train),
				sectionText: get_train_list_section_text(train.pos, trainListLocationMaster)
			});
		});
	});

	return rows.sort(compare_train_list_rows);
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

function render_train_list_table(selector, rows, rosen) {
	const body = $(selector);
	body.empty();

	if (!rows.length) {
		body.append("<tr class='empty'><td colspan='3'>列車はありません</td></tr>");
		return;
	}

	rows.forEach(function(row) {
		const tr = $("<tr></tr>");
		tr.append($("<td class='cbango'></td>").text(row.cbango));
		tr.append($("<td class='delay'></td>").text(row.delayText));
		tr.append($("<td class='section'></td>").text(row.sectionText));
		tr.on("click", function() {
			location.href = build_page_url("./location.html", "rosen=" + rosen + "&cbango=" + row.cbango);
		});
		body.append(tr);
	});
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
