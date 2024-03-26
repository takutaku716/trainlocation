// 現在のページの言語表記でのエリア名称を保持した連想配列オブジェクト。
var objAreaNameArray;
// 現在のページの言語表記での線区名称を保持した連想配列オブジェクト。
var objSenkuNameArray;
// 現在のページの言語表記での路線名称を保持した連想配列オブジェクト。
var objRosenNameArray;
// 現在のページの言語表記での区間名称を保持した連想配列オブジェクト。
var objKukanNameArray;

// 引数で指定したエリアコードのエリア名称を取得する。
function getAreaName(area) {
	// エリア名称マスタJSONを読み込む。
	if (!objAreaNameArray) areaNameLoad();
	// 引数で指定したエリアコードのエリア名称を取得する。
	return objAreaNameArray ? objAreaNameArray[area] : "";
}
// エリア名称マスタJSONを読み込む。
function areaNameLoad() {
	// 現在のページの言語コードを取得する。
	let lang = document.documentElement.dataset.lang;
	// エリア名称マスタJSONを読み込む。
	let now = Date.now() >>> 16;
	$.ajaxSetup({ async: false });
	$.getJSON(
		"./master/area_name_master.json?" + now,
		function (master) {
			objAreaNameArray = {};
			master.forEach(function (item) {
				objAreaNameArray[item.area] = item.name[lang];
			});
		}
	)
	.fail(function() {
		var errormessage = `<h2 class='msg-bg'>${get_error_message()}</h2>`;
		$('#message').html(errormessage);
		$('#message').show();
	});
	$.ajaxSetup({ async: true });
}

// 引数で指定した線区コードの線区名称を取得する。
function getSenkuName(senku) {
	// 線区名称マスタJSONを読み込む。
	if (!objSenkuNameArray) senkuNameLoad();
	// 引数で指定した線区コードの線区名称を取得する。
	return objSenkuNameArray ? objSenkuNameArray[senku] : "";
}

// 線区名称マスタJSONを読み込む。
function senkuNameLoad() {
	// 現在のページの言語コードを取得する。
	let lang = document.documentElement.dataset.lang;
	// 線区名称マスタJSONを読み込む。
	let now = Date.now() >>> 16;
	$.ajaxSetup({ async: false });
	$.getJSON(
		"https://corsproxy.io/?https://www3.jrhokkaido.co.jp/webunkou/json/master/senku_name_master.json?" + now,
		function (master) {
			objSenkuNameArray = {};
			master.forEach(function (item) {
				objSenkuNameArray[item.senku] = item.name[lang];
			});
		}
	);
	$.ajaxSetup({ async: true });
}

// 引数で指定した路線コードの路線名称を取得する。
function getRosenName(rosen) {
	// 路線名称マスタJSONを読み込む。
	if (!objRosenNameArray) rosenNameLoad();
	// 引数で指定した路線コードの路線名称を取得する。
	return objRosenNameArray && objKukanNameArray ? objRosenNameArray[rosen] + objKukanNameArray[rosen] : "";
}
// 路線名称マスタJSONを読み込む。
function rosenNameLoad() {
	// 現在のページの言語コードを取得する。
	let lang = document.documentElement.dataset.lang;
	// 路線名称マスタJSONを読み込む。
	let now = Date.now() >>> 16;
	$.ajaxSetup({ async: false });
	$.getJSON(
		"./master/rosen_name_master.json?" + now,
		function (master) {
			objRosenNameArray = {};
			objKukanNameArray = {};
			master.forEach(function (item) {
				objRosenNameArray[item.rosen] = item.rosenName[lang];
				objKukanNameArray[item.rosen] = item.kukanName[lang];
			});
		}
	)
	.fail(function() {
		var errormessage = `<h2 class='msg-bg'>${get_error_message()}</h2>`;
		$('#message').html(errormessage);
		$('#message').show();
	});
	$.ajaxSetup({ async: true });
}