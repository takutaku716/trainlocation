const assert = require("assert");
const adapter = require("../js/jrkyushu_train_navi_adapter.js");

const request = adapter.buildTimetableRequest({
	cbango: "4131M",
	jrKyushu: {
		trainNavi: {
			drivingRouteCode: 600,
			stationCode: 91101270,
			currentStationCode: 91101320,
			upperLowerKbn: 1,
			drivingBaseDate: "2026-08-30"
		}
	}
});

assert.deepStrictEqual(request, {
	drivingRouteCode: "600",
	stationCode: "91101270",
	currentStationCode: "91101320",
	currentStationName: "",
	upperLowerKbn: "1",
	drivingRouteName: "",
	trainNumber: "4131M",
	drivingBaseDate: "2026-08-30",
	trainCrownCode: "",
	trainSignCode: "",
	trainGenkai: "",
	trainCompanyCode: "",
	lang: "ja"
});
assert.strictEqual(adapter.isValidTimetableRequest(request), true);
assert.match(adapter.makeTimetableUrl("https://example.test/", request), /\/trainnavi\/timetable\?/);

const nameRequest = adapter.buildTimetableRequest({
	cbango: "3125M",
	jrKyushu: {
		trainNavi: {
			currentStationName: "門司港",
			candidateStationNames: ["門司港", "門司", "門司"],
			drivingRouteName: "鹿児島本線",
			upperLowerKbn: 1
		}
	}
});
assert.strictEqual(adapter.isValidTimetableRequest(nameRequest), true);
assert.deepStrictEqual(nameRequest.candidateStationNames, ["門司港", "門司"]);
assert.match(adapter.makeTimetableUrl("https://example.test", nameRequest), /currentStationName=%E9%96%80%E5%8F%B8%E6%B8%AF/);

const response = {
	ok: true,
	matched: true,
	train: {
		trainNumber: "4131M",
		trainKindName: "快速",
		nickName: "",
		destinationStationName: "羽犬塚",
		cars: 6,
		delayMinutes: 3,
		suspension: false,
		operationCompleted: false
	},
	timetable: [
		{ stationName: "二日市", planArrival: "13:13:00", planDeparture: "13:14:00", time: "13:14:00" },
		{ stationName: "羽犬塚", planArrival: "13:45:00", planDeparture: "", time: "13:45:00", terminalStation: true }
	]
};

const normalized = adapter.normalizeTimetableResponse(response);
assert.strictEqual(normalized.timetable.length, 2);
assert.strictEqual(normalized.timetable[0].time, "13:14");
assert.strictEqual(normalized.timetable[1].terminalStation, true);

const dataset = {};
adapter.applyResponseToDataset(dataset, response, "ja");
assert.strictEqual(dataset.ressha_type_name, "快速");
assert.strictEqual(dataset.shu_eki, "羽犬塚 行き");
assert.strictEqual(dataset.ryosu, "6両");
assert.strictEqual(dataset.chien_text, "3分遅れ");
assert.strictEqual(JSON.parse(dataset.jrkyushu_timetable).length, 2);

const unmatchedDataset = { shu_eki: "既存行先" };
adapter.applyResponseToDataset(unmatchedDataset, { ok: true, matched: false, timetable: [] }, "ja");
assert.strictEqual(unmatchedDataset.shu_eki, "既存行先");
assert.deepStrictEqual(JSON.parse(unmatchedDataset.jrkyushu_timetable), []);

console.log("JR Kyushu Train Navi adapter tests passed");
