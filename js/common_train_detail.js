/**
 * ｢列車詳細情報｣ダイアログを表示する。
 * @param target ｢列車詳細情報｣ダイアログを埋め込む親要素。この要素の data-url 属性に｢列車詳細情報｣HTMLのURLを指定する。
 * @param train 列車情報オブジェクト。以下のキーによる連想配列を保持する。
 * 				cbango 列番。
 * 				name 列車名
 * 				type 列車種別。
 * 				shaEki 発車駅の駅キー。
 * 				shaTime 発車時刻。
 * 				shuEki 終着駅の駅キー。
 * 				ryosu 車両数。
 * 				senku 線区コード。
 * 				runStatus 走行状態。0:走行終了、1:走行中、2:走行前、4:域外遅延付与。
 * 				yokuStatus 抑止の状態。0:なし、1:始発駅抑止、2:抑止。
 *				yokuDetail 各言語での、抑止状態の詳細を表す文言。
 * 				status 運行状態。0:全区間運休、1:運転、2:部分運休。
 * 				statusDetail 運行状態の詳細を表す文言。
 * 				chien 遅れ分数。
 * 				pos 地点キー。
 * @param isError エラーメッセージを表示するかどうか。この値が true の場合、無条件にエラーメッセージを表示する。
 */
function showTrainDetailDialog(target, train, isError) {
	// ｢列車詳細情報｣ダイアログを表示する。
	if ($(target).length) {
		// ダイアログ要素を取得する。
		let dialog = $(target).find(".trainDetailDialog");
		// 未ロードの場合、｢列車詳細情報｣HTMLをロードする。
		if (!dialog.length) {
			// キャッシュバスター値を生成する。(UNIX元期からの経過ミリ秒数を右に16ビットシフトした値。2の16乗＝65536ミリ秒≒約1分間隔でキャッシュを無効化する)
			const now = Date.now() >>> 16;
			// ｢列車詳細情報｣HTMLのURLを算出する。
			const url = $(target).data("url") + "?" + now;
			// ｢列車詳細情報｣を開く。
			$(target).load(url, () => {
				// ロードしたダイアログ要素を取得する。
				dialog = $(target).find(".trainDetailDialog");
				// ダイアログに列車詳細情報を埋め込む。
				loadTrainDetail(dialog, train, isError);
				// ダイアログを表示する。
				showDialog(dialog, true);
			});
			return;
		}
		// ダイアログに列車詳細情報を埋め込む。
		loadTrainDetail(dialog, train, isError);
		// ダイアログを表示する。
		showDialog(dialog);
	}
	/**
	 * 最新の列車詳細情報を取得して、ダイアログに表示する。
	 * @param dialog ダイアログ要素。
	 * @param train 列車情報オブジェクト。
	 * @param isError エラーメッセージを表示するかどうか。この値が true の場合、無条件にエラーメッセージを表示する。
	 */
	function loadTrainDetail(dialog, train, isError) {
		// エラーフラグが有効な場合は、エラーメッセージを表示する。
		if (isError) {
			$(dialog).find(".error").removeClass("hide");
			return;
		}
		const lang = document.documentElement.dataset.lang;
		// マスタファイル用のキャッシュバスター値を生成する。(UNIX元期からの経過ミリ秒数を右に16ビットシフトした値。2の16乗＝65536ミリ秒≒約1分間隔でキャッシュを無効化する)
		const mstNow = Date.now() >>> 16;
		// マスタファイル類を読み込んで、列車詳細情報を描画する。
		$.when(
			$.getJSON("https://corsproxy.io/?https://www3.jrhokkaido.co.jp/webunkou/json/master/eki_master.json?" + mstNow),
			$.getJSON("https://corsproxy.io/?https://www3.jrhokkaido.co.jp/webunkou/json/master/ressha_type_master.json?" + mstNow),
			$.getJSON("./ORIGINAL/location_master" + (lang === "ja" ? "" : "_" + lang) + ".json?" + mstnow),
			$.getJSON("https://api.allorigins.win/raw?url=https://www3.jrhokkaido.co.jp/webunkou/json/daiya/daiya_" + train.senku + (lang === "ja" ? "" : "_" + lang) + ".json?" + mstNow)
		)
		.done(function(ekiMasterBase, resshaTypeMasterBase, posNameMasterBase, daiyaBase) {
			const ekiMaster = ekiMasterBase[0];
			const resshaTypeMaster = resshaTypeMasterBase[0];
			const posNameMaster = posNameMasterBase[0];
			const daiya = daiyaBase[0];
			// ｢列車情報｣部分を表示状態にする。
			$(dialog).find(".train-info").removeClass("hide");
			// ダイアログに｢列車種別｣を描画する。
			drawResshaType(dialog, train.type, resshaTypeMaster);
			// ダイアログに｢列車情報｣を描画する。
			drawResshaInfo(dialog, train.name, train.shaEki, train.shaTime, train.shuEki, train.ryosu, ekiMaster);
			// ダイアログに｢現在地｣を描画する。
			drawCurrentPos(dialog, train.pos, posNameMaster);
			// ダイアログに｢遅れ｣を描画する。
			drawChien(dialog, train.runStatus, train.yokuStatus, train.yokuDetail, train.chien, train.status);
			// ダイアログに｢運行状態｣を描画する。
			drawUnkouStatus(dialog, train.status, train.statusDetail);
			// ダイアログに｢ダイヤデータ｣を描画する。
			drawDaiya(dialog, train.cbango, ekiMaster, daiya);
		})
		.fail(function() {
			// データの取得に失敗した場合は、エラーメッセージを表示する。
			$(dialog).find(".error").removeClass("hide");
		});
		/**
		 * ダイアログに｢列車種別｣を描画する。
		 * @param dialog ダイアログ要素。
		 * @param type 列車種別。
		 * @param resshaTypeMaster 列車種別マスタ。
		 */
		function drawResshaType(dialog, type, resshaTypeMaster) {
			const lang = document.documentElement.dataset.lang;
			// 列車種別名を取得する。
			resshaTypeInfo = resshaTypeMaster.find(ressha => ressha.type == type);
			// 列車種別名を画面に表示する。
			if (resshaTypeInfo && resshaTypeInfo.labelText[lang]) {
				// 列車種別名を取得できた場合は、画面に表示する。
				const resshaTypeName = resshaTypeInfo.labelText[lang];
				if (resshaTypeName) {
					$(dialog).find(".type-label").attr("data-type", type);
					$(dialog).find(".type-label").text(resshaTypeName);
					$(dialog).find(".type-label").removeClass("hide");
				}
			}
		}
		/**
		 * ダイアログに｢列車情報｣を描画する。
		 * @param dialog ダイアログ要素。
		 * @param name 列車名
		 * @param shaEki 発車駅の駅キー。
		 * @param shaTime 発車時刻。
		 * @param shuEki 終着駅の駅キー。
		 * @param ryosu 車両数。
		 * @param ekiMaster 駅マスタ。
		 * @param cbango 列番。
		 */
		function drawResshaInfo(dialog, name, shaEki, shaTime, shuEki, ryosu, ekiMaster, cbango) {
			const lang = document.documentElement.dataset.lang;
			// 列車名がある場合は、画面に表示する。
			if (name) {
				$(dialog).find(".name").text(name);
				$(dialog).find(".name-label").removeClass("hide");
			}
			// 発車駅名を取得する。
			const shaEkiName = (function(key) {
				const eki = ekiMaster.find(eki => eki.key === key);
				return eki ? eki[lang] : undefined;
			}(shaEki));
			// 発車駅名を取得できた場合は、画面に表示する。
			if (shaEkiName) {
				$(dialog).find(".sha-eki").text(shaEkiName);
				$(dialog).find(".sha-label").removeClass("hide");
			}
			// 発車時刻がある場合は、画面に表示する。
			if (shaTime) {
				$(dialog).find(".sha-time").text(shaTime);
				$(dialog).find(".sha-label").removeClass("hide");
			}
			// 終着駅名を取得する。
			const shuEkiName = (function(key) {
				const eki = ekiMaster.find(eki => eki.key === key);
				return eki ? eki[lang] : undefined;
			}(shuEki));
			// 終着駅名を取得できた場合は、画面に表示する。
			if (shuEkiName) {
				$(dialog).find(".shu-eki").text(shuEkiName);
				$(dialog).find(".shu-label").removeClass("hide");
			}
			// 車両数がある場合は、画面に表示する。
			if (ryosu) {
				$(dialog).find(".ryosu").text(ryosu);
				$(dialog).find(".ryosu-label").removeClass("hide");
			}
			// 運行番号がある場合は、画面に表示する。
			if (cbango) {
				$(dialog).find(".cbango").text(cbango);
				$(dialog).find(".unban-label").removeClass("hide");
			}
		}
		/**
		 * ダイアログに｢現在地｣を描画する。
		 * @param dialog ダイアログ要素。
		 * @param type 地点コード。
		 * @param posNameMaster 地点名称マスタ。
		 */
		function drawCurrentPos(dialog, pos, posNameMaster) {
			// 地点名を取得する。
			const posName = posNameMaster[pos];
			// 地点名を取得できた場合は、画面に表示する。
			if (posName) {
				$(dialog).find(".pos-name").text(posName);
				$(dialog).find(".pos-item").removeClass("hide");
			}
		}
		/**
		 * ダイアログに｢遅れ｣を描画する。
		 * @param dialog ダイアログ要素。
		 * @param runStatus 走行状態。0:走行終了、1:走行中、2:走行前、4:域外遅延付与。
		 * @param yokuStatus 抑止の状態。0:なし、1:始発駅抑止、2:抑止。
		 * @param yokuDetail 各言語での、抑止状態の詳細を表す文言。
		 * @param chien 遅れ分数。
		 * @param unkouStatus 運行状態。0:全区間運休、1:運転、2:部分運休。
		 */
		function drawChien(dialog, runStatus, yokuStatus, yokuDetail, chien, unkouStatus) {
			const lang = document.documentElement.dataset.lang;
			const chienText = ((yokuStatus, runStatus, status) => {
				const CHIEN_LABEL_DELAYED_HOUR = { "ja": "{0}時間遅れ", "en": "{0} hour(s) late", "tc": "延遲{0}小時", "sc": "延迟{0}小时", "kr": "{0}시간 지연" };
				const CHIEN_LABEL_DELAYED_HR_MIN = { "ja": "{0}時間{1}分遅れ", "en": "{0} hr {1} min late", "tc": "延遲{0}小時{1}分", "sc": "延迟{0}小时{1}分", "kr": "{0}시간 {1}분 지연" };
				const CHIEN_LABEL_DELAYED_MINUTES = { "ja": "{0}分遅れ", "en": "{0} minutes late", "tc": "延遲{0}分", "sc": "延迟{0}分", "kr": "{0}분 지연" };
				if(unkouStatus === 1 || unkouStatus === 2){
					// 走行終了の場合は表示なし。
					if (!runStatus) return "";
					// 抑止の状態が「1:始発駅抑止」「2:抑止」なら抑止の詳細文言を表示。
					if (yokuStatus === 1 || yokuStatus === 2) return yokuDetail[lang];
					// 遅れが5分未満の場合は表示なし。
					if (chien < 5) return "";
					// 遅れが5分以上の場合は時分を表示
					if (chien >= 5) {
						let chienHour = Math.floor(chien / 60);
						let chienMin = chien % 60;
						if (chienHour > 0){
							if (chienMin > 0) return CHIEN_LABEL_DELAYED_HR_MIN[lang].replace("{0}", chienHour).replace("{1}", chienMin); // 「〇時間〇分遅れ」
							else return CHIEN_LABEL_DELAYED_HOUR[lang].replace("{0}",chienHour); // 「〇時間遅れ」
						} else {
							return CHIEN_LABEL_DELAYED_MINUTES[lang].replace("{0}", chienMin); // 「〇分遅れ」
						}
					}
				} else {
					return "";
				}
			})(yokuStatus, runStatus, chien);
			// 遅れ状態を取得できた場合は、画面に表示する。
			if (chienText) {
				$(dialog).find(".chien-text").text(chienText);
				$(dialog).find(".chien-item").removeClass("hide");
			}
		}
		/**
		 * ダイアログに｢運行状態｣を描画する。
		 * @param dialog ダイアログ要素。
		 * @param status 運行状態。0:全区間運休、1:運転、2:部分運休。
		 * @param statusDetail 運行状態の詳細を表す文言。
		 */
		function drawUnkouStatus(dialog, status, statusDetail) {
			const lang = document.documentElement.dataset.lang;
			// 運休がない場合は、運行状態を画面に表示しない。
			if (status === 1) {
				return;
			}
			// 運行状態名を取得する。
			const UNKOU_LABEL_ZENKYU = { "ja": "全区間運休", "en": "All sections cancelled", "tc": "全區間停駛", "sc": "全区间停驶", "kr": "전 구간<br>운행 중지" };
			const UNKOU_LABEL_BUBUNKYU = { "ja": "部分運休", "en": "Partially cancelled", "tc": "部分停駛", "sc": "部分停驶", "kr": "부분 운행<br>중지" };
			const unkouStatusText = status === 0 ? UNKOU_LABEL_ZENKYU[lang] : status === 2 ? UNKOU_LABEL_BUBUNKYU[lang] : "";
			// 運行状態名を取得できた場合は、画面に表示する。
			if (unkouStatusText) {
				$(dialog).find(".status-label").attr("data-status", status);
				$(dialog).find(".status-label").html(unkouStatusText);
				$(dialog).find(".status-item").removeClass("hide");
			}
			// 運行状態の詳細がある場合は、画面に表示する。
			if (statusDetail) {
				$(dialog).find(".status-text").text(statusDetail);
				$(dialog).find(".status-item").removeClass("hide");
			}
		}
		/**
		 * ダイアログに｢ダイヤデータ｣を描画する。
		 * @param dialog ダイアログ要素。
		 * @param cbango 列番。
		 * @param ekiMaster 駅マスタ。
		 * @param daiya ダイヤデータ。
		 */
		function drawDaiya(dialog, cbango, ekiMaster, daiya) {
			// ダイヤデータから、対象列番の列車データを取得する。
			const train = daiya.today.find(train => train.cbango === cbango);
			// 停車駅が1件以上ある場合は、｢ダイヤデータ｣部分を表示状態にする。
			if (train && train.stations && train.stations.length) {
				$(dialog).find(".station-list").removeClass("hide");
			}
			// 停車駅の一覧を作成する。
			train.stations.forEach((station, index, stations) => {
				// ｢列車｣のテンプレートを取得して、画面に追加する。
				const trainElement = (function(key) {
					const rowTemplate = (station === stations.slice(-1)[0] ? $(dialog).find(".template.arr") : $(dialog).find(".template.dep"))[0].cloneNode(true);
					$(rowTemplate).attr("key", key);
					$(rowTemplate).removeClass("template");
					$(dialog).find(".timetable tbody").append(rowTemplate);
					return $(dialog).find(".timetable tbody tr[key='" + key +"']");
				}(station.key));
				// 駅名を設定する。
				const eki = ekiMaster.find(eki => eki.key === station.key);
				if (eki) {
					$(trainElement).find(".name").text(eki[lang]);
				}
				// 時刻を設定する。
				$(trainElement).find(".time").text(station.time);
			});
		}
	}
	/**
	 * ダイアログの表示やクローズイベントに関する制御を適用する。
	 * @param dialog ダイアログ要素。
	 * @param isFirst 初回読み込みかどうか。このフラグが true の場合、｢閉じる｣イベントの設定などダイアログの初期処理を行う。
	 */
	function showDialog(dialog, isFirst) {
		// ダイアログを表示する。
		$(dialog).fadeIn("fast");
		// 本体のスクロールを無効にする。
		disabledBodyScroll();
		// 初回読み込み時の処理を行う。
		if (isFirst) {
			// ダイアログ内の非表示要素リストを取得する。
			const defaultHiddenElements = $(dialog).find(".hide");
			// ダイアログ内の｢閉じる｣ボタンをクリックしたときのイベントを追加する。
			$(dialog).on("click", ".close, .dialog-outer", () => {
				// ダイヤデータのスクロール位置をトップにする。
				$(dialog).find(".station-list").scrollTop(0);
				// ポップアップボックスを閉じる。
				$(dialog).fadeOut("fast", function() {
					if ($("#sideMenu .side-menu-outer").length) {
						if (!$("#sideMenu .side-menu-outer").is(":visible")) {
							// 本体のスクロールを有効にする。（走行位置ページの場合サイドメニュー非表示時）
							enableBodyScroll();
						}
					} else {
						// 本体のスクロールを有効にする。（トップページの場合）
						enableBodyScroll();
					}
					// ダイヤデータを元の状態に復元する。
					$(dialog).find(".timetable tbody tr:not('.template')").remove();
					// ダイアログ内の非表示要素リストを元の状態に復元する。
					$(defaultHiddenElements).addClass("hide");
				});
				// ローディングアニメーションを非表示にする。
				loading_animation_hidden();
			});
			// ｢閉じる｣ボタンのクリックイベントのバブリングを無効にする。
			$(dialog).on("click", ".dialog-outer .dialog", e => e.stopPropagation());
		}
	}
	/**
	 * ダイアログを開く際、本体のスクロールを無効にする。
	 */
	function disabledBodyScroll() {
		// 本体のスクロールバーの幅を取得する。
		const scrollbarWidth = window.innerWidth - document.body.clientWidth;
		// 右下の｢↑｣アイコンを非表示にする。
		$("#commonPageTop").hide();
		// 本体のスクロール位置を保存する。
		const scroll = $("body").css("overflow-y") == "hidden" ? scrollY : window.scrollY;
		$("body").data("scrollY", scroll);
		// 本体を固定する。
		$("body").css("position", "fixed");
		// 本体のスクロールバーを非表示にする。
		$("body").css("overflow-y", "hidden");
		// 非表示にしたスクロールバーの分だけ、本体とヘッダーの横幅を調整する。
		$("body").css("width", "calc(100% - " + scrollbarWidth + "px)");
		$("header").css("width", "calc(100% - " + scrollbarWidth + "px)");
		// トップページコンテンツのスクロール位置を調整する。
		if ($("#commonMainDiv").length) {
			$("#commonMainDiv").data("scrollY", scroll);
			$("#commonMainDiv").css("position", "relative");
			$("#commonMainDiv").css("top",  scroll * -1 - 10 + "px");
		}
		// 走行位置ページの場合は、サブヘッダーとサブフッターの横幅および走行位置のスクロール位置も調整する。
		if ($(".train-guide-contents").length) {
			// サブヘッダーとサブフッターの横幅を調整する。
			const contentsWidth = $(".train-guide-contents").width();
			$(".sub-header").css("width", contentsWidth + "px");
			$(".sub-footer").css("marginRight", scrollbarWidth + "px");
			$(".homen-footer-contents").css("width", contentsWidth + "px");
			$(".homen-footer-contents").css("marginRight", scrollbarWidth + "px");
			// 走行位置のスクロール位置を調整する。
			$(".station-list-contents").css("position", "relative");
			$(".station-list-contents").css("top",  scroll * -1 + "px");
		}
	}
	/**
	 * ダイアログを閉じる際、本体のスクロールを有効にする。
	 */
	function enableBodyScroll() {
		// トップページコンテンツのスクロール位置を調整する。
		if ($("#commonMainDiv").length) {
			$("#commonMainDiv").css("position", "");
			$("#commonMainDiv").css("top",  "");
		}
		// 走行位置ページの場合は、サブヘッダーとサブフッターの横幅および走行位置のスクロール位置も復元する。
		if ($(".train-guide-contents").length) {
			// サブヘッダーとサブフッターの横幅を復元する。
			$(".sub-header").css("width", "");
			$(".sub-footer").css("marginRight", "");
			$(".homen-footer-contents").css("width", "");
			$(".homen-footer-contents").css("marginRight", "");
			// 走行位置のスクロール位置を復元する。
			$(".station-list-contents").css("position", "");
			$(".station-list-contents").css("top", "");
		}
		// 本体のスクロールバーを表示する。
		$("body").css("overflow-y", "");
		// 本体の固定を解除する。
		$("body").css("position", "");
		// 本体とヘッダーの横幅を復元する。
		$("body").css("width", "");
		$("header").css("width", "");
		// 本体のスクロール位置を復元する。
		// 本体のスクロール位置を取得する。
		const scroll = $("body").data("scrollY");
		window.scrollTo(0, scroll);
		$("body").removeData("scrollY");
		// 右下の｢↑｣アイコンを表示する。
		if ($(this).scrollTop() > 100) $("#commonPageTop").show();
	}
}
