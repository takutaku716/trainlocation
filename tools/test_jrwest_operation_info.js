const adapter = require("../js/jrwest_operation_info_adapter.js");

function assert(condition, message) {
	if (!condition) throw new Error(message);
}

const sample = {
	areaTrafficInfos: [
		{
			id: 2,
			dailyData: [{
				placeTrafficInfos: [{
					conventionalLineTrafficInfos: [
						{
							id: 3,
							lineName: "ＪＲ京都線",
							iconType: "0003",
							conventionalLineTrafficInfoDetails: [{
								trafficId: 100,
								conditionName: "遅れ",
								versionDetail: [{ updatedAt: "2026-08-22T12:34:00+09:00", title: "遅れのお知らせ", body: "列車に遅れが発生しています。" }]
							}]
						},
						{
							id: 4,
							lineName: "ＪＲ神戸線",
							conventionalLineTrafficInfoDetails: [{
								trafficId: 100,
								conditionName: "遅れ",
								versionDetail: [{ title: "同一事象", body: "同じ事象の重複レコードです。" }]
							}, {
								trafficId: 101,
								conditionName: "運転見合わせ",
								versionDetail: [{ title: "運転見合わせ", body: "運転を見合わせています。" }]
							}]
						}
					]
				}]
			}]
		}
	]
};

const notices = adapter.getNotices(sample, [3, 4]);
assert(notices.length === 2, "trafficIdが同じ事象は重複排除されること");
assert(notices[0].lineName === "ＪＲ京都線", "対象線区名を保持すること");
assert(notices[0].lineNames.join("|") === "ＪＲ京都線|ＪＲ神戸線", "重複事象の影響線区はすべて保持すること");
assert(notices[0].severity === "delay", "遅れを判定できること");
assert(notices[1].severity === "suspend", "運転見合わせを判定できること");
assert(adapter.getNotices(sample, [99]).length === 0, "対象外線区を除外すること");
assert(adapter.getNotices("invalid", [3]).length === 0, "不正JSONでも停止しないこと");

console.log("JR西日本在来線運行情報アダプター: OK");
