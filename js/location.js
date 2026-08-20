// スクロールの高さ保持用
let scrollY = 0;
// 遷移前の路線保持用
let befRosen = "";
// スクロール用の駅キー保持用
let scrollKey = "";
// サイドメニュークリック時
let isSideMenuClick = false;
// 画面初期表示時判定用
let isLoad = true;
// ダイアログ表示時判定用
let isDialogDisp = false;
// サイドメニュー表示時判定用
let isSideMenuDisp = false;
// 横幅リサイズ判定用
let beforeWidth = 0;
// 画面表示処理実行判定用
let isNotInitDisp = false;
// 走行位置自動更新の既定間隔(ms)
const LOCATION_AUTO_REFRESH_DEFAULT_INTERVAL = 15000;
// 自動更新設定の保存キー
const LOCATION_AUTO_REFRESH_ENABLED_KEY = "location_auto_refresh_enabled";
const LOCATION_AUTO_REFRESH_INTERVAL_KEY = "location_auto_refresh_interval";
const LOCATION_SLEEP_PREVENT_ENABLED_KEY = "location_sleep_prevent_enabled";
const TRACKING_SCROLL_ENABLED_KEY = "tracking_scroll_enabled";
const LOCATION_JSON_SOURCE_MAP = {
	"51": ["01", "05"],
	"52": ["02", "07", "09"],
	"53": ["02", "13"]
};
const JREAST_LOCATION_SOURCE_MAP = {
	"54": {
		screenCode: "88",
		hokkaidoRosens: ["15"],
		relatedJreastRosens: ["54", "55", "56"],
		url: "https://jrproxy-926717289220.asia-northeast1.run.app/proxy?name=jrelines/transaction/2.0.0/train_88.json"
	},
	"55": {
		screenCode: "87",
		relatedJreastRosens: ["54", "55", "56"],
		url: "https://jrproxy-926717289220.asia-northeast1.run.app/proxy?name=jrelines/transaction/2.0.0/train_87.json"
	},
	"56": {
		screenCode: "89",
		relatedJreastRosens: ["54", "55", "56"],
		url: "https://jrproxy-926717289220.asia-northeast1.run.app/proxy?name=jrelines/transaction/2.0.0/train_89.json"
	}
};
const DOKOTRE_LOCATION_SOURCE_MAP = {
	"57": {
		dokotreId: "9021",
		senku: "57",
		mappingUrl: "./tools/dokotre_9021_mapping.json",
		lineUrl: "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://doko-train.jp/json/line/9021.json",
		diagramUrl: "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://doko-train.jp/json/diagram/line/9021.json",
		statusUrl: "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://doko-train.jp/json/trainstatus/9021.json"
	},
	"58": {
		senku: "58",
		sources: [
			{
				dokotreId: "110",
				senku: "58",
				mappingUrl: "./tools/dokotre_110_mapping.json",
				lineUrl: "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://doko-train.jp/json/line/110.json",
				diagramUrl: "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://doko-train.jp/json/diagram/line/110.json",
				detailDiagramUrl: "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://doko-train.jp/json/diagram/line/110A.json",
				statusUrl: "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://doko-train.jp/json/trainstatus/110.json"
			},
			{
				dokotreId: "9022",
				senku: "58",
				mappingUrl: "./tools/dokotre_9022_mapping.json",
				lineUrl: "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://doko-train.jp/json/line/9022.json",
				diagramUrl: "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://doko-train.jp/json/diagram/line/9022.json",
				detailDiagramUrl: "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://doko-train.jp/json/diagram/line/110A.json",
				statusUrl: "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://doko-train.jp/json/trainstatus/9022.json"
			}
		]
	}
};
const dokotreStaticSourceDataCache = new Map();
const JR_SHINKANSEN_LOCATION_SOURCE_MAP = {
	"59": {
		senku: "59",
		centralUrl: "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://traininfo.jr-central.co.jp/shinkansen/var/train_info/train_location_info.json",
		centralSuspensionUrl: "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://traininfo.jr-central.co.jp/shinkansen/var/train_info/suspension_info.json",
		centralMasterUrl: "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://traininfo.jr-central.co.jp/shinkansen/common/data/common_ja.json",
		centralTrainInfoUrlBase: "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://traininfo.jr-central.co.jp/shinkansen/var/train_info/",
		officialTrainNumberUrl: (location.hostname === "127.0.0.1" || location.hostname === "localhost") ?
			"http://127.0.0.1:8787/jreast-shinkansen/train-numbers" :
			"https://trainlocation-jrkyushu-timetable-cache.densha716.workers.dev/jreast-shinkansen/train-numbers",
		kyushuUrl: "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://george-doredore.jrkyushu.co.jp/jrqSEN29.html"
	},
	"60": {
		senku: "60",
		kyushuUrl: "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://george-doredore.jrkyushu.co.jp/jrqSEN57.html"
	}
};
const jrShinkansenStaticSourceDataCache = new Map();
const jrEastShinkansenTrainNumberDataCache = new Map();
const jrKyushuTimetableDataCache = new Map();
const JR_KYUSHU_TIMETABLE_WORKER_BASE = "https://trainlocation-jrkyushu-timetable-cache.densha716.workers.dev";
const JRWEST_LOCATION_SOURCE_MAP = {
	"61": {
		senku: "61",
		currentTimeUrl: "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www.train-guide.westjr.co.jp/api/v3/currenttime.txt",
		sources: [
			{
				areaId: "kinki",
				lineId: "hokurikubiwako",
				positionPrefix: "JW61",
				stationCodes: [
					"0382", "0384", "0385", "0386", "0387", "0388", "0389", "0390", "0391",
					"0392", "0393", "0394", "0395", "0396", "0397", "0398", "0399", "0400",
					"0401", "0402"
				],
				areaMasterUrl: "https://www.train-guide.westjr.co.jp/api/v3/area_kinki_master.json",
				stationUrl: "https://www.train-guide.westjr.co.jp/api/v3/hokurikubiwako_st.json",
				locationUrl: "https://www.train-guide.westjr.co.jp/api/v3/hokurikubiwako.json"
			},
			{
				areaId: "kinki",
				lineId: "kyoto",
				positionPrefix: "JW61",
				stationCodes: [
					"0402", "0404", "0464", "0405", "0406", "0407", "0461", "0408", "0409",
					"0466", "0410", "0411", "0412", "0413", "0414", "0415", "0416"
				],
				areaMasterUrl: "https://www.train-guide.westjr.co.jp/api/v3/area_kinki_master.json",
				stationUrl: "https://www.train-guide.westjr.co.jp/api/v3/kyoto_st.json",
				locationUrl: "https://www.train-guide.westjr.co.jp/api/v3/kyoto.json"
			},
			{
				areaId: "kinki",
				lineId: "kobesanyo",
				positionPrefix: "JW61",
				stationCodes: [
					"0415", "0416", "0417", "0419", "0420", "0421", "0422", "0460", "0423", "0424",
					"0425", "0426", "0427", "0428", "0429", "0430", "0431", "0432", "0433", "0434",
					"0435", "0462", "0436", "0437", "0438", "0439", "0440", "0441", "0442", "0443",
					"0444", "0445", "0446", "0447", "0448", "0449", "0450", "0451", "0465", "0452"
				],
				areaMasterUrl: "https://www.train-guide.westjr.co.jp/api/v3/area_kinki_master.json",
				stationUrl: "https://www.train-guide.westjr.co.jp/api/v3/kobesanyo_st.json",
				locationUrl: "https://www.train-guide.westjr.co.jp/api/v3/kobesanyo.json"
			}
		]
	},
	"62": {
		senku: "62",
		currentTimeUrl: "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www.train-guide.westjr.co.jp/api/v3/currenttime.txt",
		sources: [
			{
				areaId: "hokuriku",
				lineId: "hokuriku",
				positionPrefix: "JWH",
				stationCodes: ["0450", "0449", "0448"],
				areaMasterUrl: "https://www.train-guide.westjr.co.jp/api/v3/area_hokuriku_master.json",
				stationUrl: "https://www.train-guide.westjr.co.jp/api/v3/hokuriku_st.json",
				locationUrl: "https://www.train-guide.westjr.co.jp/api/v3/hokuriku.json"
			},
			{
				areaId: "kinki",
				lineId: "hokurikubiwako",
				stationCodes: [
					"0509", "0508", "0507", "0506", "0505", "0504", "0503", "0502", "0501", "0382"
				],
				areaMasterUrl: "https://www.train-guide.westjr.co.jp/api/v3/area_kinki_master.json",
				stationUrl: "https://www.train-guide.westjr.co.jp/api/v3/hokurikubiwako_st.json",
				locationUrl: "https://www.train-guide.westjr.co.jp/api/v3/hokurikubiwako.json"
			}
		]
	},
	"63": {
		senku: "63",
		currentTimeUrl: "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www.train-guide.westjr.co.jp/api/v3/currenttime.txt",
		sources: [
			{
				areaId: "hokuriku",
				lineId: "hokuriku",
				positionPrefix: "JWH",
				stationCodes: ["0450", "0449"],
				areaMasterUrl: "https://www.train-guide.westjr.co.jp/api/v3/area_hokuriku_master.json",
				stationUrl: "https://www.train-guide.westjr.co.jp/api/v3/hokuriku_st.json",
				locationUrl: "https://www.train-guide.westjr.co.jp/api/v3/hokuriku.json"
			},
			{
				areaId: "kinki",
				lineId: "kosei",
				stationCodes: [
					"0510", "0509", "0919", "0618", "0617", "0616", "0615", "0614",
					"0613", "0612", "0611", "0610", "0609", "0608", "0607", "0606",
					"0605", "0604", "0603", "0602", "0601", "0401", "0402"
				],
				areaMasterUrl: "https://www.train-guide.westjr.co.jp/api/v3/area_kinki_master.json",
				stationUrl: "https://www.train-guide.westjr.co.jp/api/v3/kosei_st.json",
				locationUrl: "https://www.train-guide.westjr.co.jp/api/v3/kosei.json"
			},
			{
				areaId: "kinki",
				lineId: "kosei",
				stationCodes: [
					"0510", "0509", "0919", "0618", "0617", "0616", "0615", "0614",
					"0613", "0612", "0611", "0610", "0609", "0608", "0607", "0606",
					"0605", "0604", "0603", "0602", "0601", "0401", "0402"
				],
				areaMasterUrl: "https://www.train-guide.westjr.co.jp/api/v3/area_kinki_master.json",
				stationUrl: "https://www.train-guide.westjr.co.jp/api/v3/kosei_st.json",
				locationUrl: "https://www.train-guide.westjr.co.jp/api/v3/koseihokurikubiwako.json"
			}
		]
	},
	"64": {
		senku: "64",
		currentTimeUrl: "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www.train-guide.westjr.co.jp/api/v3/currenttime.txt",
		sources: [
			{
				areaId: "okayama",
				lineId: "setoohashi",
				positionPrefix: "JWO",
				stationCodes: [
					"0245", "0246", "0247", "0248", "0249", "0250",
					"0251", "0252", "0253", "0254", "0255", "0256"
				],
				areaMasterUrl: "https://www.train-guide.westjr.co.jp/api/v3/area_okayama_master.json",
				stationUrl: "https://www.train-guide.westjr.co.jp/api/v3/setoohashi_st.json",
				locationUrl: "https://www.train-guide.westjr.co.jp/api/v3/setoohashi.json"
			}
		]
	},
	"65": {
		senku: "65",
		currentTimeUrl: "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www.train-guide.westjr.co.jp/api/v3/currenttime.txt",
		sources: [
			{
				areaId: "kinki",
				lineId: "gakkentoshi",
				stationCodes: [
					"3023", "1322", "1321", "1320", "1319", "1318", "1317", "1316",
					"1315", "1314", "1313", "1312", "1311", "1310", "1309", "1308",
					"1307", "1306", "1305", "1304", "1303", "1302", "1301", "2517"
				],
				areaMasterUrl: "https://www.train-guide.westjr.co.jp/api/v3/area_kinki_master.json",
				stationUrl: "https://www.train-guide.westjr.co.jp/api/v3/gakkentoshi_st.json",
				locationUrl: "https://www.train-guide.westjr.co.jp/api/v3/gakkentoshi.json"
			},
			{
				areaId: "kinki",
				lineId: "tozai",
				stationCodes: [
					"2517", "1501", "1502", "1503", "1504", "1505", "1506", "1508", "0419"
				],
				areaMasterUrl: "https://www.train-guide.westjr.co.jp/api/v3/area_kinki_master.json",
				stationUrl: "https://www.train-guide.westjr.co.jp/api/v3/tozai_st.json",
				locationUrl: "https://www.train-guide.westjr.co.jp/api/v3/tozai.json"
			}
		]
	},
	"66": {
		senku: "66",
		currentTimeUrl: "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www.train-guide.westjr.co.jp/api/v3/currenttime.txt",
		sources: [
			{
				areaId: "kinki",
				lineId: "hanwahagoromo",
				stationCodes: [
					"2510", "2601", "2602", "2603", "2604", "2605", "2606", "2607",
					"2608", "2609", "2610", "2611", "6061", "2613", "2651", "2614",
					"2615", "2616", "2617", "2618", "2619", "2620", "2621", "2622",
					"2623", "2624", "2625", "3701", "3702", "3703", "3704", "3705",
					"3706", "3707", "3708", "3709"
				],
				areaMasterUrl: "https://www.train-guide.westjr.co.jp/api/v3/area_kinki_master.json",
				stationUrl: "https://www.train-guide.westjr.co.jp/api/v3/hanwahagoromo_st.json",
				locationUrl: "https://www.train-guide.westjr.co.jp/api/v3/hanwahagoromo.json"
			}
		]
	},
	"67": {
		senku: "67",
		currentTimeUrl: "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www.train-guide.westjr.co.jp/api/v3/currenttime.txt",
		sources: [
			{
				areaId: "kinki",
				lineId: "osakaloop",
				stationCodes: [
					"0416", "2501", "2502", "2503", "2504", "2506", "2507", "2508",
					"2509", "2510", "2511", "2512", "2513", "2514", "2515", "2516",
					"2517", "2518", "2519"
				],
				areaMasterUrl: "https://www.train-guide.westjr.co.jp/api/v3/area_kinki_master.json",
				stationUrl: "https://www.train-guide.westjr.co.jp/api/v3/osakaloop_st.json",
				locationUrl: "https://www.train-guide.westjr.co.jp/api/v3/osakaloop.json"
			}
		]
	},
	"68": {
		senku: "68",
		currentTimeUrl: "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www.train-guide.westjr.co.jp/api/v3/currenttime.txt",
		sources: [
			{
				areaId: "kinki",
				lineId: "yumesaki",
				stationCodes: ["2503", "2551", "2552", "2553"],
				areaMasterUrl: "https://www.train-guide.westjr.co.jp/api/v3/area_kinki_master.json",
				stationUrl: "https://www.train-guide.westjr.co.jp/api/v3/yumesaki_st.json",
				locationUrl: "https://www.train-guide.westjr.co.jp/api/v3/yumesaki.json"
			}
		]
	},
	"69": {
		senku: "69",
		currentTimeUrl: "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www.train-guide.westjr.co.jp/api/v3/currenttime.txt",
		sources: [
			{
				areaId: "kinki",
				lineId: "yamatoji",
				stationCodes: [
					"3002", "2508", "2509", "2510", "3003", "3005", "3008", "3009",
					"3010", "3011", "3012", "3013", "3014", "3015", "3016", "3017",
					"3018", "3019", "3020", "3022", "3023", "3024"
				],
				areaMasterUrl: "https://www.train-guide.westjr.co.jp/api/v3/area_kinki_master.json",
				stationUrl: "https://www.train-guide.westjr.co.jp/api/v3/yamatoji_st.json",
				locationUrl: "https://www.train-guide.westjr.co.jp/api/v3/yamatoji.json"
			},
			{
				areaId: "kinki",
				lineId: "yamatoji",
				stationCodes: [
					"3002", "2508", "2509", "2510", "3003", "3005", "3008", "3009",
					"3010", "3011", "3012", "3013", "3014", "3015", "3016", "3017",
					"3018", "3019", "3020", "3022", "3023", "3024"
				],
				areaMasterUrl: "https://www.train-guide.westjr.co.jp/api/v3/area_kinki_master.json",
				stationUrl: "https://www.train-guide.westjr.co.jp/api/v3/yamatoji_st.json",
				locationUrl: "https://www.train-guide.westjr.co.jp/api/v3/yamatojiosakahigashi.json"
			}
		]
	},
	"70": {
		senku: "70",
		currentTimeUrl: "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www.train-guide.westjr.co.jp/api/v3/currenttime.txt",
		sources: [
			{
				areaId: "kinki",
				lineId: "osakahigashi",
				stationCodes: [
					"1401", "0415", "1204", "1206", "1207", "1208", "1301", "1302",
					"8006", "8005", "8004", "8003", "8007", "8001", "3009"
				],
				areaMasterUrl: "https://www.train-guide.westjr.co.jp/api/v3/area_kinki_master.json",
				stationUrl: "https://www.train-guide.westjr.co.jp/api/v3/osakahigashi_st.json",
				locationUrl: "https://www.train-guide.westjr.co.jp/api/v3/osakahigashi.json"
			},
			{
				areaId: "kinki",
				lineId: "osakahigashi",
				stationCodes: [
					"1401", "0415", "1204", "1206", "1207", "1208", "1301", "1302",
					"8006", "8005", "8004", "8003", "8007", "8001", "3009"
				],
				areaMasterUrl: "https://www.train-guide.westjr.co.jp/api/v3/area_kinki_master.json",
				stationUrl: "https://www.train-guide.westjr.co.jp/api/v3/osakahigashi_st.json",
				locationUrl: "https://www.train-guide.westjr.co.jp/api/v3/osakahigashigakkentoshi.json"
			},
			{
				areaId: "kinki",
				lineId: "osakahigashi",
				stationCodes: [
					"1401", "0415", "1204", "1206", "1207", "1208", "1301", "1302",
					"8006", "8005", "8004", "8003", "8007", "8001", "3009"
				],
				areaMasterUrl: "https://www.train-guide.westjr.co.jp/api/v3/area_kinki_master.json",
				stationUrl: "https://www.train-guide.westjr.co.jp/api/v3/osakahigashi_st.json",
				locationUrl: "https://www.train-guide.westjr.co.jp/api/v3/osakahigashiyamatoji.json"
			},
			{
				areaId: "kinki",
				lineId: "osakahigashi",
				stationCodes: [
					"1401", "0415", "1204", "1206", "1207", "1208", "1301", "1302",
					"8006", "8005", "8004", "8003", "8007", "8001", "3009"
				],
				areaMasterUrl: "https://www.train-guide.westjr.co.jp/api/v3/area_kinki_master.json",
				stationUrl: "https://www.train-guide.westjr.co.jp/api/v3/osakahigashi_st.json",
				locationUrl: "https://www.train-guide.westjr.co.jp/api/v3/osakahigashikyoto.json"
			}
		]
	},
	"71": {
		senku: "71",
		currentTimeUrl: "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www.train-guide.westjr.co.jp/api/v3/currenttime.txt",
		sources: [
			{
				areaId: "kinki",
				lineId: "kansaiairport",
				stationCodes: ["2625", "2701", "2702"],
				areaMasterUrl: "https://www.train-guide.westjr.co.jp/api/v3/area_kinki_master.json",
				stationUrl: "https://www.train-guide.westjr.co.jp/api/v3/kansaiairport_st.json",
				locationUrl: "https://www.train-guide.westjr.co.jp/api/v3/kansaiairport.json"
			}
		]
	},
	"72": {
		senku: "72",
		currentTimeUrl: "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www.train-guide.westjr.co.jp/api/v3/currenttime.txt",
		sources: [
			{
				areaId: "okayama",
				lineId: "unominato",
				positionPrefix: "JWO",
				stationCodes: ["0252", "0258", "0259", "0260", "0261", "0262", "0263", "0264"],
				areaMasterUrl: "https://www.train-guide.westjr.co.jp/api/v3/area_okayama_master.json",
				stationUrl: "https://www.train-guide.westjr.co.jp/api/v3/unominato_st.json",
				locationUrl: "https://www.train-guide.westjr.co.jp/api/v3/unominato.json"
			}
		]
	},
	...((typeof window !== "undefined" && window.JrWestRemainingRouteSources) || {})
};
const jrWestStaticSourceDataCache = new Map();
const jrWestStaticJsonDataCache = new Map();
const JRSHIKOKU_API_BASE = (location.hostname === "127.0.0.1" || location.hostname === "localhost")
	? location.origin
	: "https://trainlocation.pages.dev";
const JRSHIKOKU_LOCATION_SOURCE_MAP = {
	"64": {
		senku: "64",
		lineId: "seto",
		liveUrl: JRSHIKOKU_API_BASE + "/api/jrshikoku/location",
		timetableUrl: JRSHIKOKU_API_BASE + "/api/jrshikoku/timetable"
	},
	"73": {
		senku: "73",
		lineId: "yosan",
		liveUrl: JRSHIKOKU_API_BASE + "/api/jrshikoku/location",
		timetableUrl: JRSHIKOKU_API_BASE + "/api/jrshikoku/timetable"
	},
	"76": {
		senku: "76",
		lineId: "uwajima",
		liveUrl: JRSHIKOKU_API_BASE + "/api/jrshikoku/location",
		timetableUrl: JRSHIKOKU_API_BASE + "/api/jrshikoku/timetable"
	},
	"77": {
		senku: "77",
		lineId: "uwajima2",
		liveUrl: JRSHIKOKU_API_BASE + "/api/jrshikoku/location",
		timetableUrl: JRSHIKOKU_API_BASE + "/api/jrshikoku/timetable"
	},
	"78": {
		senku: "78",
		lineId: "dosan",
		liveUrl: JRSHIKOKU_API_BASE + "/api/jrshikoku/location",
		timetableUrl: JRSHIKOKU_API_BASE + "/api/jrshikoku/timetable"
	},
	"79": {
		senku: "79",
		lineId: "kubokawa",
		liveUrl: JRSHIKOKU_API_BASE + "/api/jrshikoku/location",
		timetableUrl: JRSHIKOKU_API_BASE + "/api/jrshikoku/timetable"
	},
	"80": {
		senku: "80",
		lineId: "koutoku",
		liveUrl: JRSHIKOKU_API_BASE + "/api/jrshikoku/location",
		timetableUrl: JRSHIKOKU_API_BASE + "/api/jrshikoku/timetable"
	},
	"81": {
		senku: "81",
		lineId: "tokushima",
		liveUrl: JRSHIKOKU_API_BASE + "/api/jrshikoku/location",
		timetableUrl: JRSHIKOKU_API_BASE + "/api/jrshikoku/timetable"
	},
	"82": {
		senku: "82",
		lineId: "naruto",
		liveUrl: JRSHIKOKU_API_BASE + "/api/jrshikoku/location",
		timetableUrl: JRSHIKOKU_API_BASE + "/api/jrshikoku/timetable"
	}
};
const jrShikokuStaticSourceDataCache = new Map();
const JRCENTRAL_LOCATION_SOURCE_MAP = {
	"74": {
		senku: "74",
		lineName: "東海道線(豊橋～米原)",
		stationSet: "tokaido_toyohashi_maibara",
		positionPrefix: "JTC",
		liveUrl: "https://traininfo.jr-central.co.jp/zairaisen/data/zaisenichi.json"
	},
	"75": {
		senku: "75",
		lineName: "東海道線(熱海～豊橋)",
		stationSet: "tokaido_atami_toyohashi",
		positionPrefix: "JTC",
		liveUrl: "https://traininfo.jr-central.co.jp/zairaisen/data/zaisenichi.json"
	},
	"83": {
		senku: "83", lineName: "中央線", stationSet: "chuo", positionPrefix: "JTC83",
		liveUrl: "https://traininfo.jr-central.co.jp/zairaisen/data/zaisenichi.json"
	},
	"84": {
		senku: "84", lineName: "関西線", stationSet: "kansai", positionPrefix: "JTC84",
		liveUrl: "https://traininfo.jr-central.co.jp/zairaisen/data/zaisenichi.json"
	},
	"85": {
		senku: "85", lineName: "紀勢線", stationSet: "kisei", positionPrefix: "JTC85",
		liveUrl: "https://traininfo.jr-central.co.jp/zairaisen/data/zaisenichi.json"
	},
	"86": {
		senku: "86", lineName: "高山線", stationSet: "takayama", positionPrefix: "JTC86",
		liveUrl: "https://traininfo.jr-central.co.jp/zairaisen/data/zaisenichi.json"
	},
	"87": {
		senku: "87", lineName: "武豊線", stationSet: "taketoyo", positionPrefix: "JTC87",
		liveUrl: "https://traininfo.jr-central.co.jp/zairaisen/data/zaisenichi.json"
	},
	"88": {
		senku: "88", lineName: "飯田線", stationSet: "iida", positionPrefix: "JTC88",
		liveUrl: "https://traininfo.jr-central.co.jp/zairaisen/data/zaisenichi.json"
	},
	"89": {
		senku: "89", lineName: "太多線", stationSet: "taita", positionPrefix: "JTC89",
		liveUrl: "https://traininfo.jr-central.co.jp/zairaisen/data/zaisenichi.json"
	},
	"90": {
		senku: "90", lineName: "御殿場線", stationSet: "gotemba", positionPrefix: "JTC90",
		liveUrl: "https://traininfo.jr-central.co.jp/zairaisen/data/zaisenichi.json"
	},
	"91": {
		senku: "91", lineName: "身延線", stationSet: "minobu", positionPrefix: "JTC91",
		liveUrl: "https://traininfo.jr-central.co.jp/zairaisen/data/zaisenichi.json"
	},
	"92": {
		senku: "92", lineName: "参宮線", stationSet: "sangu", positionPrefix: "JTC92",
		liveUrl: "https://traininfo.jr-central.co.jp/zairaisen/data/zaisenichi.json"
	},
	"93": {
		senku: "93", lineName: "名松線", stationSet: "meisho", positionPrefix: "JTC93",
		liveUrl: "https://traininfo.jr-central.co.jp/zairaisen/data/zaisenichi.json"
	},
	"94": {
		senku: "94", lineName: "美濃赤坂線", stationSet: "mino_akasaka", positionPrefix: "JTC94",
		liveUrl: "https://traininfo.jr-central.co.jp/zairaisen/data/zaisenichi.json"
	},
	"95": {
		senku: "95", lineName: "伊勢鉄道", stationSet: "ise_railway", positionPrefix: "JTC95",
		liveUrl: "https://traininfo.jr-central.co.jp/zairaisen/data/zaisenichi.json"
	}
};
const JRCENTRAL_TIMETABLE_URL = "https://traininfo.jr-central.co.jp/zairaisen/data/kobetsujikoku.json";
const JRCENTRAL_TIMETABLE_CACHE_NAME = "jrcentral-timetable-v1";
let jrCentralTimetableDataPromise = null;
let jrCentralTimetableDataExpiresAt = 0;
let jrCentralTimetableCacheExpiryTimer = null;
let jrCentralTimetableCacheInitializedFor = "";

function get_mainte_json_request(fileName, cacheKey) {
	const cloudflareApiBase = "https://trainlocation.pages.dev";
	const localUrl = "./mainte/" + fileName + "?" + cacheKey;
	const apiBase = location.hostname.endsWith("github.io") ? cloudflareApiBase : ".";
	const apiUrl = apiBase + "/api/mainte/" + fileName + "?" + cacheKey;
	const useLocal = location.protocol === "file:";
	const primaryUrl = useLocal ? localUrl : apiUrl;
	const deferred = $.Deferred();

	function request(url, canFallback) {
		$.getJSON(url)
			.done((data, textStatus, jqxhr) => deferred.resolve(data, textStatus, jqxhr))
			.fail(() => {
				if (canFallback) {
					request(localUrl, false);
					return;
				}
				deferred.reject();
			});
	}

	request(primaryUrl, primaryUrl !== localUrl);
	return deferred.promise();
}

// 走行位置自動更新タイマー
let locationAutoRefreshTimer = null;
// 列車選択アニメーションタイマー
let resshaAnimationTimer = null;
// 自動更新用の路線保持
let autoRefreshRosen = "";
// 列車再描画用マスタのキャッシュ
let cachedResshaTypeData = null;
let cachedEkiData = null;
let cachedLocationMasterData = null;
// 自動更新設定
let locationAutoRefreshEnabled = false;
let locationAutoRefreshInterval = LOCATION_AUTO_REFRESH_DEFAULT_INTERVAL;
let locationSleepPreventEnabled = false;
let locationWakeLock = null;
// 次回自動更新予定時刻
let nextLocationAutoRefreshAt = null;
// バックグラウンドからの復帰判定
let locationPageWasBackgrounded = false;
let lastLocationForegroundRefreshAt = 0;
const LOCATION_FOREGROUND_REFRESH_DEBOUNCE = 1000;
// 列車検索用キャッシュ
let cachedTrainSearchData = null;
let trainSearchDataPromise = null;
let cachedTrainSearchLoadedAt = 0;
const trainSearchTimetableCoreCache = new Map();
const trainSearchTimetableNowCache = new Map();
const TRAIN_SEARCH_CACHE_TTL = 30000;
const TRAIN_SEARCH_TIMETABLE_NOW_CACHE_TTL = 30000;
let trainNumberListRows = [];
let trainNumberListFilter = "all";
let trainNumberListDelayThreshold = 1;
let trainNumberListShowEndedDelayed = false;
let trainNumberListMode = "numbers";
let cancelledTrainStationMasterPromise = null;
let cancelledTrainFetchPromise = null;
let cancelledTrainRows = null;
let cancelledTrainFailures = [];
let cancelledTrainFetchedAt = 0;
let cancelledTrainStationCount = 0;
let cancelledTrainCacheExpiryTimer = null;
let cancelledTrainTestMode = false;
const CANCELLED_TRAIN_FETCH_CONCURRENCY = 4;
const CANCELLED_TRAIN_CACHE_KEY = "cancelled_train_cache_v1";
let preserveScrollAfterHashChange = false;
let preservedScrollTop = 0;
let suppressTrackScrollOnce = false;
let trackingScrollEnabled = true;
let osakaLoopScrollState = null;
let osakaLoopScrollFrame = null;
let osakaLoopResizeTimer = null;

function preserve_scroll_after_hash_change() {
	preserveScrollAfterHashChange = true;
	preservedScrollTop = $(window).scrollTop();
}

function suppress_track_scroll_once() {
	suppressTrackScrollOnce = true;
	preservedScrollTop = $(window).scrollTop();
}

function clear_tracked_train_selection(_preserveScroll = false) {
	const rosen = get_param_rosen();
	if (!rosen || !get_param_cbango()) return;
	if (_preserveScroll) preserve_scroll_after_hash_change();
	location.hash = "rosen=" + rosen;
}

function load_tracking_scroll_setting() {
	const stored = localStorage.getItem(TRACKING_SCROLL_ENABLED_KEY);
	trackingScrollEnabled = stored === null ? true : stored === "true";
}

function save_tracking_scroll_setting() {
	localStorage.setItem(TRACKING_SCROLL_ENABLED_KEY, trackingScrollEnabled ? "true" : "false");
}

function update_tracking_footer_controls() {
	const lang = document.documentElement.dataset.lang;
	const trackedCbango = get_param_cbango();
	const hasTracking = !!trackedCbango;
	const scrollLabels = trackingScrollEnabled ? {
		"ja": "\u8ffd\u5f93\u4e2d",
		"en": "Follow ON",
		"tc": "Follow ON",
		"sc": "Follow ON",
		"kr": "Follow ON"
	} : {
		"ja": "\u8ffd\u5f93\u505c\u6b62",
		"en": "Follow OFF",
		"tc": "Follow OFF",
		"sc": "Follow OFF",
		"kr": "Follow OFF"
	};
	const releaseLabels = {
		"ja": "\u8ffd\u8de1\u89e3\u9664",
		"en": "Untrack",
		"tc": "Untrack",
		"sc": "Untrack",
		"kr": "Untrack"
	};

	if (hasTracking) {
		$("#trackingFooterContents").removeAttr("hidden").show();
		$("#trackScrollToggleBtn")
			.attr("data-state", trackingScrollEnabled ? "on" : "off")
			.toggleClass("is-off", !trackingScrollEnabled)
			.toggleClass("is-following", trackingScrollEnabled);
		$("#trackScrollToggleBtn .tracking-cbango").text(trackedCbango);
		$("#trackScrollToggleBtn .tracking-status").text(scrollLabels[lang] || scrollLabels.ja);
		$("#trackReleaseBtn .sub-footer-unkou-msg").text(releaseLabels[lang] || releaseLabels.ja);
	} else {
		$("#trackScrollToggleBtn").removeAttr("data-state").removeClass("is-off is-following");
		$("#trackingFooterContents").attr("hidden", "hidden").hide();
	}
}

window.onload = function(){
	load_location_auto_refresh_settings();
	load_tracking_scroll_setting();
	restore_cancelled_train_cache();
	setup_cancelled_train_test_mode();
	// 現在表示中の路線を取得
	let param_rosen = get_param_rosen();
	// 走行位置を表示
	if (param_rosen != "") set_station_list(param_rosen, null);
	// エリア別状況JSONを読み込んで、運行情報を設定する。
	set_unko_info(param_rosen);

	// ポップアップhtml判断
	let now = Date.now() >>> 16;
	let lang = document.documentElement.dataset.lang;
	let popup_url = lang == "ja" ? "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/trainlocation/CMUNKOU/inc_location_popup.html?" + now : "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/trainlocation/CMUNKOU/inc_location_popup_" + lang + ".html?" + now;
	$.ajax({
		url: popup_url,
		detaType: "html",
		success: function (data) {
			if (data != "") {
				let popupDiv = document.createElement("div");
				popupDiv.innerHTML = data;
				$("#popupOshirase").html(popupDiv);
				$(".sub-footer-contents.popup").show();
			} else {
				$(".sub-footer-contents.popup").hide();
			}
		}
	})

	// サイドメニュー　各路線の遅延情報の設定
	set_side_area_chien();
	// サイドメニュー　各特急列車ボタンの作成
	createSideExpressList();

	hsize = $(window).height();
	$(".side-menu").css("height", hsize - 60 + "px");

	if (!is_reload()) {
		// 札幌近郊の路線の場合、初期表示を札幌駅周辺にする。（更新時以外）
		if (!get_param_id() && !get_param_cbango()) {
			let rosen = get_param_rosen();
			if ((rosen == "01" || rosen == "02" || rosen == "03") && $("div[key='091']").length > 0) {
				$("body,html").animate({scrollTop: $("div[key='091']").offset().top - 310});
			}
		}
	}

	// 選択されているタブに表示を合わせる
	str = $('input:radio[name="sideSelect"]:checked').val();
	tab_select(str);
	// ヘッダーの高さ分の余白を設定する。
	set_header_height();

	// サイドメニュー設定
	set_side_menu(false);

	// 初期表示時の横幅保持
	beforeWidth = window.innerWidth;

	$(function(){
		// ページの最後が駅で終わっている路線（08、13）でサブフッターの表示があった場合、下に余白を追加する
		eki_end_margin();
	});
};

window.onresize = function () {
	// サイドメニューの高さを画面サイズに合わせて設定
	hsize = $(window).height();
	$(".side-menu").css("height", hsize - 60 + "px");
	if (beforeWidth != window.innerWidth && !isDialogDisp) {
		// 横幅リサイズ時
		scrollY = window.scrollY;
	}

	// 画面幅のサイズに合わせて画面項目を制御する。(アドレスバーによる高さのリサイズでは実行しない)
	if (beforeWidth != window.innerWidth) {
		set_responsive();
	}

	// お知らせのサイズによって子要素の横幅を設定する。
	set_oshirase_width();

	// ヘッダーの高さ分の余白を設定する。
	set_header_height();

	// PC用表示の場合、タブ選択と表示内容を一致させる
	if (window.innerWidth > 1000) {
		str = $('input:radio[name="sideSelect"]:checked').val();
		tab_select_resize(str);
	}

	// リサイズ後の横幅保持
	beforeWidth = window.innerWidth;

	// ページの最後が駅で終わっている路線（08、13）でサブフッターの表示があった場合、下に余白を追加する
	eki_end_margin();
	recalculate_osaka_loop_scroll();
};

window.onscroll = function () {
	if (!(isLoad || isDialogDisp || isSideMenuDisp)) {
		// スクロール位置を保存
		window.sessionStorage.setItem("scrollY", window.scrollY - 50);
		scrollY = window.scrollY;
	}
};

window.onhashchange = function () {
	// 繝上ャ繧ｷ繝･縺九ｉid・磯ｧ・く繝ｼ・峨ｒ蜿門ｾ・
	let param_id = get_param_id();

	// 霍ｯ邱壹ｒ蛻・ｊ譖ｿ縺医◆髫帙∝・霆翫・襍､譫繧帝撼陦ｨ遉ｺ
	$(".ressha-animation").hide();

	// 逕ｻ髱｢陦ｨ遉ｺ蜃ｦ逅・
	if (!isNotInitDisp) init_disp(scrollKey, () => {

		if (param_id) {
			// 繝上ャ繧ｷ繝･縺ｫ鬧・D縺悟ｭ伜惠縺励◆蝣ｴ蜷医∝ｯｾ雎｡縺ｮ鬧・∪縺ｧ繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ
			let target = get_preferred_station_element(param_id);
			if (!target.length) return;
			let pos = target.offset().top - 380;
			$("body,html").scrollTop(pos);
		}

		// 繝倥ャ繝繝ｼ縺ｮ鬮倥＆蛻・・菴咏區繧定ｨｭ螳壹☆繧九・
		set_header_height();
	})

	if (suppressTrackScrollOnce && !get_param_cbango()) {
		suppressTrackScrollOnce = false;
	}

	isNotInitDisp = false;
}

$(function ($) {
	sync_refresh_setting_controls();
	// 選択（エリアから選択／特急列車から選択）タブの選択を切り替えたときの動き
	$(document).on('change', 'input[name="sideSelect"]', function () {
		str = $('input:radio[name="sideSelect"]:checked').val();
		tab_select(str);
	});

	// サイドメニューの各エリアをクリックしたときの動き
	$(document).on("click", ".side-menu .area-contents .area-name-label", function () {
		// 自分をこれから開く場合、他の展開をすべて閉じる
		if ($(this).next().css("display") === "none") {
			$(".rosen-name-list").css("display", "none");
			$(".area-name-label").removeClass("open");
		}
		// 明細を開く／閉じる
		$(this).next().stop().slideToggle(100);
		$(this).toggleClass("open");
	});

	// 路線選択ボタンをクリックしたときの動き
	$("#localSelBtn").on("click", function() {
		let lang = document.documentElement.dataset.lang;
		$(".side-menu").css("transform", "translateX(0px)");
		$(".side-menu").css("box-shadow", "5px 5px 10px rgb(0 0 0 / 40%)");
		$("#localTab").show();
		$("#expTab").hide();
		$("#sideMenu .side-menu .area-contents-header").show();
		$("#sideMenu .side-menu-outer").show();
		if (lang == "ja") $("#sideHeader").text("路線選択");
		if (lang == "en") $("#sideHeader").text("Select a line");
		if (lang == "tc") $("#sideHeader").text("選擇路線");
		if (lang == "sc") $("#sideHeader").text("选择路线");
		if (lang == "kr") $("#sideHeader").text("노선 선택");
		// bodyのスクロールを無効にする。
		set_scroll_hide_side_menu();
	});

	// 特急列車選択ボタンをクリックしたときの動き
	$("#expSelBtn").on("click", function() {
		let lang = document.documentElement.dataset.lang;
		$(".side-menu").css("transform", "translateX(0px)");
		$(".side-menu").css("box-shadow", "5px 5px 10px rgb(0 0 0 / 40%)");
		$("#localTab").hide();
		$("#expTab").show();
		$("#sideMenu .side-menu .area-contents-header").show();
		$("#sideMenu .side-menu-outer").show();
		if (lang == "ja") $("#sideHeader").text("特急列車選択");
		if (lang == "en") $("#sideHeader").text("Select a limited express");
		if (lang == "tc") $("#sideHeader").text("選擇特急列車");
		if (lang == "sc") $("#sideHeader").text("选择特急列车");
		if (lang == "kr") $("#sideHeader").text("특급열차 선택");
		// bodyのスクロールを無効にする。
		set_scroll_hide_side_menu();
	});

	// 現在地選択ボタンをクリックしたときの動き
	$(".header-btn.pos").on("click", function() {
		// ローディングアニメーションを表示
		loading_animation_display();
		// 現在地から一番近い駅を表示
		get_pos_info(false);
	});

	// 自動更新設定ボタンをクリックしたときの動き
	$("#refreshSettingBtn, #refreshSettingBtnSub").on("click", function() {
		sync_refresh_setting_controls();
		$("#refreshSettingDetail").fadeIn("fast");
		set_scroll_hide($("#refreshSettingDetail .dialog"));
	});

	// 列車検索ボタンをクリックしたときの動き
	$("#trainSearchBtn, #trainSearchBtnSub").on("click", function() {
		reset_train_search_dialog();
		$("#trainSearchDetail").fadeIn("fast");
		set_scroll_hide($("#trainSearchDetail .dialog"));
		$("#trainSearchResultInfo").text("読み込み中...");
		load_train_search_data()
			.then((searchData) => {
				populate_train_search_name_select(searchData);
				$("#trainSearchResultInfo").empty();
				$("#trainSearchNumberInput").trigger("focus");
			})
			.catch(() => {
				$("#trainSearchResultInfo").text("検索データを取得できませんでした。");
			});
	});

	// 駅選択をクリックしたときの動き
	$(document).on("click", ".header-btn.eki", function() {
		// テンプレートのhtmlから駅を取得
		let stationListScope = $("#stationList");
		if (get_param_rosen() === "67") {
			stationListScope = stationListScope.children(".osaka-loop-cycle[data-loop-cycle='1']");
		}
		let list = stationListScope.find(".eki-panel .eki-contents a");
		// 取得した駅からボタンをダイアログに表示する内容を作成
		let html = "<ul>";
		for(let row of list){
			const stationNode = row.querySelector("[key]");
			if (!stationNode) continue;
			html += "<li>";
			html += row.children[0].children[0].outerHTML;
			html += "<div value='" + stationNode.getAttribute("key") + "'>" + stationNode.innerText.replace("\n", "") + "</div>";
			html += "</li>";
		}
		html += "</ul>";

		// 駅選択ダイアログ内に駅のリストを表示
		$("#searchDetail .train-link").html(html);

		// 駅選択ダイアログを開く。
		$("#searchDetail").fadeIn("fast");
		$("#searchDetailMain").scrollTop(0);
		// ダイアログを開くときのbodyのスクロールの制御
		set_scroll_hide($("#searchDetail .dialog"));
	});

	// 駅選択ダイアログ内の｢閉じる｣ボタンをクリックしたときの動き
	$(document).on("click", "#searchDetail, #searchDetail .common-subtitle.header", function() {
		// 駅選択ダイアログを閉じる。
		$("#searchDetail").fadeOut("fast");
		// ダイアログを閉じたときのbodyのスクロールの制御
		set_scroll_show($("#searchDetail .dialog"));
	});

	// 列車検索ダイアログを閉じる
	$(document).on("click", "#trainSearchDetail, #trainSearchDetail .common-subtitle.header", function() {
		close_train_search_dialog();
	});

	// 取得した列番一覧を表示
	$(document).on("click", "#trainNumberListBtn", function() {
		open_train_number_list_dialog("numbers");
	});

	// 運休列車一覧を表示する。未取得の場合だけ、駅別データを取得する。
	$(document).on("click", "#cancelledTrainListBtn", function() {
		open_train_number_list_dialog("cancelled");
	});

	// 利用者が指定したタイミングで運休列車を再取得する。
	$(document).on("click", "#cancelledTrainFetchBtn, #cancelledTrainRefreshBtn", function() {
		fetch_cancelled_train_data(true).catch(() => {});
	});

	$(document).on("click", "#trainNumberListDetail .train-number-list-filter-btn", function() {
		if (trainNumberListMode !== "numbers") return;
		trainNumberListFilter = $(this).attr("data-filter") || "all";
		render_train_number_list_filtered();
	});

	$(document).on("input change", "#trainNumberListDelayRange", function() {
		trainNumberListDelayThreshold = Math.max(1, Number($(this).val()) || 1);
		$("#trainNumberListDelayValue").text(trainNumberListDelayThreshold + "分以上");
		if (trainNumberListMode === "numbers" && trainNumberListFilter === "delayed") {
			render_train_number_list_filtered();
		}
	});

	$(document).on("change", "#trainNumberListShowEndedDelayed", function() {
		trainNumberListShowEndedDelayed = $(this).prop("checked");
		if (trainNumberListMode === "numbers" && trainNumberListFilter === "delayed") {
			render_train_number_list_filtered();
		}
	});

	// 取得列番一覧ダイアログを閉じる
	$(document).on("click", "#trainNumberListDetail, #trainNumberListDetail .common-subtitle.header", function() {
		close_train_number_list_dialog();
	});

	// 自動更新設定ダイアログを閉じる
	$(document).on("click", "#refreshSettingDetail, #refreshSettingDetail .close", function() {
		$("#refreshSettingDetail").fadeOut("fast");
		set_scroll_show($("#refreshSettingDetail .dialog"));
	});

	// 自動更新設定を適用する
	$(document).on("click", "#refreshSettingApplyBtn", function() {
		const enabled = $("#refreshEnabledSelect").val() === "on";
		const intervalSeconds = Number($("#refreshIntervalSelect").val());
		const sleepPreventEnabled = $("#sleepPreventSelect").val() === "on";
		apply_location_auto_refresh_settings(enabled, intervalSeconds * 1000, sleepPreventEnabled);
		$("#refreshSettingDetail").fadeOut("fast");
		set_scroll_show($("#refreshSettingDetail .dialog"));
	});

	// 駅選択ダイアログ内の各駅のボタンをクリックしたときの動き
	$(document).on("click", "#searchDetail .train-link li" , function() {
		// 駅選択ダイアログを閉じる。
		$("#searchDetail").fadeOut("fast");
		// ダイアログを閉じたときのbodyのスクロールの制御
		set_scroll_show($("#searchDetail .dialog"));

		// 駅コードを取得
		let id = this.children[1].getAttribute("value");
		// 対象の駅までスクロール
		let target = get_preferred_station_element(id);
		if (target.length == 0) return;
		let pos = target.offset().top - 380;
		$("body,html").animate({scrollTop: pos});
	});

	// 列車検索の実行
	$(document).on("click", "#trainSearchNumberBtn", function() {
		run_train_number_search();
	});
	$(document).on("click", "#trainSearchNameBtn", function() {
		run_train_name_search();
	});
	$(document).on("keydown", "#trainSearchNumberInput", function(event) {
		if (event.key === "Enter") run_train_number_search();
	});
	$(document).on("keydown", "#trainSearchNameNumberInput", function(event) {
		if (event.key === "Enter") run_train_name_search();
	});
	$(window).on("resize", function() {
		update_train_search_result_title_layout();
	});
	$(document).on("click", "#trainSearchResult .train-search-result-item, #trainNumberListBody .train-search-result-item", function(event) {
		event.preventDefault();
		event.stopImmediatePropagation();
		const targetRosen = $(this).attr("value");
		const cbango = $(this).attr("cbango");
		const isRunning = $(this).attr("data-running") !== "0";
		const isCancelledListItem = trainNumberListMode === "cancelled" && $(this).closest("#trainNumberListBody").length > 0;
		close_train_search_dialog();
		close_train_number_list_dialog();
		if (!isRunning) {
			const searchTrain = isCancelledListItem ? find_cancelled_train_result(cbango) : find_train_search_result(cbango);
			if (searchTrain && searchTrain.detailTrain) {
				load_train_search_detail_data(searchTrain.detailTrain)
					.then((detailTrain) => showTrainDetailDialog($("#trainDetail"), detailTrain));
				return;
			}
			show_train_not_running_message();
			return;
		}
		if (!targetRosen || !cbango) return;
		const currentRosen = get_param_rosen();
		const currentCbango = get_param_cbango();
		if (currentRosen === targetRosen && currentCbango === cbango) {
			init_disp();
		} else {
			location.hash = "rosen=" + targetRosen + "&cbango=" + cbango;
		}
	});

	// 重要なお知らせをクリックしたときの動き
	$(document).on("click", "#popupDetailBtn", function() {
		// ポップアップダイアログ内の重要なお知らせを開く。
		$("#popupDetail").fadeIn("fast");
		$("#popupDetailMain .popup-detail-main").scrollTop(0);
		$("#dialogOshirase").hide();
		$("#popupOshirase").show();
		// ダイアログを開くときのbodyのスクロールの制御
		set_scroll_hide($("#popupDetail .dialog"));
	});

	// ポップアップダイアログ内の｢閉じる｣ボタンをクリックしたときの動き
	$(document).on("click", "#popupDetail, #popupDetail .close", function() {
		// ポップアップダイアログを閉じる。
		$("#popupDetail").fadeOut("fast");
		// ダイアログを閉じたときのbodyのスクロールの制御
		set_scroll_show($("#popupDetail .dialog"));
	});

	// バブリングを停止
	$(document).on("click", "#trackReleaseBtn", function() {
		clear_tracked_train_selection(true);
	});

	$(document).on("click", "#trackScrollToggleBtn", function() {
		trackingScrollEnabled = !trackingScrollEnabled;
		save_tracking_scroll_setting();
		update_tracking_footer_controls();
		if (trackingScrollEnabled) {
			const param_cbango = get_param_cbango();
			if (!param_cbango) return;
			const ressha = get_preferred_train_element(param_cbango);
			if (ressha.length) {
				scroll_selected_train_into_view(ressha);
			}
		}
	});

	$(document).on("click", "#guideDetail .dialog, #searchDetail .dialog, #trainSearchDetail .dialog, #trainNumberListDetail .dialog, #popupDetail .dialog, #refreshSettingDetail .dialog", function(event) {
		event.stopPropagation();
	});

	// ページの表示状態に応じて自動更新を制御する
	document.addEventListener("visibilitychange", handle_page_visibility_change);
	document.addEventListener("pointerdown", handle_location_wake_lock_user_activation);
	document.addEventListener("keydown", handle_location_wake_lock_user_activation);
	window.addEventListener("blur", mark_location_page_backgrounded);
	window.addEventListener("focus", handle_page_window_focus);
	window.addEventListener("pagehide", handle_location_page_hide);
	window.addEventListener("pageshow", handle_location_page_show);
	window.addEventListener("beforeunload", release_location_wake_lock);

	// サイドメニューの閉じるボタンをクリックしたときの動き
	$("#sideMenu .side-menu .area-contents-header, #sideMenu .side-menu-outer").on("click", function() {
		$("#sideMenu .side-menu").css("transform", "translateX(-327px)");
		$("#sideMenu .side-menu").css("box-shadow", "none");
		$("#sideMenu .side-menu-outer").hide();
		// サイドメニュー内の折り畳みを閉じる。
		toggle_close();
		// bodyのスクロールを有効にする。
		set_scroll_show_side_menu();
	});

	// 区間をクリックしたときの動き
	$(document).on("click"
	, ".rosen-name-list .rosen-name-contents, .hoka-rosen-link a, .up-rosen-link a, .down-rosen-link a, .shin-link a, .jrshikoku-wakamiya-caption a"
	,  function() {
		$("#sideMenu .side-menu-outer").hide();

		// ローディングアニメーションを表示
		loading_animation_display();

		// 現在表示中の路線を取得
		befRosen = get_param_rosen();
		if ($(this).attr("class") == "rosen-name-contents") {
			// サイドメニュークリック判定用のフラグをtrue
			isSideMenuClick = true;
		}

		let rosen = $(this).attr("value");
		if (!rosen) return;
		scrollKey = $(this).attr("key");
		const hash = scrollKey ? "rosen=" + rosen + "&id=" + scrollKey : "rosen=" + rosen;

		if (befRosen == rosen) {
			// 表示中の路線と遷移先の路線が同じ場合
			// ハッシュからid（駅キー）、列車番号を取得
			let param_id = get_param_id();
			let param_cbango = get_param_cbango();
			location.hash = hash;
			// 駅キー、列車番号が設定されていた場合、画面表示処理を行う
			if (!param_id && !param_cbango) init_disp(scrollKey);
		} else {
			// ハッシュを選択した路線に変更
			location.hash = hash;
		}

		$(function(){
			if (window.innerWidth <= 1000) {
				// サイドメニュー内の折り畳みを閉じる。
				toggle_close();
				// bodyのスクロールを有効にする。
				if (isSideMenuClick) set_scroll_show_side_menu();
			}
		});
	});

	// 特急名をクリックした場合の動き
	$(document).on("click", ".express-name-label", function () {

		// 自分をこれから開く場合、他の展開をすべて閉じる
		if ($(this).next().css("display") === "none") {
			$(".express-train-list").css("display", "none");
			$(".express-name-label").removeClass("open");
		}
		// 明細を開く／閉じる
		$(this).next().stop().slideToggle(100, () => {
			// 自分をこれから開く場合、展開したリストが見える位置までスクロールする。
			if ($(this).next().css("display") !== "none") {
				// スクロール位置を計算する。
				const pos = $(this).offset().top - $(this).parent().parent().first().offset().top;
				// スクロールする。
				$(this).closest(".side-menu-scroll").animate({scrollTop: pos}, 100);
			}
		});
		$(this).toggleClass("open");
	});

	// 特急列車名をクリックしたときの動き
	$(document).on("click", ".express-train-contents", function() {
		let lang = document.documentElement.dataset.lang;
		// ローディングアニメーションを表示する。
		loading_animation_display();
		// サイドメニュークリック判定用のフラグをtrue
		isSideMenuClick = true;
		// 列番を取得する。
		const cbango = $(this).attr("cbango");
		// 列車種別を取得する。
		const type = $(this).attr("type");
		// マスタファイル用のキャッシュバスター値を生成する。(UNIX元期からの経過ミリ秒数を右に16ビットシフトした値。2の16乗＝65536ミリ秒≒約1分間隔でキャッシュを無効化する)
		const mstNow = Date.now() >>> 16;
		// トランファイル用のキャッシュバスター値を生成する。(UNIX元期からの経過ミリ秒数を右に10ビットシフトした値。2の10乗＝1024ミリ秒間隔でキャッシュを無効化する)
		const trnNow = Date.now() >>> 10;
		// 最新の列車運行情報を取得する。
		$.when(
			get_daiya_request("00", lang, mstNow),
			get_express_now_request(trnNow)
		)
		.done((daiyaBase, expressNowBase) => {
			// 対象の列車の運行情報を取得する。
			const expressNow = expressNowBase[0].trains.find(train => train.cbango === cbango);
			const targetRosen = $(this).attr("value") || normalizeMergedRosen(expressNow.runRosen, $(this).find(".train-name").text());
			// 対象の列車に有効な路線キーが設定されている場合は、当該路線ページの該当列車位置に遷移する。
			if (targetRosen) {
				// 現在表示している路線を取得する。
				const currentRosen = get_param_rosen();
				// 現在hashに設定している列車番号を取得する。
				const currentCbango = get_param_cbango();
				if (currentRosen === targetRosen && currentCbango === cbango) {
					// 表示中の路線／列車番号と遷移先の路線／列車番号が同じ場合であれば、画面表示処理を呼び出す。
					init_disp();

				} else {
					// 別の路線／列車番号であれば、ハッシュを選択した路線／列車番号に変更する。
					location.hash = "rosen=" + targetRosen + "&cbango=" + cbango;
				}
				return;
			}
			// 対象の列車のダイヤデータを取得する。
			const daiya = daiyaBase[0].today.find(train => train.cbango === cbango);
			// 運行状態の詳細を表す文言を取得する。
			const statuDetail =
				lang === "ja" ? expressNow.statusDetail :
				lang === "en" ? expressNow.statusDetailEn :
				lang === "tc" ? expressNow.statusDetailTc :
				lang === "sc" ? expressNow.statusDetailSc :
				lang === "kr" ? expressNow.statusDetailKr : "";
			// 列車詳細情報ダイアログを表示する。
			showTrainDetailDialog($("#trainDetail"), {
				"cbango": cbango,
				"name": daiya.name,
				"type": type,
				"shuEki": daiya.shuEkiKey,
				"ryosu": daiya.ryosu,
				"senku": "00",
				"runStatus": expressNow.runStatus,
				"yokuStatus": expressNow.yokuStatus,
				"yokuDetail": expressNow.yokuDetail,
				"status": expressNow.status,
				"statusDetail": statuDetail,
				"chien": expressNow.chien
			});
		})
		.fail(() => {
			// データの取得に失敗した場合は、エラーメッセージを表示する。
			showTrainDetailDialog($("#trainDetail"), undefined, true);
		});
	});
});

/*
 * 画面表示処理
 */
function init_disp(_scrollKey, _callback) {
	// 現在表示中の路線を取得
	let param_rosen = get_param_rosen();
	// 要素をすべて削除
	$("#stationList").empty();

	// メッセージを削除
	$("#message").empty();
	$("#message").hide();

	$(".main-contents").css("transition", "transform .0s ease-out 0s,-webkit-transform .0s ease-out 0s");
	$(".main-contents").css("transform", "translateX(0px)");
	$(".sub-footer #subFooterContents").css("transition", "transform .0s ease-out 0s,-webkit-transform .0s ease-out 0s");
	$(".sub-footer #subFooterContents").css("transform", "translateX(0px)");

	// 選択された区間を基に走行位置を再表示
	set_station_list(param_rosen, _scrollKey, _callback);

	// エリア別状況JSONを読み込んで、運行情報を設定する。
	set_unko_info(param_rosen);

	// ポップアップhtml判断
	let now = Date.now() >>> 16;
	let lang = document.documentElement.dataset.lang;
	let popup_url = lang == "ja" ? "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/trainlocation/CMUNKOU/inc_location_popup.html?" + now : "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/trainlocation/CMUNKOU/inc_location_popup_" + lang + ".html?" + now;
	$.ajax({
		url: popup_url,
		detaType: "html",
		success: function (data) {
			if (data != "") {
				let popupDiv = document.createElement("div");
				popupDiv.innerHTML = data;
				$("#popupOshirase").html(popupDiv);
				$(".sub-footer-contents.popup").show();
			} else {
				$(".sub-footer-contents.popup").hide();
			}
		}
	})

	// ページの最後が駅で終わっている路線（08、13）でサブフッターの表示があった場合、下に余白を追加する
	eki_end_margin();
}

/*
 * 列車アイコンの赤枠を点滅させる
 */
function set_ressha_icon_animation() {
	let doc = document.querySelector('.ressha-animation');

	if (doc) {
		if (resshaAnimationTimer) {
			clearInterval(resshaAnimationTimer);
			resshaAnimationTimer = null;
		}
		function blink() {
			doc.classList.toggle('hidden');
		}

		resshaAnimationTimer = setInterval(blink, 1000);
	}
}

/*
 * JSONデータを読み込み、駅・駅間を描画する
 */
function get_location_json_source_list(_param_rosen) {
	const sourceList = LOCATION_JSON_SOURCE_MAP[_param_rosen];
	if (!Array.isArray(sourceList) || sourceList.length < 1) return [_param_rosen];

	const uniqueSources = [...new Set(sourceList.map(String).filter(Boolean))];
	return uniqueSources.length > 0 ? uniqueSources : [_param_rosen];
}

function get_location_json_url(_rosen, _now) {
	return "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/trainlocation/json/location/now/location_" + _rosen + "_now.json?" + _now;
}

function is_jreast_location_rosen(_rosen) {
	return Object.prototype.hasOwnProperty.call(JREAST_LOCATION_SOURCE_MAP, String(_rosen || ""));
}

function is_dokotre_location_rosen(_rosen) {
	return Object.prototype.hasOwnProperty.call(DOKOTRE_LOCATION_SOURCE_MAP, String(_rosen || ""));
}

function is_jr_shinkansen_location_rosen(_rosen) {
	return Object.prototype.hasOwnProperty.call(JR_SHINKANSEN_LOCATION_SOURCE_MAP, String(_rosen || ""));
}

function is_jrwest_location_rosen(_rosen) {
	return Object.prototype.hasOwnProperty.call(JRWEST_LOCATION_SOURCE_MAP, String(_rosen || ""));
}

function is_jrshikoku_location_rosen(_rosen) {
	return Object.prototype.hasOwnProperty.call(JRSHIKOKU_LOCATION_SOURCE_MAP, String(_rosen || ""));
}

function is_jrcentral_location_rosen(_rosen) {
	return Object.prototype.hasOwnProperty.call(JRCENTRAL_LOCATION_SOURCE_MAP, String(_rosen || ""));
}

function is_location_auto_refresh_allowed(_rosen) {
	return !is_jreast_location_rosen(_rosen);
}

function get_jreast_location_request(_rosen, _now) {
	const source = JREAST_LOCATION_SOURCE_MAP[String(_rosen || "")];
	if (!source) return $.Deferred().reject().promise();
	const separator = source.url.indexOf("?") >= 0 ? "&" : "?";
	return $.getJSON(source.url + separator + "cache=" + _now);
}

function get_dokotre_location_request(_url, _now) {
	if (!_url) return $.Deferred().reject().promise();
	const separator = _url.indexOf("?") >= 0 ? "&" : "?";
	const url = _url + separator + "cache=" + _now;
	const proxyPrefix = "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=";
	return $.getJSON(url.indexOf(proxyPrefix) === 0 ? url : proxyPrefix + url);
}

function get_jrcentral_timetable_cache_info(_now = new Date()) {
	const now = new Date(_now);
	const boundary = new Date(now);
	boundary.setHours(4, 0, 0, 0);
	let serviceDate = new Date(now);
	let expiresAt = boundary;
	if (now >= boundary) {
		expiresAt = new Date(boundary);
		expiresAt.setDate(expiresAt.getDate() + 1);
	} else {
		serviceDate.setDate(serviceDate.getDate() - 1);
	}
	const pad = (value) => String(value).padStart(2, "0");
	return {
		serviceDate: serviceDate.getFullYear() + "-" + pad(serviceDate.getMonth() + 1) + "-" + pad(serviceDate.getDate()),
		expiresAt: expiresAt.getTime()
	};
}

function get_jrcentral_timetable_cache_request(_serviceDate) {
	return new Request(new URL("./__jrcentral_timetable_cache__/" + _serviceDate + ".json", location.href).toString());
}

async function get_jrcentral_timetable_cache(_cacheInfo) {
	if (!("caches" in window)) return null;
	const cache = await caches.open(JRCENTRAL_TIMETABLE_CACHE_NAME);
	const targetRequest = get_jrcentral_timetable_cache_request(_cacheInfo.serviceDate);
	const requests = await cache.keys();
	await Promise.all(requests.map(async (request) => {
		if (request.url === targetRequest.url) return;
		await cache.delete(request);
	}));
	const cachedResponse = await cache.match(targetRequest);
	if (!cachedResponse) return { cache: cache, request: targetRequest, response: null };
	const expiresAt = Number(cachedResponse.headers.get("x-expires-at") || 0);
	if (!expiresAt || expiresAt <= Date.now()) {
		await cache.delete(targetRequest);
		return { cache: cache, request: targetRequest, response: null };
	}
	return { cache: cache, request: targetRequest, response: cachedResponse };
}

function parse_jrcentral_timetable_json(_text) {
	return JSON.parse(String(_text || "").replace(/^\uFEFF/, ""));
}

async function fetch_jrcentral_timetable_json(_cacheInfo, _cacheContext) {
	const cacheToken = String(_cacheInfo.serviceDate || "").replace(/-/g, "");
	const sourceUrl = JRCENTRAL_TIMETABLE_URL + "?cache=" + cacheToken;
	const proxyUrl = "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=" + sourceUrl;
	const response = await fetch(proxyUrl, { cache: "no-store" });
	if (!response.ok) throw new Error("JR Central timetable request failed: " + response.status);
	const text = await response.text();
	const json = parse_jrcentral_timetable_json(text);
	if (!json || !Array.isArray(json.train_info)) throw new Error("JR Central timetable response is invalid");
	if (_cacheContext && _cacheContext.cache) {
		const cachedResponse = new Response(text, {
			headers: {
				"content-type": "application/json; charset=utf-8",
				"x-expires-at": String(_cacheInfo.expiresAt)
			}
		});
		try {
			await _cacheContext.cache.put(_cacheContext.request, cachedResponse);
		} catch (_error) {
			// 容量制限などで保存できない場合も、今回取得した時刻データはそのまま使用する。
		}
	}
	return json;
}

function schedule_jrcentral_timetable_cache_expiry(_expiresAt) {
	if (jrCentralTimetableCacheExpiryTimer) clearTimeout(jrCentralTimetableCacheExpiryTimer);
	const delay = Math.max(0, Number(_expiresAt || 0) - Date.now());
	jrCentralTimetableCacheExpiryTimer = setTimeout(() => {
		jrCentralTimetableDataPromise = null;
		jrCentralTimetableDataExpiresAt = 0;
		jrCentralTimetableCacheExpiryTimer = null;
		jrCentralTimetableCacheInitializedFor = "";
		if ("caches" in window) caches.delete(JRCENTRAL_TIMETABLE_CACHE_NAME).catch(() => {});
	}, Math.min(delay, 2147483647));
}

function initialize_jrcentral_timetable_cache() {
	const cacheInfo = get_jrcentral_timetable_cache_info();
	if (jrCentralTimetableCacheInitializedFor === cacheInfo.serviceDate) return;
	jrCentralTimetableCacheInitializedFor = cacheInfo.serviceDate;
	get_jrcentral_timetable_cache(cacheInfo).catch(() => {});
	schedule_jrcentral_timetable_cache_expiry(cacheInfo.expiresAt);
}

function load_jrcentral_timetable_json() {
	const cacheInfo = get_jrcentral_timetable_cache_info();
	if (jrCentralTimetableDataPromise && jrCentralTimetableDataExpiresAt > Date.now()) {
		return jrCentralTimetableDataPromise;
	}
	jrCentralTimetableDataExpiresAt = cacheInfo.expiresAt;
	jrCentralTimetableDataPromise = get_jrcentral_timetable_cache(cacheInfo)
		.then(async (cacheContext) => {
			if (cacheContext && cacheContext.response) {
				return parse_jrcentral_timetable_json(await cacheContext.response.text());
			}
			return fetch_jrcentral_timetable_json(cacheInfo, cacheContext);
		})
		.catch((error) => {
			jrCentralTimetableDataPromise = null;
			jrCentralTimetableDataExpiresAt = 0;
			throw error;
		});
	schedule_jrcentral_timetable_cache_expiry(cacheInfo.expiresAt);
	return jrCentralTimetableDataPromise;
}

function prepare_jrcentral_timetable_dataset(_dataset) {
	if (!_dataset || _dataset.source !== "jrcentral") return Promise.resolve();
	const trainIdentificationKey = String(_dataset.jrcentral_train_key || "").trim();
	if (!trainIdentificationKey || !window.JrCentralLocationAdapter || typeof window.JrCentralLocationAdapter.convertTimetable !== "function") {
		_dataset.jrcentral_timetable = "[]";
		return Promise.resolve();
	}
	return load_jrcentral_timetable_json().then((json) => {
		const timetable = window.JrCentralLocationAdapter.convertTimetable(json, trainIdentificationKey);
		_dataset.jrcentral_timetable = JSON.stringify(timetable);
	});
}

function get_dokotre_mapping_request(_url, _now) {
	if (!_url) return $.Deferred().reject().promise();
	const separator = _url.indexOf("?") >= 0 ? "&" : "?";
	return $.getJSON(_url + separator + "cache=" + _now);
}

function get_external_text_request(_url, _now) {
	if (!_url) return $.Deferred().reject().promise();
	const separator = _url.indexOf("?") >= 0 ? "&" : "?";
	return $.ajax({
		url: _url + separator + "cache=" + _now,
		dataType: "text"
	});
}

function jqxhr_to_promise(_jqxhr) {
	return new Promise((resolve, reject) => {
		_jqxhr.done((data) => resolve(data)).fail((error) => reject(error));
	});
}

const LOCATION_DATA_STALE_THRESHOLD_MS = 5 * 60 * 1000;

function get_location_train_merge_key(_row) {
	if (!_row || !_row.cbango) return "";
	const cbango = String(_row.cbango);
	if (_row.jrShikoku && _row.jrShikoku.isForecastWindow) {
		return ["jrshikoku-forecast", cbango, String(_row.pos || "")].join("|");
	}
	return cbango;
}

function merge_location_now_data(_nowDataList) {
	const seenCbangoMap = new Map();
	const mergedTrains = [];
	const sourceTimes = [];
	const maintenanceMessages = [];
	let displayTime = null;

	_nowDataList.forEach((entry) => {
		const nowData = entry && entry.nowData ? entry.nowData : entry;
		const sourceRosen = entry && entry.rosen ? entry.rosen : "";
		if (!nowData || !Array.isArray(nowData.trains)) return;
		const sourceTime = get_location_now_time_info(nowData, sourceRosen);
		if (sourceTime) sourceTimes.push(sourceTime);
		if (!displayTime && nowData.time) displayTime = nowData.time;
		const nowMaintenanceMessages = Array.isArray(nowData.maintenanceMessages)
			? nowData.maintenanceMessages
			: (nowData.maintenance ? [nowData.maintenance] : []);
		nowMaintenanceMessages.forEach((maintenance) => {
			if (maintenance) maintenanceMessages.push(maintenance);
		});

		nowData.trains.forEach((row) => {
			if (!row || !row.cbango) {
				mergedTrains.push(row);
				return;
			}
			const mergeKey = get_location_train_merge_key(row);
			if (seenCbangoMap.has(mergeKey)) return;
			seenCbangoMap.set(mergeKey, true);
			mergedTrains.push(row);
		});
	});

	const mergedData = { trains: mergedTrains, sourceTimes: sourceTimes };
	if (displayTime) mergedData.time = displayTime;
	if (maintenanceMessages.length > 0) mergedData.maintenanceMessages = maintenanceMessages;
	return mergedData;
}

function load_location_now_data(_param_rosen, _now) {
	if (String(_param_rosen || "") === "64") {
		return load_combined_jrwest_jrshikoku_location_now_data(_param_rosen, _now);
	}
	if (is_jreast_location_rosen(_param_rosen)) {
		return load_combined_jreast_location_now_data(_param_rosen, _now);
	}
	if (is_dokotre_location_rosen(_param_rosen)) {
		return load_dokotre_location_now_data(_param_rosen, _now);
	}
	if (is_jr_shinkansen_location_rosen(_param_rosen)) {
		return load_jr_shinkansen_location_now_data(_param_rosen, _now);
	}
	if (is_jrwest_location_rosen(_param_rosen)) {
		return load_jrwest_location_now_data(_param_rosen, _now);
	}
	if (is_jrshikoku_location_rosen(_param_rosen)) {
		return load_jrshikoku_location_now_data(_param_rosen, _now);
	}
	if (is_jrcentral_location_rosen(_param_rosen)) {
		return load_jrcentral_location_now_data(_param_rosen, _now);
	}

	const sourceRosens = get_location_json_source_list(_param_rosen);
	return Promise.all(
		sourceRosens.map((rosen) => {
			return jqxhr_to_promise(get_location_now_request(rosen, _now))
				.then((nowData) => ({ rosen: rosen, nowData: nowData }))
				.catch(() => null);
		})
	).then((nowDataResults) => {
		const successDataList = nowDataResults.filter((entry) => entry && entry.nowData && Array.isArray(entry.nowData.trains));
		if (successDataList.length < 1) throw new Error("location now json load failed");
		return merge_location_now_data(successDataList);
	});
}

function load_combined_jrwest_jrshikoku_location_now_data(_param_rosen, _now) {
	return Promise.all([
		load_jrshikoku_location_now_data(_param_rosen, _now)
			.then((nowData) => ({ rosen: _param_rosen, sourceType: "jrshikoku", nowData: nowData }))
			.catch(() => null),
		load_jrwest_location_now_data(_param_rosen, _now)
			.then((nowData) => ({ rosen: _param_rosen, sourceType: "jrwest", nowData: nowData }))
			.catch(() => null)
	]).then((nowDataResults) => {
		const successDataList = nowDataResults.filter((entry) => entry && entry.nowData && Array.isArray(entry.nowData.trains));
		if (successDataList.length < 1) throw new Error("Seto-Ohashi location now json load failed");
		return merge_location_now_data(successDataList);
	});
}

function load_combined_jreast_location_now_data(_param_rosen, _now) {
	const source = JREAST_LOCATION_SOURCE_MAP[String(_param_rosen || "")];
	const hokkaidoRosens = source && Array.isArray(source.hokkaidoRosens) ? source.hokkaidoRosens : [];
	const jreastRosens = source && Array.isArray(source.relatedJreastRosens) ? source.relatedJreastRosens : [_param_rosen];
	const hokkaidoRequests = hokkaidoRosens.map((rosen) => {
		return jqxhr_to_promise(get_location_now_request(rosen, _now))
			.then((nowData) => ({ rosen: rosen, sourceType: "hokkaido", nowData: nowData }))
			.catch(() => null);
	});
	const jreastRequests = jreastRosens.map((rosen) => {
		return load_jreast_location_now_data(_param_rosen, _now, rosen)
			.then((nowData) => ({ rosen: rosen, sourceType: "jreast", nowData: nowData }))
			.catch(() => null);
	});

	return Promise.all(hokkaidoRequests.concat(jreastRequests))
		.then((nowDataResults) => {
			const successDataList = nowDataResults.filter((entry) => entry && entry.nowData && Array.isArray(entry.nowData.trains));
			if (successDataList.length < 1) throw new Error("location now json load failed");
			const mergedData = merge_location_now_data(successDataList);
			const jreastData = successDataList.find((entry) => entry.sourceType === "jreast" && entry.rosen == _param_rosen && entry.nowData && entry.nowData.time)
				|| successDataList.find((entry) => entry.sourceType === "jreast" && entry.nowData && entry.nowData.time);
			if (jreastData) mergedData.time = jreastData.nowData.time;
			return mergedData;
		});
}

function load_jreast_location_now_data(_param_rosen, _now, _source_rosen) {
	const sourceRosen = _source_rosen || _param_rosen;
	const source = JREAST_LOCATION_SOURCE_MAP[String(sourceRosen || "")];
	if (!source || !window.JrEastLocationAdapter) {
		return Promise.reject(new Error("JRE location adapter is not loaded"));
	}
	return jqxhr_to_promise(get_jreast_location_request(sourceRosen, _now))
		.then((rawData) => convert_jreast_location_now_data(rawData, source, _param_rosen, sourceRosen));
}

function load_dokotre_location_now_data(_param_rosen, _now) {
	const source = DOKOTRE_LOCATION_SOURCE_MAP[String(_param_rosen || "")];
	if (!source || !window.DokotreLocationAdapter) {
		return Promise.reject(new Error("Dokotre location adapter is not loaded"));
	}
	const sources = Array.isArray(source.sources) ? source.sources : [source];
	return Promise.all(sources.map((entry) => {
		return load_dokotre_location_source(entry, _now)
			.then((nowData) => ({ rosen: entry.senku || source.senku || _param_rosen, sourceType: "dokotre", nowData: nowData }))
			.catch(() => null);
	})).then((nowDataResults) => {
		const successDataList = nowDataResults.filter((entry) => entry && entry.nowData && Array.isArray(entry.nowData.trains));
		if (successDataList.length < 1) throw new Error("Dokotre location now json load failed");
		return merge_location_now_data(successDataList);
	});
}

function load_dokotre_location_source(source, _now) {
	return Promise.all([
		load_dokotre_static_source_data(source, _now),
		jqxhr_to_promise(get_dokotre_location_request(source.statusUrl, _now))
	]).then((results) => {
		const staticData = results[0];
		const statusJson = results[1];
		const normalized = window.DokotreLocationAdapter.normalize(staticData.lineJson, staticData.diagramJson, statusJson, staticData.mapping, {
			dokotreId: source.dokotreId,
			senku: source.senku,
			detailDiagramJson: staticData.detailDiagramJson
		});
		return normalized.location;
	});
}

function load_dokotre_static_source_data(source, _now) {
	const cacheKey = get_dokotre_static_source_cache_key(source);
	if (dokotreStaticSourceDataCache.has(cacheKey)) {
		return dokotreStaticSourceDataCache.get(cacheKey);
	}
	const loadPromise = Promise.all([
		source.lineUrl ? jqxhr_to_promise(get_dokotre_location_request(source.lineUrl, _now)) : Promise.resolve({ data: [] }),
		jqxhr_to_promise(get_dokotre_location_request(source.diagramUrl, _now)),
		jqxhr_to_promise(get_dokotre_mapping_request(source.mappingUrl, _now)),
		source.detailDiagramUrl ? jqxhr_to_promise(get_dokotre_location_request(source.detailDiagramUrl, _now)).catch(() => null) : Promise.resolve(null)
	]).then((results) => {
		return {
			lineJson: results[0],
			diagramJson: results[1],
			mapping: results[2],
			detailDiagramJson: results[3]
		};
	}).catch((error) => {
		dokotreStaticSourceDataCache.delete(cacheKey);
		throw error;
	});
	dokotreStaticSourceDataCache.set(cacheKey, loadPromise);
	return loadPromise;
}

function get_dokotre_static_source_cache_key(source) {
	return [
		source && source.dokotreId || "",
		source && source.senku || "",
		source && source.lineUrl || "",
		source && source.diagramUrl || "",
		source && source.mappingUrl || "",
		source && source.detailDiagramUrl || ""
	].join("|");
}

function load_jrwest_location_now_data(_param_rosen, _now) {
	const source = JRWEST_LOCATION_SOURCE_MAP[String(_param_rosen || "")];
	if (!source || !window.JrWestLocationAdapter) {
		return Promise.reject(new Error("JR West location adapter is not loaded"));
	}
	const sources = Array.isArray(source.sources) ? source.sources : [source];
	return jqxhr_to_promise(get_external_text_request(source.currentTimeUrl, _now)).catch(() => "")
		.then((currentTimeText) => Promise.all(sources.map((entry) => {
			return load_jrwest_location_source(entry, source.senku || _param_rosen, currentTimeText, _now)
				.then((nowData) => ({ rosen: source.senku || _param_rosen, sourceType: "jrwest", nowData: nowData }))
				.catch(() => null);
		})))
		.then((nowDataResults) => {
			const successDataList = nowDataResults.filter((entry) => entry && entry.nowData && Array.isArray(entry.nowData.trains));
			if (successDataList.length < 1) throw new Error("JR West location now json load failed");
			return merge_location_now_data(successDataList);
		});
}

function load_jrwest_location_source(source, senku, currentTimeText, _now) {
	return Promise.all([
		load_jrwest_static_source_data(source, _now),
		jqxhr_to_promise(get_dokotre_location_request(source.locationUrl, _now))
	]).then((results) => {
		return window.JrWestLocationAdapter.normalize(
			results[1],
			results[0].stationJson,
			results[0].areaMasterJson,
			currentTimeText,
			{
				senku: senku,
				lineId: source.lineId,
				stationCodes: source.stationCodes,
				positionPrefix: window.JrWestLocationAdapter.scopePositionPrefix(source.positionPrefix, senku)
			}
		);
	});
}

function load_jrwest_static_source_data(source, _now) {
	const cacheKey = [source.areaId, source.lineId, source.areaMasterUrl, source.stationUrl].join("|");
	if (jrWestStaticSourceDataCache.has(cacheKey)) {
		return jrWestStaticSourceDataCache.get(cacheKey);
	}
	const loadPromise = Promise.all([
		load_jrwest_static_json(source.areaMasterUrl, _now),
		load_jrwest_static_json(source.stationUrl, _now)
	]).then((results) => ({ areaMasterJson: results[0], stationJson: results[1] }))
		.catch((error) => {
			jrWestStaticSourceDataCache.delete(cacheKey);
			throw error;
		});
	jrWestStaticSourceDataCache.set(cacheKey, loadPromise);
	return loadPromise;
}

function load_jrwest_static_json(url, _now) {
	if (jrWestStaticJsonDataCache.has(url)) return jrWestStaticJsonDataCache.get(url);
	const loadPromise = jqxhr_to_promise(get_dokotre_location_request(url, _now))
		.catch((error) => {
			jrWestStaticJsonDataCache.delete(url);
			throw error;
		});
	jrWestStaticJsonDataCache.set(url, loadPromise);
	return loadPromise;
}

function load_jrshikoku_location_now_data(_param_rosen, _now) {
	const source = JRSHIKOKU_LOCATION_SOURCE_MAP[String(_param_rosen || "")];
	if (!source || !window.JrShikokuLocationAdapter) {
		return Promise.reject(new Error("JR Shikoku location adapter is not loaded"));
	}
	return Promise.all([
		jqxhr_to_promise(get_external_text_request(source.liveUrl, _now)),
		load_jrshikoku_timetable_data(source, _now)
	]).then((results) => {
		return window.JrShikokuLocationAdapter.normalize(results[0], results[1], {
			senku: source.senku || _param_rosen,
			lineId: source.lineId || "yosan"
		});
	});
}

function load_jrcentral_location_now_data(_param_rosen, _now) {
	const source = JRCENTRAL_LOCATION_SOURCE_MAP[String(_param_rosen || "")];
	if (!source || !window.JrCentralLocationAdapter) {
		return Promise.reject(new Error("JR Central location adapter is not loaded"));
	}
	initialize_jrcentral_timetable_cache();
	return jqxhr_to_promise(get_dokotre_location_request(source.liveUrl, _now))
		.then((rawData) => window.JrCentralLocationAdapter.normalize(rawData, {
			senku: source.senku || _param_rosen,
			lineName: source.lineName,
			stationSet: source.stationSet,
			positionPrefix: source.positionPrefix
		}));
}

function load_jrshikoku_timetable_data(source, _now) {
	const cacheKey = source && source.timetableUrl ? source.timetableUrl : "jrshikoku-timetable";
	if (jrShikokuStaticSourceDataCache.has(cacheKey)) {
		return jrShikokuStaticSourceDataCache.get(cacheKey);
	}
	const loadPromise = jqxhr_to_promise(get_external_text_request(source.timetableUrl, get_jrshikoku_service_date_key()))
		.catch((error) => {
			jrShikokuStaticSourceDataCache.delete(cacheKey);
			throw error;
		});
	jrShikokuStaticSourceDataCache.set(cacheKey, loadPromise);
	return loadPromise;
}

function get_jrshikoku_service_date_key() {
	const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
	if (jst.getUTCHours() < 4) jst.setUTCDate(jst.getUTCDate() - 1);
	return jst.getUTCFullYear() + "-" +
		String(jst.getUTCMonth() + 1).padStart(2, "0") + "-" +
		String(jst.getUTCDate()).padStart(2, "0");
}

function load_jr_shinkansen_location_now_data(_param_rosen, _now) {
	const source = JR_SHINKANSEN_LOCATION_SOURCE_MAP[String(_param_rosen || "")];
	if (!source || !window.JrShinkansenLocationAdapter) {
		return Promise.reject(new Error("JR Shinkansen location adapter is not loaded"));
	}
	return Promise.all([
		jqxhr_to_promise(get_dokotre_location_request(source.centralUrl, _now)).catch(() => null),
		load_jr_shinkansen_static_source_data(source, _now).catch(() => ({ centralMasterJson: null })),
		jqxhr_to_promise(get_external_text_request(source.kyushuUrl, _now)).catch(() => ""),
		load_jr_shinkansen_central_suspension_data(source, _now).catch(() => null),
		load_jr_shinkansen_official_train_number_map(source).catch(() => ({}))
	]).then((results) => {
		const centralLocationJson = results[0];
		const centralMasterJson = results[1].centralMasterJson;
		const kyushuHtml = results[2];
		const centralSuspensionJson = results[3];
		const officialTrainNumberMap = results[4];
		return load_jr_shinkansen_central_train_info_map(source, centralLocationJson, _now)
			.then((centralTrainInfoMap) => {
				const baseOptions = {
					senku: source.senku || _param_rosen,
					centralTrainInfoMap: centralTrainInfoMap,
					centralSuspensionJson: centralSuspensionJson,
					officialTrainNumberMap: officialTrainNumberMap
				};
				const preliminary = window.JrShinkansenLocationAdapter.normalize(centralLocationJson, centralMasterJson, kyushuHtml, baseOptions);
				return load_jr_shinkansen_kyushu_timetable_map(source, preliminary.location, _now)
					.then((kyushuTimetableMap) => {
						const normalized = window.JrShinkansenLocationAdapter.normalize(centralLocationJson, centralMasterJson, kyushuHtml, Object.assign({}, baseOptions, {
							kyushuTimetableMap: kyushuTimetableMap
						}));
						return normalized;
					});
			})
			.then((normalized) => {
				if (!normalized.location || !Array.isArray(normalized.location.trains) || normalized.location.trains.length < 1) {
					throw new Error("JR Shinkansen location now json load failed");
				}
				return normalized.location;
			});
	});
}

function load_jr_shinkansen_central_suspension_data(source, _now) {
	if (!source || !source.centralSuspensionUrl) return Promise.resolve(null);
	return jqxhr_to_promise(get_dokotre_location_request(source.centralSuspensionUrl, _now));
}

function load_jr_shinkansen_official_train_number_map(source) {
	if (!source || !source.officialTrainNumberUrl) return Promise.resolve({});
	const serviceDate = get_jrkyushu_timetable_service_date();
	const cacheKey = String(source.senku || "") + "|" + serviceDate;
	if (jrEastShinkansenTrainNumberDataCache.has(cacheKey)) {
		return jrEastShinkansenTrainNumberDataCache.get(cacheKey);
	}
	const requestUrl = source.officialTrainNumberUrl + "?date=" + encodeURIComponent(serviceDate);
	const loadPromise = jqxhr_to_promise($.getJSON(requestUrl))
		.then((data) => data && data.maps ? data.maps : {});
	jrEastShinkansenTrainNumberDataCache.set(cacheKey, loadPromise);
	return loadPromise;
}

function load_jr_shinkansen_kyushu_timetable_map(source, normalizedLocation, _now) {
	const trainNumbers = collect_jr_shinkansen_kyushu_timetable_train_numbers(source, normalizedLocation);
	if (trainNumbers.length < 1) return Promise.resolve({});
	return Promise.all(trainNumbers.map((trainNumber) => {
		return load_jrkyushu_timetable_data(trainNumber, _now)
			.then((data) => ({ trainNumber: trainNumber, data: data }))
			.catch(() => null);
	})).then((results) => {
		return results.filter((entry) => entry && entry.data).reduce((map, entry) => {
			map[entry.trainNumber] = entry.data;
			return map;
		}, {});
	});
}

function collect_jr_shinkansen_kyushu_timetable_train_numbers(source, normalizedLocation) {
	const senku = String(source && source.senku || "");
	const trainNumbers = new Set();
	const trains = normalizedLocation && Array.isArray(normalizedLocation.trains) ? normalizedLocation.trains : [];
	trains.forEach((train) => {
		if (!train || !train.jrShinkansen || !train.cbango) return;
		if (senku === "60") {
			trainNumbers.add(String(train.cbango));
			return;
		}
		const jr = train.jrShinkansen;
		const startingStation = Number(jr.startingStation || 0);
		const terminalStation = Number(jr.terminalStation || 0);
		const pos = String(train.pos || "");
		if (jr.source === "kyushu" || /^JQ01P/.test(pos) || (startingStation >= 46 && startingStation <= 56) || (terminalStation >= 46 && terminalStation <= 56)) {
			trainNumbers.add(String(train.cbango));
		}
	});
	return Array.from(trainNumbers).slice(0, 80);
}

function load_jrkyushu_timetable_data(trainNumber, _now) {
	const normalizedTrainNumber = normalize_train_search_cbango(trainNumber);
	if (!normalizedTrainNumber) return Promise.reject(new Error("empty train number"));
	const serviceDate = get_jrkyushu_timetable_service_date();
	const cacheKey = serviceDate + "|" + normalizedTrainNumber;
	if (jrKyushuTimetableDataCache.has(cacheKey)) return jrKyushuTimetableDataCache.get(cacheKey);
	const cacheBuster = encodeURIComponent(_now || Date.now());
	const workerUrl = JR_KYUSHU_TIMETABLE_WORKER_BASE + "/timetable/" + encodeURIComponent(normalizedTrainNumber) + "?date=" + encodeURIComponent(serviceDate) + "&_=" + cacheBuster;
	const loadPromise = get_jrkyushu_timetable_json(workerUrl)
		.catch((error) => {
			jrKyushuTimetableDataCache.delete(cacheKey);
			throw error;
		});
	jrKyushuTimetableDataCache.set(cacheKey, loadPromise);
	return loadPromise;
}

function get_jrkyushu_timetable_json(url) {
	return new Promise((resolve, reject) => {
		$.ajax({
			url: url,
			dataType: "json",
			cache: false
		}).done((data) => {
			if (!data || data.ok === false || !Array.isArray(data.stations)) {
				reject(new Error("JR Kyushu timetable response is invalid"));
				return;
			}
			resolve(data);
		}).fail((jqxhr, textStatus, errorThrown) => {
			reject(new Error(errorThrown || textStatus || "JR Kyushu timetable request failed"));
		});
	});
}

function get_jrkyushu_timetable_service_date(now = new Date()) {
	const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
	if (jst.getUTCHours() < 4) jst.setUTCDate(jst.getUTCDate() - 1);
	const year = jst.getUTCFullYear();
	const month = String(jst.getUTCMonth() + 1).padStart(2, "0");
	const day = String(jst.getUTCDate()).padStart(2, "0");
	return year + "-" + month + "-" + day;
}

function load_jr_shinkansen_static_source_data(source, _now) {
	if (!source || !source.centralMasterUrl) return Promise.resolve({ centralMasterJson: null });
	const cacheKey = source && source.centralMasterUrl || "";
	if (jrShinkansenStaticSourceDataCache.has(cacheKey)) {
		return jrShinkansenStaticSourceDataCache.get(cacheKey);
	}
	const loadPromise = Promise.all([
		jqxhr_to_promise(get_dokotre_location_request(source.centralMasterUrl, _now))
	]).then((results) => {
		return {
			centralMasterJson: results[0]
		};
	}).catch((error) => {
		jrShinkansenStaticSourceDataCache.delete(cacheKey);
		throw error;
	});
	jrShinkansenStaticSourceDataCache.set(cacheKey, loadPromise);
	return loadPromise;
}

function load_jr_shinkansen_central_train_info_map(source, centralLocationJson, _now) {
	const refs = collect_jr_shinkansen_central_train_refs(centralLocationJson);
	if (refs.length < 1) return Promise.resolve({});
	return Promise.all(refs.map((ref) => {
		return jqxhr_to_promise(get_jr_shinkansen_central_train_info_request(source, ref.train, ref.trainNumber, _now))
			.then((json) => ({ key: ref.key, json: json }))
			.catch(() => null);
	})).then((results) => {
		return results.filter(Boolean).reduce((map, entry) => {
			map[entry.key] = entry.json;
			return map;
		}, {});
	});
}

function get_jr_shinkansen_central_train_info_request(source, train, trainNumber, _now) {
	if (!source || !source.centralTrainInfoUrlBase || !train || !trainNumber) return $.Deferred().reject().promise();
	const url = source.centralTrainInfoUrlBase + "train_info_" + encodeURIComponent(train) + "_" + encodeURIComponent(trainNumber) + ".json";
	return get_dokotre_location_request(url, _now);
}

function collect_jr_shinkansen_central_train_refs(centralLocationJson) {
	const refs = new Map();
	const locationInfo = centralLocationJson && centralLocationJson.trainLocationInfo ? centralLocationJson.trainLocationInfo : {};
	["atStation", "betweenStation"].forEach((groupName) => {
		const bounds = locationInfo[groupName] && locationInfo[groupName].bounds ? locationInfo[groupName].bounds : {};
		Object.keys(bounds).forEach((bound) => {
			(bounds[bound] || []).forEach((entry) => {
				(entry.trains || []).forEach((train) => {
					if (!train || !train.train || !train.trainNumber) return;
					const key = String(train.train) + "_" + String(train.trainNumber);
					if (!refs.has(key)) refs.set(key, { key: key, train: String(train.train), trainNumber: String(train.trainNumber) });
				});
			});
		});
	});
	return Array.from(refs.values());
}

function convert_jreast_location_now_data(_rawData, _source, _display_rosen, _source_rosen) {
	const normalized = window.JrEastLocationAdapter.normalize(_rawData, {
		screenCode: _source.screenCode
	});
	const timeText = format_jreast_datetime_to_location_time(normalized.dateTime);
	const sourceTime = timeText ? get_location_now_time_info({ time: { ja: timeText } }, normalized.screenCode) : null;
	const trains = (Array.isArray(normalized.trains) ? normalized.trains : []).map((train) => {
		const row = Object.assign({}, train);
		row.source = "jreast";
		row.sourceRosen = _source_rosen || "";
		row.senku = "";
		row.posName = train.jrEast && train.jrEast.positionName ? train.jrEast.positionName : "";
		row.shuEkiSimple = train.shuEkiSimple || make_jreast_destination_short(train.shuEkiName);
		row.shuEkiName = train.shuEkiName || train.shuEkiSimple || "";
		row.shuEkiKey = train.shuEkiKey || "";
		return row;
	});
	const screenDisplayMode = normalized.screenDisplayMode || {};
	const maintenanceMessages = is_jreast_location_not_in_service_time(_rawData, normalized)
		? [{
			source: "jreast",
			rosen: _source_rosen || _display_rosen || "",
			message: screenDisplayMode.message && screenDisplayMode.message.ja ? screenDisplayMode.message.ja : ""
		}]
		: [];

	return {
		time: timeText ? { ja: timeText } : undefined,
		trains: trains,
		sourceTimes: sourceTime ? [sourceTime] : [],
		maintenanceMessages: maintenanceMessages
	};
}

function is_jreast_location_not_in_service_time(_rawData, _normalized) {
	if (_normalized && _normalized.screenDisplayMode && _normalized.screenDisplayMode.mode === "notInServiceTime") return true;
	return !!(_rawData && Array.isArray(_rawData.statusInfo) && _rawData.statusInfo.some((status) => {
		return status && status.deliveryStatus && status.deliveryStatus.mode === "notInServiceTime";
	}));
}

function format_jreast_datetime_to_location_time(_dateTime) {
	const match = String(_dateTime || "").match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
	if (!match) return "";
	return Number(match[1]) + "年" +
		Number(match[2]) + "月" +
		Number(match[3]) + "日" +
		Number(match[4]) + "時" +
		Number(match[5]) + "分" +
		Number(match[6]) + "秒現在";
}

function make_jreast_destination_short(_destination) {
	const text = String(_destination || "").replace(/\s+/g, "");
	if (!text) return "";
	const first = text.split(/[・･／/]/)[0] || text;
	return first.length > 2 ? first.slice(0, 2) : first;
}

function get_location_now_time_info(_nowData, _rosen) {
	if (!_nowData) return null;
	const timeText = typeof _nowData.time === "string" ? _nowData.time : (_nowData.time && _nowData.time.ja ? _nowData.time.ja : "");
	const timestamp = parse_location_now_time(timeText);
	if (!timestamp) return null;
	return {
		rosen: _rosen,
		text: timeText,
		timestamp: timestamp
	};
}

function parse_location_now_time(_timeText) {
	if (!_timeText) return null;
	const match = String(_timeText).match(/(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日\s*(\d{1,2})時\s*(\d{1,2})分(?:(\d{1,2})秒)?/);
	if (!match) return null;
	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const hour = Number(match[4]);
	const minute = Number(match[5]);
	const second = Number(match[6] || 0);
	if ([year, month, day, hour, minute, second].some((value) => Number.isNaN(value))) return null;
	return Date.UTC(year, month - 1, day, hour - 9, minute, second);
}

function get_oldest_location_now_time(_nowData) {
	const sourceTimes = _nowData && Array.isArray(_nowData.sourceTimes) ? _nowData.sourceTimes : [];
	if (sourceTimes.length < 1) return null;
	return sourceTimes.reduce((oldest, current) => {
		return current.timestamp < oldest.timestamp ? current : oldest;
	}, sourceTimes[0]);
}

function get_location_maintenance_warning_message(_nowData) {
	const maintenanceMessages = _nowData && Array.isArray(_nowData.maintenanceMessages) ? _nowData.maintenanceMessages : [];
	const hasJrEastMaintenance = maintenanceMessages.some((message) => message && message.source === "jreast");
	if (!hasJrEastMaintenance) return "";
	return "JR\u6771\u65e5\u672c\u5074\u30e1\u30f3\u30c6\u30ca\u30f3\u30b9\u4e2d\u3067\u3059\u3002\u5217\u8eca\u4f4d\u7f6e\u30c7\u30fc\u30bf\u3092\u53d6\u5f97\u3067\u304d\u306a\u3044\u53ef\u80fd\u6027\u304c\u3042\u308a\u307e\u3059\u3002";
}

function update_location_data_stale_warning(_nowData) {
	const maintenanceMessage = get_location_maintenance_warning_message(_nowData);
	if (maintenanceMessage) {
		$("#locationDataStaleWarning").text(maintenanceMessage).removeAttr("hidden");
		if (typeof set_header_height === "function") set_header_height();
		return;
	}
	const oldestTime = get_oldest_location_now_time(_nowData);
	if (!oldestTime) {
		$("#locationDataStaleWarning").text("").attr("hidden", "hidden");
		if (typeof set_header_height === "function") set_header_height();
		return;
	}
	const ageMs = Date.now() - oldestTime.timestamp;
	if (ageMs < LOCATION_DATA_STALE_THRESHOLD_MS) {
		$("#locationDataStaleWarning").text("").attr("hidden", "hidden");
		if (typeof set_header_height === "function") set_header_height();
		return;
	}
	const message = "列車位置データの更新が停止している可能性があります。最終配信時刻：" + oldestTime.text;
	$("#locationDataStaleWarning").text(message).removeAttr("hidden");
	if (typeof set_header_height === "function") set_header_height();
}

function format_location_timestamp_jst() {
	const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
	return now.getUTCFullYear() + "年" +
		(now.getUTCMonth() + 1) + "月" +
		now.getUTCDate() + "日" +
		now.getUTCHours() + "時" +
		now.getUTCMinutes() + "分" +
		now.getUTCSeconds() + "秒現在";
}

function prepare_osaka_loop_cycles(_param_rosen) {
	if (String(_param_rosen) !== "67") return;
	const stationList = $("#stationList");
	const sourceCycle = stationList.children(".osaka-loop-cycle").first();
	if (sourceCycle.length !== 1 || stationList.children(".osaka-loop-cycle").length !== 1) return;

	sourceCycle.attr("data-loop-cycle", "1");
	const previousCycle = sourceCycle.clone(false).attr("data-loop-cycle", "0");
	const nextCycle = sourceCycle.clone(false).attr("data-loop-cycle", "2");
	sourceCycle.before(previousCycle);
	sourceCycle.after(nextCycle);
}

function get_osaka_loop_anchor_offset() {
	const subHeader = document.querySelector(".sub-header");
	if (!subHeader) return 0;
	return Math.max(0, subHeader.getBoundingClientRect().bottom + 8);
}

function measure_osaka_loop_scroll() {
	const cycles = $("#stationList").children(".osaka-loop-cycle");
	if (cycles.length !== 3) return null;
	const middleTop = cycles.eq(1).offset().top;
	const nextTop = cycles.eq(2).offset().top;
	const cycleHeight = nextTop - middleTop;
	if (!(cycleHeight > 0)) return null;
	return {
		middleTop: middleTop,
		nextTop: nextTop,
		cycleHeight: cycleHeight,
		anchorOffset: get_osaka_loop_anchor_offset()
	};
}

function normalize_osaka_loop_scroll() {
	if (!osakaLoopScrollState || isDialogDisp) return;
	const state = osakaLoopScrollState;
	let target = window.scrollY;
	let anchorPosition = target + state.anchorOffset;
	while (anchorPosition < state.middleTop) {
		target += state.cycleHeight;
		anchorPosition += state.cycleHeight;
	}
	while (anchorPosition >= state.nextTop) {
		target -= state.cycleHeight;
		anchorPosition -= state.cycleHeight;
	}
	if (Math.abs(target - window.scrollY) < 1) return;
	window.scrollTo(0, target);
	window.sessionStorage.setItem("scrollY", Math.max(0, target - 50));
}

function setup_osaka_loop_infinite_scroll(_param_rosen) {
	teardown_osaka_loop_infinite_scroll();
	if (String(_param_rosen) !== "67") return;

	window.requestAnimationFrame(function() {
		const measured = measure_osaka_loop_scroll();
		if (!measured) return;
		osakaLoopScrollState = measured;
		if (window.scrollY <= 1) {
			window.scrollTo(0, Math.max(0, measured.middleTop - measured.anchorOffset));
		} else {
			normalize_osaka_loop_scroll();
		}
		osakaLoopScrollState.handler = function() {
			if (osakaLoopScrollFrame !== null) return;
			osakaLoopScrollFrame = window.requestAnimationFrame(function() {
				osakaLoopScrollFrame = null;
				normalize_osaka_loop_scroll();
			});
		};
		window.addEventListener("scroll", osakaLoopScrollState.handler, { passive: true });
	});
}

function recalculate_osaka_loop_scroll() {
	if (!osakaLoopScrollState) return;
	clearTimeout(osakaLoopResizeTimer);
	osakaLoopResizeTimer = setTimeout(function() {
		if (!osakaLoopScrollState) return;
		const oldState = osakaLoopScrollState;
		const oldPosition = window.scrollY + oldState.anchorOffset - oldState.middleTop;
		const progress = ((oldPosition % oldState.cycleHeight) + oldState.cycleHeight) % oldState.cycleHeight;
		const measured = measure_osaka_loop_scroll();
		if (!measured) return;
		measured.handler = oldState.handler;
		osakaLoopScrollState = measured;
		window.scrollTo(0, Math.max(0, measured.middleTop + progress - measured.anchorOffset));
	}, 80);
}

function teardown_osaka_loop_infinite_scroll() {
	if (osakaLoopScrollState && osakaLoopScrollState.handler) {
		window.removeEventListener("scroll", osakaLoopScrollState.handler);
	}
	if (osakaLoopScrollFrame !== null) {
		window.cancelAnimationFrame(osakaLoopScrollFrame);
		osakaLoopScrollFrame = null;
	}
	clearTimeout(osakaLoopResizeTimer);
	osakaLoopResizeTimer = null;
	osakaLoopScrollState = null;
}

function get_preferred_station_element(_key) {
	const key = String(_key || "");
	let scope = $("#stationList");
	if (get_param_rosen() === "67") {
		const middleCycle = scope.children(".osaka-loop-cycle[data-loop-cycle='1']");
		if (middleCycle.length) scope = middleCycle;
	}
	return scope.find("[key]").filter(function() {
		return String($(this).attr("key")) === key;
	}).first();
}

function get_preferred_train_element(_cbango) {
	const cbango = String(_cbango || "");
	let scope = $("#stationList");
	if (get_param_rosen() === "67") {
		const middleCycle = scope.children(".osaka-loop-cycle[data-loop-cycle='1']");
		if (middleCycle.length) scope = middleCycle;
	}
	const candidates = scope.find(".ressha[data-cbango]").filter(function() {
		return String($(this).attr("data-cbango")) === cbango;
	});
	const actualTrain = candidates.not(".jrshikoku-forecast-train").first();
	return actualTrain.length ? actualTrain : candidates.first();
}

function set_station_list(_param_rosen, _scrollKey, _callback) {
	stop_location_auto_refresh();
	teardown_osaka_loop_infinite_scroll();
	// お知らせ欄作成
	if (!is_jrcentral_location_rosen(_param_rosen)) disp_oshirase(_param_rosen);

	// 各区間のhtmlを読み込み
	const lang = document.documentElement.dataset.lang;

	// 走行位置ページメンテナンスJSONファイルを読み込んで、メンテナンスページに切り替えるか判定を行う。
	let mstNow = Date.now() >>> 16;
	let nowQuery = Date.now() >>> 10;
	let rosen_html = lang == "ja" ? `./rosen/rosen_${_param_rosen}.html` : `https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/trainlocation/rosen_${_param_rosen}_${lang}.html`;
	let maintenance_html = lang == "ja" ? "./mainte/rosen_maintenance.html" : "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/trainlocation/mainte/rosen_maintenance_" + lang + ".html";

	$.when(
		$.getJSON("./master/rosen_name_master.json?" + mstNow),
		get_mainte_json_request("rosen_maintenance.json", mstNow),
		$.getJSON("https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/master/ressha_type_master.json?" + mstNow),
		$.getJSON("https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/master/eki_master.json?" + mstNow),
		$.get(rosen_html),
		$.get(maintenance_html)
	)
	.done(function(rosenNameData, maintenanceData, typeData, ekiData, rosen, maintenance) {

		// 現在日付を設定。外部JSON変換路線はJSON内部の配信時刻を使用する。
		if (is_jreast_location_rosen(_param_rosen) || is_dokotre_location_rosen(_param_rosen) || is_jr_shinkansen_location_rosen(_param_rosen) || is_jrwest_location_rosen(_param_rosen) || is_jrshikoku_location_rosen(_param_rosen) || is_jrcentral_location_rosen(_param_rosen)) $("#timestamp").text("");
		else update_location_timestamp();

		// 路線名を設定
		let findRosenName = rosenNameData[0].find((v) => v.rosen == _param_rosen);
		if (typeof findRosenName !== "undefined") {
			if (lang == "ja") $("#title").html(findRosenName.rosenName.ja + findRosenName.kukanName.ja);
			if (lang == "en") $("#title").html(`<span>${findRosenName.rosenName.en}</span><span>${findRosenName.kukanName.en}</span>`);
			if (lang == "tc") $("#title").html(findRosenName.rosenName.tc + findRosenName.kukanName.tc);
			if (lang == "sc") $("#title").html(findRosenName.rosenName.sc + findRosenName.kukanName.sc);
			if (lang == "kr") $("#title").html(`<span>${findRosenName.rosenName.kr}</span><span>${findRosenName.kukanName.kr}</span>`);
		}
		const canAutoRefresh = is_location_auto_refresh_allowed(_param_rosen);
		const isMobileLayout = window.innerWidth <= 1000;
		$("#refreshSettingBtn").toggle(canAutoRefresh && !isMobileLayout);
		$("#refreshSettingBtnSub").toggle(canAutoRefresh);
		update_refresh_status_label();

		let result = maintenanceData[0].lines.filter((v) => v.status == "1" && v.rosen == _param_rosen);
		if (result.length > 0) {
			cachedResshaTypeData = null;
			cachedEkiData = null;
			update_location_data_stale_warning(null);
			// 表示対象の路線のステータスが1の場合、メンテナンスページを表示
			$("#stationList").html(maintenance[0]);
			// 方面の設定
			$(".homen-header-contents").hide();
			$(".homen-footer-contents").hide();

			// 駅選択ボタンを非表示
			$(".btn-header-contents .header-btn.eki").hide();
			// フッターのお知らせ・運行情報を表示
			$("#subFooterContents").hide();

			$(".maintenance-title").show();

			// 駅・駅間描画後の後処理
			set_post_station_list(_param_rosen, _scrollKey);
		} else {
			load_location_now_data(_param_rosen, nowQuery)
			.then(function(nowData) {
			autoRefreshRosen = _param_rosen;
			cachedResshaTypeData = typeData[0];
			cachedEkiData = ekiData[0];
			$("#stationList").html(rosen[0]);
			prepare_osaka_loop_cycles(_param_rosen);
			prepare_jrshikoku_forecast_windows(_param_rosen);
			set_jr_shinkansen_station_border_colors(_param_rosen);
			if (is_jreast_location_rosen(_param_rosen) || is_dokotre_location_rosen(_param_rosen) || is_jr_shinkansen_location_rosen(_param_rosen) || is_jrwest_location_rosen(_param_rosen) || is_jrshikoku_location_rosen(_param_rosen) || is_jrcentral_location_rosen(_param_rosen)) setTimestamp(nowData);
			update_location_data_stale_warning(nowData);
			// 列車アイコンを描画する
			create_ressha_icon(_param_rosen, nowData, typeData[0], ekiData[0]);
			// 列車アイコンの表示順を並び替える
			ressha_pos_sort();

			// 方面の設定
			let homenUp = $("#homenNameUpText");
			let homenDown = $("#homenNameDownText");
			if (homenUp) $("#homenNameUp").html(homenUp.text());
			if (homenDown) $("#homenNameDown").html(homenDown.text());
			$(".homen-header-contents").show();
			$(".homen-footer-contents").show();

			// 駅選択ボタンを表示
			$(".btn-header-contents .header-btn.eki").show();
			// フッターのお知らせ・運行情報を表示
			$("#subFooterContents").show();

			// 駅・駅間描画後の後処理
			set_post_station_list(_param_rosen, _scrollKey);
			start_location_auto_refresh(_param_rosen);

			if (_callback) _callback();
			})
			.catch(function() {
				var errormessage = `<h2 class='msg-bg'>${get_error_message()}</h2>`;
				$('#message').html(errormessage);
				$('#message').show();
			});
		}
	})
	.fail(function() {
		var errormessage = `<h2 class='msg-bg'>${get_error_message()}</h2>`;
		$('#message').html(errormessage);
		$('#message').show();
	});
}

function set_jr_shinkansen_station_border_colors(_param_rosen) {
	if (String(_param_rosen || "") !== "59") return;
	let sectionClass = "jr-shinkansen-tokaido";
	$("#stationList .eki-panel.eki").each(function() {
		const stationLink = $(this).find(".eki-contents > .stalist-eki-link").first();
		const stationKey = String(stationLink.find("[key]").first().attr("key") || "");
		if (stationKey === "0156") sectionClass = "jr-shinkansen-sanyo";
		if (stationKey === "1627") sectionClass = "jr-shinkansen-kyushu";
		stationLink.addClass(sectionClass);
	});
}

/*
 * 走行位置の自動更新を開始する
 */
function start_location_auto_refresh(_param_rosen, _delay = locationAutoRefreshInterval) {
	stop_location_auto_refresh(true);
	if (!_param_rosen || !locationAutoRefreshEnabled) return;
	if (!is_location_auto_refresh_allowed(_param_rosen)) {
		stop_location_auto_refresh();
		return;
	}
	set_next_location_auto_refresh_time(_delay);
	locationAutoRefreshTimer = setTimeout(() => {
		if (document.visibilityState === "visible") {
			refresh_location_positions(_param_rosen);
		}
		start_location_auto_refresh(_param_rosen, locationAutoRefreshInterval);
	}, _delay);
}

/*
 * 走行位置の自動更新を停止する
 */
function stop_location_auto_refresh(_preserveNextRefresh = false) {
	if (locationAutoRefreshTimer) {
		clearTimeout(locationAutoRefreshTimer);
		locationAutoRefreshTimer = null;
	}
	if (!_preserveNextRefresh) {
		nextLocationAutoRefreshAt = null;
	}
	update_refresh_status_label();
}

/*
 * 走行位置JSONのみを再取得して、列車アイコンだけ再描画する
 */
function refresh_location_positions(_param_rosen) {
	if (!_param_rosen || _param_rosen !== get_param_rosen()) return;
	if (!cachedResshaTypeData || !cachedEkiData) return;
	if (!$("#stationList .ressha-icon").length) return;

	const now = Date.now() >>> 10;
	load_location_now_data(_param_rosen, now)
	.then(function(nowData) {
		redraw_location_positions(_param_rosen, nowData);
		set_unko_info(_param_rosen);
	})
	.catch(function() {
		// 自動更新失敗時は次回更新を待つ
	});
}

/*
 * 走行位置アイコンを差し替えて再描画する
 */
function redraw_location_positions(_param_rosen, _nowData) {
	clear_location_positions(_param_rosen);
	create_ressha_icon(_param_rosen, _nowData, cachedResshaTypeData, cachedEkiData);
	ressha_pos_sort();
	if (is_jreast_location_rosen(_param_rosen) || is_dokotre_location_rosen(_param_rosen) || is_jr_shinkansen_location_rosen(_param_rosen) || is_jrwest_location_rosen(_param_rosen) || is_jrshikoku_location_rosen(_param_rosen) || is_jrcentral_location_rosen(_param_rosen)) setTimestamp(_nowData);
	else update_location_timestamp();
	update_location_data_stale_warning(_nowData);
	restore_selected_train_marker(trackingScrollEnabled);
	update_tracking_footer_controls();
}

/*
 * 既存の走行位置アイコンをクリアする
 */
function clear_location_positions(_param_rosen) {
	$("#stationList .ressha-animation").remove();
	if (resshaAnimationTimer) {
		clearInterval(resshaAnimationTimer);
		resshaAnimationTimer = null;
	}
	$("#stationList .ressha-icon").removeClass("up");
	$("#stationList .ressha-icon .ressha, #stationList .ressha-icon .dummy").remove();

	if (["09", "52"].includes(_param_rosen)) {
		$("#fujishiro1").show();
		$("#fujishiro2").show();
		$("#fujishiro1Long").hide();
		$("#fujishiro2Long").hide();
		$("#stationList .item.hakodate").css("height", "");
		$("#stationList .item.goryokaku").css("height", "");
		$("#goryokaku").show();
		$("#goryokakuLong").hide();
	}
}

/*
 * 現在時刻表示を更新する
 */
function update_location_timestamp() {
	$("#timestamp").text(format_location_timestamp_jst());
}

/*
 * 選択中の列車がある場合、再描画後に赤枠を付け直す
 */
function restore_selected_train_marker(_follow = false) {
	const param_cbango = get_param_cbango();
	if (!param_cbango) return;
	const ressha = get_preferred_train_element(param_cbango);
	if (!ressha.length) {
		clear_tracked_train_selection(true);
		return;
	}
	ressha.append("<img class='ressha-animation' src='./images/home/ressha_mark.svg' alt>");
	set_ressha_icon_animation();
	if (_follow) {
		scroll_selected_train_into_view(ressha);
	}
}

function scroll_selected_train_into_view(_ressha) {
	if (!_ressha || !_ressha.length) return;
	if ($("#guideDetail").is(":visible") || $("#searchDetail").is(":visible") || $("#trainSearchDetail").is(":visible") || $("#trainNumberListDetail").is(":visible") || $("#popupDetail").is(":visible") || $("#refreshSettingDetail").is(":visible") || $("#resshaDetail").is(":visible") || $(".trainDetailDialog").is(":visible") || $("#oshiraseDetail").is(":visible")) {
		return;
	}
	const currentScroll = $(window).scrollTop();
	const viewportHeight = window.innerHeight || $(window).height();
	const targetScroll = Math.max(0, _ressha.offset().top - (viewportHeight / 2) + (_ressha.outerHeight() / 2));
	if (Math.abs(currentScroll - targetScroll) < 4) return;
	$("html, body").stop(true).animate({ scrollTop: targetScroll }, 250);
	window.sessionStorage.setItem("scrollY", Math.max(0, targetScroll - 50));
}

/*
 * 自動更新設定を読み込む
 */
function load_location_auto_refresh_settings() {
	const storedEnabled = localStorage.getItem(LOCATION_AUTO_REFRESH_ENABLED_KEY);
	const storedInterval = Number(localStorage.getItem(LOCATION_AUTO_REFRESH_INTERVAL_KEY));
	const storedSleepPrevent = localStorage.getItem(LOCATION_SLEEP_PREVENT_ENABLED_KEY);
	locationAutoRefreshEnabled = storedEnabled === null ? false : storedEnabled === "true";
	locationAutoRefreshInterval = [15000, 30000, 60000].includes(storedInterval) ? storedInterval : LOCATION_AUTO_REFRESH_DEFAULT_INTERVAL;
	locationSleepPreventEnabled = storedSleepPrevent === null ? false : storedSleepPrevent === "true";
	update_refresh_status_label();
	update_location_wake_lock();
}

/*
 * 自動更新設定入力欄に現在値を反映する
 */
function sync_refresh_setting_controls() {
	$("#refreshEnabledSelect").val(locationAutoRefreshEnabled ? "on" : "off");
	$("#refreshIntervalSelect").val(String(locationAutoRefreshInterval / 1000));
	$("#sleepPreventSelect").val(locationSleepPreventEnabled ? "on" : "off");
}

/*
 * 自動更新状態の表示を更新する
 */
function update_refresh_status_label() {
	const lang = document.documentElement.dataset.lang;
	const intervalSeconds = locationAutoRefreshInterval / 1000;
	const messages = {
		ja: "自動更新ON (" + intervalSeconds + "秒間隔)",
		en: "Auto refresh ON (" + intervalSeconds + " sec)",
		tc: "自動更新ON（每" + intervalSeconds + "秒）",
		sc: "自动更新ON（每" + intervalSeconds + "秒）",
		kr: "자동 갱신 ON (" + intervalSeconds + "초)"
	};
	const nextMessages = {
		ja: "次回更新：" + format_refresh_time(nextLocationAutoRefreshAt),
		en: "Next: " + format_refresh_time(nextLocationAutoRefreshAt),
		tc: "下次更新：" + format_refresh_time(nextLocationAutoRefreshAt),
		sc: "下次更新：" + format_refresh_time(nextLocationAutoRefreshAt),
		kr: "다음 갱신: " + format_refresh_time(nextLocationAutoRefreshAt)
	};
	if (locationAutoRefreshEnabled && is_location_auto_refresh_allowed(get_param_rosen())) {
		const message = (messages[lang] || messages.ja) + (nextLocationAutoRefreshAt ? "  " + (nextMessages[lang] || nextMessages.ja) : "");
		$("#refreshStatusLabel").text(message).removeAttr("hidden");
	} else {
		$("#refreshStatusLabel").text("").attr("hidden", "hidden");
	}
}

/*
 * 次回自動更新予定時刻を設定する
 */
function set_next_location_auto_refresh_time(_delay = locationAutoRefreshInterval) {
	nextLocationAutoRefreshAt = new Date(Date.now() + _delay);
	update_refresh_status_label();
}

/*
 * ヘッダー表示用に時刻を整形する
 */
function format_refresh_time(_date) {
	if (!_date) return "";
	const hours = String(_date.getHours()).padStart(2, "0");
	const minutes = String(_date.getMinutes()).padStart(2, "0");
	const seconds = String(_date.getSeconds()).padStart(2, "0");
	return hours + "時" + minutes + "分" + seconds + "秒";
}

/*
 * 自動更新設定を適用する
 */
async function update_location_wake_lock() {
	if (!locationSleepPreventEnabled || document.visibilityState !== "visible") {
		release_location_wake_lock();
		return;
	}
	if (locationWakeLock || !("wakeLock" in navigator)) return;
	try {
		locationWakeLock = await navigator.wakeLock.request("screen");
		locationWakeLock.addEventListener("release", function() {
			locationWakeLock = null;
		});
	} catch (_error) {
		locationWakeLock = null;
	}
}

function release_location_wake_lock() {
	if (!locationWakeLock) return;
	const wakeLock = locationWakeLock;
	locationWakeLock = null;
	wakeLock.release().catch(function() {});
}

function handle_location_wake_lock_user_activation() {
	if (locationSleepPreventEnabled && !locationWakeLock) update_location_wake_lock();
}

function apply_location_auto_refresh_settings(_enabled, _interval, _sleepPreventEnabled = locationSleepPreventEnabled, _persist = true) {
	const wasEnabled = locationAutoRefreshEnabled;
	locationAutoRefreshEnabled = _enabled;
	locationAutoRefreshInterval = [15000, 30000, 60000].includes(_interval) ? _interval : LOCATION_AUTO_REFRESH_DEFAULT_INTERVAL;
	locationSleepPreventEnabled = _sleepPreventEnabled;
	if (_persist) {
		localStorage.setItem(LOCATION_AUTO_REFRESH_ENABLED_KEY, String(locationAutoRefreshEnabled));
		localStorage.setItem(LOCATION_AUTO_REFRESH_INTERVAL_KEY, String(locationAutoRefreshInterval));
		localStorage.setItem(LOCATION_SLEEP_PREVENT_ENABLED_KEY, String(locationSleepPreventEnabled));
	}
	sync_refresh_setting_controls();
	update_refresh_status_label();
	update_location_wake_lock();
	if (locationAutoRefreshEnabled) {
		const currentRosen = get_param_rosen();
		if (!is_location_auto_refresh_allowed(currentRosen)) {
			stop_location_auto_refresh();
			return;
		}
		start_location_auto_refresh(currentRosen);
		if (currentRosen && document.visibilityState === "visible" && (!wasEnabled || _persist)) {
			refresh_location_positions(currentRosen);
		}
	} else {
		stop_location_auto_refresh();
	}
}

/*
 * ページの表示状態に応じて自動更新を停止・再開する
 */
function handle_page_visibility_change() {
	if (document.visibilityState === "hidden") {
		locationPageWasBackgrounded = true;
		release_location_wake_lock();
		stop_location_auto_refresh(true);
		return;
	}
	update_location_wake_lock();
	resume_location_after_background();
}

function mark_location_page_backgrounded() {
	locationPageWasBackgrounded = true;
}

function handle_page_window_focus() {
	resume_location_after_background();
}

function handle_location_page_hide() {
	locationPageWasBackgrounded = true;
	release_location_wake_lock();
	stop_location_auto_refresh(true);
}

function handle_location_page_show(_event) {
	if (_event && _event.persisted) locationPageWasBackgrounded = true;
	update_location_wake_lock();
	resume_location_after_background();
}

function resume_location_after_background() {
	if (!locationPageWasBackgrounded || document.visibilityState !== "visible") return;
	const currentRosen = get_param_rosen();
	if (!locationAutoRefreshEnabled || !currentRosen) return;
	if (!is_location_auto_refresh_allowed(currentRosen)) {
		locationPageWasBackgrounded = false;
		stop_location_auto_refresh();
		return;
	}

	locationPageWasBackgrounded = false;
	const now = Date.now();
	if (now - lastLocationForegroundRefreshAt >= LOCATION_FOREGROUND_REFRESH_DEBOUNCE) {
		lastLocationForegroundRefreshAt = now;
		refresh_location_positions(currentRosen);
	}
	start_location_auto_refresh(currentRosen);
}

/*
 * 駅・駅間描画後の後処理
 */
function set_post_station_list(_param_rosen, _scrollKey) {
	if (["09", "52"].includes(_param_rosen)) {
		// 函館線[長万部～函館間]の場合
		if ($(".fujishiro-panel").height() > 800){
			$("#fujishiro1").hide();
			$("#fujishiro2").hide();
			$("#fujishiro1Long").show();
			$("#fujishiro2Long").show();
		}
	}

	set_responsive();

	// スクロール位置が先頭にある場合、路線描画タイミングでヘッダーの余白の高さを設定
	if ($("body,html").scrollTop() == 0) set_header_height();

	// 初期表示時のみ
	if (isLoad) {
		let param_cbango = get_param_cbango();
		if (param_cbango) {
			// ハッシュにcbangoが存在した場合処理を実行
			ressha_run_check();
			window.sessionStorage.setItem("scrollY", window.scrollY - 50);
		} else if (is_reload()) {
			// セッションに保存したスクロール位置を取得
			let scroll = Number(window.sessionStorage.getItem("scrollY"));
			if (!isNaN(scroll)) {
				// 更新時、スクロール位置を設定
				$("body,html").scrollTop(scroll + 50);
			}
		} else {
			let param_id = get_param_id();
			if (param_id) {
				// ハッシュに駅IDが存在した場合、対象の駅までスクロール
				let target = get_preferred_station_element(param_id);
				if (!target.length) return;
				let pos = target.offset().top - 380;
				$("body,html").animate({scrollTop: pos});
				window.sessionStorage.setItem("scrollY", pos - 50);
			} else {
				// 札幌近郊の路線の場合、初期表示を札幌駅周辺にする。
				set_disp_scroll_spo();
			}
		}

		// 初期表示のフラグをfalse
		isLoad = false;
	} else {
		let param_cbango = get_param_cbango();
		if (param_cbango) {
			// ハッシュにcbangoが存在した場合処理を実行
			ressha_run_check();
		} else if (preserveScrollAfterHashChange) {
			$("body,html").scrollTop(preservedScrollTop);
			scrollY = preservedScrollTop;
			preserveScrollAfterHashChange = false;
		} else {
			// 画面スクロール位置設定
			set_disp_scroll(_param_rosen, _scrollKey);
		}
	}

	scrollKey = "";
	isSideMenuClick = false;
	update_tracking_footer_controls();
	setup_osaka_loop_infinite_scroll(_param_rosen);

	// ローディングアニメーションを非表示にする
	loading_animation_hidden();
}

/*
 * 画面スクロール位置設定
 */
function set_disp_scroll(_param_rosen, _scrollKey) {
	// 他路線から遷移してきた場合、遷移元の線路のリンクの箇所までスクロール
	let doc = $("a[value='" + befRosen + "']");
	if (_scrollKey && _scrollKey != "") {
		// 駅の箇所までスクロール
		doc = get_preferred_station_element(_scrollKey);
	}

	if (isSideMenuClick) {
		// 札幌近郊の路線の場合、初期表示を札幌駅周辺にする。
		set_disp_scroll_spo();
	} else if (doc.length > 0) {
		let scroll = doc.offset().top - 310;
		if (_param_rosen == "01" && _scrollKey == "090") scroll -= 120; // SP1 桑園駅への遷移
		if (_param_rosen == "03" && _scrollKey == "090") scroll -= 120; // SP3 桑園駅への遷移
		if (_param_rosen == "06" && _scrollKey == "227") scroll += 80;  // DO3 志文駅への遷移
		if (_param_rosen == "13" && _scrollKey == "220") scroll -= 110; // DT1 追分駅への遷移
		if (_param_rosen == "01" && befRosen == "02") scroll -= 120;	// SP2からSP1への遷移
		if (_param_rosen == "13" && befRosen == "14") scroll -= 120;	// DT2からDT1への遷移
		if (_param_rosen == "02" && befRosen == "01") scroll -= 120;	// SP1からSP2への遷移
		$("body,html").scrollTop(scroll);
		scrollY = scroll;
	} else {
		// ページトップへスクロール
		$("body,html").scrollTop(0);
	}
}

/*
 * 札幌近郊の路線の場合、初期表示を札幌駅周辺にする。
 */
function set_disp_scroll_spo() {
	if (!get_param_id() && !get_param_cbango()) {
		let rosen = get_param_rosen();
		if ((rosen == "01" || rosen == "02" || rosen == "03") && $("div[key='091']").length > 0) {
			let scroll = $("div[key='091']").offset().top - 310;
			$("body,html").scrollTop(scroll);
			scrollY = scroll;
		} else {
			// ページトップへスクロール
			$("body,html").scrollTop(0);
			scrollY = 0;
		}
	}
}

/*
 * 画面幅のサイズに合わせて画面項目を制御する。
 */
function set_responsive() {
	let userAgent = navigator.userAgent;
	let windowWidth = window.innerWidth;
	let scrollbarWidth; // グローバルスコープで宣言
	document.addEventListener('DOMContentLoaded', (event) => {
   	scrollbarWidth = window.innerWidth - document.body.clientWidth;
    	// このスコープ内でscrollbarWidthの値を設定
	});
	let margin = 0;
	let lang = document.documentElement.dataset.lang;
	if (!(userAgent.indexOf('iPhone') > 0 || userAgent.indexOf('iPad') > 0 || userAgent.indexOf('Android') > 0 || userAgent.indexOf('Mobile') > 0 )) {
		if ($("#guideDetail").is(":visible") || $("#searchDetail").is(":visible") || $("#trainSearchDetail").is(":visible") || $("#trainNumberListDetail").is(":visible") || $("#popupDetail").is(":visible") || $("#refreshSettingDetail").is(":visible") || $("#resshaDetail").is(":visible") || $("#oshiraseDetail").is(":visible")) {
			// いずれかのダイアログが表示されていた場合
			margin = scrollbarWidth;
		}

		// PCの場合
		if (windowWidth <= 550) {
			$("#guideDetail .dialog").css("margin", "0px " + scrollbarWidth + "px 0px 0px");
			$("#searchDetail .dialog").css("margin", "0px " + scrollbarWidth + "px 0px 0px");
			$("#trainSearchDetail .dialog").css("margin", "0px " + scrollbarWidth + "px 0px 0px");
			$("#trainNumberListDetail .dialog").css("margin", "0px " + scrollbarWidth + "px 0px 0px");
			$("#popupDetail .dialog").css("margin", "0px " + scrollbarWidth + "px 0px 0px");
			$("#refreshSettingDetail .dialog").css("margin", "0px " + scrollbarWidth + "px 0px 0px");
			$("#resshaDetail .dialog").css("margin", "0px " + scrollbarWidth + "px 0px 0px");
			$("#oshiraseDetail .dialog").css("margin", "0px " + scrollbarWidth + "px 0px 0px");
		} else {
			if (631 <= windowWidth <= 920) {
				$("#guideDetail .dialog").css("marginLeft", "0px");
			} else {
				$("#guideDetail .dialog").css("marginLeft", scrollbarWidth + "px");
			}
			$("#searchDetail .dialog").css("marginLeft", scrollbarWidth + "px");
			$("#trainSearchDetail .dialog").css("marginLeft", scrollbarWidth + "px");
			$("#trainNumberListDetail .dialog").css("marginLeft", scrollbarWidth + "px");
			$("#popupDetail .dialog").css("marginLeft", scrollbarWidth + "px");
			$("#refreshSettingDetail .dialog").css("marginLeft", scrollbarWidth + "px");
			$("#resshaDetail .dialog").css("marginLeft", scrollbarWidth + "px");
			$("#oshiraseDetail .dialog").css("marginLeft", scrollbarWidth + "px");
		}

		// 画面サイズが一般的なスマホサイズ以下となった場合、画面を縮小させる
		if (windowWidth <= 385) {
			let tr = (385 - windowWidth + 5) * 0.00275;
			$(".main-contents").css("transform", `scale(${1 - tr})`);
			$(".main-contents").css("width", "370px");
		} else {
			$(".main-contents").css("transform", "scale(1)");
			$(".main-contents").css("width", "100%");
		}
	} else {
		$("#guideDetail .dialog").css("margin", "0px");
		$("#searchDetail .dialog").css("margin", "0px");
		$("#trainSearchDetail .dialog").css("margin", "0px");
		$("#trainNumberListDetail .dialog").css("margin", "0px");
		$("#popupDetail .dialog").css("margin", "0px");
		$("#refreshSettingDetail .dialog").css("margin", "0px");
		$("#resshaDetail .dialog").css("margin", "0px");
		$("#oshiraseDetail .dialog").css("margin", "0px");

		// 画面サイズが一般的なスマホサイズ以下となった場合、画面を縮小させる
		if (windowWidth <= 375) {
			let tr = (375 - windowWidth) * 0.00265;
			$(".main-contents").css("transform", `scale(${1 - tr})`);
			$(".main-contents").css("width", "370px");
		} else {
			$(".main-contents").css("transform", "scale(1)");
			$(".main-contents").css("width", "100%");
		}
	}

	if (windowWidth <= 1000) {
		// サイドメニューを隠す
		$("#sideMenu .side-menu").css("transform", "translateX(-327px)");
		$("#sideMenu .side-menu").css("box-shadow", "none");
		$("#sideMenu .side-menu-outer").hide();
		$(".sub-header").css("width", "calc(100% - " + margin + "px)");
		$(".sub-footer .homen-footer-contents").css("width", "calc(100% - " + margin + "px)");
		if (lang == "ja") $(".sub-footer .sub-footer-contents.popup .sub-footer-unkou-msg").html("重要な<br>お知らせ");
		// サイドメニュー内の折り畳みを閉じる。
		toggle_close();
		if (!($("#guideDetail").is(":visible") || $("#searchDetail").is(":visible") || $("#trainSearchDetail").is(":visible") || $("#trainNumberListDetail").is(":visible") || $("#popupDetail").is(":visible") || $("#refreshSettingDetail").is(":visible") || $("#resshaDetail").is(":visible") || $(".trainDetailDialog").is(":visible") || $("#oshiraseDetail").is(":visible"))) {
			// ダイアログが表示されていない場合
			// bodyのスクロールを有効にする。
			set_scroll_show_side_menu();
		}

		// メンテナンスページのタイトルの制御
		if (windowWidth <= 575) {
			let text = $(".maintenance-title").html();
			if (text && text.indexOf("<br>") == -1) {
				$(".maintenance-title").html(text.replace("メンテナンス", "<br>メンテナンス"));
			}
		} else {
			let text = $(".maintenance-title").html();
			if (text && text.indexOf("<br>") > 0) {
				$(".maintenance-title").html(text.replace("<br>", ""));
			}
		}
	} else {
		// サイドメニューを表示する
		margin += 325;
		$("#sideMenu .side-menu").css("transform", "translateX(0px)");
		$("#sideMenu .side-menu .area-contents-header").hide();
		$("#sideMenu .side-menu-outer").hide();
		$(".sub-header").css("width", "calc(100% - " + margin + "px)");
		$(".sub-footer .homen-footer-contents").css("width", "calc(100% - " + margin + "px)");
		if (lang == "ja") $(".sub-footer .sub-footer-contents.popup .sub-footer-unkou-msg").html("重要なお知らせ");
		if (!($("#guideDetail").is(":visible") || $("#searchDetail").is(":visible") || $("#trainSearchDetail").is(":visible") || $("#trainNumberListDetail").is(":visible") || $("#popupDetail").is(":visible") || $("#refreshSettingDetail").is(":visible") || $("#resshaDetail").is(":visible") || $(".trainDetailDialog").is(":visible") || $("#oshiraseDetail").is(":visible"))) {
			// ダイアログが表示されていない場合
			// bodyのスクロールを有効にする。
			set_scroll_show_side_menu();
		}
	}
}

/*
 * 列車アイコンを描画する。
 */
function create_ressha_icon(_param_rosen, _nowData, _typeData, _ekiData) {
	_nowData.trains.forEach(nowRow => {
		let windowWidth = window.innerWidth;
		let pos = nowRow.jrShikoku && nowRow.jrShikoku.renderPosition
			? nowRow.jrShikoku.renderPosition
			: nowRow.pos;
		let width = $("#stationList").width();
		let add = 0;
		if (windowWidth > 1000) add = 325;

		if (pos != "" && $("." + pos).length > 0) {
			if (nowRow.jrShikoku && nowRow.jrShikoku.isForecastWindow) {
				$("." + pos).append(create_html_jrshikoku_forecast_row(nowRow, _typeData, _ekiData));
			} else if (nowRow.jrShikoku && pos.slice(-1) === "U") {
				// JR四国はLine + PosNumの投影先末尾で、画面上の上下方向を明示する。
				$("." + pos).append(create_html_up_ressha_icon(nowRow, _typeData, _ekiData));
				$("." + pos).addClass("up");
			} else if (nowRow.jrShikoku && pos.slice(-1) === "D") {
				$("." + pos).append(create_html_down_ressha_icon(nowRow, _typeData, _ekiData));
			} else if (pos == "R9P11U" || pos == "R9P10U" || pos == "R9P9U" || pos == "R1P160U") {
				// 新函館北斗駅左側（R9P11U）
				// 新函館北斗～仁山間左側（R9P10U）
				// 仁山駅左側（R9P9U）
				// 新千歳空港～南千歳間左側（R1P160U）の場合
				$("." + pos).append(create_html_up_ressha_icon(nowRow, _typeData, _ekiData));
				$("." + pos).addClass("up");
			} else if (pos == "R9P11D" || pos == "R9P10D" || pos == "R9P9D" || pos == "R1P160D") {
				// 新函館北斗駅右側（R9P11D）
				// 新函館北斗～仁山間右側（R9P10D）
				// 仁山駅右側（R9P9D）
				// 新千歳空港～南千歳間右側（R1P160D）
				if ($("." + pos).children(".ressha").length < 4) {
					$(create_html_down_ressha_icon(nowRow, _typeData, _ekiData)).prependTo("." + pos);
				} else {
					$("." + pos).append(create_html_down_ressha_icon(nowRow, _typeData, _ekiData));
				}
			} else if (pos == "R9P26U") {
				// 藤城線（R9P26U）
				if ($("." + pos).children(".ressha").length < 4) {
					$(create_html_up_ressha_icon(nowRow, _typeData, _ekiData)).prependTo("." + pos);
					$("." + pos).addClass("up");
				} else {
					$("." + pos).append(create_html_up_ressha_icon(nowRow, _typeData, _ekiData));
					$("." + pos).addClass("up");
				}
			} else if (pos == "R1P119U") {
				// 新千歳空港駅左側（R1P119U）の場合
				$("." + pos).append(create_html_up_ressha_icon(nowRow, _typeData, _ekiData));
				$("." + pos).addClass("up");
			} else if (pos == "R1P119D") {
				// 新千歳空港駅右側（R1P119D）の場合
				if ($("." + pos).children().length < 2) {
					if ($("." + pos).children(".ressha").length < 1) {
						$("." + pos).append(create_html_down_ressha_icon(nowRow, _typeData, _ekiData));
					} else {
						$(create_html_down_ressha_icon(nowRow, _typeData, _ekiData)).prependTo("." + pos);
					}
			} else {
				$("." + pos).append(create_html_down_ressha_icon(nowRow, _typeData, _ekiData));
			}
		} else if (String(_param_rosen) === "66" && pos.indexOf("JWH") === 0) {
			// 羽衣線は左側の別枠に描画するため、画面上の左右ではなくpos末尾の方向を使う。
			if (pos.slice(-1) === "U") {
				$("." + pos).append(create_html_up_ressha_icon(nowRow, _typeData, _ekiData));
				$("." + pos).addClass("up");
			} else {
				$("." + pos).append(create_html_down_ressha_icon(nowRow, _typeData, _ekiData));
			}
		} else if ($("." + pos).offset().left < width / 2 + add) {
				// アイコン表示位置が画面半分より左の場合
				$("." + pos).append(create_html_up_ressha_icon(nowRow, _typeData, _ekiData));
				$("." + pos).addClass("up");
			} else {
				// アイコン表示位置が画面半分より右の場合
				if ($("." + pos).children(".ressha").length < 6) {
					if ($("." + pos).parent().parent().parent(".eki").length > 0) {
						// 駅の場合
						if ($("." + pos).children(".ressha").length < 3) {
							$("." + pos).append(create_html_down_ressha_icon(nowRow, _typeData, _ekiData));
						} else {
							if ($("." + pos).children(".ressha").length == 3) $("<div class='dummy'></div><div class='dummy'></div><div class='dummy'></div>").prependTo(("." + pos));
							let idx = $("." + pos).children(".ressha").length - 3;
							let test = $("." + pos).children()[idx];
							test.outerHTML = create_html_down_ressha_icon(nowRow, _typeData, _ekiData);
						}
					} else {
						// 駅間の場合
						$(create_html_down_ressha_icon(nowRow, _typeData, _ekiData)).prependTo("." + pos);
					}
				} else {
					$("." + pos).append(create_html_down_ressha_icon(nowRow, _typeData, _ekiData));
				}
			}
		}
	});

	// TID区間外の高さを設定
	set_hirendo_height();

	// 函館駅周辺の高さを設定
	if (["09", "52"].includes(_param_rosen)) set_hakodate_height();
}

/*
 * JR四国の予告窓を、対象駅の直前に専用枠として追加する。
 */
function prepare_jrshikoku_forecast_windows(_param_rosen) {
	if (!is_jrshikoku_location_rosen(_param_rosen) || !window.JrShikokuLocationAdapter) return;
	const definitions = Array.isArray(window.JrShikokuLocationAdapter.forecastPositions)
		? window.JrShikokuLocationAdapter.forecastPositions.filter(function(definition) {
			return definition.rosen === String(_param_rosen);
		})
		: [];
	if (definitions.length === 0) return;

	const groupedDefinitions = new Map();
	definitions.forEach(function(definition) {
		if (!groupedDefinitions.has(definition.hostStationCode)) groupedDefinitions.set(definition.hostStationCode, []);
		groupedDefinitions.get(definition.hostStationCode).push(definition);
	});

	groupedDefinitions.forEach(function(rows, stationCode) {
		if ($("#stationList .jrshikoku-forecast-table[data-station-code='" + stationCode + "']").length > 0) return;
		const stationNameElement = $("#stationList [key]").filter(function() {
			return String($(this).attr("key")) === stationCode;
		}).first();
		const stationPanel = stationNameElement.closest(".eki-panel");
		if (stationPanel.length === 0) return;

		rows.sort(function(left, right) { return Number(left.slot) - Number(right.slot); });
		const baseName = String(rows[0].name || "予告窓").replace(/予告窓[①②]?$/, "");
		const table = $("<div class='jrshikoku-forecast-table'></div>")
			.attr("data-station-code", stationCode)
			.addClass("side-" + (rows[0].side === "left" ? "left" : "right"));
		table.append($("<div class='jrshikoku-forecast-heading'></div>").text(baseName + "予告"));
		rows.forEach(function(definition) {
			table.append($("<div class='ressha-icon jrshikoku-forecast-row'></div>").addClass(definition.pos));
		});
		stationPanel.append(table);
	});
}

function create_html_jrshikoku_forecast_row(_nowRow, _typeData, _ekiData) {
	const objItem = document.createElement("div");
	objItem.classList.add("ressha", "jrshikoku-forecast-train");
	const arrow = Number(_nowRow.jrShikoku && _nowRow.jrShikoku.rawDirection) === 0 ? "↑" : "↓";
	const trainNumber = get_train_number_display_label(_nowRow) || "?";
	const destination = _nowRow.shuEkiSimple || "?";
	objItem.textContent = arrow + " " + trainNumber + "／" + destination;
	create_ressha_detail(objItem, _nowRow, _typeData, _ekiData);
	return objItem.outerHTML;
}

/*
 * TID区間外の高さを設定
 */
function set_hirendo_height() {
	// TID区間外の点線内に列車アイコンを表示する領域が２つ or ３つ or ４つ存在するパターンを考慮し高さを設定。
	// 列車アイコン表示領域２つ
	$(".hirendo-contents.two-ressha-contents").each(function(i, row) {
		let ressha = row.getElementsByClassName("hirendo-ressha-panel");
		if (ressha[0].children[0].childElementCount >= 2 || ressha[1].children[0].childElementCount >= 2) {
			// ２つの領域中の上の要素内に列車が２つ以上存在する場合
			let resshaCount = 0;
			if (ressha[0].children[0].childElementCount > ressha[1].children[0].childElementCount) {
				resshaCount = ressha[0].children[0].childElementCount;
			} else {
				resshaCount = ressha[1].children[0].childElementCount;
			}

			if (resshaCount > 6) resshaCount = 6;

			let eki = row.getElementsByClassName("hirendo-eki-contents")[0];
			if (eki.classList[1] == "one-eki") {
				// 駅が１つの場合
				let margin = 50 * resshaCount + 12 * (resshaCount - 2);
				let height = 70 * resshaCount;
				eki.children[0].style.marginTop = margin + "px";
				ressha[0].style.gap = "35px";
				ressha[1].style.gap = "35px";
				ressha[0].children[0].style.height = height + "px";
				ressha[1].children[0].style.height = height + "px";
				ressha[0].children[0].style.padding = "8px 0";
				ressha[1].children[0].style.padding = "8px 0";
			} else if (eki.classList[1] == "three-eki") {
				// 駅が３つの場合
				let margin = 23 * resshaCount + 5 * (resshaCount - 2);
				let height = 65 * resshaCount;
				eki.children[0].style.marginTop = margin + "px";
				eki.children[1].style.marginTop = margin + "px";
				ressha[0].children[0].style.height = height + "px";
				ressha[1].children[0].style.height = height + "px";
				ressha[0].children[0].style.padding = "8px 0";
				ressha[1].children[0].style.padding = "8px 0";
			}
		}

		if (ressha[0].children[1].childElementCount >= 2 || ressha[1].children[1].childElementCount >= 2) {
			// ２つの領域中の下の要素内に列車が２つ以上存在する場合
			let resshaCount = 0;
			if (ressha[0].children[1].childElementCount > ressha[1].children[1].childElementCount) {
				resshaCount = ressha[0].children[1].childElementCount;
			} else {
				resshaCount = ressha[1].children[1].childElementCount;
			}

			if (resshaCount > 6) resshaCount = 6;

			let eki = row.getElementsByClassName("hirendo-eki-contents")[0];
			if (eki.classList[1] == "one-eki") {
				// 駅が１つの場合
				let margin = 50 * resshaCount + 12 * (resshaCount - 2);
				let height = 70 * resshaCount;
				eki.children[0].style.marginBottom = margin + "px";
				ressha[0].style.gap = "35px";
				ressha[1].style.gap = "35px";
				ressha[0].children[1].style.height = height + "px";
				ressha[1].children[1].style.height = height + "px";
				ressha[0].children[1].style.padding = "8px 0";
				ressha[1].children[1].style.padding = "8px 0";
			} else if (eki.classList[1] == "three-eki") {
				// 駅が３つの場合
				let margin = 23 * resshaCount + 5 * (resshaCount - 2);
				let height = 65 * resshaCount;
				eki.children[2].style.marginTop = margin + "px";
				eki.children[2].style.marginBottom = margin + "px";
				ressha[0].children[1].style.height = height + "px";
				ressha[1].children[1].style.height = height + "px";
				ressha[0].children[1].style.padding = "8px 0";
				ressha[1].children[1].style.padding = "8px 0";
			}
		}
	});

	// 列車アイコン表示領域３つ
	$(".hirendo-contents.three-ressha-contents").each(function(i, row) {
		let ressha = row.getElementsByClassName("hirendo-ressha-panel");
		if (ressha[0].children[0].childElementCount >= 2 || ressha[1].children[0].childElementCount >= 2) {
			// ３つの領域中の上の要素内に列車が２つ以上存在する場合
			let resshaCount = 0;
			if (ressha[0].children[0].childElementCount > ressha[1].children[0].childElementCount) {
				resshaCount = ressha[0].children[0].childElementCount;
			} else {
				resshaCount = ressha[1].children[0].childElementCount;
			}

			if (resshaCount > 6) resshaCount = 6;

			let eki = row.getElementsByClassName("hirendo-eki-contents")[0];
			if (eki.classList[1] == "two-eki") {
				// 駅が２つの場合
				let margin = 50 * resshaCount + 12 * (resshaCount - 2);
				let height = 70 * resshaCount;
				eki.children[0].style.marginTop = margin + "px";
				ressha[0].style.gap = "35px";
				ressha[1].style.gap = "35px";
				ressha[0].children[0].style.height = height + "px";
				ressha[1].children[0].style.height = height + "px";
				ressha[0].children[0].style.padding = "8px 0";
				ressha[1].children[0].style.padding = "8px 0";
			}
		}

		if (ressha[0].children[1].childElementCount >= 2 || ressha[1].children[1].childElementCount >= 2) {
			// ３つの領域中の真ん中の要素内に列車が２つ以上存在する場合
			let resshaCount = 0;
			if (ressha[0].children[1].childElementCount > ressha[1].children[1].childElementCount) {
				resshaCount = ressha[0].children[1].childElementCount;
			} else {
				resshaCount = ressha[1].children[1].childElementCount;
			}

			if (resshaCount > 6) resshaCount = 6;

			let eki = row.getElementsByClassName("hirendo-eki-contents")[0];
			if (eki.classList[1] == "two-eki") {
				// 駅が２つの場合
				let margin = 33 * resshaCount;
				let height = 70 * resshaCount;
				eki.children[0].style.marginBottom = margin + "px";
				eki.children[1].style.marginTop = margin + "px";
				ressha[0].style.gap = "35px";
				ressha[1].style.gap = "35px";
				ressha[0].children[1].style.height = height + "px";
				ressha[1].children[1].style.height = height + "px";
				ressha[0].children[1].style.padding = "8px 0";
				ressha[1].children[1].style.padding = "8px 0";
			}
		}

		if (ressha[0].children[2].childElementCount >= 2 || ressha[1].children[2].childElementCount >= 2) {
			// ３つの領域中の下の要素内に列車が２つ以上存在する場合
			let resshaCount = 0;
			if (ressha[0].children[2].childElementCount > ressha[1].children[2].childElementCount) {
				resshaCount = ressha[0].children[2].childElementCount;
			} else {
				resshaCount = ressha[1].children[2].childElementCount;
			}

			if (resshaCount > 6) resshaCount = 6;

			let eki = row.getElementsByClassName("hirendo-eki-contents")[0];
			if (eki.classList[1] == "two-eki") {
				// 駅が２つの場合
				let margin = 50 * resshaCount + 12 * (resshaCount - 2);
				let height = 70 * resshaCount;
				ressha[0].style.gap = "35px";
				ressha[1].style.gap = "35px";
				eki.children[1].style.marginBottom = margin + "px";
				ressha[0].children[2].style.height = height + "px";
				ressha[1].children[2].style.height = height + "px";
				ressha[0].children[2].style.padding = "8px 0";
				ressha[1].children[2].style.padding = "8px 0";
			}
		}
	});

	// 列車アイコン表示領域４つ
	$(".hirendo-contents.four-ressha-contents").each(function(i, row) {
		let ressha = row.getElementsByClassName("hirendo-ressha-panel");
		if (ressha[0].children[0].childElementCount >= 2 || ressha[1].children[0].childElementCount >= 2) {
			// ４つの領域中の一番上の要素内に列車が２つ以上存在する場合
			let resshaCount = 0;
			if (ressha[0].children[0].childElementCount > ressha[1].children[0].childElementCount) {
				resshaCount = ressha[0].children[0].childElementCount;
			} else {
				resshaCount = ressha[1].children[0].childElementCount;
			}

			if (resshaCount > 6) resshaCount = 6;

			let eki = row.getElementsByClassName("hirendo-eki-contents")[0];
			if (eki.classList[1] == "three-eki") {
				// 駅が３つの場合
				let margin = 50 * resshaCount+ 12 * (resshaCount - 2);
				let height = 70 * resshaCount;
				ressha[0].style.gap = "35px";
				ressha[1].style.gap = "35px";
				eki.children[0].style.marginTop = margin + "px";
				ressha[0].children[0].style.height = height + "px";
				ressha[1].children[0].style.height = height + "px";
				ressha[0].children[0].style.padding = "8px 0";
				ressha[1].children[0].style.padding = "8px 0";
			}
		}

		if (ressha[0].children[1].childElementCount >= 2 || ressha[1].children[1].childElementCount >= 2) {
			// ４つの領域中の上から２番目の要素内に列車が２つ以上存在する場合
			let resshaCount = 0;
			if (ressha[0].children[1].childElementCount > ressha[1].children[1].childElementCount) {
				resshaCount = ressha[0].children[1].childElementCount;
			} else {
				resshaCount = ressha[1].children[1].childElementCount;
			}

			if (resshaCount > 6) resshaCount = 6;

			let eki = row.getElementsByClassName("hirendo-eki-contents")[0];
			if (eki.classList[1] == "three-eki") {
				// 駅が３つの場合
				let margin = 35 * resshaCount;
				let height = 70 * resshaCount;
				ressha[0].style.gap = "35px";
				ressha[1].style.gap = "35px";
				eki.children[0].style.marginBottom = margin + "px";
				eki.children[1].style.marginTop = margin + "px";
				ressha[0].children[1].style.height = height + "px";
				ressha[1].children[1].style.height = height + "px";
				ressha[0].children[1].style.padding = "8px 0";
				ressha[1].children[1].style.padding = "8px 0";
			}
		}

		if (ressha[0].children[2].childElementCount >= 2 || ressha[1].children[2].childElementCount >= 2) {
			// ４つの領域中の上から３番目の要素内に列車が２つ以上存在する場合
			let resshaCount = 0;
			if (ressha[0].children[2].childElementCount > ressha[1].children[2].childElementCount) {
				resshaCount = ressha[0].children[2].childElementCount;
			} else {
				resshaCount = ressha[1].children[2].childElementCount;
			}

			if (resshaCount > 6) resshaCount = 6;

			let eki = row.getElementsByClassName("hirendo-eki-contents")[0];
			if (eki.classList[1] == "three-eki") {
				// 駅が３つの場合
				let margin = 35 * resshaCount;
				let height = 70 * resshaCount;
				ressha[0].style.gap = "35px";
				ressha[1].style.gap = "35px";
				eki.children[1].style.marginBottom = margin + "px";
				eki.children[2].style.marginTop = margin + "px";
				ressha[0].children[2].style.height = height + "px";
				ressha[1].children[2].style.height = height + "px";
				ressha[0].children[2].style.padding = "8px 0";
				ressha[1].children[2].style.padding = "8px 0";
			}
		}

		if (ressha[0].children[3].childElementCount >= 2 || ressha[1].children[3].childElementCount >= 2) {
			// ４つの領域中の一番下の要素内に列車が２つ以上存在する場合
			let resshaCount = 0;
			if (ressha[0].children[3].childElementCount > ressha[1].children[3].childElementCount) {
				resshaCount = ressha[0].children[3].childElementCount;
			} else {
				resshaCount = ressha[1].children[3].childElementCount;
			}

			if (resshaCount > 6) resshaCount = 6;

			let eki = row.getElementsByClassName("hirendo-eki-contents")[0];
			if (eki.classList[1] == "three-eki") {
				// 駅が３つの場合
				let margin = 50 * resshaCount+ 12 * (resshaCount - 2);
				let height = 70 * resshaCount;
				ressha[0].style.gap = "35px";
				ressha[1].style.gap = "35px";
				eki.children[2].style.marginBottom = margin + "px";
				ressha[0].children[3].style.height = height + "px";
				ressha[1].children[3].style.height = height + "px";
				ressha[0].children[3].style.padding = "8px 0";
				ressha[1].children[3].style.padding = "8px 0";
			}
		}
	});
}

/*
 * 函館駅周辺の高さを設定
 */
function set_hakodate_height() {
	let countUH = document.querySelector(".R10P41U").childElementCount;
	let countDH = document.querySelector(".R10P41D").childElementCount;
	if ((countUH >= 3 || countDH >= 3)) {
			// 函館駅に列車が３つ以上存在する場合
			let resshaCount = countDH > countUH ? countDH : countUH;
			if (resshaCount > 6) resshaCount = 6;
			let height = 210 + (resshaCount - 2) * 65;
			$("#stationList .item.hakodate").css("height", height + "px");
	}

	let countUG = document.querySelector(".R10P1U").childElementCount;
	let countDG = document.querySelector(".R10P1D").childElementCount;
	if ((countUG >= 4 || countDG >= 4)) {
			// 五稜郭駅に列車が４つ以上存在する場合
			$("#stationList .item.goryokaku").css("height", "136px");
			$("#goryokaku").hide();
			$("#goryokakuLong").show();
	}
}

/*
 *　上り列車のアイコンのhtmlを生成する。
 */
function set_jr_shinkansen_train_icon(_iconArea, _nowRow) {
	const icon = _nowRow.jrShinkansen && _nowRow.jrShinkansen.trainIcon ? _nowRow.jrShinkansen.trainIcon : "";
	if (!icon) return;
	const iconMap = {
		nozomi: "./images/home/train_icon_nozomi.svg",
		hikari: "./images/home/train_icon_hikari.svg",
		kodama: "./images/home/train_icon_kodama.svg",
		mizuho: "./images/home/train_icon_mizuho.svg",
		sakura: "./images/home/train_icon_sakura.svg",
		tsubame: "./images/home/train_icon_tsubame.svg"
	};
	if (iconMap[icon]) {
		_iconArea.style.backgroundImage = "url(" + iconMap[icon] + ")";
	}
}

function set_jrwest_train_icon(_iconArea, _nowRow) {
	const iconCode = _nowRow.jrWest && _nowRow.jrWest.lineColorIconCode ? _nowRow.jrWest.lineColorIconCode : "";
	if (!/^[a-z0-9]+$/.test(iconCode)) return;
	_iconArea.style.backgroundImage = "url(./images/home/jrwest/train_icon_" + iconCode + ".svg)";
}

function set_jrcentral_train_icon(_iconArea, _nowRow) {
	const semanticType = _nowRow.jrCentral && _nowRow.jrCentral.semanticType ? _nowRow.jrCentral.semanticType : "";
	const genericIconMap = {
		local: "./images/home/train_icon.svg",
		limited_express: "./images/home/train_icon_red.svg",
		express: "./images/home/train_icon_red.svg",
		liner: "./images/home/train_icon_red.svg",
		special: "./images/home/train_icon_white.svg"
	};
	if (genericIconMap[semanticType]) {
		_iconArea.style.backgroundImage = "url(" + genericIconMap[semanticType] + ")";
		_iconArea.classList.add("jrcentral-icon", "jrcentral-icon-" + semanticType);
		return;
	}
	const iconCode = _nowRow.jrCentral && _nowRow.jrCentral.lineColorIconCode ? _nowRow.jrCentral.lineColorIconCode : "";
	if (!/^[a-z0-9_]+$/.test(iconCode)) return;
	_iconArea.style.backgroundImage = "url(./images/home/jrcentral/train_icon_" + iconCode + ".svg)";
	_iconArea.classList.add("jrcentral-icon", "jrcentral-icon-" + iconCode);
}

function get_train_type_simple_label(_nowRow, _type, _lang) {
	if (_nowRow.jrWest && _nowRow.jrWest.typeSimple) {
		return _nowRow.jrWest.typeSimple;
	}
	if (_nowRow.jrShikoku && _nowRow.jrShikoku.typeSimple) {
		return _nowRow.jrShikoku.typeSimple;
	}
	if (_nowRow.jrCentral && _nowRow.jrCentral.typeSimple) {
		return _nowRow.jrCentral.typeSimple;
	}
	if (_type && _type.typeSimple) {
		return _type.typeSimple[_lang] || _type.typeSimple.ja || "";
	}
	return "";
}

function get_train_number_display_label(_nowRow) {
	if (Object.prototype.hasOwnProperty.call(_nowRow, "displayTrainNumber")) {
		return _nowRow.displayTrainNumber || "";
	}
	return _nowRow.cbango || "";
}

function create_html_up_ressha_icon(_nowRow, _typeData, _ekiData) {
	let lang = document.documentElement.dataset.lang;
	let objItem = document.createElement("div");
	objItem.classList.add("ressha");

	// 列車種別マスタから列車種別を取得
	let type = _typeData.find((v) => v.type == _nowRow.type);
	// アイコン内の列車種別を設定
	let iconArea = document.createElement("div");
	iconArea.classList.add("icon-img");
	set_jr_shinkansen_train_icon(iconArea, _nowRow);
	set_jrwest_train_icon(iconArea, _nowRow);
	set_jrcentral_train_icon(iconArea, _nowRow);
	// 新幹線以外には列車種別の文字をアイコンに入れる
	if(_nowRow.type != "4") {
		let objSbt = document.createElement("span");
		objSbt.classList.add("ressha-sbt");
		const simpleLabel = get_train_type_simple_label(_nowRow, type, lang);
		if (simpleLabel) {
			objSbt.textContent = simpleLabel;
			objSbt.setAttribute("sbt", simpleLabel);
		}
		iconArea.appendChild(objSbt);
	} else {
		iconArea.classList.add("cbango-only");
	}
		objItem.appendChild(iconArea);

	let objCbango = document.createElement("span");
	objCbango.classList.add("cbango-label");
	objCbango.textContent = get_train_number_display_label(_nowRow);
	iconArea.appendChild(objCbango);

	// 遅延を設定
	let chienText = "";
	if (_nowRow.chien > 0) {
		if (_nowRow.chien >= 999) {
			if (lang == "ja") chienText = "+大幅";
			if (lang == "en") chienText = "+Very";
			if (lang == "tc") chienText = "+大幅";
			if (lang == "sc") chienText = "+大幅";
			if (lang == "kr") chienText = "+대폭";
		} else {
			chienText = "+" + _nowRow.chien;
		}
	}
	let objOkure = document.createElement("span");
	objOkure.classList.add("okure-label");
	objOkure.textContent = chienText;
	objItem.appendChild(objOkure);

	// 列車アイコンの矢印を設定
	let objArrow = document.createElement("img");
	objArrow.classList.add("arrow");
	objArrow.setAttribute("src", "./images/home/train_icon_arrow_up.svg");
	objArrow.setAttribute("alt", "");
	objItem.appendChild(objArrow);

	// 行先を設定
	if (lang == "ja") {
		let objYukisaki = document.createElement("span");
		objYukisaki.classList.add("yukisaki-label");
		objYukisaki.textContent = _nowRow.shuEkiSimple;
		objItem.appendChild(objYukisaki);
	}

	// 部分運休の！を設定
	if (_nowRow.status == "2") {
		let objExclamation = document.createElement("img");
		objExclamation.classList.add("exclamation");
		objExclamation.setAttribute("src", "./images/home/exclamation.svg");
		objExclamation.setAttribute("alt", "");
		objItem.appendChild(objExclamation);
	}
	// 抑止中のアイコンを設定
	if (_nowRow.yokuStatus == 1 || _nowRow.yokuStatus == 2) {
		let objSuppression = document.createElement("img");
		objSuppression.classList.add("suppression");
		objSuppression.setAttribute("src", "./images/home/suppression.svg");
		objSuppression.setAttribute("alt", "");
		objItem.appendChild(objSuppression);
	}

	// 列車詳細に表示する内容の設定
	create_ressha_detail(objItem, _nowRow, _typeData, _ekiData);

	return objItem.outerHTML;
}

/*
 * 下り列車のアイコンのhtmlを生成する。
 */
function create_html_down_ressha_icon(_nowRow, _typeData, _ekiData) {
	let lang = document.documentElement.dataset.lang;
	let objItem = document.createElement("div");
	objItem.classList.add("ressha");

	// 遅延を設定
	let chienText = "";
	if (_nowRow.chien > 0) {
		if (_nowRow.chien >= 999) {
			if (lang == "ja") chienText = "+大幅";
			if (lang == "en") chienText = "+Very";
			if (lang == "tc") chienText = "+大幅";
			if (lang == "sc") chienText = "+大幅";
			if (lang == "kr") chienText = "+대폭";
		} else {
			chienText = "+" + _nowRow.chien;
		}
	}
	let objOkure = document.createElement("span");
	objOkure.classList.add("okure-label");
	objOkure.textContent = chienText;
	objItem.appendChild(objOkure);

	// 列車種別マスタから列車種別を取得
	let type = _typeData.find((v) => v.type == _nowRow.type);
	// アイコン内の列車種別を設定
	let iconArea = document.createElement("div");
	iconArea.classList.add("icon-img");
	set_jr_shinkansen_train_icon(iconArea, _nowRow);
	set_jrwest_train_icon(iconArea, _nowRow);
	set_jrcentral_train_icon(iconArea, _nowRow);
	// 新幹線以外には列車種別の文字をアイコンに入れる
	if(_nowRow.type != "4") {
		let objSbt = document.createElement("span");
		objSbt.classList.add("ressha-sbt");
		const simpleLabel = get_train_type_simple_label(_nowRow, type, lang);
		if (simpleLabel) {
			objSbt.textContent = simpleLabel;
			objSbt.setAttribute("sbt", simpleLabel);
		}
		iconArea.appendChild(objSbt);
	} else {
		iconArea.classList.add("cbango-only");
	}
		objItem.appendChild(iconArea);

	let objCbango = document.createElement("span");
	objCbango.classList.add("cbango-label");
	objCbango.textContent = get_train_number_display_label(_nowRow);
	iconArea.appendChild(objCbango);

	// 列車アイコンの矢印を設定
	let objArrow = document.createElement("img");
	objArrow.classList.add("arrow");
	objArrow.setAttribute("src", "./images/home/train_icon_arrow_down.svg");
	objArrow.setAttribute("alt", "");
	objItem.appendChild(objArrow);

	// 行先を設定
	if (lang == "ja") {
		let objYukisaki = document.createElement("span");
		objYukisaki.classList.add("yukisaki-label");
		objYukisaki.textContent = _nowRow.shuEkiSimple;
		objItem.appendChild(objYukisaki);
	}

	// 部分運休の！を設定
	if (_nowRow.status == "2") {
		let objExclamation = document.createElement("img");
		objExclamation.classList.add("exclamation");
		objExclamation.setAttribute("src", "./images/home/exclamation.svg");
		objExclamation.setAttribute("alt", "");
		objItem.appendChild(objExclamation);
	}
	// 抑止中のアイコンを設定
	if (_nowRow.yokuStatus == 1 || _nowRow.yokuStatus == 2) {
		let objSuppression = document.createElement("img");
		objSuppression.classList.add("suppression");
		objSuppression.setAttribute("src", "./images/home/suppression.svg");
		objSuppression.setAttribute("alt", "");
		objItem.appendChild(objSuppression);
	}

	// 列車詳細に表示する内容の設定
	create_ressha_detail(objItem, _nowRow, _typeData, _ekiData);

	return objItem.outerHTML;
}

/*
 * 列車詳細用の隠し要素を設定する。
 */
function create_ressha_detail(_objItem, _nowRow, _typeData, _ekiData) {
	let lang = document.documentElement.dataset.lang;
	// 列車種別マスタから列車種別を取得
	let type = _typeData.find((v) => v.type == _nowRow.type);

	// 隠し属性を設定する。（運行情報詳細を表示する際に使用する）
	{
		// 列車番号
		{
			_objItem.dataset.cbango = _nowRow.cbango;
			_objItem.dataset.display_cbango = get_train_number_display_label(_nowRow);
			_objItem.dataset.source = _nowRow.source || "";
			_objItem.dataset.source_rosen = _nowRow.sourceRosen || "";
			_objItem.dataset.aisho = _nowRow.jrEast && _nowRow.jrEast.nickname ? _nowRow.jrEast.nickname : (_nowRow.name || "");
			_objItem.dataset.jreast_series = _nowRow.jrEast && _nowRow.jrEast.series ? _nowRow.jrEast.series : "";
			_objItem.dataset.jreast_timetable = _nowRow.jrEast && Array.isArray(_nowRow.jrEast.timetable) ? JSON.stringify(_nowRow.jrEast.timetable) : "[]";
			_objItem.dataset.dokotre_timetable = _nowRow.dokotre && Array.isArray(_nowRow.dokotre.timetable) ? JSON.stringify(_nowRow.dokotre.timetable) : "[]";
			_objItem.dataset.jrshinkansen_timetable = _nowRow.jrShinkansen && Array.isArray(_nowRow.jrShinkansen.timetable) ? JSON.stringify(_nowRow.jrShinkansen.timetable) : "[]";
			_objItem.dataset.jrwest_timetable = _nowRow.jrWest && Array.isArray(_nowRow.jrWest.timetable) ? JSON.stringify(_nowRow.jrWest.timetable) : "[]";
			_objItem.dataset.jrwest_type_change = _nowRow.jrWest && _nowRow.jrWest.typeChange ? _nowRow.jrWest.typeChange : "";
			_objItem.dataset.jrshikoku_timetable = _nowRow.jrShikoku && Array.isArray(_nowRow.jrShikoku.timetable) ? JSON.stringify(_nowRow.jrShikoku.timetable) : "[]";
			_objItem.dataset.jrcentral_timetable = _nowRow.jrCentral && Array.isArray(_nowRow.jrCentral.timetable) ? JSON.stringify(_nowRow.jrCentral.timetable) : "[]";
			_objItem.dataset.jrcentral_train_key = _nowRow.jrCentral && _nowRow.jrCentral.trainIdentificationKey ? _nowRow.jrCentral.trainIdentificationKey : "";
			_objItem.dataset.jrshinkansenIcon = _nowRow.jrShinkansen && _nowRow.jrShinkansen.trainIcon ? _nowRow.jrShinkansen.trainIcon : "";
		}

		// 列車種別を表す色を設定。
		{
			if (type && type.labelColor) {
				_objItem.dataset.ressha_type = type.labelColor;
			} else {
				_objItem.dataset.ressha_type = "";
			}
		}

		// 列車種別名
		{
			if (_nowRow.typeLabel) {
				_objItem.dataset.ressha_type_name = _nowRow.typeLabel;
			} else if (type) {
				if (type.type === 8) {
					_objItem.dataset.ressha_type_name = "快速";
				} else {
					_objItem.dataset.ressha_type_name = type.typeText[lang];
				}
			}

		}

		// 運行状態コード ※0=全区間運休、1=運転、2=部分運休
		_objItem.dataset.unkou = _nowRow.status;

		if (lang == "ja") {
			// 運行状態名
			{
				if (_nowRow.status == "0") _objItem.dataset.unkou_name = "全区間運休";
				if (_nowRow.status == "1") _objItem.dataset.unkou_name = "";
				if (_nowRow.status == "2") _objItem.dataset.unkou_name = "部分運休";
			}
			// 運行状態詳細
			{
				if (!_nowRow.statusDetail || _nowRow.statusDetail == "") _objItem.dataset.unkou_detail = "─";
				else _objItem.dataset.unkou_detail = _nowRow.statusDetail;
			}
		}
		else if (lang == "en") {
			// 運行状態名
			{
				if (_nowRow.status == "0") _objItem.dataset.unkou_name = "All sections cancelled";
				if (_nowRow.status == "1") _objItem.dataset.unkou_name = "";
				if (_nowRow.status == "2") _objItem.dataset.unkou_name = "Partially cancelled";
			}
			// 運行状態詳細
			{
				if (!_nowRow.statusDetailEn || _nowRow.statusDetailEn == "") _objItem.dataset.unkou_detail = "─";
				else _objItem.dataset.unkou_detail = _nowRow.statusDetailEn;
			}
		}
		else if (lang == "tc") {
			// 運行状態名
			{
				if (_nowRow.status == "0") _objItem.dataset.unkou_name = "全區間停駛";
				if (_nowRow.status == "1") _objItem.dataset.unkou_name = "";
				if (_nowRow.status == "2") _objItem.dataset.unkou_name = "部分停駛";
			}
			// 運行状態詳細
			{
				if (!_nowRow.statusDetailTc || _nowRow.statusDetailTc == "") _objItem.dataset.unkou_detail = "─";
				else _objItem.dataset.unkou_detail = _nowRow.statusDetailTc;
			}
		}
		else if (lang == "sc") {
			// 運行状態名
			{
				if (_nowRow.status == "0") _objItem.dataset.unkou_name = "全区间停驶";
				if (_nowRow.status == "1") _objItem.dataset.unkou_name = "";
				if (_nowRow.status == "2") _objItem.dataset.unkou_name = "部分停驶";
			}
			// 運行状態詳細
			{
				if (!_nowRow.statusDetailSc || _nowRow.statusDetailSc == "") _objItem.dataset.unkou_detail = "─";
				else _objItem.dataset.unkou_detail = _nowRow.statusDetailSc;
			}
		}
		else if (lang == "kr") {
			// 運行状態名
			{
				if (_nowRow.status == "0") _objItem.dataset.unkou_name = "전 구간<br>운행 중지";
				if (_nowRow.status == "1") _objItem.dataset.unkou_name = "";
				if (_nowRow.status == "2") _objItem.dataset.unkou_name = "부분 운행<br>중지";
			}
			// 運行状態詳細
			{
				if (!_nowRow.statusDetailKr || _nowRow.statusDetailKr == "") _objItem.dataset.unkou_detail = "─";
				else _objItem.dataset.unkou_detail = _nowRow.statusDetailKr;
			}
		}

		// 遅れ
		_objItem.dataset.chien = _nowRow.chien ? _nowRow.chien : "0";
		if (_nowRow.yokuStatus == 1 || _nowRow.yokuStatus == 2) {
			_objItem.dataset.yoku_text = _nowRow.yokuDetail && _nowRow.yokuDetail[lang] ? _nowRow.yokuDetail[lang] : "";
			_objItem.dataset.yoku_status = _nowRow.yokuStatus;
		} else {
			_objItem.dataset.yoku_text = "";
			_objItem.dataset.yoku_status = "0";
		}
		if (_nowRow.chien >= 1) {
			const CHIEN_LABEL_DELAYED_HOUR = { "ja": "{0}時間遅れ", "en": "{0} hour(s) late", "tc": "延遲{0}小時", "sc": "延迟{0}小时", "kr": "{0}시간 지연" };
			const CHIEN_LABEL_DELAYED_HR_MIN = { "ja": "{0}時間{1}分遅れ", "en": "{0} hr {1} min late", "tc": "延遲{0}小時{1}分", "sc": "延迟{0}小时{1}分", "kr": "{0}시간 {1}분 지연" };
			const CHIEN_LABEL_DELAYED_MINUTES = { "ja": "{0}分遅れ", "en": "{0} minutes late", "tc": "延遲{0}分", "sc": "延迟{0}分", "kr": "{0}분 지연" };
			let chienHour = Math.floor(_nowRow.chien / 60);
			let chienMin = _nowRow.chien % 60;
			_objItem.dataset.chien_status = "1";
			if (chienHour > 0){
				if (chienMin > 0) _objItem.dataset.chien_text = CHIEN_LABEL_DELAYED_HR_MIN[lang].replace("{0}", chienHour).replace("{1}", chienMin); // 「〇時間〇分遅れ」
				else _objItem.dataset.chien_text = CHIEN_LABEL_DELAYED_HOUR[lang].replace("{0}",chienHour); // 「〇時間遅れ」
			} else {
				// 英語で1分遅れの場合「1 minute late」になる
				if (lang == "en" && chienMin == 1)_objItem.dataset.chien_text = chienMin + " minute late";
				else _objItem.dataset.chien_text = CHIEN_LABEL_DELAYED_MINUTES[lang].replace("{0}", chienMin); // 「〇分遅れ」
			}
		} else {
			_objItem.dataset.chien_text = "";
			_objItem.dataset.chien_status = "0";
		}

		// 線区
		_objItem.dataset.senku = _nowRow.senku;

		// 地点キー
		_objItem.dataset.pos = _nowRow.pos;
		_objItem.dataset.pos_name = _nowRow.posName || "";

		// 駅マスタからダイヤデータの終着駅を取得する
		let findEki = _ekiData.find((v) => v.key == _nowRow.shuEkiKey);

		// 行先
		const jreastDestination = _nowRow.shuEkiName || _nowRow.shuEkiSimple || "";
		const jrWestVia = _nowRow.jrWest && _nowRow.jrWest.via ? _nowRow.jrWest.via + "経由 " : "";
		if (lang == "ja") _objItem.dataset.shu_eki = jreastDestination === "行先取得不可" ? jreastDestination : jrWestVia + (typeof findEki !== "undefined" ? findEki.ja + " 行き" : (jreastDestination ? jreastDestination + " 行き" : "行き"));
		if (lang == "en") _objItem.dataset.shu_eki = typeof findEki !== "undefined" ? "For " + findEki.en : (jreastDestination ? "For " + jreastDestination : "For ");
		if (lang == "tc") _objItem.dataset.shu_eki = typeof findEki !== "undefined" ? "開往" + findEki.tc : (jreastDestination ? "開往" + jreastDestination : "開往");
		if (lang == "sc") _objItem.dataset.shu_eki = typeof findEki !== "undefined" ? "开往" + findEki.sc : (jreastDestination ? "开往" + jreastDestination : "开往");
		if (lang == "kr") _objItem.dataset.shu_eki = typeof findEki !== "undefined" ? findEki.kr + "행" : (jreastDestination ? jreastDestination + "행" : "행");

		// 車両数
		const jreastSeries = _nowRow.jrEast && _nowRow.jrEast.series ? _nowRow.jrEast.series : "";
		_objItem.dataset.ryosu = _nowRow.ryosu && _nowRow.ryosu != 0 ? _nowRow.ryosu : "";
		if (_objItem.dataset.ryosu != "") {
			if (lang == "ja") _objItem.dataset.ryosu += "両";
			if (lang == "en") _objItem.dataset.ryosu += " car(s)";
			if (lang == "tc") _objItem.dataset.ryosu += "節車廂";
			if (lang == "sc") _objItem.dataset.ryosu += "节车厢";
			if (lang == "kr") _objItem.dataset.ryosu += "량 편성";
			if (_nowRow.source === "jreast" && jreastSeries) {
				_objItem.dataset.ryosu += "（" + jreastSeries + "）";
			}
		}
	}
}

/*
 * ヘッダーの高さ分の余白を設定する。
 */
function set_header_height() {
	let height = $(".train-guide-contents .sub-header").height();
	$(".station-list-contents").css("marginTop", 5 + height + "px");
}

/*
 * ダイアログを開くときのbodyのスクロールを無効にする。
 */
function set_scroll_hide(dialog) {
	let userAgent = navigator.userAgent;
	let windowWidth = window.innerWidth;
	let scrollbarWidth = window.innerWidth - document.body.clientWidth;
	let width = 0;
	if (windowWidth > 1000) width = 325;

	if (!$("#sideMenu .side-menu-outer").is(":visible")) scrollY = window.scrollY; // サイドメニュー非表示時
	$("body").css("overflow-y", "hidden");
	$("body").css("position", "fixed");
	$(".station-list-contents").css("position", "relative");
	if (!$("#sideMenu .side-menu-outer").is(":visible")) $(".station-list-contents").css("top",  scrollY * -1 + "px"); // サイドメニュー非表示時

	if (!(userAgent.indexOf('iPhone') > 0 || userAgent.indexOf('iPad') > 0 || userAgent.indexOf('Android') > 0 || userAgent.indexOf('Mobile') > 0 )) {
		// PCの場合
		width += scrollbarWidth;
		$("body").css("width", "calc(100% - " + scrollbarWidth + "px)");
		$("header").css("width", "calc(100% - " + scrollbarWidth + "px)");
		$(".sub-header").css("width", "calc(100% - " + width + "px)");
		$(".sub-footer").css("paddingRight", scrollbarWidth + "px");
		$(".sub-footer .homen-footer-contents").css("width", "calc(100% - " + width + "px)");
		$(".sub-footer .homen-footer-contents").css("marginRight", scrollbarWidth + "px");
		$("#menuLayer .menu").css("marginRight", scrollbarWidth + "px");
		$("#menuLayer .menu").css("width", "calc(99.3% - " + scrollbarWidth + "px)");
		if (windowWidth <= 550) {
			dialog.css("marginLeft", "0px");
			dialog.css("marginRight", scrollbarWidth + "px");
		} else {
			if (dialog.parent().parent().attr("id") == "guideDetail" && 631 <= windowWidth <= 920) {
				dialog.css("marginLeft", "0px");
				dialog.css("marginRight", scrollbarWidth + "px");
			} else {
				dialog.css("marginLeft", scrollbarWidth + "px");
			}
		}
	} else {
		dialog.css("marginLeft", "0px");
	}

	isDialogDisp = true;
}

/*
 * ダイアログを閉じるときのbodyのスクロールを有効にする。
 */
function set_scroll_show(dialog) {
	let userAgent = navigator.userAgent;
	let windowWidth = window.innerWidth;
	let scrollbarWidth = window.innerWidth - document.body.clientWidth;
	let width = 0;
	if (windowWidth > 1000) width = 325;

	$("body").css("overflow-y", "scroll");
	$("body").css("position", "static");
	$(".station-list-contents").css("position", "static");
	window.scrollTo(0, scrollY);

	if (!(userAgent.indexOf('iPhone') > 0 || userAgent.indexOf('iPad') > 0 || userAgent.indexOf('Android') > 0 || userAgent.indexOf('Mobile') > 0 )) {
		// PCの場合
		$("body").css("width", "100%");
		$("header").css("width", "100%");
		$(".sub-header").css("width", "calc(100% - " + width + "px)");
		$(".sub-footer").css("paddingRight", "0px");
		$(".sub-footer .homen-footer-contents").css("width", "calc(100% - " + width + "px)");
		$(".sub-footer .homen-footer-contents").css("marginRight", "0px");
		$("#menuLayer .menu").css("margin", "0");
		$("#menuLayer .menu").css("width", "99.3%");
		if (windowWidth <= 550) {
			dialog.css("marginLeft", "0px");
			dialog.css("marginRight", "0px");
		} else {
			if (dialog.parent().parent().attr("id") == "guideDetail") {
				if (631 <= windowWidth <= 920) {
					dialog.css("marginLeft", "0px");
					dialog.css("marginRight", "0px");
				} else {
					dialog.css("marginLeft", scrollbarWidth + "px");
				}
			} else {
				dialog.css("marginLeft", (scrollbarWidth * 2) + "px");
			}
		}
	}

	isDialogDisp = false;
}

/*
 * サイドメニューを開くときのbodyのスクロールを無効にする。
 */
function set_scroll_hide_side_menu() {
	let userAgent = navigator.userAgent;
	let scrollbarWidth = window.innerWidth - document.body.clientWidth;
	scrollY = window.scrollY;
	$("body").css("overflow-y", "hidden");
	$("body").css("position", "fixed");
	$(".station-list-contents").css("position", "relative");
	$(".station-list-contents").css("top",  scrollY * -1 + "px");

	if (!(userAgent.indexOf('iPhone') > 0 || userAgent.indexOf('iPad') > 0 || userAgent.indexOf('Android') > 0 || userAgent.indexOf('Mobile') > 0 )) {
		// PCの場合
		$("body").css("width", "calc(100% - " + scrollbarWidth + "px)");
		$("header").css("width", "calc(100% - " + scrollbarWidth + "px)");
		$(".sub-header").css("width", "calc(100% - " + scrollbarWidth + "px)");
		$(".sub-footer").css("paddingRight", scrollbarWidth + "px");
		$(".sub-footer .homen-footer-contents").css("width", "calc(100% - " + scrollbarWidth + "px)");
		$(".sub-footer .homen-footer-contents").css("marginRight", scrollbarWidth + "px");
		$("#menuLayer .menu").css("marginRight", scrollbarWidth + "px");
		$("#menuLayer .menu").css("width", "calc(99.3% - " + scrollbarWidth + "px)");
	}

	isSideMenuDisp = true;
}

/*
 * サイドメニューを閉じるときのbodyのスクロールを有効にする。
 */
function set_scroll_show_side_menu() {
	let userAgent = navigator.userAgent;
	let windowWidth = window.innerWidth;
	let width = 0;
	if (windowWidth > 1000) width = 325;

	$("body").css("overflow-y", "scroll");
	$("body").css("position", "static");
	$(".station-list-contents").css("position", "static");
	// サイドメニューの表示がある場合のみ(他路線への移動の場合はスクロールの移動を行わない)
	if (isSideMenuDisp) window.scrollTo(0, scrollY);

	if (!(userAgent.indexOf('iPhone') > 0 || userAgent.indexOf('iPad') > 0 || userAgent.indexOf('Android') > 0 || userAgent.indexOf('Mobile') > 0 )) {
		// PCの場合
		$("body").css("width", "100%");
		$("header").css("width", "100%");
		$(".sub-header").css("width", "calc(100% - " + width + "px)");
		$(".sub-footer").css("paddingRight", "0px");
		$(".sub-footer .homen-footer-contents").css("width", "calc(100% - " + width + "px)");
		$(".sub-footer .homen-footer-contents").css("marginRight", "0px");
		$("#menuLayer .menu").css("margin", "0");
		$("#menuLayer .menu").css("width", "99.3%");
	}

	isSideMenuDisp = false;
}

/*
 * タブ選択時の制御処理
 */
function tab_select(_str) {

	// タブ内の折り畳みを閉じる。
	toggle_close();

	if (_str == "Exp") {
		$('#localTab').hide();
		$('#expTab').show();
	} else {
		$('#localTab').show();
		$('#expTab').hide();
	}
}

/*
 * タブ選択時の制御処理（リサイズ時）
 */
function tab_select_resize(_str) {

	if (_str == "Exp") {
		$('#localTab').hide();
		$('#expTab').show();
	} else {
		$('#localTab').show();
		$('#expTab').hide();
	}
}

/*
 * タブ内の折り畳みを閉じる。
 */
function toggle_close() {
	// 特急リストをたたむ
	$(".express-train-list").css("display", "none");
	// 特急リストの見出し（三角）を初期化
	$(".express-name-label").removeClass("open");
	// サイドメニューをたたむ
	$(".rosen-name-list").css("display", "none");
	// サイドメニューの見出し（三角）を初期化
	$(".area-name-label").removeClass("open");
}

/*
 * ハッシュに保持した列車番号の列車が走行中か確認を行う
 */
function ressha_run_check() {
	// ローディングアニメーションを表示
	loading_animation_display();
	if (!suppressTrackScrollOnce) $("body,html").scrollTop(0);

	let param_cbango = get_param_cbango();
	let ressha = get_preferred_train_element(param_cbango);
	if (ressha.length > 0) {
		let pos = ressha.offset().top - 260;
		// リロードされた場合アニメーションを行わない
		if (suppressTrackScrollOnce) {
			$("body,html").scrollTop(preservedScrollTop);
			suppressTrackScrollOnce = false;
		} else if (!is_reload()) {
			$("body,html").animate({scrollTop: pos});
		} else {
			$("body,html").scrollTop(pos);
		}
		window.sessionStorage.setItem("scrollY", pos - 50);

		let html = "<img class='ressha-animation' src='./images/home/ressha_mark.svg' alt>"
		ressha.append(html);

		// 選択した列車に赤枠をつけて強調する
		set_ressha_icon_animation();

		// ローディングアニメーションを非表示にする
		loading_animation_hidden();

	} else {
		// 現在表示中の路線を取得
		isNotInitDisp = true;
		let rosen = get_param_rosen();
		location.hash = "rosen=" + rosen;
		// ページの読み込みが終わってからダイアログ表示
		$("#oshiraseDetail").fadeIn("fast");
		let lang = document.documentElement.dataset.lang;
		if (lang == "ja") $("#oshiraseDetailMain .text").text("現在はこの列車の営業時間外です。");
		if (lang == "en") $("#oshiraseDetailMain .text").text("This train is not in operation now.");
		if (lang == "tc") $("#oshiraseDetailMain .text").text("現在非本列車營運時間。");
		if (lang == "sc") $("#oshiraseDetailMain .text").text("现在非本列车营运时间。");
		if (lang == "kr") $("#oshiraseDetailMain .text").text("현재 이 열차는 주행하고 있지 않습니다.");
		set_scroll_hide($("#oshiraseDetail .dialog"));
	}

	if (window.innerWidth <= 1000) {
		// サイドメニューを閉じる
		$("#sideMenu .side-menu").css("transform", "translateX(-327px)");
		$("#sideMenu .side-menu").css("box-shadow", "none");
		$("#localTab").show();
		$("#expTab").show();
		$("#sideMenu .side-menu-outer").hide();
		// サイドメニュー内の折り畳みを閉じる。
		toggle_close();
	}
}

/*
 * ハッシュから路線を取得
 */
function get_param_rosen() {
	return new URLSearchParams(location.hash.slice(1)).get("rosen") || "";
}

/*
 * ハッシュからid（駅キー）を取得
 */
function get_param_id() {
	let params = location.hash.slice(1).split('&');
	if (params.length > 1) {
		if (params[1].indexOf("id=") >= 0) return params[1].substring(3);
		else return "";
	}
}

/*
 * ハッシュからcbangoを取得
 */
function get_param_cbango() {
	let params = location.hash.slice(1).split('&');
	if (params.length > 1) {
		if (params[1].indexOf("cbango=") >= 0) return params[1].substring(7);
		else return "";
	}
}

/*
 * 列車検索ダイアログを初期状態に戻す
 */
function reset_train_search_dialog() {
	$("#trainSearchNumberInput").val("");
	$("#trainSearchNameNumberInput").val("");
	$("#trainSearchResultInfo").empty();
	$("#trainSearchResult").empty();
}

/*
 * 列車検索ダイアログを閉じる
 */
function close_train_search_dialog() {
	$("#trainSearchDetail").fadeOut("fast");
	set_scroll_show($("#trainSearchDetail .dialog"));
}

/*
 * 取得列番一覧ダイアログを開く
 */
function open_train_number_list_dialog(mode) {
	trainNumberListMode = mode === "cancelled" ? "cancelled" : "numbers";
	trainNumberListFilter = "all";
	trainNumberListDelayThreshold = 1;
	trainNumberListShowEndedDelayed = false;
	trainNumberListRows = [];
	const isCancelledMode = trainNumberListMode === "cancelled";
	$("#trainNumberListTitle").text(isCancelledMode ? "運休列車一覧" : "取得した列番一覧");
	$("#trainNumberListDetail .train-number-list-filter-btn[data-filter]").prop("hidden", isCancelledMode);
	$("#cancelledTrainRefreshBtn").prop("hidden", !isCancelledMode);
	$("#trainNumberListDelayRange").val(trainNumberListDelayThreshold);
	$("#trainNumberListDelayValue").text(trainNumberListDelayThreshold + "分以上");
	$("#trainNumberListShowEndedDelayed").prop("checked", trainNumberListShowEndedDelayed);
	$("#trainNumberListDelayFilter").prop("hidden", true);
	$("#trainNumberListDetail .train-number-list-filter-btn").removeClass("active");
	if (!isCancelledMode) {
		$("#trainNumberListDetail .train-number-list-filter-btn[data-filter='all']").addClass("active");
	}
	$("#trainNumberListInfo").text("読み込み中...");
	$("#trainNumberListBody").empty();
	$("#trainNumberListDetail").fadeIn("fast");
	if (!$("#trainSearchDetail").is(":visible")) {
		set_scroll_hide($("#trainNumberListDetail .dialog"));
	}

	if (isCancelledMode) {
		if (cancelledTrainRows !== null) {
			render_cancelled_train_list();
		} else {
			fetch_cancelled_train_data(false).catch(() => {});
		}
		return;
	}

	load_train_search_data()
		.then((searchData) => {
			trainNumberListRows = searchData && Array.isArray(searchData.trains) ? searchData.trains : [];
			render_train_number_list_filtered();
		})
		.catch(() => {
			$("#trainNumberListInfo").text("列番一覧を取得できませんでした。");
			$("#trainNumberListBody").empty();
		});
}

/*
 * 取得列番一覧ダイアログを閉じる
 */
function close_train_number_list_dialog() {
	if (!$("#trainNumberListDetail").is(":visible")) return;
	$("#trainNumberListDetail").fadeOut("fast");
	if ($("#trainSearchDetail").is(":visible")) return;
	set_scroll_show($("#trainNumberListDetail .dialog"));
}

function find_cancelled_train_result(cbango) {
	if (!Array.isArray(cancelledTrainRows)) return undefined;
	const normalizedCbango = normalize_train_search_cbango(cbango);
	return cancelledTrainRows.find((train) => normalize_train_search_cbango(train.cbango) === normalizedCbango);
}

function load_cancelled_train_station_master() {
	if (cancelledTrainStationMasterPromise) return cancelledTrainStationMasterPromise;
	const cacheKey = Date.now() >>> 16;
	cancelledTrainStationMasterPromise = jqxhr_to_promise($.getJSON("./original/cancelled_train_station_master.json?" + cacheKey))
		.then((rows) => Array.isArray(rows) ? rows.filter((row) => row && row.key) : [])
		.catch((error) => {
			cancelledTrainStationMasterPromise = null;
			throw error;
		});
	return cancelledTrainStationMasterPromise;
}

function request_train_search_timetable_now(stationKey, forceRefresh) {
	const key = String(stationKey || "");
	if (!key) return Promise.reject(new Error("station key is required"));
	const now = Date.now();
	const cachedNow = trainSearchTimetableNowCache.get(key);
	if (!forceRefresh && cachedNow && now - cachedNow.loadedAt < TRAIN_SEARCH_TIMETABLE_NOW_CACHE_TTL) {
		return cachedNow.promise;
	}
	const sourceUrl = "https://www3.jrhokkaido.co.jp/webunkou/json/timetable/now/" + encodeURIComponent(key) + "_now.json";
	const requestUrl = "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=" + encodeURIComponent(sourceUrl) + "&_=" + (now >>> 10);
	const promise = jqxhr_to_promise($.getJSON(requestUrl));
	trainSearchTimetableNowCache.set(key, { "promise": promise, "loadedAt": now });
	promise.catch(() => {
		const current = trainSearchTimetableNowCache.get(key);
		if (current && current.promise === promise) trainSearchTimetableNowCache.delete(key);
	});
	return promise;
}

function delay_promise(milliseconds) {
	return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function fetch_cancelled_train_station(station, forceRefresh) {
	return request_train_search_timetable_now(station.key, forceRefresh)
		.catch(() => delay_promise(350).then(() => request_train_search_timetable_now(station.key, true)))
		.then((data) => ({ "station": station, "data": data }));
}

function fetch_cancelled_train_stations(stations, forceRefresh, onProgress) {
	const results = new Array(stations.length);
	let nextIndex = 0;
	let completed = 0;
	let failed = 0;
	const workerCount = Math.min(CANCELLED_TRAIN_FETCH_CONCURRENCY, stations.length);
	const workers = Array.from({ length: workerCount }, async () => {
		while (true) {
			const index = nextIndex++;
			if (index >= stations.length) return;
			try {
				results[index] = await fetch_cancelled_train_station(stations[index], forceRefresh);
			} catch (error) {
				failed++;
				results[index] = { "station": stations[index], "error": error };
			} finally {
				completed++;
				if (onProgress) onProgress(completed, stations.length, failed);
			}
		}
	});
	return Promise.all(workers).then(() => results);
}

function get_cancelled_train_status_detail(operation) {
	const lang = document.documentElement.dataset.lang;
	if (lang === "en") return operation.statusDetailEn || operation.statusDetail || "";
	if (lang === "tc") return operation.statusDetailTc || operation.statusDetail || "";
	if (lang === "sc") return operation.statusDetailSc || operation.statusDetail || "";
	if (lang === "kr") return operation.statusDetailKr || operation.statusDetail || "";
	return operation.statusDetail || "";
}

function merge_cancelled_train_operations(stationResults) {
	const operationMap = new Map();
	stationResults.forEach((result) => {
		if (!result || result.error || !result.data || !Array.isArray(result.data.today)) return;
		result.data.today.forEach((operation) => {
			if (!operation || !operation.cbango) return;
			const status = Number(operation.status);
			if (status !== 0 && status !== 2) return;
			const key = normalize_train_search_cbango(operation.cbango);
			const candidate = {
				"operation": operation,
				"station": result.station,
				"priority": status === 0 ? 2 : 1
			};
			const current = operationMap.get(key);
			if (!current || candidate.priority > current.priority || (!get_cancelled_train_status_detail(current.operation) && get_cancelled_train_status_detail(operation))) {
				operationMap.set(key, candidate);
			}
		});
	});
	return operationMap;
}

function build_cancelled_train_rows(stationResults, searchData) {
	const searchMap = new Map();
	if (searchData && Array.isArray(searchData.trains)) {
		searchData.trains.forEach((train) => {
			if (train && train.cbango) searchMap.set(normalize_train_search_cbango(train.cbango), train);
		});
	}
	const operationMap = merge_cancelled_train_operations(stationResults);
	return Array.from(operationMap.entries()).map(([normalizedCbango, entry]) => {
		const operation = entry.operation;
		const matchedTrain = searchMap.get(normalizedCbango);
		const status = Number(operation.status);
		const statusDetail = get_cancelled_train_status_detail(operation);
		let detailTrain = matchedTrain && matchedTrain.detailTrain ? Object.assign({}, matchedTrain.detailTrain) : null;
		if (detailTrain) {
			detailTrain.runStatus = operation.runStatus;
			detailTrain.yokuStatus = operation.yokuStatus;
			detailTrain.yokuDetail = operation.yokuDetail;
			detailTrain.status = status;
			detailTrain.statusDetail = statusDetail;
			detailTrain.chien = operation.chien;
			detailTrain.pos = operation.pos;
			if (!detailTrain.typeLookupStation) detailTrain.typeLookupStation = entry.station.key;
		}
		return {
			"cbango": String(operation.cbango || "").toUpperCase(),
			"type": matchedTrain ? matchedTrain.type : "",
			"value": matchedTrain ? matchedTrain.value : "",
			"name": matchedTrain ? matchedTrain.name : String(operation.cbango || ""),
			"status": status === 0 ? "全区間運休" : "部分運休",
			"currentSection": statusDetail,
			"showStatusSection": true,
			"baseName": matchedTrain ? matchedTrain.baseName : "",
			"goNumber": matchedTrain ? matchedTrain.goNumber : "",
			"isRunning": false,
			"detailTrain": detailTrain
		};
	});
}

function is_cancelled_train_test_mode() {
	const host = String(window.location.hostname || "").toLowerCase();
	if (host !== "127.0.0.1" && host !== "localhost") return false;
	return new URLSearchParams(window.location.search).get("cancelledTest") === "1";
}

function build_cancelled_train_test_rows() {
	return [
		{
			"cbango": "168M",
			"type": "3",
			"value": "01",
			"name": "\u666e\u901a \u5c0f\u6a3d",
			"status": "\u5168\u533a\u9593\u904b\u4f11",
			"currentSection": "\u5ca9\u898b\u6ca2\uff5e\u5c0f\u6a3d \u9593",
			"showStatusSection": true,
			"baseName": "",
			"goNumber": "",
			"isRunning": false,
			"detailTrain": null
		},
		{
			"cbango": "154M",
			"type": "3",
			"value": "01",
			"name": "\u666e\u901a \u624b\u7a32",
			"status": "\u90e8\u5206\u904b\u4f11",
			"currentSection": "\u672d\u5e4c\uff5e\u624b\u7a32 \u9593",
			"showStatusSection": true,
			"baseName": "",
			"goNumber": "",
			"isRunning": false,
			"detailTrain": null
		},
		{
			"cbango": "71D",
			"type": "1",
			"value": "01",
			"name": "\u30aa\u30db\u30fc\u30c4\u30af1\u53f7 \u7db2\u8d70",
			"status": "\u90e8\u5206\u904b\u4f11",
			"currentSection": "\u65ed\u5ddd\uff5e\u7db2\u8d70 \u9593",
			"showStatusSection": true,
			"baseName": "\u30aa\u30db\u30fc\u30c4\u30af",
			"goNumber": "1",
			"isRunning": false,
			"detailTrain": null
		},
		{
			"cbango": "923D",
			"type": "3",
			"value": "01",
			"name": "\u666e\u901a \u51fd\u9928",
			"status": "\u5168\u533a\u9593\u904b\u4f11",
			"currentSection": "\u68ee\uff5e\u51fd\u9928 \u9593",
			"showStatusSection": true,
			"baseName": "",
			"goNumber": "",
			"isRunning": false,
			"detailTrain": null
		}
	];
}

function setup_cancelled_train_test_mode() {
	if (!is_cancelled_train_test_mode()) return;
	cancelledTrainTestMode = true;
	cancelledTrainRows = build_cancelled_train_test_rows();
	cancelledTrainFailures = [];
	cancelledTrainFetchedAt = Date.now();
	cancelledTrainStationCount = 83;
	$("#cancelledTrainFetchInfo").text("\u3010\u30c6\u30b9\u30c8\u8868\u793a\u3011" + get_cancelled_train_summary_text());
	window.setTimeout(() => open_train_number_list_dialog("cancelled"), 500);
}

function format_cancelled_train_fetch_time(timestamp) {
	if (!timestamp) return "";
	const date = new Date(timestamp);
	return String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0");
}

function get_cancelled_train_cache_expiry(timestamp) {
	const fetchedDate = new Date(timestamp);
	const expiry = new Date(timestamp);
	expiry.setHours(3, 0, 0, 0);
	if (expiry <= fetchedDate) expiry.setDate(expiry.getDate() + 1);
	return expiry.getTime();
}

function schedule_cancelled_train_cache_expiry(expiresAt) {
	if (cancelledTrainCacheExpiryTimer) {
		window.clearTimeout(cancelledTrainCacheExpiryTimer);
		cancelledTrainCacheExpiryTimer = null;
	}
	const delay = Number(expiresAt) - Date.now();
	if (delay <= 0) {
		clear_cancelled_train_cache(false);
		return;
	}
	cancelledTrainCacheExpiryTimer = window.setTimeout(() => {
		clear_cancelled_train_cache(true);
	}, delay);
}

function save_cancelled_train_cache() {
	if (cancelledTrainTestMode) return;
	if (!Array.isArray(cancelledTrainRows) || !cancelledTrainFetchedAt) return;
	const expiresAt = get_cancelled_train_cache_expiry(cancelledTrainFetchedAt);
	const cache = {
		"version": 1,
		"rows": cancelledTrainRows,
		"failures": cancelledTrainFailures,
		"fetchedAt": cancelledTrainFetchedAt,
		"stationCount": cancelledTrainStationCount,
		"expiresAt": expiresAt
	};
	try {
		window.localStorage.setItem(CANCELLED_TRAIN_CACHE_KEY, JSON.stringify(cache));
	} catch (error) {
		console.warn("運休列車キャッシュを保存できませんでした。", error);
	}
	schedule_cancelled_train_cache_expiry(expiresAt);
}

function clear_cancelled_train_cache(showMessage) {
	try {
		window.localStorage.removeItem(CANCELLED_TRAIN_CACHE_KEY);
	} catch (error) {
		console.warn("運休列車キャッシュを削除できませんでした。", error);
	}
	if (cancelledTrainCacheExpiryTimer) {
		window.clearTimeout(cancelledTrainCacheExpiryTimer);
		cancelledTrainCacheExpiryTimer = null;
	}
	cancelledTrainRows = null;
	cancelledTrainFailures = [];
	cancelledTrainFetchedAt = 0;
	cancelledTrainStationCount = 0;
	if (!showMessage) return;
	const message = "午前3時になったため、運休列車のキャッシュを削除しました。";
	$("#cancelledTrainFetchInfo").text(message);
	if (trainNumberListMode === "cancelled" && $("#trainNumberListDetail").is(":visible")) {
		$("#trainNumberListInfo").text(message);
		$("#trainNumberListBody").html("<div class='train-search-empty'>再取得してください。</div>");
	}
}

function restore_cancelled_train_cache() {
	let cache;
	try {
		const stored = window.localStorage.getItem(CANCELLED_TRAIN_CACHE_KEY);
		if (!stored) return;
		cache = JSON.parse(stored);
	} catch (error) {
		clear_cancelled_train_cache(false);
		return;
	}
	if (!cache || cache.version !== 1 || !Array.isArray(cache.rows) || Number(cache.expiresAt) <= Date.now()) {
		clear_cancelled_train_cache(false);
		return;
	}
	cancelledTrainRows = cache.rows;
	cancelledTrainFailures = Array.isArray(cache.failures) ? cache.failures : [];
	cancelledTrainFetchedAt = Number(cache.fetchedAt) || 0;
	cancelledTrainStationCount = Number(cache.stationCount) || 0;
	$("#cancelledTrainFetchInfo").text(get_cancelled_train_summary_text());
	schedule_cancelled_train_cache_expiry(Number(cache.expiresAt));
}

function set_cancelled_train_fetch_controls(disabled) {
	$("#cancelledTrainFetchBtn, #cancelledTrainRefreshBtn").prop("disabled", disabled);
}

function update_cancelled_train_fetch_progress(completed, total, failed) {
	let text = "運休列車を取得中... " + completed + "/" + total + "駅";
	if (failed > 0) text += "（失敗 " + failed + "駅）";
	$("#cancelledTrainFetchInfo").text(text);
	if (trainNumberListMode === "cancelled" && $("#trainNumberListDetail").is(":visible")) {
		$("#trainNumberListInfo").text(text);
	}
}

function get_cancelled_train_summary_text() {
	const count = Array.isArray(cancelledTrainRows) ? cancelledTrainRows.length : 0;
	const successCount = Math.max(0, cancelledTrainStationCount - cancelledTrainFailures.length);
	let text = "運休列車 " + count + "件・" + successCount + "/" + cancelledTrainStationCount + "駅取得";
	if (cancelledTrainFetchedAt) text += "（" + format_cancelled_train_fetch_time(cancelledTrainFetchedAt) + "現在）";
	if (cancelledTrainFailures.length) {
		const failedNames = cancelledTrainFailures.slice(0, 3).map((station) => station.name).join("、");
		text += "・取得失敗 " + cancelledTrainFailures.length + "駅";
		if (failedNames) text += "（" + failedNames + (cancelledTrainFailures.length > 3 ? "ほか" : "") + "）";
	}
	return text;
}

function fetch_cancelled_train_data(forceRefresh) {
	if (cancelledTrainTestMode) {
		cancelledTrainRows = build_cancelled_train_test_rows();
		cancelledTrainFetchedAt = Date.now();
		$("#cancelledTrainFetchInfo").text("\u3010\u30c6\u30b9\u30c8\u8868\u793a\u3011" + get_cancelled_train_summary_text());
		if (trainNumberListMode === "cancelled" && $("#trainNumberListDetail").is(":visible")) render_cancelled_train_list();
		return Promise.resolve(cancelledTrainRows);
	}
	if (cancelledTrainFetchPromise) return cancelledTrainFetchPromise;
	if (!forceRefresh && cancelledTrainRows !== null) {
		render_cancelled_train_list();
		return Promise.resolve(cancelledTrainRows);
	}
	set_cancelled_train_fetch_controls(true);
	$("#cancelledTrainFetchInfo").text("運休列車の取得駅を読み込み中...");
	if (trainNumberListMode === "cancelled" && $("#trainNumberListDetail").is(":visible")) {
		$("#trainNumberListInfo").text("運休列車の取得駅を読み込み中...");
	}
	cancelledTrainFetchPromise = Promise.all([
		load_cancelled_train_station_master(),
		load_train_search_data().catch(() => ({ "trains": [] }))
	]).then(([stations, searchData]) => {
		cancelledTrainStationCount = stations.length;
		update_cancelled_train_fetch_progress(0, stations.length, 0);
		return fetch_cancelled_train_stations(stations, forceRefresh, update_cancelled_train_fetch_progress)
			.then((stationResults) => ({ "stationResults": stationResults, "searchData": searchData }));
	}).then(({ stationResults, searchData }) => {
		cancelledTrainFailures = stationResults.filter((result) => result && result.error).map((result) => result.station);
		cancelledTrainRows = build_cancelled_train_rows(stationResults, searchData);
		cancelledTrainFetchedAt = Date.now();
		save_cancelled_train_cache();
		const summary = get_cancelled_train_summary_text();
		$("#cancelledTrainFetchInfo").text(summary);
		if (trainNumberListMode === "cancelled" && $("#trainNumberListDetail").is(":visible")) render_cancelled_train_list();
		return cancelledTrainRows;
	}).catch(() => {
		const message = "運休列車を取得できませんでした。";
		$("#cancelledTrainFetchInfo").text(message);
		if (trainNumberListMode === "cancelled" && $("#trainNumberListDetail").is(":visible")) {
			$("#trainNumberListInfo").text(message);
			$("#trainNumberListBody").html("<div class='train-search-empty'>時間をおいて再取得してください。</div>");
		}
		throw new Error(message);
	}).finally(() => {
		cancelledTrainFetchPromise = null;
		set_cancelled_train_fetch_controls(false);
	});
	return cancelledTrainFetchPromise;
}

/*
 * 現在走行していない列車を選択した際のメッセージを表示する
 */
function show_train_not_running_message() {
	$("#oshiraseDetail").fadeIn("fast");
	let lang = document.documentElement.dataset.lang;
	if (lang == "ja") $("#oshiraseDetailMain .text").text("この列車は現在走行していません。");
	if (lang == "en") $("#oshiraseDetailMain .text").text("This train is not currently running.");
	if (lang == "tc") $("#oshiraseDetailMain .text").text("本列車目前未行駛。");
	if (lang == "sc") $("#oshiraseDetailMain .text").text("本列车目前未运行。");
	if (lang == "kr") $("#oshiraseDetailMain .text").text("이 열차는 현재 주행하고 있지 않습니다.");
	set_scroll_hide($("#oshiraseDetail .dialog"));
}

/*
 * 列車検索データを読み込む
 */
function find_train_search_result(cbango) {
	if (!cachedTrainSearchData || !Array.isArray(cachedTrainSearchData.trains)) return undefined;
	const normalizedCbango = normalize_train_search_cbango(cbango);
	return cachedTrainSearchData.trains.find((train) => normalize_train_search_cbango(train.cbango) === normalizedCbango);
}

/*
 * 駅別時刻表の公式データから、非走行列車の種別と運行状態を取得する。
 */
function load_train_search_detail_data(detailTrain) {
	const stationKey = String((detailTrain && detailTrain.typeLookupStation) || "");
	if (!detailTrain || !stationKey) return Promise.resolve(detailTrain);

	let corePromise = Promise.resolve(null);
	if (!detailTrain.type) {
		corePromise = trainSearchTimetableCoreCache.get(stationKey);
		if (!corePromise) {
			const sourceUrl = "https://www3.jrhokkaido.co.jp/webunkou/json/timetable/core/" + encodeURIComponent(stationKey) + "_core.json";
			const requestUrl = "https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=" + encodeURIComponent(sourceUrl) + "&_=" + (Date.now() >>> 16);
			corePromise = jqxhr_to_promise($.getJSON(requestUrl));
			trainSearchTimetableCoreCache.set(stationKey, corePromise);
			corePromise.catch(() => trainSearchTimetableCoreCache.delete(stationKey));
		}
	}

	let nowPromise = Promise.resolve(null);
	if (detailTrain.status === null || typeof detailTrain.status === "undefined") {
		nowPromise = request_train_search_timetable_now(stationKey, false);
	}

	return Promise.all([corePromise, nowPromise]).then(([coreData, nowData]) => {
		const resolvedDetail = Object.assign({}, detailTrain);
		const targetCbango = normalize_train_search_cbango(detailTrain.cbango);
		const timetables = coreData && coreData.today && Array.isArray(coreData.today.timetable) ? coreData.today.timetable : [];
		let matchedTrain;
		timetables.some((timetable) => {
			if (!timetable || !Array.isArray(timetable.trains)) return false;
			matchedTrain = timetable.trains.find((train) => train && normalize_train_search_cbango(train.cbango) === targetCbango);
			return !!matchedTrain;
		});
		if (matchedTrain && matchedTrain.type !== null && typeof matchedTrain.type !== "undefined" && String(matchedTrain.type) !== "") {
			resolvedDetail.type = String(matchedTrain.type);
			resolvedDetail.typeLabel = String(matchedTrain.typeText || "");
		}

		const operationRows = nowData && Array.isArray(nowData.today) ? nowData.today : [];
		const operation = operationRows.find((train) => train && normalize_train_search_cbango(train.cbango) === targetCbango);
		if (operation) {
			const lang = document.documentElement.dataset.lang;
			resolvedDetail.runStatus = operation.runStatus;
			resolvedDetail.yokuStatus = operation.yokuStatus;
			resolvedDetail.yokuDetail = operation.yokuDetail;
			resolvedDetail.status = Number(operation.status);
			resolvedDetail.statusDetail =
				lang === "ja" ? operation.statusDetail :
				lang === "en" ? operation.statusDetailEn :
				lang === "tc" ? operation.statusDetailTc :
				lang === "sc" ? operation.statusDetailSc :
				lang === "kr" ? operation.statusDetailKr : "";
			resolvedDetail.chien = operation.chien;
			resolvedDetail.pos = operation.pos;
		}
		return resolvedDetail;
	}).catch(() => detailTrain);
}

function load_train_search_data() {
	if (cachedTrainSearchData && (Date.now() - cachedTrainSearchLoadedAt) < TRAIN_SEARCH_CACHE_TTL) {
		return Promise.resolve(cachedTrainSearchData);
	}
	if (trainSearchDataPromise) return trainSearchDataPromise;

	const lang = document.documentElement.dataset.lang;
	const mstNow = Date.now() >>> 16;
	const trnNow = Date.now() >>> 10;
	const searchSourceRosens = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15"];
	const daiyaSourceSenkus = ["00"].concat(searchSourceRosens, ["19"]);
	const expressMasterPromise = jqxhr_to_promise($.getJSON("https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/master/express_master.json?" + mstNow));
	const expressCorePromise = jqxhr_to_promise(get_express_core_request(mstNow));
	const expressNowPromise = jqxhr_to_promise(get_express_now_request(trnNow))
		.catch(() => ({ "trains": [] }));
	const typePromise = cachedResshaTypeData ? Promise.resolve(cachedResshaTypeData) : jqxhr_to_promise($.getJSON("https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/master/ressha_type_master.json?" + mstNow));
	const ekiPromise = cachedEkiData ? Promise.resolve(cachedEkiData) : jqxhr_to_promise($.getJSON("https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=https://www3.jrhokkaido.co.jp/webunkou/json/master/eki_master.json?" + mstNow));
	const locationMasterPromise = cachedLocationMasterData ? Promise.resolve(cachedLocationMasterData) : jqxhr_to_promise($.getJSON("./original/location_master.json")).catch(() => ({}));
	const locationPromises = searchSourceRosens.map((rosen) =>
		(is_dokotre_location_rosen(rosen) || is_jr_shinkansen_location_rosen(rosen) ? load_location_now_data(rosen, trnNow) : jqxhr_to_promise(get_location_now_request(rosen, trnNow)))
			.then((data) => ({ "rosen": rosen, "data": data }))
			.catch(() => null)
	);
	const daiyaPromises = daiyaSourceSenkus.map((senku) =>
		jqxhr_to_promise(get_daiya_request(senku, lang, mstNow))
			.then((data) => ({ "senku": senku, "data": data }))
			.catch(() => null)
	);

	trainSearchDataPromise = Promise.all([
		expressMasterPromise,
		expressCorePromise,
		expressNowPromise,
		typePromise,
		ekiPromise,
		locationMasterPromise,
		Promise.all(daiyaPromises),
		Promise.all(locationPromises)
	]).then(([expressMaster, expressCore, expressNowData, typeData, ekiData, locationMasterData, daiyaDataList, locationDataList]) => {
		cachedResshaTypeData = typeData;
		cachedEkiData = ekiData;
		cachedLocationMasterData = locationMasterData || {};
		const daiyaMap = new Map();
		const expressNowMap = new Map();
		const expressCoreTrainMap = new Map();
		daiyaDataList.filter(Boolean).forEach((entry) => {
			if (!entry.data || !Array.isArray(entry.data.today)) return;
			entry.data.today.forEach((row) => {
				if (!row || !row.cbango) return;
				const cbango = String(row.cbango);
				const current = daiyaMap.get(cbango);
				const candidate = Object.assign({ "senku": entry.senku }, row);
				if (!current) {
					daiyaMap.set(cbango, candidate);
					return;
				}
				const merged = Object.assign({}, current);
				Object.keys(candidate).forEach((key) => {
					const value = candidate[key];
					if (value === "" || value === null || typeof value === "undefined") return;
					if (key === "senku") {
						if (!merged.senku || (merged.senku !== "00" && value === "00")) merged.senku = value;
						return;
					}
					if (key === "stations") {
						if (!Array.isArray(merged.stations) || merged.stations.length === 0 || (Array.isArray(value) && value.length > merged.stations.length)) {
							merged.stations = value;
						}
						return;
					}
					if (merged[key] === "" || merged[key] === null || typeof merged[key] === "undefined") {
						merged[key] = value;
					}
				});
				daiyaMap.set(cbango, merged);
			});
		});
		if (expressNowData && Array.isArray(expressNowData.trains)) {
			expressNowData.trains.forEach((train) => {
				if (!train || !train.cbango) return;
				expressNowMap.set(String(train.cbango).toUpperCase(), train);
			});
		}
		if (expressCore && Array.isArray(expressCore.expresses)) {
			expressCore.expresses.forEach((express) => {
				if (!express || !Array.isArray(express.trains)) return;
				express.trains.forEach((train) => {
					if (!train || !train.cbango) return;
					expressCoreTrainMap.set(String(train.cbango).toUpperCase(), train);
				});
			});
		}

		const trainMap = new Map();
		locationDataList.filter(Boolean).forEach((entry) => {
			if (!entry.data || !Array.isArray(entry.data.trains)) return;
			entry.data.trains.forEach((train) => {
				if (!train || !train.cbango) return;
				const cbango = String(train.cbango).toUpperCase();
				const daiya = daiyaMap.get(String(train.cbango)) || (train.source === "dokotre" || train.source === "jrshinkansen" ? {
					"name": train.name || "",
					"shuEkiKey": train.shuEkiKey || "",
					"senku": train.senku || ""
				} : undefined);
				if (is_hidden_train_search_shinkansen(train.senku || train.sourceRosen || entry.rosen || (daiya ? daiya.senku : ""))) return;
				const nameInfo = parse_train_name(daiya && daiya.name ? daiya.name : "");
				const displayName = build_train_search_display_name(train, daiya, typeData, ekiData);
				const targetRosen = normalizeMergedRosen(entry.rosen, nameInfo.baseName || displayName);
				const detailType = daiya && String(daiya.senku || "") === "19" ? "4" : String(train.type || (daiya ? daiya.type : "") || "");
				const detailTrain = daiya ? {
					"cbango": cbango,
					"name": daiya.name || "",
					"type": detailType,
					"shuEki": daiya.shuEkiKey || train.shuEkiKey || "",
					"ryosu": daiya.ryosu || train.ryosu || "",
					"senku": daiya.senku || train.senku || entry.rosen || "00",
					"typeLookupStation": Array.isArray(daiya.stations) && daiya.stations[0] ? String(daiya.stations[0].key || "") : "",
					"runStatus": train.runStatus,
					"yokuStatus": train.yokuStatus,
					"yokuDetail": train.yokuDetail,
					"status": train.status,
					"statusDetail": train.statusDetail,
					"chien": train.chien,
					"pos": train.pos
				} : null;
				const candidate = {
					"cbango": cbango,
					"type": String(train.type || ""),
					"value": targetRosen,
					"name": displayName,
					"status": getTrainChienText(train),
					"currentSection": get_train_search_current_section(train, locationMasterData),
					"baseName": nameInfo.baseName,
					"goNumber": nameInfo.goNumber,
					"hasCustomName": !!nameInfo.baseName,
					"delayMinutes": Math.max(0, Number(train.chien) || 0),
					"isRunning": true,
					"detailTrain": detailTrain
				};
				const current = trainMap.get(cbango);
				if (!current || (!current.hasCustomName && candidate.hasCustomName)) {
					trainMap.set(cbango, candidate);
				}
			});
		});
		daiyaMap.forEach((daiya, cbangoKey) => {
			const cbango = String(cbangoKey).toUpperCase();
			if (is_hidden_train_search_shinkansen(daiya && daiya.senku)) return;
			if (trainMap.has(cbango)) return;
			const nameInfo = parse_train_name(daiya && daiya.name ? daiya.name : "");
			const expressNow = expressNowMap.get(cbango);
			const expressCoreTrain = expressCoreTrainMap.get(cbango);
			const statusDetail = expressNow ? (
				lang === "ja" ? expressNow.statusDetail :
				lang === "en" ? expressNow.statusDetailEn :
				lang === "tc" ? expressNow.statusDetailTc :
				lang === "sc" ? expressNow.statusDetailSc :
				lang === "kr" ? expressNow.statusDetailKr : ""
			) : "";
			const suppliedType = expressCoreTrain && expressCoreTrain.type !== null && typeof expressCoreTrain.type !== "undefined" && String(expressCoreTrain.type) !== "" ?
				String(expressCoreTrain.type) :
				(daiya && daiya.type !== null && typeof daiya.type !== "undefined" ? String(daiya.type) : "");
			const resolvedType = resolve_train_search_type(
				suppliedType,
				daiya ? daiya.name : "",
				typeData,
				cbango,
				daiya ? daiya.senku : ""
			);
			const displayName = build_train_search_display_name({
				"type": resolvedType,
				"shuEkiKey": daiya ? daiya.shuEkiKey : "",
				"cbango": cbango
			}, daiya, typeData, ekiData);
			const detailType = daiya && String(daiya.senku || "") === "19" ? "4" : suppliedType;
			const detailTrain = daiya ? {
				"cbango": cbango,
				"name": daiya.name || "",
				"type": detailType,
				"shuEki": daiya.shuEkiKey || "",
				"ryosu": daiya.ryosu || "",
				"senku": daiya.senku || "00",
				"typeLookupStation": Array.isArray(daiya.stations) && daiya.stations[0] ? String(daiya.stations[0].key || "") : ""
			} : null;
			if (detailTrain && expressNow) {
				detailTrain.runStatus = expressNow.runStatus;
				detailTrain.yokuStatus = expressNow.yokuStatus;
				detailTrain.yokuDetail = expressNow.yokuDetail;
				detailTrain.status = expressNow.status;
				detailTrain.statusDetail = statusDetail;
				detailTrain.chien = expressNow.chien;
			}
			trainMap.set(cbango, {
				"cbango": cbango,
				"type": resolvedType,
				"value": "",
				"name": displayName,
				"status": "この列車は現在走行していません。",
				"currentSection": "",
				"baseName": nameInfo.baseName,
				"goNumber": nameInfo.goNumber,
				"hasCustomName": !!nameInfo.baseName,
				"delayMinutes": Math.max(0, Number(expressNow && expressNow.chien) || 0),
				"isRunning": false,
				"detailTrain": detailTrain
			});
		});
		const trains = Array.from(trainMap.values()).sort((a, b) => a.cbango.localeCompare(b.cbango, "ja"));
		const activeExpressKeys = new Set(
			(expressCore && Array.isArray(expressCore.expresses) ? expressCore.expresses : [])
				.filter((row) => row && Array.isArray(row.trains) && row.trains.length > 0)
				.map((row) => row.key)
		);
		const expressNames = Array.from(new Set(
			(expressMaster && Array.isArray(expressMaster) ? expressMaster : [])
				.filter((row) => activeExpressKeys.has(row.key))
				.map((row) => row.name && row.name[lang] ? row.name[lang] : "")
				.filter(Boolean)
		));
		const shinkansenNames = Array.from(new Set(
			Array.from(daiyaMap.values())
				.filter((row) => row && String(row.senku || "") === "19")
				.map((row) => parse_train_name(row.name).baseName)
				.filter(Boolean)
		));
		const names = Array.from(new Set(expressNames.concat(shinkansenNames))).sort((a, b) => a.localeCompare(b, "ja"));
		cachedTrainSearchData = { "trains": trains, "names": names };
		cachedTrainSearchLoadedAt = Date.now();
		trainSearchDataPromise = null;
		return cachedTrainSearchData;
	}).catch((error) => {
		trainSearchDataPromise = null;
		throw error;
	});

	return trainSearchDataPromise;
}

/*
 * 列車名プルダウンを構築する
 */
function populate_train_search_name_select(searchData) {
	const select = $("#trainSearchNameSelect");
	select.empty();
	select.append($("<option>").val("").text("列車名を選択"));
	if (searchData && Array.isArray(searchData.names)) {
		searchData.names.forEach((name) => {
			select.append($("<option>").val(name).text(name));
		});
	}
}

/*
 * 列車名と号数を分解する
 */
function parse_train_name(name) {
	const text = String(name || "")
		.replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xFEE0))
		.replace(/\u3000/g, " ")
		.trim();
	if (!text) return { "baseName": "", "goNumber": "" };
	const match = text.match(/^(.*?)(\d+)号?$/);
	if (!match) return { "baseName": text, "goNumber": "" };
	return {
		"baseName": match[1].trim(),
		"goNumber": match[2]
	};
}

/*
 * 列車検索用の表示名を作成する
 */
function build_train_search_display_name(train, daiya, typeData, ekiData) {
	const lang = document.documentElement.dataset.lang;
	const destKey = train.shuEkiKey || (daiya ? daiya.shuEkiKey : "");
	const dest = ekiData.find((row) => row.key == destKey);
	const destName = dest ? (dest[lang] || dest.ja || "") : "";
	const destText = destName ? " " + destName + "行" : "";
	const nameInfo = parse_train_name(daiya && daiya.name ? daiya.name : "");
	if (nameInfo.baseName) return (daiya.name + destText).trim();
	const resolvedType = resolve_train_search_type(train.type, daiya ? daiya.name : "", typeData, train.cbango, daiya ? daiya.senku : "");
	const type = typeData.find((row) => String(row.type) == String(resolvedType));
	let typeName = "";
	if (type) {
		typeName = type.type === 8 ? "快速" : (type.typeText[lang] || type.typeText.ja || "");
	}
	const displayName = (typeName + destText).trim();
	if (displayName) return displayName;
	if (daiya && daiya.name) return (daiya.name + destText).trim();
	return String(train.cbango || "");
}

function is_hidden_train_search_shinkansen(senku) {
	const value = String(senku || "");
	return value === "59" || value === "60";
}

function get_train_search_current_section(train, locationMasterData) {
	const pos = String((train && train.pos) || "");
	if (!pos || !locationMasterData || typeof locationMasterData !== "object") return "";
	const section = locationMasterData[pos];
	return typeof section === "string" ? section.trim() : "";
}

/*
 * HTMLエスケープ
 */
function resolve_train_search_type(type, name, typeData, cbango, senku) {
	if (String(senku || "") === "19") return "4";
	const resolvedType = String(type || "");
	if (resolvedType) return resolvedType;
	const normalizedCbango = normalize_train_search_cbango(cbango);
	if (normalizedCbango.endsWith("B")) return "4";
	const trainName = String(name || "");
	if (trainName && Array.isArray(typeData)) {
		let matchedType = "";
		let matchedLength = 0;
		typeData.forEach((row) => {
			if (!row) return;
			const labels = [];
			if (row.labelText) {
				if (row.labelText.ja) labels.push(String(row.labelText.ja));
				if (row.labelText[document.documentElement.dataset.lang]) labels.push(String(row.labelText[document.documentElement.dataset.lang]));
			}
			if (row.typeText) {
				if (row.typeText.ja) labels.push(String(row.typeText.ja));
				if (row.typeText[document.documentElement.dataset.lang]) labels.push(String(row.typeText[document.documentElement.dataset.lang]));
			}
			labels.forEach((label) => {
				if (!label || trainName.indexOf(label) < 0) return;
				if (label.length > matchedLength) {
					matchedType = String(row.type || "");
					matchedLength = label.length;
				}
			});
		});
		if (matchedType) return matchedType;
	}
	if (trainName.indexOf("特別快速") >= 0) return "5";
	if (trainName.indexOf("快速") >= 0) return "8";
	if (trainName.indexOf("普通") >= 0) return "3";
	return "";
}

function normalize_train_search_cbango(cbango) {
	const text = String(cbango || "").trim().toUpperCase();
	const match = text.match(/^0*(\d+)([A-Z]+)$/);
	if (!match) return text;
	return String(Number(match[1])) + match[2];
}

function escape_train_search_html(text) {
	return String(text || "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

/*
 * 列番検索を行う
 */
function run_train_number_search() {
	const digits = $("#trainSearchNumberInput").val().replace(/[^\d]/g, "");
	const suffix = String($("#trainSearchSuffixSelect").val() ?? "").toUpperCase();
	if (!digits) {
		render_train_search_results([], "列番を入力してください。", "列番を入力してください。");
		return;
	}
	const keyword = normalize_train_search_cbango(digits + suffix);
	load_train_search_data()
		.then((searchData) => {
			const results = searchData.trains.filter((train) => normalize_train_search_cbango(train.cbango) === keyword);
			render_train_search_results(results, "検索結果");
		})
		.catch(() => {
			render_train_search_results([], "検索データを取得できませんでした。", "検索データを取得できませんでした。");
		});
}

/*
 * 列車名検索を行う
 */
function run_train_name_search() {
	const selectedName = $("#trainSearchNameSelect").val();
	const goNumber = $("#trainSearchNameNumberInput").val().replace(/[^\d]/g, "");
	if (!selectedName) {
		render_train_search_results([], "列車名を選択してください。", "列車名を選択してください。");
		return;
	}
	load_train_search_data()
		.then((searchData) => {
			const results = searchData.trains.filter((train) => {
				if (train.baseName !== selectedName) return false;
				if (!goNumber) return true;
				return train.goNumber === goNumber;
			});
			if (!goNumber) {
				const groupedResults = {
					"\u4e0a\u308a\u5217\u8eca": [],
					"\u4e0b\u308a\u5217\u8eca": [],
					"\u305d\u306e\u4ed6": []
				};
				results.forEach((train) => {
					const goNumberValue = Number(train.goNumber || "");
					const cbangoNumber = Number(String(train.cbango || "").replace(/[^\d]/g, ""));
					const groupNumber = (!Number.isNaN(goNumberValue) && train.goNumber) ? goNumberValue : cbangoNumber;
					if (!Number.isNaN(groupNumber) && groupNumber > 0) {
						if (groupNumber % 2 === 0) groupedResults["\u4e0a\u308a\u5217\u8eca"].push(train);
						else groupedResults["\u4e0b\u308a\u5217\u8eca"].push(train);
						return;
					}
					groupedResults["\u305d\u306e\u4ed6"].push(train);
				});
				Object.keys(groupedResults).forEach((key) => {
					groupedResults[key].sort((a, b) => {
						const numA = Number(a.goNumber || String(a.cbango || "").replace(/[^\d]/g, "") || "9999");
						const numB = Number(b.goNumber || String(b.cbango || "").replace(/[^\d]/g, "") || "9999");
						return numA - numB;
					});
				});
				render_train_search_grouped_results(groupedResults, "\u691c\u7d22\u7d50\u679c");
				return;
			}
            render_train_search_results(results, "\u691c\u7d22\u7d50\u679c");
		})
		.catch(() => {
			render_train_search_results([], "検索データを取得できませんでした。", "検索データを取得できませんでした。");
		});
}

/*
 * 検索用文字列を正規化
 */
function normalize_train_search_text(text) {
	return String(text || "").toLowerCase().replace(/[\s\u3000]+/g, "");
}

/*
 * 列車検索結果を描画
 */
function split_train_search_result_name(name) {
	const text = String(name || "").trim();
	if (!text) return { "title": "", "destination": "" };
	const splitIndex = text.lastIndexOf(" ");
	if (splitIndex < 0) return { "title": text, "destination": "" };
	return {
		"title": text.slice(0, splitIndex).trim(),
		"destination": text.slice(splitIndex + 1).trim()
	};
}

function update_train_search_result_title_layout() {
	$("#trainSearchResult .search-result-title.has-number, #trainNumberListBody .search-result-title.has-number").each(function(_, row) {
		const title = $(row);
		title.removeClass("stacked");
		if (window.innerWidth > 480) return;
		const name = row.querySelector(".search-result-name");
		const number = row.querySelector(".search-result-number");
		if (!name || !number) return;
		const totalWidth = name.scrollWidth + number.offsetWidth + 6;
		if (totalWidth > row.clientWidth) {
			title.addClass("stacked");
		}
	});
}

function build_train_search_result_items(results) {
	let html = "";
	results.forEach(train => {
		const nameParts = split_train_search_result_name(train.name);
		const titleText = train.baseName || nameParts.title || train.name;
		const numberText = train.baseName && train.goNumber ? train.goNumber + "号" : "";
		const currentSection = train.currentSection && (train.isRunning || train.showStatusSection) ? train.currentSection : "";
		const cancellationType = get_cancelled_train_status_type(train);
		const statusClasses = [];
		if (train.status && train.status.indexOf("遅れ") >= 0) statusClasses.push("chien");
		if (cancellationType) statusClasses.push("cancelled-" + cancellationType);
		html += "<div class='express-train-contents train-search-result-item' cbango='" + escape_train_search_html(train.cbango) + "' type='" + escape_train_search_html(train.type) + "' value='" + escape_train_search_html(train.value) + "' data-running='" + (train.isRunning === false ? "0" : "1") + "'>";
		html += "<div class='search-result-main'>";
		html += "<span class='search-result-cbango'>" + escape_train_search_html(train.cbango) + "</span>";
		html += "<span class='search-result-title" + (numberText ? " has-number" : "") + "'>";
		html += "<span class='search-result-name'>" + escape_train_search_html(titleText) + "</span>";
		if (numberText) {
			html += "<span class='search-result-number'>" + escape_train_search_html(numberText) + "</span>";
		}
		html += "</span>";
		html += "<span class='search-result-destination'>" + escape_train_search_html(nameParts.destination) + "</span>";
		html += "</div>";
		html += "<span class='unkou-label" + (statusClasses.length ? " " + statusClasses.join(" ") : "") + "'>";
		html += "<span class='search-status-text'>" + escape_train_search_html(train.status || "") + "</span>";
		if (currentSection) {
			html += "<span class='search-status-section'>" + escape_train_search_html(currentSection) + "</span>";
		}
		html += "</span>";
		html += "</div>";
	});
	return html;
}

function get_cancelled_train_status_type(train) {
	if (!train) return "";
	if (train.cancellationStatusType === "full" || train.cancellationStatusType === "partial") return train.cancellationStatusType;
	if (train.detailTrain && train.detailTrain.status !== undefined && train.detailTrain.status !== null && train.detailTrain.status !== "") {
		const statusCode = Number(train.detailTrain.status);
		if (statusCode === 0) return "full";
		if (statusCode === 2) return "partial";
	}
	const statusText = String(train.status || "");
	if (statusText.indexOf("\u5168\u533a\u9593\u904b\u4f11") >= 0) return "full";
	if (statusText.indexOf("\u90e8\u5206\u904b\u4f11") >= 0) return "partial";
	return "";
}

function apply_cancelled_status_to_train_number_rows(trains) {
	if (!Array.isArray(trains) || !Array.isArray(cancelledTrainRows) || !cancelledTrainRows.length) return trains || [];
	const cancelledMap = new Map();
	cancelledTrainRows.forEach((train) => {
		if (!train || !train.cbango) return;
		cancelledMap.set(normalize_train_search_cbango(train.cbango), train);
	});
	return trains.map((train) => {
		const cancelledTrain = train && cancelledMap.get(normalize_train_search_cbango(train.cbango));
		if (!cancelledTrain) return train;
		return Object.assign({}, train, {
			"status": cancelledTrain.status,
			"currentSection": cancelledTrain.currentSection,
			"showStatusSection": true,
			"cancellationStatusType": get_cancelled_train_status_type(cancelledTrain)
		});
	});
}

function get_train_number_list_delay_minutes(train) {
	if (!train) return 0;
	const delayMinutes = Number(train.delayMinutes);
	if (Number.isFinite(delayMinutes) && delayMinutes > 0) return delayMinutes;
	const detailDelayMinutes = Number(train.detailTrain && train.detailTrain.chien);
	return Number.isFinite(detailDelayMinutes) && detailDelayMinutes > 0 ? detailDelayMinutes : 0;
}

function get_train_number_list_delay_text(delayMinutes) {
	const minutes = Math.max(0, Number(delayMinutes) || 0);
	if (minutes >= 999) return "大幅遅れ";
	const hours = Math.floor(minutes / 60);
	const remainingMinutes = minutes % 60;
	if (hours > 0 && remainingMinutes > 0) return hours + "時間" + remainingMinutes + "分遅れ";
	if (hours > 0) return hours + "時間遅れ";
	return minutes + "分遅れ";
}

function render_train_number_list(trains) {
	const rows = apply_cancelled_status_to_train_number_rows(Array.isArray(trains) ? trains : [])
		.slice()
		.sort((a, b) => normalize_train_search_cbango(a.cbango).localeCompare(normalize_train_search_cbango(b.cbango), "ja", { numeric: true }));

	const totalCount = trainNumberListRows.length;
	let countText = "取得件数：" + rows.length + "件";
	if (trainNumberListFilter === "running") countText = "走行中：" + rows.length + "件 / 全" + totalCount + "件";
	if (trainNumberListFilter === "delayed") {
		countText = "遅延列車：" + rows.length + "件 / 全" + totalCount + "件（" + trainNumberListDelayThreshold + "分以上";
		if (trainNumberListShowEndedDelayed) countText += "・走行終了を含む";
		countText += "）";
	}
	$("#trainNumberListInfo").text(countText);
	if (!rows.length) {
		const emptyMessage = trainNumberListFilter === "delayed" ?
			"設定したしきい値以上の遅延列車はありません。" :
			"取得した列番はありません。";
		$("#trainNumberListBody").html("<div class='train-search-empty'>" + emptyMessage + "</div>");
		return;
	}
	$("#trainNumberListBody").html(build_train_search_result_items(rows));
	update_train_search_result_title_layout();
}

function render_train_number_list_filtered() {
	$("#trainNumberListDetail .train-number-list-filter-btn").removeClass("active");
	$("#trainNumberListDetail .train-number-list-filter-btn[data-filter='" + trainNumberListFilter + "']").addClass("active");
	$("#trainNumberListDelayFilter").prop("hidden", trainNumberListFilter !== "delayed");
	let rows = trainNumberListRows;
	if (trainNumberListFilter === "running") {
		rows = trainNumberListRows.filter((train) => train && train.isRunning !== false);
	}
	if (trainNumberListFilter === "delayed") {
		rows = trainNumberListRows
			.filter((train) => {
				if (!trainNumberListShowEndedDelayed && train && train.isRunning === false) return false;
				return get_train_number_list_delay_minutes(train) >= trainNumberListDelayThreshold;
			})
			.map((train) => {
				if (String(train.status || "").indexOf("遅れ") >= 0) return train;
				return Object.assign({}, train, {
					"status": get_train_number_list_delay_text(get_train_number_list_delay_minutes(train))
				});
			});
	}
	render_train_number_list(rows);
}

function render_cancelled_train_list() {
	const rows = Array.isArray(cancelledTrainRows) ? cancelledTrainRows.slice() : [];
	rows.sort((a, b) => normalize_train_search_cbango(a.cbango).localeCompare(normalize_train_search_cbango(b.cbango), "ja", { numeric: true }));
	const summaryPrefix = cancelledTrainTestMode ? "\u3010\u30c6\u30b9\u30c8\u8868\u793a\u3011" : "";
	$("#trainNumberListInfo").text(summaryPrefix + get_cancelled_train_summary_text());
	if (!rows.length) {
		const message = cancelledTrainFailures.length ?
			"取得できた駅の範囲では、運休列車はありません。" :
			"現在、運休列車はありません。";
		$("#trainNumberListBody").html("<div class='train-search-empty'>" + message + "</div>");
		return;
	}
	$("#trainNumberListBody").html(build_train_search_result_items(rows));
	update_train_search_result_title_layout();
}

function render_train_search_results(results, headerText, emptyMessage) {
	$("#trainSearchResultInfo").text(headerText || "");
	if (!results.length) {
		$("#trainSearchResult").html("<div class='train-search-empty'>" + (emptyMessage || "該当する列車はありません。") + "</div>");
		return;
	}
	$(`#trainSearchResult`).html(build_train_search_result_items(results));
	update_train_search_result_title_layout();
}

function render_train_search_grouped_results(groupMap, headerText, emptyMessage) {
	$(`#trainSearchResultInfo`).text(headerText || "");
	const groupEntries = Object.entries(groupMap).filter(([, rows]) => rows && rows.length);
	if (!groupEntries.length) {
		$(`#trainSearchResult`).html("<div class='train-search-empty'>" + (emptyMessage || "該当する列車はありません。") + "</div>");
		return;
	}
	let html = "";
	groupEntries.forEach(([label, rows]) => {
		html += "<div class='train-search-group-label'>" + escape_train_search_html(label) + "</div>";
		html += build_train_search_result_items(rows);
	});
	$(`#trainSearchResult`).html(html);
	update_train_search_result_title_layout();
}

/*
 * rosen_xx.htmlに表記された地点コードの順に列車アイコンの表示を並び替える
 */
function ressha_pos_sort() {
	let resshaIconArray =  Array.from($("#stationList .ressha-icon"));
	// 列車が2つ以上ある地点を取得
	let result = resshaIconArray.filter((v) => v.childElementCount > 1);
	result.forEach(posArea => {
		// 並び替える基準となる地点コードをclassから取得
		let sortArray = Array.from(posArea.classList);
		// 並び替える対象の列車を取得
		let resshaArray =Array.from(posArea.childNodes);
		resshaArray.sort((a, b) => sortArray.indexOf(a.dataset.pos) - sortArray.indexOf(b.dataset.pos));
		// 下向き列車アイコンの並び替え
		resshaArray.filter((v) => v.className == "dummy").forEach(row => {
			resshaArray = resshaArray.splice(1);
			resshaArray.splice(2, 0, row);
		});
		// 列車を並び替え後のものに置き換える
		while(posArea.firstChild) {
			posArea.removeChild(posArea.firstChild);
		}
		for(const ressha of resshaArray) {
			posArea.appendChild(ressha);
		}
	});
}

/*
 * ページの最後が駅で終わっている路線（08、13）でサブフッターの表示があった場合、下に余白を追加する
 */
function eki_end_margin() {
	if ($(".sub-footer").height() <= 0) return;
	let paramRosen = get_param_rosen();
	let marginHeight = $(".sub-footer").height() + 10;
	if (paramRosen == "08") {
		// end-eki-sub-footer-marginが既に追加済みだった場合には高さのみを変更する
		if($(".end-eki-sub-footer-margin").length > 0) {
			$(".end-eki-sub-footer-margin").css("height", marginHeight + "px");
		} else {
			// 余白用のHTMLを追加する
			let add_html = document.createElement("div");
			add_html.className = "end-eki-sub-footer-margin";
			$(".eki-panel.eki.end").after(add_html);
			$(".end-eki-sub-footer-margin").css("height", marginHeight + "px");
		}
	}
	if (paramRosen == "13") {
		// 表示対象外エリアにサブフッター分の余白を追加する
		$(".eki-panel.non-service-area .hirendo-contents").css("padding", "8px 0 " + marginHeight + "px 0");
	}
}

/*
 * 画面更新判定処理
 */
function is_reload() {
	if (window.performance) {
		if (window.performance.getEntriesByType('navigation').length) {
			if (window.performance.getEntriesByType('navigation')[0].type === 'reload') {
				// 更新時
				return true;
			}
		}
	}
	return false;
}
