import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../workers/jrkyushu_timetable_cache.js", import.meta.url), "utf8");
const workerModule = await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));
const upstreamRequests = [];

globalThis.fetch = async function(url) {
	const parsed = new URL(url);
	upstreamRequests.push(parsed);
	if (parsed.pathname.endsWith("/station/operationStatus")) {
		return Response.json({
			trainInfoList: [{
				trainCrownCode: 0,
				trainNumber: 4131,
				trainSignCode: 1,
				trainSignName: "M",
				trainGenkai: 0,
				trainCompanyCode: 1,
				drivingBaseDate: "2026-08-30",
				operationCompleted: false
			}]
		});
	}
	if (parsed.pathname.endsWith("/station/trainInfo")) {
		return Response.json({
			trainInfoDataList: [{
				trainCrownCode: 0,
				trainNumber: 4131,
				trainSignCode: 1,
				trainSignName: "M",
				trainGenkai: 0,
				trainCompanyCode: 1,
				drivingBaseDate: "2026-08-30",
				trainKindName: "快速",
				destinationStationName: "羽犬塚",
				cars: 6,
				delayMinutes: 0,
				suspension: false,
				operationCompleted: false,
				stopStationData: {
					stationDataList: [
						{ stationName: "二日市", departurePlatform: 2, mainTrainData: { arrivalTime: "13:13:00", departureTime: "13:14:00", startingStation: false, terminalStation: false } },
						{ stationName: "羽犬塚", departurePlatform: null, mainTrainData: { arrivalTime: "13:45:00", departureTime: null, startingStation: false, terminalStation: true } }
					]
				}
			}]
		});
	}
	return new Response("Not Found", { status: 404 });
};

const requestUrl = new URL("https://worker.example/trainnavi/timetable");
requestUrl.search = new URLSearchParams({
	drivingRouteCode: "600",
	stationCode: "91101270",
	currentStationCode: "91101320",
	upperLowerKbn: "1",
	trainNumber: "4131M",
	drivingBaseDate: "2026-08-30"
}).toString();

const response = await workerModule.default.fetch(new Request(requestUrl), {});
const body = await response.json();

assert.equal(response.status, 200);
assert.equal(body.ok, true);
assert.equal(body.matched, true);
assert.equal(body.train.trainNumber, "4131M");
assert.equal(body.train.destinationStationName, "羽犬塚");
assert.equal(body.timetable.length, 2);
assert.equal(body.timetable[0].time, "13:14");
assert.equal(body.timetable[1].terminalStation, true);
assert.equal(upstreamRequests.length, 1);
assert.equal(upstreamRequests[0].pathname, "/api/station/trainInfo");
assert.equal(upstreamRequests[0].searchParams.get("trainSignCode"), "1");

const invalidResponse = await workerModule.default.fetch(new Request("https://worker.example/trainnavi/timetable?trainNumber=4131M"), {});
assert.equal(invalidResponse.status, 400);

globalThis.fetch = async function() {
	return Response.json({ trainInfoList: [] });
};
const unmatchedResponse = await workerModule.default.fetch(new Request(requestUrl), {});
const unmatchedBody = await unmatchedResponse.json();
assert.equal(unmatchedResponse.status, 200);
assert.equal(unmatchedBody.matched, false);
assert.deepEqual(unmatchedBody.timetable, []);

const fallbackRequests = [];
globalThis.fetch = async function(url) {
	const parsed = new URL(url);
	fallbackRequests.push(parsed);
	if (parsed.pathname.endsWith("/findStationInput")) {
		return Response.json([{ stationCode: 91101360, stationName: "鳥栖" }]);
	}
	if (parsed.pathname.endsWith("/stationDetailInfo")) {
		return Response.json({
			drivingNumberingDirectionList: [
				{ drivingRouteName: "鹿児島本線", guidanceDrivingRouteCode: 600 },
				{ drivingRouteName: "長崎本線", guidanceDrivingRouteCode: 50 }
			]
		});
	}
	if (parsed.pathname.endsWith("/station/operationStatus")) {
		if (parsed.searchParams.get("drivingRouteCode") !== "50") return Response.json({ trainInfoList: [] });
		return Response.json({
			trainInfoList: [{
				trainCrownCode: 0,
				trainNumber: 4065,
				trainSignCode: 1,
				trainSignName: "M",
				trainGenkai: 0,
				trainCompanyCode: 1,
				drivingBaseDate: "2026-08-30",
				operationCompleted: false
			}]
		});
	}
	if (parsed.pathname.endsWith("/station/trainInfo")) {
		if (parsed.searchParams.get("drivingRouteCode") !== "50") {
			return new Response("Not Found", { status: 400 });
		}
		return Response.json({
			trainInfoDataList: [{
				trainCrownCode: 0,
				trainNumber: 4065,
				trainSignCode: 1,
				trainSignName: "M",
				trainGenkai: 0,
				trainCompanyCode: 1,
				drivingBaseDate: "2026-08-30",
				trainKindName: "特急",
				nickName: "みどり 65号",
				destinationStationName: "佐世保",
				cars: 6,
				stopStationData: {
					stationDataList: [
						{ stationName: "鳥栖", departurePlatform: 5, mainTrainData: { arrivalTime: "21:55:00", departureTime: "21:56:00", startingStation: false, terminalStation: false } },
						{ stationName: "佐世保", departurePlatform: 3, mainTrainData: { arrivalTime: "23:18:00", departureTime: null, startingStation: false, terminalStation: true } }
					]
				}
			}]
		});
	}
	return new Response("Not Found", { status: 404 });
};

const fallbackUrl = new URL("https://worker.example/trainnavi/timetable");
fallbackUrl.search = new URLSearchParams({
	currentStationName: "鳥栖",
	drivingRouteName: "鹿児島本線",
	upperLowerKbn: "1",
	trainNumber: "4065M",
	drivingBaseDate: "2026-08-30"
}).toString();
const fallbackResponse = await workerModule.default.fetch(new Request(fallbackUrl), {});
const fallbackBody = await fallbackResponse.json();
assert.equal(fallbackResponse.status, 200);
assert.equal(fallbackBody.matched, true);
assert.equal(fallbackBody.train.trainNumber, "4065M");
assert.equal(fallbackBody.train.nickName, "みどり 65号");
assert.equal(fallbackBody.timetable.length, 2);
assert.deepEqual(
	fallbackRequests.filter((request) => request.pathname.endsWith("/station/operationStatus")).map((request) => request.searchParams.get("drivingRouteCode")),
	[]
);
assert.deepEqual(
	fallbackRequests.filter((request) => request.pathname.endsWith("/station/trainInfo")).map((request) => request.searchParams.get("drivingRouteCode")),
	["600", "50"]
);

const cSignRequests = [];
globalThis.fetch = async function(url) {
	const parsed = new URL(url);
	cSignRequests.push(parsed);
	if (!parsed.pathname.endsWith("/station/trainInfo")) return new Response("Not Found", { status: 404 });
	return Response.json({
		trainInfoDataList: [{
			trainCrownCode: 0,
			trainNumber: 5797,
			trainSignCode: 3,
			trainSignName: "C",
			trainGenkai: 0,
			trainCompanyCode: 1,
			drivingBaseDate: "2026-08-30",
			trainKindName: "普通",
			destinationStationName: "宇美",
			stopStationData: { stationDataList: [] }
		}]
	});
};
const cSignUrl = new URL("https://worker.example/trainnavi/timetable");
cSignUrl.search = new URLSearchParams({
	drivingRouteCode: "40",
	stationCode: "91117080",
	currentStationCode: "91117080",
	upperLowerKbn: "1",
	trainNumber: "5797C",
	drivingBaseDate: "2026-08-30"
}).toString();
const cSignResponse = await workerModule.default.fetch(new Request(cSignUrl), {});
const cSignBody = await cSignResponse.json();
assert.equal(cSignBody.matched, true);
assert.equal(cSignRequests.length, 1);
assert.equal(cSignRequests[0].pathname, "/api/station/trainInfo");
assert.equal(cSignRequests[0].searchParams.get("trainSignCode"), "3");

const unknownSignRequests = [];
globalThis.fetch = async function(url) {
	const parsed = new URL(url);
	unknownSignRequests.push(parsed);
	if (parsed.pathname.endsWith("/station/operationStatus")) {
		return Response.json({
			trainInfoList: [{
				trainCrownCode: 0,
				trainNumber: 700,
				trainSignCode: 99,
				trainSignName: "X",
				trainGenkai: 0,
				trainCompanyCode: 1,
				drivingBaseDate: "2026-08-30",
				operationCompleted: false
			}]
		});
	}
	if (parsed.pathname.endsWith("/station/trainInfo")) {
		return Response.json({
			trainInfoDataList: [{
				trainCrownCode: 0,
				trainNumber: 700,
				trainSignCode: 99,
				trainSignName: "X",
				trainGenkai: 0,
				trainCompanyCode: 1,
				drivingBaseDate: "2026-08-30",
				trainKindName: "普通",
				destinationStationName: "試験",
				stopStationData: { stationDataList: [] }
			}]
		});
	}
	return new Response("Not Found", { status: 404 });
};
const unknownSignUrl = new URL("https://worker.example/trainnavi/timetable");
unknownSignUrl.search = new URLSearchParams({
	drivingRouteCode: "600",
	stationCode: "91101270",
	currentStationCode: "91101270",
	upperLowerKbn: "1",
	trainNumber: "700X",
	drivingBaseDate: "2026-08-30"
}).toString();
const unknownSignResponse = await workerModule.default.fetch(new Request(unknownSignUrl), {});
const unknownSignBody = await unknownSignResponse.json();
assert.equal(unknownSignBody.matched, true);
assert.deepEqual(
	unknownSignRequests.map((request) => request.pathname),
	["/api/station/operationStatus", "/api/station/trainInfo"]
);
assert.equal(unknownSignRequests[1].searchParams.get("trainSignCode"), "99");

console.log("JR Kyushu Train Navi worker tests passed");
