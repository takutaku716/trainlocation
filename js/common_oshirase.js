/*
 * お知らせ欄の表示制御を行う。
 */
function disp_oshirase(_rosen) {
	$("#commonOshirase").empty();
	let lang = document.documentElement.dataset.lang;

	// 路線に該当するエリアのお知らせの表示
	if (_rosen == "01" || _rosen == "02" || _rosen == "03") {
		// 札幌近郊の場合
		// エリア名取得
		let areaName = getAreaName("01");
		if (!areaName) areaName = "";
		// お知らせ文章生成
		if (lang == "ja") load_oshirase_html(areaName, "https://api.allorigins.win/raw?url=https://www3.jrhokkaido.co.jp/trainlocation/CMUNKOU/inc_location_area_spo.html");
		else load_oshirase_html(areaName, "https://api.allorigins.win/raw?url=https://www3.jrhokkaido.co.jp/trainlocation/CMUNKOU/inc_location_area_spo_" + lang + ".html");
	}
	if (_rosen == "04" || _rosen == "05" || _rosen == "06" || _rosen == "07" || _rosen == "08") {
		// 道央エリアの場合
		// エリア名取得
		let areaName = "";
		if (!areaName) areaName = "";
		if (lang == "en") areaName = "central Hokkaido area";
		else areaName = getAreaName("02");
		// お知らせ文章生成
		if (lang == "ja") load_oshirase_html(areaName, "https://api.allorigins.win/raw?url=https://www3.jrhokkaido.co.jp/trainlocation/CMUNKOU/inc_location_area_doo.html");
		else load_oshirase_html(areaName, "https://api.allorigins.win/raw?url=https://www3.jrhokkaido.co.jp/trainlocation/CMUNKOU/inc_location_area_doo_" + lang + ".html");
	}
	if (_rosen == "09" || _rosen == "10") {
		// 道南エリアの場合
		// エリア名取得
		let areaName = "";
		if (!areaName) areaName = "";
		if (lang == "en") areaName = "southern Hokkaido area";
		else areaName = getAreaName("03");
		// お知らせ文章生成
		if (lang == "ja") load_oshirase_html(areaName, "https://api.allorigins.win/raw?url=https://www3.jrhokkaido.co.jp/trainlocation/CMUNKOU/inc_location_area_donan.html");
		else load_oshirase_html(areaName, "https://api.allorigins.win/raw?url=https://www3.jrhokkaido.co.jp/trainlocation/CMUNKOU/inc_location_area_donan_" + lang + ".html");
	}
	if (_rosen == "11" || _rosen == "12") {
		// 道北エリアの場合
		// エリア名取得
		let areaName = "";
		if (!areaName) areaName = "";
		if (lang == "en") areaName = "northern Hokkaido area";
		else areaName = getAreaName("04");
		// お知らせ文章生成
		if (lang == "ja") load_oshirase_html(areaName, "https://api.allorigins.win/raw?url=https://www3.jrhokkaido.co.jp/trainlocation/CMUNKOU/inc_location_area_dohoku.html");
		else load_oshirase_html(areaName, "https://api.allorigins.win/raw?url=https://www3.jrhokkaido.co.jp/trainlocation/CMUNKOU/inc_location_area_dohoku_" + lang + ".html");
	}
	if (_rosen == "13" || _rosen == "14") {
		// 道東エリアの場合
		// エリア名取得
		let areaName = "";
		if (!areaName) areaName = "";
		if (lang == "en") areaName = "eastern Hokkaido area";
		else areaName = getAreaName("05");
		// お知らせ文章生成
		if (lang == "ja") load_oshirase_html(areaName, "https://api.allorigins.win/raw?url=https://www3.jrhokkaido.co.jp/trainlocation/CMUNKOU/inc_location_area_doto.html");
		else load_oshirase_html(areaName, "https://api.allorigins.win/raw?url=https://www3.jrhokkaido.co.jp/trainlocation/CMUNKOU/inc_location_area_doto_" + lang + ".html");
	}
	if (_rosen == "15") {
		// 北海道新幹線の場合
		// エリア名取得
		let areaName = getAreaName("06");
		if (!areaName) areaName = "";
		// お知らせ文章生成
		if (lang == "ja") load_oshirase_html(areaName, "https://api.allorigins.win/raw?url=https://www3.jrhokkaido.co.jp/trainlocation/CMUNKOU/inc_location_area_shin.html");
		else load_oshirase_html(areaName, "https://api.allorigins.win/raw?url=https://www3.jrhokkaido.co.jp/trainlocation/CMUNKOU/inc_location_area_shin_" + lang + ".html");
	}

	// 路線のお知らせの表示
	if (lang == "ja") {
		let rosen = ("00" + _rosen).slice(-2);
		let rosenName = getRosenName(rosen);
		if (typeof rosenName !== "string") rosenName = "";
		load_oshirase_html(rosenName, "https://api.allorigins.win/raw?url=https://www3.jrhokkaido.co.jp/trainlocation/CMUNKOU/inc_location_rosen_" + rosen +".html");
	}
}

/*
 * お知らせファイルの内容を読み込む。
 */
function load_oshirase_html(_name, _fileName) {
	let now = Date.now() >>> 16;

	$.ajax( {
		url: _fileName + "?" + now,
		detaType: "html",
		success: function( data ) {
			if (data != "")	create_oshirase_html(_name, data);
		}
	})

}

/*
 * お知らせファイルの内容から、お知らせ欄を作成する。
 */
function create_oshirase_html(_name, _data) {
	let newDiv = "";
	let oshiraseDiv = document.createElement("div");

	newDiv = document.createElement("div");
	newDiv.className = "location-oshirase";
	let lang = document.documentElement.dataset.lang;
	if (lang == "ja") newDiv.innerHTML = "<h2 class='common-subtitle toggle'>" + _name + "のお知らせ</h2>";
	if (lang == "en") newDiv.innerHTML = "<h2 class='common-subtitle toggle'>" + "Notice on " + _name +"</h2>" ;
	if (lang == "kr") newDiv.innerHTML = "<h2 class='common-subtitle toggle'>" + _name + " 안내</h2>" ;
	if (lang == "sc") newDiv.innerHTML = "<h2 class='common-subtitle toggle'>" + _name + "的信息</h2>" ;
	if (lang == "tc") newDiv.innerHTML = "<h2 class='common-subtitle toggle'>" + _name + "的資訊</h2>" ;
	oshiraseDiv.innerHTML = _data;
	oshiraseDiv.className = "common-contents-frame";
	newDiv.append(oshiraseDiv);

	if (document.querySelector('#commonOshirase').childElementCount == 0) {
		$("#commonOshirase .common-subtitle").addClass("open");
		$("#commonOshirase .common-contents-frame").hide();
	}

	if ($("#commonOshirase").children().length) newDiv.classList.add("border");
	$("#commonOshirase").append(newDiv);

	set_oshirase_width();

	// ヘッダーの高さ分の余白を設定する。（お知らせの追加分の高さの余白を再設定）
	set_header_height();
}

/*
 * お知らせのサイズによって子要素の横幅を設定する。
 */
function set_oshirase_width() {
	let diff = $("#commonOshirase").width() - 137;
	$("#commonOshirase li").css( { width: diff + 100 + "px" });
}