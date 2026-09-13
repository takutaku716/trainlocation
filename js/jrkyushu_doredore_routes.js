(function(root, factory) {
	if (typeof module === "object" && module.exports) {
		module.exports = factory();
	} else {
		root.JRKYUSHU_DOREDORE_ROUTES = factory();
	}
}(typeof self !== "undefined" ? self : this, function() {
	"use strict";
	return [
		{ rosen: "122", sourceId: "2", lineName: "鹿児島本線", displayName: "鹿児島本線（門司港～八代）", trainNaviRouteName: "鹿児島本線" },
		{ rosen: "123", sourceId: "51", lineName: "鹿児島本線", displayName: "鹿児島本線（川内～鹿児島）", trainNaviRouteName: "鹿児島本線" },
		{ rosen: "124", sourceId: "53", lineName: "福北ゆたか線・若松線", displayName: "福北ゆたか線・若松線", trainNaviRouteName: "福北ゆたか線" },
		{ rosen: "125", sourceId: "10", lineName: "日豊本線", displayName: "日豊本線", trainNaviRouteName: "日豊本線" },
		{ rosen: "126", sourceId: "5", lineName: "長崎本線", displayName: "長崎本線", trainNaviRouteName: "長崎本線" },
		{ rosen: "127", sourceId: "50", lineName: "長崎本線（長与経由）", displayName: "長崎本線（長与経由）", trainNaviRouteName: "長崎本線" },
		{ rosen: "128", sourceId: "55", lineName: "久大本線", displayName: "久大本線", trainNaviRouteName: "久大本線" },
		{ rosen: "129", sourceId: "17", lineName: "豊肥本線", displayName: "豊肥本線", trainNaviRouteName: "豊肥本線" },
		{ rosen: "130", sourceId: "9", lineName: "筑肥線", displayName: "筑肥線（下山門～西唐津）", trainNaviRouteName: "筑肥線" },
		{ rosen: "131", sourceId: "56", lineName: "筑肥線", displayName: "筑肥線（西唐津～伊万里）", trainNaviRouteName: "筑肥線" },
		{ rosen: "132", sourceId: "4", lineName: "香椎線", displayName: "香椎線", trainNaviRouteName: "香椎線" },
		{ rosen: "133", sourceId: "8", lineName: "唐津線", displayName: "唐津線", trainNaviRouteName: "唐津線" },
		{ rosen: "134", sourceId: "12", lineName: "日田彦山線", displayName: "日田彦山線", trainNaviRouteName: "日田彦山線" },
		{ rosen: "136", sourceId: "16", lineName: "後藤寺線", displayName: "後藤寺線", trainNaviRouteName: "後藤寺線" },
		{ rosen: "137", sourceId: "6", lineName: "佐世保線", displayName: "佐世保線", trainNaviRouteName: "佐世保線" },
		{ rosen: "138", sourceId: "54", lineName: "宮崎空港線", displayName: "宮崎空港線", trainNaviRouteName: "宮崎空港線" },
		{ rosen: "139", sourceId: "20", lineName: "指宿枕崎線", displayName: "指宿枕崎線", trainNaviRouteName: "指宿枕崎線" }
	];
}));
