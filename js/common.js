window.onscroll = function(){
	if ($(this).scrollTop() > 100) {  //100pxスクロールしたら表示
		$("#commonPageTop").fadeIn();
	} else {
		$("#commonPageTop").fadeOut();
	}
};

$(function ($) {
	// 言語コードを取得する。
	const lang = document.documentElement.dataset.lang;

	// ヘッダーを埋め込み表示する。
	if ($("header").length) {
		// キャッシュバスター値を生成する。(UNIX元期からの経過ミリ秒数を右に16ビットシフトした値。2の16乗＝65536ミリ秒≒約1分間隔でキャッシュを無効化する)
		const now = Date.now() >>> 16;
		// ヘッダーHTMLのURLを算出する。
		const url = (lang === "ja" ? "./call_common_header.html" : "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/trainlocation/call_common_header_" + lang + ".html") + "?" + now;
		// ヘッダーを埋め込み表示する。
		$("header").load(url, () => {
			// ヘッダーに「現在日時」を表示する。
			const timestamp = $("header").data("timestamp");
			if (timestamp) $("#timestamp").text(timestamp);
			if ($("#headerTrainListLink").length) {
				const currentRosen = get_current_hash_rosen();
				const targetHash = currentRosen ? "rosen=" + currentRosen : "";
				$("#headerTrainListLink").attr("href", build_page_url("./train_list.html", targetHash));
			}
			ensure_test_mode_ui();
			start_test_mode_layout_observer();

			// ヘッダーの｢メニュー(開く)｣アイコンをクリックしたときのイベントを追加する。
			$(document).on("click", "#headerMenuOpen", () => {
				// 運行情報ボックスを開く。
				$("#menuLayer").stop().slideToggle();
				// ｢メニュー｣アイコンの｢開く｣｢閉じる｣を切り替える。
				$("#headerMenuOpen").toggleClass("hide");
				$("#headerMenuClose").toggleClass("hide");
			});

			// ヘッダーの｢メニュー(閉じる)｣アイコンをクリックしたときのイベントを追加する。
			$(document).on("click", "#headerMenuClose, #menuLayer", () => {
				// 運行情報ボックスを閉じる。
				$("#menuLayer").stop().slideToggle("fast");
				// ｢メニュー｣アイコンの｢開く｣｢閉じる｣を切り替える。
				$("#headerMenuOpen").toggleClass("hide");
				$("#headerMenuClose").toggleClass("hide");
			});

			// ヘッダーの｢使い方｣アイコンをクリックしたときのイベントを追加する。
			$(document).on("click", "#headerHowToUse, #commonAttention #attentionGuide", () => {
				// 初回クリック時は、｢使い方｣をロードして埋め込む。
				if (!$("#guideDetail").children().length) {
					// ｢使い方｣HTMLのURLを算出する。
					const url = (lang === "ja" ? "./guide/call_guide.html" : "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/trainlocation/call_guide_" + lang + ".html")
					// ｢使い方｣を埋め込む。
					$("#guideDetail").load(url, () => {
						// 使い方ボックス内の｢閉じる｣ボタンをクリックしたときのイベントを追加する。
						$(document).on("click", "section#guideDetail, section#guideDetail .common-subtitle.header", function () {
							// 使い方ボックスを閉じる。
							$("section#guideDetail").fadeOut("fast");
							if ($("#sideMenu .side-menu-outer").length) {
								if (!$("#sideMenu .side-menu-outer").is(":visible")) {
									// ダイアログを閉じたときのbodyのスクロールの制御（走行位置ページの場合サイドメニュー非表示時）
									set_scroll_show($("#guideDetail .dialog"));
								}
							} else {
								// ダイアログを閉じたときのbodyのスクロールの制御（トップページの場合）
								set_scroll_show($("#guideDetail .dialog"));
							}
						});
						// バブリングを停止する。
						$(document).on("click", "section#guideDetail .dialog", function (event) {
							event.stopPropagation();
						});
						// ｢使い方｣ボックスを開く。
						showGuideDetail();
                        update_guide_test_mode_button();
						// ｢ご利用上の注意｣を埋め込み表示する。
						if ($("#guideDetailAttention").length) {
							// ｢ご利用上の注意｣HTMLのURLを算出する。
							const url = $("#guideDetailAttention").data("url") + "?" + now;
							// ｢ご利用上の注意｣を埋め込み表示する。
							$("#guideDetailAttention").load(url, () => {
								if ($("#guideDetailAttention").children().length) {
									$("#commonAttention").show();
								}
							});
						}
					});
				} else {
					// ｢使い方｣ボックスを開く。
					showGuideDetail();
                        update_guide_test_mode_button();
				}
				// ｢使い方｣ボックスを開く。
				function showGuideDetail() {
					// ｢使い方｣ボックスを開く。
					$("section#guideDetail").fadeIn("fast");
					$("#guideDetailMain").scrollTop(0);
					// ダイアログを開くときのbodyのスクロールの制御
					set_scroll_hide($("#guideDetail .dialog"));
				}
			});
		});
	}

	// 内部リンクを埋め込み表示する。
	if ($("#commonInternalLinks").length) {
		// キャッシュバスター値を生成する。(UNIX元期からの経過ミリ秒数を右に16ビットシフトした値。2の16乗＝65536ミリ秒≒約1分間隔でキャッシュを無効化する)
		const now = Date.now() >>> 16;
		// 内部リンクHTMLのURLを算出する。
		const url = $("#commonInternalLinks").data("url") + "?" + now;
		// 内部リンクを埋め込み表示する。
		$("#commonInternalLinks").load(url);
		// 内部リンクのTwitterボタンを押下したときの動き
		$(document).on("click", function(event) {
			if(!$(event.target).closest(".common-internal-links li.twitter div").length) {
				$(".common-internal-links li.twitter ul").hide();
			} else {
				if ($(".common-internal-links li.twitter ul").is(":visible")) {
					$(".common-internal-links li.twitter ul").hide();
				} else {
					$(".common-internal-links li.twitter ul").show();
				}
			}
		});
	}

	// ｢ご利用上の注意｣を埋め込み表示する。
	if ($("#commonAttentionBody").length) {
		// キャッシュバスター値を生成する。(UNIX元期からの経過ミリ秒数を右に16ビットシフトした値。2の16乗＝65536ミリ秒≒約1分間隔でキャッシュを無効化する)
		const now = Date.now() >>> 16;
		// ｢ご利用上の注意｣HTMLのURLを算出する。
		const url = $("#commonAttentionBody").data("url") + "?" + now;
		// ｢ご利用上の注意｣を埋め込み表示する。
		$("#commonAttentionBody").load(url, function() {
			if ($("#commonAttentionBody").children().length) {
				// 表示する内容が存在する場合、｢ご利用上の注意｣に表示／非表示切替イベントを追加する。
				$(document).on("click", "#commonAttention .common-subtitle.toggle", function() {
					$(this).next().stop().slideToggle();
					$(this).toggleClass("open");
				});
				$("#commonAttention").show();
			}
		});
	}

	// ｢運行情報メニュー｣を埋め込み表示する。
	if ($("#commonUnkouInfoMenu").length) {
		// キャッシュバスター値を生成する。(UNIX元期からの経過ミリ秒数を右に16ビットシフトした値。2の16乗＝65536ミリ秒≒約1分間隔でキャッシュを無効化する)
		const now = Date.now() >>> 16;
		// ｢運行情報メニュー｣HTMLのURLを算出する。
		const url = $("#commonUnkouInfoMenu").data("url") + "?" + now;
		// ｢運行情報メニュー｣を埋め込み表示する。
		$("#commonUnkouInfoMenu").load(url);
		// ｢運行情報メニュー｣のTwitterボタンを押下したときの動き
		$(document).on("click", function(event) {
			if(!$(event.target).closest("#unkouInfoMenuList li.twitter div").length) {
				$("#unkouInfoMenuList li.twitter ul").hide();
			} else {
				if ($("#unkouInfoMenuList li.twitter ul").is(":visible")) {
					$("#unkouInfoMenuList li.twitter ul").hide();
				} else {
					$("#unkouInfoMenuList li.twitter ul").show();
				}
			}
		});
	}

	// バブリングを停止
	$(document).on("click", "#menuLayer .menu, #oshiraseDetail .dialog", function(event) {
		event.stopPropagation();
	});

	// 画面右下の｢↑｣アイコンをクリックしたときのイベントを追加する。
	$(document).on("click", "#commonPageTop", function() {
		window.scroll({top: 0, behavior: "smooth"});
	});

	// お知らせダイアログ内の｢閉じる｣ボタンをクリックしたときの動き
	$(document).on("click", "#oshiraseDetail, #oshiraseDetail .close", function() {
		// お知らせダイアログを閉じる。
		$('#loaderBg').fadeOut("fast");
		$("#oshiraseDetail").fadeOut("fast");
		// ダイアログを閉じる時のbodyのスクロールの制御
		set_scroll_show($("#oshiraseDetail .dialog"));
	});

	// ｢お知らせ｣のヘッダーをクリックしたときの動き
$(document).on("click", "#commonOshirase div .toggle", function() {
        $(this).next().stop().slideToggle();
        $(this).toggleClass("open");
    });

    ensure_test_mode_ui();
    update_guide_test_mode_button();
    start_test_mode_layout_observer();
    $(window).on("resize", update_test_mode_exit_button_position);
});

/*
 * エラーメッセージを取得します。
 */
function get_test_mode_labels() {
	const lang = document.documentElement.dataset.lang;
	return {
		"badge": ({
			"ja": "\u30c6\u30b9\u30c8\u30e2\u30fc\u30c9",
			"en": "TEST MODE",
			"tc": "TEST MODE",
			"sc": "TEST MODE",
			"kr": "TEST MODE"
		})[lang] || "TEST MODE",
		"exitLine1": ({
			"ja": "\u30c6\u30b9\u30c8",
			"en": "TEST",
			"tc": "TEST",
			"sc": "TEST",
			"kr": "TEST"
		})[lang] || "TEST",
		"exitLine2": ({
			"ja": "\u7d42\u4e86",
			"en": "EXIT",
			"tc": "EXIT",
			"sc": "EXIT",
			"kr": "EXIT"
		})[lang] || "EXIT"
	};
}

function enable_test_mode() {
	const url = new URL(location.href);
	url.searchParams.set("test", "1");
	location.href = url.pathname + "?" + url.searchParams.toString() + url.hash;
}

function get_current_hash_rosen() {
	const params = location.hash.slice(1).split("&");
	if (params.length > 0 && params[0].indexOf("rosen=") >= 0) {
		return params[0].slice(-2);
	}
	return "";
}

function update_guide_test_mode_button() {
	const button = $("#guideTestModeEntry");
	if (!button.length) return;
	button.toggle(!is_test_mode());
}

function end_test_mode() {
	const url = new URL(location.href);
	url.searchParams.delete("test");
	url.searchParams.delete("scenario");
	location.href = url.pathname + (url.searchParams.toString() ? "?" + url.searchParams.toString() : "") + url.hash;
}

function update_test_mode_exit_button_position() {
	const button = $("#commonTestModeExit");
	if (!button.length || !is_test_mode()) return;
	let bottom = $("#commonPageTop").length ? 90 : 10;
	const subFooter = $(".sub-footer");
	if (subFooter.length) {
		const footerBottom = parseFloat(subFooter.css("bottom")) || 0;
		bottom = Math.max(bottom, footerBottom + subFooter.outerHeight() + 10);
	}
	button.css("bottom", bottom + "px");
}

function ensure_test_mode_ui() {
	if (!is_test_mode()) {
		$("#commonTestModeBadge").remove();
		$("#commonTestModeExit").remove();
		return;
	}

	const labels = get_test_mode_labels();
	if ($("header #headerMain .title").length && !$("#commonTestModeBadge").length) {
		$("header #headerMain .title").append("<span id='commonTestModeBadge' class='test-mode-badge'></span>");
	}
	$("#commonTestModeBadge").text(labels.badge);

	if (!$("#commonTestModeExit").length) {
		$("body").append("<div id='commonTestModeExit'><button type='button' id='commonTestModeExitBtn'><span class='line1'></span><span class='line2'></span></button></div>");
	}
	$("#commonTestModeExitBtn .line1").text(labels.exitLine1);
	$("#commonTestModeExitBtn .line2").text(labels.exitLine2);
	update_test_mode_exit_button_position();
}

function start_test_mode_layout_observer() {
	if (!is_test_mode() || !window.MutationObserver) return;
	if (window.__testModeLayoutObserverStarted) return;
	window.__testModeLayoutObserverStarted = true;
	const subFooter = document.querySelector(".sub-footer");
	if (!subFooter) return;
	const observer = new MutationObserver(function() {
		update_test_mode_exit_button_position();
	});
	observer.observe(subFooter, { attributes: true, childList: true, subtree: true });
}

$(document).on("click", "#commonTestModeExitBtn", function() {
    end_test_mode();
});

$(document).on("click", "#guideTestModeBtn", function() {
    enable_test_mode();
});
function get_error_message() {
	let lang = document.documentElement.dataset.lang;
	let errormessage = "";
	if (lang == "ja") errormessage = "データを取得できませんでした。";
	if (lang == "en") errormessage = "Failed to acquire data.";
	if (lang == "tc") errormessage = "無法取得資訊。";
	if (lang == "sc") errormessage = "无法取得信息。";
	if (lang == "kr") errormessage = "데이터를 취득하지 못했습니다.";

	return errormessage;
}
