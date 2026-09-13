(function(root, factory) {
	if (typeof module === "object" && module.exports) module.exports = factory();
	else root.ToeiRoutes = factory();
}(typeof self !== "undefined" ? self : this, function() {
	"use strict";
	// 東京都交通局・公共交通オープンデータ協議会 (CC BY 4.0), ODPT Railway, 2026-09-07.
	return {
	"routes": [
		{
			"rosen": "140",
			"railway": "odpt.Railway:Toei.Asakusa",
			"name": "浅草線",
			"code": "A",
			"color": "#e85298",
			"ascending": "odpt.RailDirection:Northbound",
			"descending": "odpt.RailDirection:Southbound",
			"live": true,
			"stations": [
				{
					"id": "odpt.Station:Toei.Asakusa.NishiMagome",
					"name": "西馬込",
					"index": 1,
					"number": "A01"
				},
				{
					"id": "odpt.Station:Toei.Asakusa.Magome",
					"name": "馬込",
					"index": 2,
					"number": "A02"
				},
				{
					"id": "odpt.Station:Toei.Asakusa.Nakanobu",
					"name": "中延",
					"index": 3,
					"number": "A03"
				},
				{
					"id": "odpt.Station:Toei.Asakusa.Togoshi",
					"name": "戸越",
					"index": 4,
					"number": "A04"
				},
				{
					"id": "odpt.Station:Toei.Asakusa.Gotanda",
					"name": "五反田",
					"index": 5,
					"number": "A05"
				},
				{
					"id": "odpt.Station:Toei.Asakusa.Takanawadai",
					"name": "高輪台",
					"index": 6,
					"number": "A06"
				},
				{
					"id": "odpt.Station:Toei.Asakusa.Sengakuji",
					"name": "泉岳寺",
					"index": 7,
					"number": "A07"
				},
				{
					"id": "odpt.Station:Toei.Asakusa.Mita",
					"name": "三田",
					"index": 8,
					"number": "A08"
				},
				{
					"id": "odpt.Station:Toei.Asakusa.Daimon",
					"name": "大門",
					"index": 9,
					"number": "A09"
				},
				{
					"id": "odpt.Station:Toei.Asakusa.Shimbashi",
					"name": "新橋",
					"index": 10,
					"number": "A10"
				},
				{
					"id": "odpt.Station:Toei.Asakusa.HigashiGinza",
					"name": "東銀座",
					"index": 11,
					"number": "A11"
				},
				{
					"id": "odpt.Station:Toei.Asakusa.Takaracho",
					"name": "宝町",
					"index": 12,
					"number": "A12"
				},
				{
					"id": "odpt.Station:Toei.Asakusa.Nihombashi",
					"name": "日本橋",
					"index": 13,
					"number": "A13"
				},
				{
					"id": "odpt.Station:Toei.Asakusa.Ningyocho",
					"name": "人形町",
					"index": 14,
					"number": "A14"
				},
				{
					"id": "odpt.Station:Toei.Asakusa.HigashiNihombashi",
					"name": "東日本橋",
					"index": 15,
					"number": "A15"
				},
				{
					"id": "odpt.Station:Toei.Asakusa.Asakusabashi",
					"name": "浅草橋",
					"index": 16,
					"number": "A16"
				},
				{
					"id": "odpt.Station:Toei.Asakusa.Kuramae",
					"name": "蔵前",
					"index": 17,
					"number": "A17"
				},
				{
					"id": "odpt.Station:Toei.Asakusa.Asakusa",
					"name": "浅草",
					"index": 18,
					"number": "A18"
				},
				{
					"id": "odpt.Station:Toei.Asakusa.HonjoAzumabashi",
					"name": "本所吾妻橋",
					"index": 19,
					"number": "A19"
				},
				{
					"id": "odpt.Station:Toei.Asakusa.Oshiage",
					"name": "押上",
					"index": 20,
					"number": "A20"
				}
			]
		},
		{
			"rosen": "141",
			"railway": "odpt.Railway:Toei.Mita",
			"name": "三田線",
			"code": "I",
			"color": "#0079c2",
			"ascending": "odpt.RailDirection:Northbound",
			"descending": "odpt.RailDirection:Southbound",
			"live": true,
			"stations": [
				{
					"id": "odpt.Station:Toei.Mita.Meguro",
					"name": "目黒",
					"index": 1,
					"number": "I01"
				},
				{
					"id": "odpt.Station:Toei.Mita.Shirokanedai",
					"name": "白金台",
					"index": 2,
					"number": "I02"
				},
				{
					"id": "odpt.Station:Toei.Mita.ShirokaneTakanawa",
					"name": "白金高輪",
					"index": 3,
					"number": "I03"
				},
				{
					"id": "odpt.Station:Toei.Mita.Mita",
					"name": "三田",
					"index": 4,
					"number": "I04"
				},
				{
					"id": "odpt.Station:Toei.Mita.Shibakoen",
					"name": "芝公園",
					"index": 5,
					"number": "I05"
				},
				{
					"id": "odpt.Station:Toei.Mita.Onarimon",
					"name": "御成門",
					"index": 6,
					"number": "I06"
				},
				{
					"id": "odpt.Station:Toei.Mita.Uchisaiwaicho",
					"name": "内幸町",
					"index": 7,
					"number": "I07"
				},
				{
					"id": "odpt.Station:Toei.Mita.Hibiya",
					"name": "日比谷",
					"index": 8,
					"number": "I08"
				},
				{
					"id": "odpt.Station:Toei.Mita.Otemachi",
					"name": "大手町",
					"index": 9,
					"number": "I09"
				},
				{
					"id": "odpt.Station:Toei.Mita.Jimbocho",
					"name": "神保町",
					"index": 10,
					"number": "I10"
				},
				{
					"id": "odpt.Station:Toei.Mita.Suidobashi",
					"name": "水道橋",
					"index": 11,
					"number": "I11"
				},
				{
					"id": "odpt.Station:Toei.Mita.Kasuga",
					"name": "春日",
					"index": 12,
					"number": "I12"
				},
				{
					"id": "odpt.Station:Toei.Mita.Hakusan",
					"name": "白山",
					"index": 13,
					"number": "I13"
				},
				{
					"id": "odpt.Station:Toei.Mita.Sengoku",
					"name": "千石",
					"index": 14,
					"number": "I14"
				},
				{
					"id": "odpt.Station:Toei.Mita.Sugamo",
					"name": "巣鴨",
					"index": 15,
					"number": "I15"
				},
				{
					"id": "odpt.Station:Toei.Mita.NishiSugamo",
					"name": "西巣鴨",
					"index": 16,
					"number": "I16"
				},
				{
					"id": "odpt.Station:Toei.Mita.ShinItabashi",
					"name": "新板橋",
					"index": 17,
					"number": "I17"
				},
				{
					"id": "odpt.Station:Toei.Mita.ItabashiKuyakushomae",
					"name": "板橋区役所前",
					"index": 18,
					"number": "I18"
				},
				{
					"id": "odpt.Station:Toei.Mita.Itabashihoncho",
					"name": "板橋本町",
					"index": 19,
					"number": "I19"
				},
				{
					"id": "odpt.Station:Toei.Mita.Motohasunuma",
					"name": "本蓮沼",
					"index": 20,
					"number": "I20"
				},
				{
					"id": "odpt.Station:Toei.Mita.ShimuraSakaue",
					"name": "志村坂上",
					"index": 21,
					"number": "I21"
				},
				{
					"id": "odpt.Station:Toei.Mita.ShimuraSanchome",
					"name": "志村三丁目",
					"index": 22,
					"number": "I22"
				},
				{
					"id": "odpt.Station:Toei.Mita.Hasune",
					"name": "蓮根",
					"index": 23,
					"number": "I23"
				},
				{
					"id": "odpt.Station:Toei.Mita.Nishidai",
					"name": "西台",
					"index": 24,
					"number": "I24"
				},
				{
					"id": "odpt.Station:Toei.Mita.Takashimadaira",
					"name": "高島平",
					"index": 25,
					"number": "I25"
				},
				{
					"id": "odpt.Station:Toei.Mita.ShinTakashimadaira",
					"name": "新高島平",
					"index": 26,
					"number": "I26"
				},
				{
					"id": "odpt.Station:Toei.Mita.NishiTakashimadaira",
					"name": "西高島平",
					"index": 27,
					"number": "I27"
				}
			]
		},
		{
			"rosen": "142",
			"railway": "odpt.Railway:Toei.Shinjuku",
			"name": "新宿線",
			"code": "S",
			"color": "#6cbb5a",
			"ascending": "odpt.RailDirection:Eastbound",
			"descending": "odpt.RailDirection:Westbound",
			"live": true,
			"stations": [
				{
					"id": "odpt.Station:Toei.Shinjuku.Shinjuku",
					"name": "新宿",
					"index": 1,
					"number": "S01"
				},
				{
					"id": "odpt.Station:Toei.Shinjuku.ShinjukuSanchome",
					"name": "新宿三丁目",
					"index": 2,
					"number": "S02"
				},
				{
					"id": "odpt.Station:Toei.Shinjuku.Akebonobashi",
					"name": "曙橋",
					"index": 3,
					"number": "S03"
				},
				{
					"id": "odpt.Station:Toei.Shinjuku.Ichigaya",
					"name": "市ヶ谷",
					"index": 4,
					"number": "S04"
				},
				{
					"id": "odpt.Station:Toei.Shinjuku.Kudanshita",
					"name": "九段下",
					"index": 5,
					"number": "S05"
				},
				{
					"id": "odpt.Station:Toei.Shinjuku.Jimbocho",
					"name": "神保町",
					"index": 6,
					"number": "S06"
				},
				{
					"id": "odpt.Station:Toei.Shinjuku.Ogawamachi",
					"name": "小川町",
					"index": 7,
					"number": "S07"
				},
				{
					"id": "odpt.Station:Toei.Shinjuku.Iwamotocho",
					"name": "岩本町",
					"index": 8,
					"number": "S08"
				},
				{
					"id": "odpt.Station:Toei.Shinjuku.BakuroYokoyama",
					"name": "馬喰横山",
					"index": 9,
					"number": "S09"
				},
				{
					"id": "odpt.Station:Toei.Shinjuku.Hamacho",
					"name": "浜町",
					"index": 10,
					"number": "S10"
				},
				{
					"id": "odpt.Station:Toei.Shinjuku.Morishita",
					"name": "森下",
					"index": 11,
					"number": "S11"
				},
				{
					"id": "odpt.Station:Toei.Shinjuku.Kikukawa",
					"name": "菊川",
					"index": 12,
					"number": "S12"
				},
				{
					"id": "odpt.Station:Toei.Shinjuku.Sumiyoshi",
					"name": "住吉",
					"index": 13,
					"number": "S13"
				},
				{
					"id": "odpt.Station:Toei.Shinjuku.NishiOjima",
					"name": "西大島",
					"index": 14,
					"number": "S14"
				},
				{
					"id": "odpt.Station:Toei.Shinjuku.Ojima",
					"name": "大島",
					"index": 15,
					"number": "S15"
				},
				{
					"id": "odpt.Station:Toei.Shinjuku.HigashiOjima",
					"name": "東大島",
					"index": 16,
					"number": "S16"
				},
				{
					"id": "odpt.Station:Toei.Shinjuku.Funabori",
					"name": "船堀",
					"index": 17,
					"number": "S17"
				},
				{
					"id": "odpt.Station:Toei.Shinjuku.Ichinoe",
					"name": "一之江",
					"index": 18,
					"number": "S18"
				},
				{
					"id": "odpt.Station:Toei.Shinjuku.Mizue",
					"name": "瑞江",
					"index": 19,
					"number": "S19"
				},
				{
					"id": "odpt.Station:Toei.Shinjuku.Shinozaki",
					"name": "篠崎",
					"index": 20,
					"number": "S20"
				},
				{
					"id": "odpt.Station:Toei.Shinjuku.Motoyawata",
					"name": "本八幡",
					"index": 21,
					"number": "S21"
				}
			]
		},
		{
			"rosen": "143",
			"railway": "odpt.Railway:Toei.Oedo",
			"name": "大江戸線",
			"code": "E",
			"color": "#b6007a",
			"ascending": "odpt.RailDirection:OuterLoop",
			"descending": "odpt.RailDirection:InnerLoop",
			"live": true,
			"stations": [
				{
					"id": "odpt.Station:Toei.Oedo.Tochomae",
					"name": "都庁前",
					"index": 1,
					"number": "E28"
				},
				{
					"id": "odpt.Station:Toei.Oedo.ShinjukuNishiguchi",
					"name": "新宿西口",
					"index": 2,
					"number": "E01"
				},
				{
					"id": "odpt.Station:Toei.Oedo.HigashiShinjuku",
					"name": "東新宿",
					"index": 3,
					"number": "E02"
				},
				{
					"id": "odpt.Station:Toei.Oedo.WakamatsuKawada",
					"name": "若松河田",
					"index": 4,
					"number": "E03"
				},
				{
					"id": "odpt.Station:Toei.Oedo.UshigomeYanagicho",
					"name": "牛込柳町",
					"index": 5,
					"number": "E04"
				},
				{
					"id": "odpt.Station:Toei.Oedo.UshigomeKagurazaka",
					"name": "牛込神楽坂",
					"index": 6,
					"number": "E05"
				},
				{
					"id": "odpt.Station:Toei.Oedo.Iidabashi",
					"name": "飯田橋",
					"index": 7,
					"number": "E06"
				},
				{
					"id": "odpt.Station:Toei.Oedo.Kasuga",
					"name": "春日",
					"index": 8,
					"number": "E07"
				},
				{
					"id": "odpt.Station:Toei.Oedo.HongoSanchome",
					"name": "本郷三丁目",
					"index": 9,
					"number": "E08"
				},
				{
					"id": "odpt.Station:Toei.Oedo.UenoOkachimachi",
					"name": "上野御徒町",
					"index": 10,
					"number": "E09"
				},
				{
					"id": "odpt.Station:Toei.Oedo.ShinOkachimachi",
					"name": "新御徒町",
					"index": 11,
					"number": "E10"
				},
				{
					"id": "odpt.Station:Toei.Oedo.Kuramae",
					"name": "蔵前",
					"index": 12,
					"number": "E11"
				},
				{
					"id": "odpt.Station:Toei.Oedo.Ryogoku",
					"name": "両国",
					"index": 13,
					"number": "E12"
				},
				{
					"id": "odpt.Station:Toei.Oedo.Morishita",
					"name": "森下",
					"index": 14,
					"number": "E13"
				},
				{
					"id": "odpt.Station:Toei.Oedo.KiyosumiShirakawa",
					"name": "清澄白河",
					"index": 15,
					"number": "E14"
				},
				{
					"id": "odpt.Station:Toei.Oedo.MonzenNakacho",
					"name": "門前仲町",
					"index": 16,
					"number": "E15"
				},
				{
					"id": "odpt.Station:Toei.Oedo.Tsukishima",
					"name": "月島",
					"index": 17,
					"number": "E16"
				},
				{
					"id": "odpt.Station:Toei.Oedo.Kachidoki",
					"name": "勝どき",
					"index": 18,
					"number": "E17"
				},
				{
					"id": "odpt.Station:Toei.Oedo.Tsukijishijo",
					"name": "築地市場",
					"index": 19,
					"number": "E18"
				},
				{
					"id": "odpt.Station:Toei.Oedo.Shiodome",
					"name": "汐留",
					"index": 20,
					"number": "E19"
				},
				{
					"id": "odpt.Station:Toei.Oedo.Daimon",
					"name": "大門",
					"index": 21,
					"number": "E20"
				},
				{
					"id": "odpt.Station:Toei.Oedo.Akabanebashi",
					"name": "赤羽橋",
					"index": 22,
					"number": "E21"
				},
				{
					"id": "odpt.Station:Toei.Oedo.AzabuJuban",
					"name": "麻布十番",
					"index": 23,
					"number": "E22"
				},
				{
					"id": "odpt.Station:Toei.Oedo.Roppongi",
					"name": "六本木",
					"index": 24,
					"number": "E23"
				},
				{
					"id": "odpt.Station:Toei.Oedo.AoyamaItchome",
					"name": "青山一丁目",
					"index": 25,
					"number": "E24"
				},
				{
					"id": "odpt.Station:Toei.Oedo.KokuritsuKyogijo",
					"name": "国立競技場",
					"index": 26,
					"number": "E25"
				},
				{
					"id": "odpt.Station:Toei.Oedo.Yoyogi",
					"name": "代々木",
					"index": 27,
					"number": "E26"
				},
				{
					"id": "odpt.Station:Toei.Oedo.Shinjuku",
					"name": "新宿",
					"index": 28,
					"number": "E27"
				},
				{
					"id": "odpt.Station:Toei.Oedo.Tochomae",
					"name": "都庁前",
					"index": 29,
					"number": "E28"
				},
				{
					"id": "odpt.Station:Toei.Oedo.NishiShinjukuGochome",
					"name": "西新宿五丁目",
					"index": 30,
					"number": "E29"
				},
				{
					"id": "odpt.Station:Toei.Oedo.NakanoSakaue",
					"name": "中野坂上",
					"index": 31,
					"number": "E30"
				},
				{
					"id": "odpt.Station:Toei.Oedo.HigashiNakano",
					"name": "東中野",
					"index": 32,
					"number": "E31"
				},
				{
					"id": "odpt.Station:Toei.Oedo.Nakai",
					"name": "中井",
					"index": 33,
					"number": "E32"
				},
				{
					"id": "odpt.Station:Toei.Oedo.OchiaiMinamiNagasaki",
					"name": "落合南長崎",
					"index": 34,
					"number": "E33"
				},
				{
					"id": "odpt.Station:Toei.Oedo.ShinEgota",
					"name": "新江古田",
					"index": 35,
					"number": "E34"
				},
				{
					"id": "odpt.Station:Toei.Oedo.Nerima",
					"name": "練馬",
					"index": 36,
					"number": "E35"
				},
				{
					"id": "odpt.Station:Toei.Oedo.Toshimaen",
					"name": "豊島園",
					"index": 37,
					"number": "E36"
				},
				{
					"id": "odpt.Station:Toei.Oedo.NerimaKasugacho",
					"name": "練馬春日町",
					"index": 38,
					"number": "E37"
				},
				{
					"id": "odpt.Station:Toei.Oedo.Hikarigaoka",
					"name": "光が丘",
					"index": 39,
					"number": "E38"
				}
			]
		},
		{
			"rosen": "144",
			"railway": "odpt.Railway:Toei.Arakawa",
			"name": "東京さくらトラム（都電荒川線）",
			"code": "SA",
			"color": "#e6a000",
			"ascending": "odpt.RailDirection:Toei.Waseda",
			"descending": "odpt.RailDirection:Toei.Minowabashi",
			"live": true,
			"stations": [
				{
					"id": "odpt.Station:Toei.Arakawa.Minowabashi",
					"name": "三ノ輪橋",
					"index": 1,
					"number": "SA01"
				},
				{
					"id": "odpt.Station:Toei.Arakawa.ArakawaItchumae",
					"name": "荒川一中前",
					"index": 2,
					"number": "SA02"
				},
				{
					"id": "odpt.Station:Toei.Arakawa.Arakawakuyakushomae",
					"name": "荒川区役所前",
					"index": 3,
					"number": "SA03"
				},
				{
					"id": "odpt.Station:Toei.Arakawa.ArakawaNichome",
					"name": "荒川二丁目",
					"index": 4,
					"number": "SA04"
				},
				{
					"id": "odpt.Station:Toei.Arakawa.ArakawaNanachome",
					"name": "荒川七丁目",
					"index": 5,
					"number": "SA05"
				},
				{
					"id": "odpt.Station:Toei.Arakawa.MachiyaEkimae",
					"name": "町屋駅前",
					"index": 6,
					"number": "SA06"
				},
				{
					"id": "odpt.Station:Toei.Arakawa.MachiyaNichome",
					"name": "町屋二丁目",
					"index": 7,
					"number": "SA07"
				},
				{
					"id": "odpt.Station:Toei.Arakawa.HigashiOguSanchome",
					"name": "東尾久三丁目",
					"index": 8,
					"number": "SA08"
				},
				{
					"id": "odpt.Station:Toei.Arakawa.Kumanomae",
					"name": "熊野前",
					"index": 9,
					"number": "SA09"
				},
				{
					"id": "odpt.Station:Toei.Arakawa.Miyanomae",
					"name": "宮ノ前",
					"index": 10,
					"number": "SA10"
				},
				{
					"id": "odpt.Station:Toei.Arakawa.Odai",
					"name": "小台",
					"index": 11,
					"number": "SA11"
				},
				{
					"id": "odpt.Station:Toei.Arakawa.ArakawaYuenchimae",
					"name": "荒川遊園地前",
					"index": 12,
					"number": "SA12"
				},
				{
					"id": "odpt.Station:Toei.Arakawa.ArakawaShakomae",
					"name": "荒川車庫前",
					"index": 13,
					"number": "SA13"
				},
				{
					"id": "odpt.Station:Toei.Arakawa.Kajiwara",
					"name": "梶原",
					"index": 14,
					"number": "SA14"
				},
				{
					"id": "odpt.Station:Toei.Arakawa.Sakaecho",
					"name": "栄町",
					"index": 15,
					"number": "SA15"
				},
				{
					"id": "odpt.Station:Toei.Arakawa.OjiEkimae",
					"name": "王子駅前",
					"index": 16,
					"number": "SA16"
				},
				{
					"id": "odpt.Station:Toei.Arakawa.Asukayama",
					"name": "飛鳥山",
					"index": 17,
					"number": "SA17"
				},
				{
					"id": "odpt.Station:Toei.Arakawa.TakinogawaItchome",
					"name": "滝野川一丁目",
					"index": 18,
					"number": "SA18"
				},
				{
					"id": "odpt.Station:Toei.Arakawa.NishigaharaYonchome",
					"name": "西ヶ原四丁目",
					"index": 19,
					"number": "SA19"
				},
				{
					"id": "odpt.Station:Toei.Arakawa.ShinKoshinzuka",
					"name": "新庚申塚",
					"index": 20,
					"number": "SA20"
				},
				{
					"id": "odpt.Station:Toei.Arakawa.Koshinzuka",
					"name": "庚申塚",
					"index": 21,
					"number": "SA21"
				},
				{
					"id": "odpt.Station:Toei.Arakawa.Sugamoshinden",
					"name": "巣鴨新田",
					"index": 22,
					"number": "SA22"
				},
				{
					"id": "odpt.Station:Toei.Arakawa.OtsukaEkimae",
					"name": "大塚駅前",
					"index": 23,
					"number": "SA23"
				},
				{
					"id": "odpt.Station:Toei.Arakawa.Mukohara",
					"name": "向原",
					"index": 24,
					"number": "SA24"
				},
				{
					"id": "odpt.Station:Toei.Arakawa.HigashiIkebukuroYonchome",
					"name": "東池袋四丁目",
					"index": 25,
					"number": "SA25"
				},
				{
					"id": "odpt.Station:Toei.Arakawa.TodenZoshigaya",
					"name": "都電雑司ヶ谷",
					"index": 26,
					"number": "SA26"
				},
				{
					"id": "odpt.Station:Toei.Arakawa.Kishibojimmae",
					"name": "鬼子母神前",
					"index": 27,
					"number": "SA27"
				},
				{
					"id": "odpt.Station:Toei.Arakawa.Gakushuinshita",
					"name": "学習院下",
					"index": 28,
					"number": "SA28"
				},
				{
					"id": "odpt.Station:Toei.Arakawa.Omokagebashi",
					"name": "面影橋",
					"index": 29,
					"number": "SA29"
				},
				{
					"id": "odpt.Station:Toei.Arakawa.Waseda",
					"name": "早稲田",
					"index": 30,
					"number": "SA30"
				}
			]
		},
		{
			"rosen": "145",
			"railway": "odpt.Railway:Toei.NipporiToneri",
			"name": "日暮里・舎人ライナー",
			"code": "NT",
			"color": "#b6007a",
			"ascending": "odpt.RailDirection:Outbound",
			"descending": "odpt.RailDirection:Inbound",
			"live": false,
			"stations": [
				{
					"id": "odpt.Station:Toei.NipporiToneri.Nippori",
					"name": "日暮里",
					"index": 1,
					"number": "NT01"
				},
				{
					"id": "odpt.Station:Toei.NipporiToneri.NishiNippori",
					"name": "西日暮里",
					"index": 2,
					"number": "NT02"
				},
				{
					"id": "odpt.Station:Toei.NipporiToneri.AkadoShogakkomae",
					"name": "赤土小学校前",
					"index": 3,
					"number": "NT03"
				},
				{
					"id": "odpt.Station:Toei.NipporiToneri.Kumanomae",
					"name": "熊野前",
					"index": 4,
					"number": "NT04"
				},
				{
					"id": "odpt.Station:Toei.NipporiToneri.AdachiOdai",
					"name": "足立小台",
					"index": 5,
					"number": "NT05"
				},
				{
					"id": "odpt.Station:Toei.NipporiToneri.OgiOhashi",
					"name": "扇大橋",
					"index": 6,
					"number": "NT06"
				},
				{
					"id": "odpt.Station:Toei.NipporiToneri.Koya",
					"name": "高野",
					"index": 7,
					"number": "NT07"
				},
				{
					"id": "odpt.Station:Toei.NipporiToneri.Kohoku",
					"name": "江北",
					"index": 8,
					"number": "NT08"
				},
				{
					"id": "odpt.Station:Toei.NipporiToneri.NishiaraidaishiNishi",
					"name": "西新井大師西",
					"index": 9,
					"number": "NT09"
				},
				{
					"id": "odpt.Station:Toei.NipporiToneri.Yazaike",
					"name": "谷在家",
					"index": 10,
					"number": "NT10"
				},
				{
					"id": "odpt.Station:Toei.NipporiToneri.ToneriKoen",
					"name": "舎人公園",
					"index": 11,
					"number": "NT11"
				},
				{
					"id": "odpt.Station:Toei.NipporiToneri.Toneri",
					"name": "舎人",
					"index": 12,
					"number": "NT12"
				},
				{
					"id": "odpt.Station:Toei.NipporiToneri.MinumadaiShinsuikoen",
					"name": "見沼代親水公園",
					"index": 13,
					"number": "NT13"
				}
			]
		}
	],
	"types": {
		"odpt.TrainType:Toei.AccessExpress": "アクセス特急",
		"odpt.TrainType:Toei.AirportRapidLimitedExpress": "エアポート快特",
		"odpt.TrainType:Toei.CommuterLimitedExpress": "通勤特急",
		"odpt.TrainType:Toei.Express": "急行",
		"odpt.TrainType:Toei.LimitedExpress": "特急",
		"odpt.TrainType:Toei.Local": "普通",
		"odpt.TrainType:Toei.RapidLimitedExpress": "快特",
		"odpt.TrainType:Toei.Rapid": "快速"
	}
};
}));

