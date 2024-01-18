// 位置情報の取得ができなかった場合のメッセージ。
const POSITION_UNAVAILABLE_LABEL = {
	"ja": "位置情報の取得ができませんでした。",
	"en": "Failed to retrieve the location information.",
	"tc": "無法取得位置資訊。",
	"sc": "无法取得位置信息。",
	"kr": "위치정보를 취득하지 못했습니다."
};
// 周辺に北海道の駅がないか、端末の位置情報が無効な場合のメッセージ。
const PERMISSION_DENIED_LABEL = {
	"ja": "周辺にJR北海道の駅がないか、端末の位置情報が有効になっていない可能性があります。",
	"en": "There are no JR Hokkaido stations nearby or the location information may not be valid on your device.",
	"tc": "周邊沒有JR北海道的車站，或是尚未開啟位置資訊。",
	"sc": "周边没有JR北海道的车站，或是尚未开启位置信息。",
	"kr": "주변에 JR 홋카이도의 역이 없거나 단말의 위치정보가 유효하지 않은 가능성이 있습니다."
};

/*
 * 現在地を取得して近くの駅に移動する
 */
function get_pos_info(_isTop) {
	const lang = document.documentElement.dataset.lang;
	$("#posTab").empty();
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(
			// 位置情報の取得に成功
			function (pos) {

				// 最寄り駅を取得する。
				try {
					getNearestStation(pos.coords.latitude, pos.coords.longitude, 1000, _isTop);
				} catch (e) {
					$("#oshiraseDetailMain .text").text(e.message);
					$("#oshiraseDetail").fadeIn("fast");
					$("#loaderBg").fadeIn("fast");
					set_scroll_hide($("#oshiraseDetail .dialog"));
					return;
				}
			},
			// 位置情報の取得に失敗
			function (error) {
				switch (error.code) {
					// 位置情報が取得できない場合
					case error.POSITION_UNAVAILABLE:
						$("#oshiraseDetailMain .text").text(POSITION_UNAVAILABLE_LABEL[lang]);
						$("#oshiraseDetail").fadeIn("fast");
						$("#loaderBg").fadeIn("fast");
						set_scroll_hide($("#oshiraseDetail .dialog"));
						break;

					// Geolocationの使用が許可されない場合
					case error.PERMISSION_DENIED:
						$("#oshiraseDetailMain .text").text(PERMISSION_DENIED_LABEL[lang]);
						$("#oshiraseDetail").fadeIn("fast");
						$("#loaderBg").fadeIn("fast");
						set_scroll_hide($("#oshiraseDetail .dialog"));
						break;

					// タイムアウトした場合
					case error.TIMEOUT:
						$("#oshiraseDetailMain .text").text(POSITION_UNAVAILABLE_LABEL[lang]);
						$("#oshiraseDetail").fadeIn("fast");
						$("#loaderBg").fadeIn("fast");
						set_scroll_hide($("#oshiraseDetail .dialog"));
						break;
				}
			},
			{
				timeout: 5000, // タイムアウト5秒
				enableHighAccuracy: true // 位置情報の精度を上げる
			}
		);
	} else {
		$("#oshiraseDetailMain .text").text(POSITION_UNAVAILABLE_LABEL[lang]);
		$("#oshiraseDetail").fadeIn("fast");
		$("#loaderBg").fadeIn("fast");
		set_scroll_hide($("#oshiraseDetail .dialog"));
		return;
	}
}

/**
 * 指定した地点に最も近いTID対象駅を取得する。
 * 算出に当たっては球面三角法を使用する。
 * @param lat 検索対象地点の緯度。
 * @param lon 検索対象地点の経度。
 * @param maxDistance 最大距離。単位はメートル。この距離より遠い駅は対象外とする。
 * @param _isTop トップページかどうか。
 */
function getNearestStation(lat, lon, maxDistance, _isTop) {
	const lang = document.documentElement.dataset.lang;

	// 北緯40.8度～北緯45.5度、東経139.5度～東経149.0度の範囲外の場合は明らかにJR北海道エリア外なので、検索しない。
	if (lat < 40.8 || 45.5 < lat || lon < 139.5 || 149 < lon) {
		$("#oshiraseDetailMain .text").text(PERMISSION_DENIED_LABEL[lang]);
		$("#oshiraseDetail").fadeIn("fast");
		$("#loaderBg").fadeIn("fast");
		set_scroll_hide($("#oshiraseDetail .dialog"));
		return;
	}

	// 最寄り駅の駅コード。
	let nearestEkiCode = undefined;
	// 最寄り駅との距離（メートル）。
	let nearestDistance = maxDistance;

	// キャッシュバスター値を生成する。(UNIX元期からの経過ミリ秒数を右に16ビットシフトした値。2の16乗＝65536ミリ秒≒約1分間隔でキャッシュを無効化する)
	const now = Date.now() >>> 16;

	// 検索に必要なJSONファイル一式を読み込む。
	$.when(
		$.getJSON("https://corsproxy.org/?https://www3.jrhokkaido.co.jp/webunkou/json/master/eki_master.json?" + now),
		$.getJSON("https://corsproxy.org/?https://www3.jrhokkaido.co.jp/webunkou/json/master/eki_jogai_master.json?" + now),
		$.getJSON("https://corsproxy.org/?https://www3.jrhokkaido.co.jp/webunkou/json/master/eki_coordinates_master.json?" + now)
	)
	.done(function(ekiMasterBase, jogaiMasterBase, coordsMasterBase) {
		let ekiMstJson = ekiMasterBase[0];
		let jogaiMstJson = jogaiMasterBase[0];
		let coordsMstJson = coordsMasterBase[0];

		// TID対象駅の駅コードを抽出する。
		let tidEkiList = ekiMstJson.filter(eki => eki.tid === 1).map(eki => eki.key);
		// 駅除外マスタの駅コードを抽出する。
		let jogaiEkiList = jogaiMstJson.filter(eki => eki.jogai === 1).map(eki => eki.key);

		// 最寄り駅を検索する。
		let coordsMaster = coordsMstJson;
		for (let ekiCode in coordsMaster) {
			// TID非対象駅の場合または駅除外マスタにある場合、判定をスキップする。
			if (!tidEkiList.includes(ekiCode) || jogaiEkiList.includes(ekiCode)) continue;
			// 対象地点との距離を取得する。
			let coord = coordsMaster[ekiCode];
			let distance = getDistance(lat, lon, coord.lat, coord.lon);
			// 現在保持している最寄り駅との距離と、取得した対象地点との距離を比較する。
			// 近い場合は最寄り駅の駅コードおよび最寄り駅との距離を更新する。
			if (distance < nearestDistance) {
				nearestEkiCode = ekiCode;
				nearestDistance = distance;
			}
		}

		if (nearestEkiCode) {
			// 最寄り駅を取得できた場合
			load_rosen_html(nearestEkiCode, _isTop);
		} else {
			// 1キロ圏内に駅が存在しない場合
			$("#oshiraseDetailMain .text").text(PERMISSION_DENIED_LABEL[lang]);
			$("#oshiraseDetail").fadeIn("fast");
			$("#loaderBg").fadeIn("fast");
			set_scroll_hide($("#oshiraseDetail .dialog"));
			return;
		}
	})
	.fail(function() {
		// JSONファイルの読み込みに失敗したときの処理
		throw new Error(get_error_message());
	});
}

/*
 * 駅路線マスタJSONと取得した最寄り駅を基に遷移先の路線番号を取得し、対象の路線番号のテンプレートHTMLを読み込む。
 */
function load_rosen_html(_key, _isTop) {
	// キャッシュバスター値を生成する。(UNIX元期からの経過ミリ秒数を右に16ビットシフトした値。2の16乗＝65536ミリ秒≒約1分間隔でキャッシュを無効化する)
	const now = Date.now() >>> 16;
	$.getJSON("https://corsproxy.org/?https://www3.jrhokkaido.co.jp/webunkou/json/master/eki_rosen_master.json?" + now, function (rosenData) {
		let findRosen = rosenData.stations.find((v) => v.key == _key);
		if (typeof findRosen !== "undefined" && findRosen.rosen.length > 0) {
			let rosen = findRosen.rosen[0];
			$.ajax( {
				url: "https://corsproxy.org/?https://www3.jrhokkaido.co.jp/trainlocation/rosen_" + rosen + ".html",
				detaType: "html",
				success: function(rosenHtml) {
					// 走行位置ページに遷移
					disp_nearest_station(_key, _isTop, rosen, rosenHtml);
				}
			})
		}
	})
	.fail(function() {
		$("#oshiraseDetailMain .text").text(get_error_message());
		$("#oshiraseDetail").fadeIn("fast");
		$("#loaderBg").fadeIn("fast");
		set_scroll_hide($("#oshiraseDetail .dialog"));
		return;
	});
}

/*
 * 取得した最寄り駅が存在する走行位置ページに遷移する。
 */
function disp_nearest_station(_key, _isTop, _rosen, _rosenHtml) {
	const lang = document.documentElement.dataset.lang;
	let doc = document.createElement("div");
	doc.innerHTML = _rosenHtml;
	if (doc.innerHTML) {
		let ekiDiv = doc.querySelectorAll("div[key='" + _key + "']");
		if (ekiDiv.length > 0) {
			// ローディングアニメーション非表示
			loading_animation_hidden();

			if (_isTop) {
				// トップページの場合、画面遷移
				if (lang == "ja") window.location.href =  "./location.html#rosen=" + _rosen + "&id=" + _key;
				else window.location.href = "./location_" + lang + ".html#rosen=" + _rosen + "&id=" + _key;
			} else {
				// ハッシュを&で分割
				let hashArray = location.hash.slice(1).split('&');
				let befRosen = "";
				if (hashArray[0].indexOf("rosen=") >= 0) {
					befRosen = hashArray[0].slice(-2);
				}

				if (befRosen === _rosen) {
					// 表示中の路線と遷移先の路線が同じ場合
					let param_cbango = get_param_cbango();
					location.hash = "rosen=" + _rosen + "&id=" + _key;
					// 駅キー、列車番号が設定されていた場合、画面表示処理を行う
					if (!param_cbango) init_disp(_key);
				} else {
					// 走行位置ページの場合、ハッシュ値変更
					location.hash = "rosen=" + _rosen + "&id=" + _key;
				}
			}
		} else {
			$("#oshiraseDetailMain .text").text(POSITION_UNAVAILABLE_LABEL[lang]);
			$("#oshiraseDetail").fadeIn("fast");
			$("#loaderBg").fadeIn("fast");
			set_scroll_hide($("#oshiraseDetail .dialog"));
			return;
		}
	}
}

/** 地球赤道半径（メートル） */
const EARTH_RADIUS = 6378137;
/** 弧度法変換係数（(1/360)×2π） */
const DEG_TO_RAD = (1 / 360) * 2 * Math.PI;
/**
 * 2地点間の距離を取得する。
 * 算出に当たっては球面三角法を使用する。
 * @param lat1 地点1の緯度。
 * @param lon1 地点1の経度。
 * @param lat2 地点2の緯度。
 * @param lon2 地点2の経度。
 * @return 2地点間の距離。単位はメートル。
 */
function getDistance(lat1, lon1, lat2, lon2) {
	// 緯度経度をラジアンに変換する。（ラジアン＝度×(1/360)×2π）
	const rlat1 = lat1 * DEG_TO_RAD;
	const rlon1 = lon1 * DEG_TO_RAD;
	const rlat2 = lat2 * DEG_TO_RAD;
	const rlon2 = lon2 * DEG_TO_RAD;
	// 2地点の中心角（ラジアン）を求める。
	const rr = Math.acos(Math.cos(rlat1) * Math.cos(rlat2) * Math.cos(rlon2 - rlon1) + Math.sin(rlat1) * Math.sin(rlat2));
	// 2地点間の距離（メートル）を求める。
	return EARTH_RADIUS * rr;
}