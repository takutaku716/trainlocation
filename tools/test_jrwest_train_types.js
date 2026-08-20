const assert = require("assert");
const adapter = require("../js/jrwest_location_adapter.js");
const master = require("../original/jrwest_train_type_class_master.json");

const cases = [
  ["wide_area", "hokuriku", "01", "新快速", "special_rapid"],
  ["wide_area", "hokuriku", "02", "直通快速", "direct_rapid"],
  ["wide_area", "fukuchiyama", "05", "丹波路快速", "tambaji_rapid"],
  ["wide_area", "kinokuni", "06", "紀州路快速", "kishuji_rapid"],
  ["wide_area", "nara", "07", "みやこ路快速", "miyakoji_rapid"],
  ["wide_area", "sanyo1", "11", "シャトル", "shuttle"],
  ["wide_area", "sanyo1", "13", "急行", "express"],
  ["wide_area", "sanyo1", "14", "寝台特急", "sleeper"],
  ["wide_area", "yamaguchi", "15", "SL", "steam_locomotive"],
  ["wide_area", "sanin4", "16", "観光列車", "sightseeing"],
  ["wide_area", "sanin4", "17", "瑞風", "mizukaze"],
  ["wide_area", "sanyo1", "18", "臨時", "special"],
  ["wide_area", "sanyo1", "19", "臨時特急", "special_limited_express"],
  ["kinki", "kyoto", "06", "新快速", "special_rapid"],
  ["kinki", "kyoto", "03", "寝台特急", "sleeper"],
  ["kinki", "takarazuka", "29", "丹波路快速", "tambaji_rapid"],
  ["kinki", "kansaiairport", "30", "関空快速", "kansai_airport_rapid"],
  ["kinki", "hanwahagoromo", "31", "紀州路快速", "kishuji_rapid"],
  ["kinki", "yamatoji", "32", "大和路快速", "yamatoji_rapid"],
  ["kinki", "kansaiairport", "37", "関空/紀州路快速", "kansai_airport_kishuji_rapid"],
  ["kinki", "nara", "38", "みやこ路快速", "miyakoji_rapid"],
  ["kinki", "osakahigashi", "39", "直通快速", "direct_rapid"],
  ["kinki", "hanwahagoromo", "40", "B快速", "b_rapid"],
  ["kinki", "yumesaki", "41", "シャトル", "shuttle"],
  ["kinki", "kyoto", "19", "臨時", "special"]
];

for (const [classSystem, lineId, type, label, semanticType] of cases) {
  const result = adapter.mapTrainType(
    { type, displayType: "" },
    { classSystem, lineId }
  );
  assert.strictEqual(result.classSystem, classSystem, `${lineId}:${type} class system`);
  assert.strictEqual(result.label, label, `${lineId}:${type} label`);
  assert.strictEqual(result.semanticType, semanticType, `${lineId}:${type} semantic type`);
}

assert.strictEqual(
  adapter.mapTrainType({ type: "03" }, { lineId: "kyoto" }).label,
  "寝台特急",
  "Kinki type 03"
);
assert.strictEqual(
  adapter.mapTrainType({ type: "03" }, { lineId: "setoohashi" }).label,
  "快速",
  "Wide-area type 03"
);
assert.strictEqual(
  adapter.mapTrainType(
    { type: "99", displayType: "○関空／紀州路快速" },
    { lineId: "kyoto" }
  ).label,
  "関空/紀州路快速",
  "Display type fallback"
);

const requestedSimpleLabels = {
  "新快速": "新",
  "直通快速": "直",
  "丹波路快速": "丹",
  "紀州路快速": "紀",
  "みやこ路快速": "都",
  "シャトル": "シ",
  "急行": "急",
  "寝台特急": "寝",
  "SL": "S",
  "観光列車": "観",
  "瑞風": "瑞",
  "臨時": "臨",
  "臨時特急": "臨",
  "大和路快速": "大",
  "関空快速": "関",
  "関空/紀州路快速": "関紀",
  "区間快速": "区快",
  "B快速": "B"
};

for (const [label, simpleLabel] of Object.entries(requestedSimpleLabels)) {
  const result = adapter.mapTrainType(
    { type: "99", displayType: label },
    { lineId: "kyoto" }
  );
  assert.strictEqual(result.label, label, `${label} detail label`);
  assert.strictEqual(result.simpleLabel, simpleLabel, `${label} simple label`);
}

const coloredRapid = { type: "06", dest: { line: "hokuriku" } };
const coloredRapidType = adapter.mapTrainType(coloredRapid, { lineId: "kyoto" });
assert.strictEqual(
  adapter.getLineColorIconCode(coloredRapid, { lineId: "kyoto" }, coloredRapidType),
  "kka",
  "Explicit destination line color"
);

const noLineRapid = { type: "06", dest: { text: "網干" } };
const noLineRapidType = adapter.mapTrainType(noLineRapid, { lineId: "kyoto" });
assert.strictEqual(
  adapter.getLineColorIconCode(noLineRapid, { lineId: "kyoto" }, noLineRapidType),
  "",
  "Generic icon without destination line"
);

const limitedExpress = { type: "01", dest: { line: "hokuriku" } };
const limitedExpressType = adapter.mapTrainType(limitedExpress, { lineId: "kyoto" });
assert.strictEqual(
  adapter.getLineColorIconCode(limitedExpress, { lineId: "kyoto" }, limitedExpressType),
  "",
  "Generic limited express icon"
);

const sleeperExpress = { type: "03", dest: { line: "hokuriku" } };
const sleeperExpressType = adapter.mapTrainType(sleeperExpress, { lineId: "kyoto" });
assert.strictEqual(sleeperExpressType.type, "1", "Red sleeper type");
assert.strictEqual(
  adapter.getLineColorIconCode(sleeperExpress, { lineId: "kyoto" }, sleeperExpressType),
  "",
  "Generic red sleeper icon"
);

const normalized = adapter.normalize(
  {
    update: "2026-08-09T12:00:00+09:00",
    trains: [{
      no: "TEST1M",
      direction: 1,
      pos: "0402",
      type: "03",
      displayType: "",
      via: "湖西線",
      typeChange: "高槻－明石間快速",
      dest: { text: "大阪", code: "0416" }
    }]
  },
  { stations: [{ info: { code: "0402", name: "京都" } }] },
  {},
  "2026-08-09T12:00:00+09:00",
  { areaId: "kinki", lineId: "kyoto", senku: "61", stationCodes: ["0402"] }
);

assert.strictEqual(normalized.trains[0].typeLabel, "寝台特急", "Normalized detail label");
assert.strictEqual(normalized.trains[0].jrWest.semanticType, "sleeper", "Normalized icon type");
assert.strictEqual(normalized.trains[0].jrWest.lineColorIconCode, "", "Normalized generic icon");
assert.strictEqual(normalized.trains[0].jrWest.via, "湖西線", "Normalized via line");
assert.strictEqual(normalized.trains[0].jrWest.typeChange, "高槻－明石間快速", "Normalized type change");

const typeChangeViaText = "「うれしート」（有料座席） 学研都市線経由";
const typeChangeVia = adapter.normalize(
  {
    update: "2026-08-10T13:41:04+09:00",
    trains: [{
      no: "5548M",
      direction: 0,
      pos: "1321_1322",
      type: "63",
      displayType: "う快速○",
      via: "",
      typeChange: typeChangeViaText,
      dest: { text: "奈良", code: "3020", line: "yamatoji" }
    }]
  },
  {
    stations: [
      { info: { code: "1321", name: "放出" } },
      { info: { code: "1322", name: "鴫野" } }
    ]
  },
  {},
  "2026-08-10T13:41:04+09:00",
  { areaId: "kinki", lineId: "gakkentoshi", senku: "65", stationCodes: ["1321", "1322"] }
).trains[0];

assert.strictEqual(typeChangeVia.jrWest.via, "学研都市線", "Via line extracted from typeChange");
assert.strictEqual(typeChangeVia.jrWest.typeChange, typeChangeViaText, "typeChange guidance remains unchanged");

const setoStationNames = [
  "岡山", "大元", "備前西市", "妹尾", "備中箕島", "早島",
  "久々原", "茶屋町", "植松", "木見", "上の町", "児島"
];
const setoStationCodes = [
  "0245", "0246", "0247", "0248", "0249", "0250",
  "0251", "0252", "0253", "0254", "0255", "0256"
];
const setoStations = setoStationCodes.map((code, index) => ({
  info: {
    code,
    name: setoStationNames[index],
    notDisplayType: ["0249", "0253", "0254", "0255"].includes(code) ? 5 : null
  }
}));
const setoNonDisplay = adapter.normalize(
  {
    update: "2026-08-09T12:00:00+09:00",
    trains: [
      { no: "TEST-D1", direction: 1, pos: "0249_####", type: "03", dest: "児島" },
      { no: "TEST-U1", direction: 0, pos: "0249_####", type: "03", dest: "岡山" },
      { no: "TEST-D2", direction: 1, pos: "0253_####", type: "03", dest: "児島" },
      { no: "TEST-U2", direction: 0, pos: "0254_####", type: "03", dest: "岡山" }
    ]
  },
  { stations: setoStations },
  {},
  "2026-08-09T12:00:00+09:00",
  {
    areaId: "okayama",
    lineId: "setoohashi",
    senku: "64",
    positionPrefix: "JWO",
    stationCodes: setoStationCodes
  }
);

assert.deepStrictEqual(
  setoNonDisplay.trains.map(train => [train.pos, train.posName]),
  [
    ["JWO0249D", "妹尾→早島 間"],
    ["JWO0249U", "早島→妹尾 間"],
    ["JWO0253D", "茶屋町→児島 間"],
    ["JWO0253U", "児島→茶屋町 間"]
  ],
  "Non-display stations use adjacent interlocking stations"
);

const hagoromoDirections = adapter.normalize(
  {
    update: "2026-08-10T00:00:00+09:00",
    trains: [
      {
        no: "947H",
        direction: 0,
        pos: "2613_2651",
        type: "10",
        displayType: "普通",
        dest: { text: "東羽衣", code: "2651", line: "hagoromo" }
      },
      {
        no: "948H",
        direction: 0,
        pos: "2613_2651",
        type: "10",
        displayType: "普通",
        dest: { text: "鳳", code: "2613", line: "hagoromo" }
      },
      {
        no: "949H",
        direction: 0,
        pos: "2613",
        type: "10",
        displayType: "普通",
        dest: { text: "東羽衣", code: "2651", line: "hagoromo" }
      },
      {
        no: "950H",
        direction: 0,
        pos: "2613",
        type: "10",
        displayType: "普通",
        dest: { text: "鳳", code: "2613", line: "hagoromo" }
      },
      {
        no: "951H",
        direction: 0,
        pos: "2651",
        type: "10",
        displayType: "普通",
        dest: { text: "東羽衣", code: "2651", line: "hagoromo" }
      },
      {
        no: "952H",
        direction: 0,
        pos: "2651",
        type: "10",
        displayType: "普通",
        dest: { text: "鳳", code: "2613", line: "hagoromo" }
      }
    ]
  },
  {
    stations: [
      { info: { code: "2613", name: "鳳" } },
      { info: { code: "2651", name: "東羽衣" } },
      { info: { code: "2614", name: "富木" } }
    ]
  },
  {},
  "2026-08-10T00:00:00+09:00",
  {
    areaId: "kinki",
    lineId: "hanwahagoromo",
    senku: "66",
    positionPrefix: "JW66",
    stationCodes: ["2613", "2651", "2614"]
  }
);

assert.deepStrictEqual(
  hagoromoDirections.trains.map(train => [train.cbango, train.pos, train.posName]),
  [
    ["947H", "JWH662613_2651D", "鳳→東羽衣 間"],
    ["948H", "JWH662613_2651U", "東羽衣→鳳 間"],
    ["949H", "JWH662613D", "鳳"],
    ["950H", "JWH662613U", "鳳"],
    ["951H", "JWH662651D", "東羽衣"],
    ["952H", "JWH662651U", "東羽衣"]
  ],
  "Hagoromo branch direction and route-scoped prefix match the page slots"
);
assert.deepStrictEqual(
  hagoromoDirections.trains.map(train => train.jrWest.lineColorIconCode),
  ["", "", "", "", "", ""],
  "Hagoromo branch uses the generic train icon"
);

const yumesakiPositions = adapter.normalize(
  {
    update: "2026-08-10T12:00:00+09:00",
    trains: [
      {
        no: "YUME-D",
        direction: 1,
        pos: "2503_2551",
        type: "10",
        displayType: "普通",
        dest: { text: "桜島", code: "2553", line: "yumesaki" }
      },
      {
        no: "YUME-U",
        direction: 0,
        pos: "2552_2553",
        type: "10",
        displayType: "普通",
        dest: { text: "西九条", code: "2503", line: "yumesaki" }
      }
    ]
  },
  {
    stations: [
      { info: { code: "2503", name: "西九条" } },
      { info: { code: "2551", name: "安治川口" } },
      { info: { code: "2552", name: "ユニバーサルシティ" } },
      { info: { code: "2553", name: "桜島" } }
    ]
  },
  {},
  "2026-08-10T12:00:00+09:00",
  {
    areaId: "kinki",
    lineId: "yumesaki",
    senku: "68",
    stationCodes: ["2503", "2551", "2552", "2553"]
  }
);

assert.deepStrictEqual(
  yumesakiPositions.trains.map(train => [train.pos, train.posName]),
  [
    ["JW2503_2551D", "西九条→安治川口 間"],
    ["JW2552_2553U", "桜島→ユニバーサルシティ 間"]
  ],
  "Yumesaki positions follow the official direction"
);
assert.deepStrictEqual(
  yumesakiPositions.trains.map(train => train.jrWest.lineColorIconCode),
  ["kkp", "kkp"],
  "Yumesaki trains use the line color icon"
);

const osakaLoopPositions = adapter.normalize(
  {
    update: "2026-08-10T12:00:00+09:00",
    trains: [
      {
        no: "LOOP-U",
        direction: 0,
        pos: "2519_0416",
        type: "10",
        displayType: "普通",
        dest: { text: "環状", code: "0001", line: "osakaloop" }
      },
      {
        no: "LOOP-D",
        direction: 1,
        pos: "0416_2501",
        type: "10",
        displayType: "普通",
        dest: { text: "環状", code: "0001", line: "osakaloop" }
      }
    ]
  },
  {
    stations: [
      { info: { code: "0416", name: "大阪" } },
      { info: { code: "2501", name: "福島" } },
      { info: { code: "2519", name: "天満" } }
    ]
  },
  {},
  "2026-08-10T12:00:00+09:00",
  {
    areaId: "kinki",
    lineId: "osakaloop",
    senku: "67",
    stationCodes: ["0416", "2501", "2519"]
  }
);

assert.deepStrictEqual(
  osakaLoopPositions.trains.map(train => [train.pos, train.posName, train.jrWest.lineColorIconCode]),
  [
    ["JW0416_2519U", "天満→大阪 間", "kko"],
    ["JW0416_2501D", "大阪→福島 間", "kko"]
  ],
  "Osaka Loop boundary positions and line-color icon"
);

let verifiedLinePages = 0;
for (const area of Object.values(master.areas)) {
  for (const line of area.line_pages) {
    const lineId = line.page.replace(/\.html$/, "");
    assert.strictEqual(
      adapter.getTrainTypeClassSystem({ areaId: area.name, lineId }),
      line.class_system,
      `${lineId} class system`
    );
    verifiedLinePages += 1;
  }
}

let verifiedMasterCodes = 0;
for (const [classSystem, system] of Object.entries(master.class_systems)) {
  for (const [typeCode, type] of Object.entries(system.types)) {
    const expectedLabel = type.label.replace("関空／紀州路快速", "関空/紀州路快速");
    assert.strictEqual(
      adapter.mapTrainType({ type: typeCode }, { classSystem }).label,
      expectedLabel,
      `${classSystem}:${typeCode}`
    );
    verifiedMasterCodes += 1;
  }
}

console.log(
  `Verified ${verifiedLinePages} line pages, ${verifiedMasterCodes} master codes, ` +
  `and ${cases.length} requested JR West train type cases.`
);
