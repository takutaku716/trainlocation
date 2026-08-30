const assert = require("assert");
const adapter = require("../js/jrkyushu_doredore_location_adapter.js");

const html = `
<meta name="datetimestamp" content="2026/08/30 13:53:00">
<tr title="KUKAN1" id="EKINO201"><td class="auto-style1"><a href="#EKINO">門司港<br></a><a href="https://www.jrkyushu-timetable.jp/?c=1">時刻</a></td><td title="3125M" background="image/MdwnRetK.png">二日市行<br><br>定刻</td></tr>
<tr title="KUKAN2" id="EKINO"><td class="auto-style6">小森江<br>新宮中央<br></td><td title="3126M" background="image/MupRetK.png">門司港行<br><br>3分遅れ</td></tr>
<tr title="KUKAN3" id="EKINO"><td class="auto-style6"></td></tr>
<tr title="KUKAN4" id="EKINO203"><td class="auto-style1"><a href="#EKINO">門司<br></a><a href="https://www.jrkyushu-timetable.jp/?c=2">時刻</a></td><td title="構85M" background="image/Mup.png">構内行<br><br>定刻</td></tr>`;

const normalized = adapter.normalize(html, {
	senku: "122",
	sourceId: "2",
	lineName: "鹿児島本線",
	trainNaviRouteName: "鹿児島本線"
});

assert.strictEqual(normalized.rows.length, 4);
assert.strictEqual(normalized.location.trains.length, 3);
assert.strictEqual(normalized.location.trains[0].pos, "JQK02P001D");
assert.strictEqual(normalized.location.trains[0].type, "9");
assert.strictEqual(normalized.location.trains[0].typeLabel, "区間快速");
assert.strictEqual(normalized.location.trains[0].name, "区間快速列車");
assert.strictEqual(normalized.location.trains[0].jrKyushu.trainNavi.currentStationName, "門司港");
assert.deepStrictEqual(normalized.location.trains[0].jrKyushu.trainNavi.candidateStationNames, ["門司港", "門司"]);
assert.strictEqual(normalized.location.trains[1].pos, "JQK02P002U");
assert.strictEqual(normalized.location.trains[1].type, "9");
assert.strictEqual(normalized.location.trains[1].typeLabel, "区間快速");
assert.strictEqual(normalized.location.trains[1].name, "区間快速列車");
assert.strictEqual(normalized.location.trains[1].chien, 3);
assert.strictEqual(normalized.location.trains[1].jrKyushu.trainNavi.currentStationName, "門司");
assert.deepStrictEqual(normalized.location.trains[1].jrKyushu.trainNavi.candidateStationNames, ["門司", "門司港"]);
assert.strictEqual(normalized.location.trains[2].cbango, "構85M");
assert.strictEqual(normalized.location.trains[2].type, "7");
assert.strictEqual(normalized.location.trains[2].typeLabel, "入替車両");
assert.strictEqual(normalized.location.trains[2].name, "入替車両");
assert.strictEqual(normalized.location.trains[2].jrKyushu.isYardSwitching, true);
assert.strictEqual(normalized.location.trains[2].jrKyushu.typeSimple, "入");
assert.strictEqual(normalized.location.trains[2].jrKyushu.trainNavi, null);
assert.strictEqual(normalized.rows[1].isNonInterlocked, true);
assert.deepStrictEqual(normalized.rows[1].stationNames, ["小森江", "新宮中央"]);
assert.strictEqual(normalized.rows[2].isNonInterlocked, false);

const longStationHtml = `
<tr title="KUKAN1" id="EKINO201"><td class="auto-style1"><a href="#EKINO">小波瀬<br>西工大前<br></a><a href="https://www.jrkyushu-timetable.jp/?c=1">時刻</a></td></tr>
<tr title="KUKAN2" id="EKINO202"><td class="auto-style1">西有田信号所</td></tr>
<tr title="KUKAN3" id="EKINO203"><td class="auto-style1">北九州<br>ターミナル</td></tr>`;
const longStationRows = adapter.parseRows(longStationHtml);
assert.deepStrictEqual(longStationRows[0].stationNames, ["小波瀬西工大前"]);
assert.deepStrictEqual(longStationRows[1].stationNames, ["西有田信号場"]);
assert.deepStrictEqual(longStationRows[2].stationNames, ["北九州貨物ターミナル"]);
const longStationRouteHtml = adapter.buildRouteHtml(longStationHtml, { sourceId: "10" });
assert.match(longStationRouteHtml, />小波瀬西工大前<\/div>/);
assert.doesNotMatch(longStationRouteHtml, /小波瀬<br>西工大前/);
assert.match(longStationRouteHtml, /西有田信号場/);
assert.doesNotMatch(longStationRouteHtml, /信号所/);
assert.match(longStationRouteHtml, /北九州貨物ターミナル/);

const ordinary = adapter.normalize(`
<tr title="KUKAN1" id="EKINO201"><td class="auto-style1">宮崎</td><td title="6863M" background="image/Mdwn.png">西都城行<br><br>定刻</td></tr>
`, { sourceId: "10" }).location.trains[0];
assert.strictEqual(ordinary.cbango, "6863M");
assert.strictEqual(ordinary.name, "普通列車");

const routeHtml = adapter.buildRouteHtml(html, { sourceId: "2" });
assert.match(routeHtml, /eki-panel hirendo/);
assert.match(routeHtml, /hirendo-contents/);
assert.match(routeHtml, /stalist-eki-link two-eki/);
assert.strictEqual((routeHtml.match(/data-station-selectable="1"/g) || []).length, 4);
assert.match(routeHtml, /小森江/);
assert.match(routeHtml, /新宮中央/);
assert.match(routeHtml, /JQK02P002D/);

const facilityHtml = `
<tr title="KUKAN1" id="EKINO201"><td class="auto-style1"><a href="#EKINO">門司港<br></a><a href="https://www.jrkyushu-timetable.jp/?c=1">時刻</a></td></tr>
<tr title="KUKAN2" id="EKINO202"><td class="auto-style1">北九州貨物ターミナル</td></tr>
<tr title="KUKAN3" id="EKINO203"><td class="auto-style1">東小倉</td></tr>
<tr title="KUKAN4" id="EKINO204"><td class="auto-style1">川尻信号場</td></tr>`;
const facilityRouteHtml = adapter.buildRouteHtml(facilityHtml, { sourceId: "2" });
assert.strictEqual((facilityRouteHtml.match(/data-station-selectable="1"/g) || []).length, 1);

const locationMaster = adapter.buildLocationMasterEntries(normalized.rows, { sourceId: "2", lineName: "鹿児島本線" });
assert.strictEqual(locationMaster.JQK02P001U, "門司港");
assert.strictEqual(locationMaster.JQK02P001D, "門司港");
assert.strictEqual(locationMaster.JQK02P002D, "門司港→門司 間");
assert.strictEqual(locationMaster.JQK02P002U, "門司→門司港 間");
assert.strictEqual(locationMaster.JQK02P003D, "門司港→門司 間");
assert.strictEqual(locationMaster.JQK02P003U, "門司→門司港 間");
assert.strictEqual(locationMaster.JQK02P004U, "門司");
assert.strictEqual(locationMaster.JQK02P004D, "門司");

console.log("JR Kyushu Doredore location adapter tests passed");
