(function(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.KeikyuRoutes = factory();
}(typeof self !== 'undefined' ? self : this, function() {
  return {
  "routes": [
    {
      "rosen": "146",
      "railway": "odpt.Railway:Keikyu.Main",
      "name": "京急本線",
      "color": "#e60012",
      "code": "KK",
      "live": true,
      "ascending": "odpt.RailDirection:Outbound",
      "descending": "odpt.RailDirection:Inbound",
      "stations": [
        {
          "id": "odpt.Station:Keikyu.Main.Shinagawa",
          "name": "品川",
          "index": 1
        },
        {
          "id": "odpt.Station:Keikyu.Main.Kitashinagawa",
          "name": "北品川",
          "index": 2
        },
        {
          "id": "odpt.Station:Keikyu.Main.Shimbamba",
          "name": "新馬場",
          "index": 3
        },
        {
          "id": "odpt.Station:Keikyu.Main.AomonoYokocho",
          "name": "青物横丁",
          "index": 4
        },
        {
          "id": "odpt.Station:Keikyu.Main.Samezu",
          "name": "鮫洲",
          "index": 5
        },
        {
          "id": "odpt.Station:Keikyu.Main.Tachiaigawa",
          "name": "立会川",
          "index": 6
        },
        {
          "id": "odpt.Station:Keikyu.Main.Omorikaigan",
          "name": "大森海岸",
          "index": 7
        },
        {
          "id": "odpt.Station:Keikyu.Main.Heiwajima",
          "name": "平和島",
          "index": 8
        },
        {
          "id": "odpt.Station:Keikyu.Main.Omorimachi",
          "name": "大森町",
          "index": 9
        },
        {
          "id": "odpt.Station:Keikyu.Main.Umeyashiki",
          "name": "梅屋敷",
          "index": 10
        },
        {
          "id": "odpt.Station:Keikyu.Main.KeikyuKamata",
          "name": "京急蒲田",
          "index": 11
        },
        {
          "id": "odpt.Station:Keikyu.Main.Zoshiki",
          "name": "雑色",
          "index": 12
        },
        {
          "id": "odpt.Station:Keikyu.Main.Rokugodote",
          "name": "六郷土手",
          "index": 13
        },
        {
          "id": "odpt.Station:Keikyu.Main.KeikyuKawasaki",
          "name": "京急川崎",
          "index": 14
        },
        {
          "id": "odpt.Station:Keikyu.Main.HatchoNawate",
          "name": "八丁畷",
          "index": 15
        },
        {
          "id": "odpt.Station:Keikyu.Main.TsurumiIchiba",
          "name": "鶴見市場",
          "index": 16
        },
        {
          "id": "odpt.Station:Keikyu.Main.KeikyuTsurumi",
          "name": "京急鶴見",
          "index": 17
        },
        {
          "id": "odpt.Station:Keikyu.Main.Kagetsusojiji",
          "name": "花月総持寺",
          "index": 18
        },
        {
          "id": "odpt.Station:Keikyu.Main.Namamugi",
          "name": "生麦",
          "index": 19
        },
        {
          "id": "odpt.Station:Keikyu.Main.KeikyuShinkoyasu",
          "name": "京急新子安",
          "index": 20
        },
        {
          "id": "odpt.Station:Keikyu.Main.Koyasu",
          "name": "子安",
          "index": 21
        },
        {
          "id": "odpt.Station:Keikyu.Main.KanagawaShimmachi",
          "name": "神奈川新町",
          "index": 22
        },
        {
          "id": "odpt.Station:Keikyu.Main.KeikyuHigashikanagawa",
          "name": "京急東神奈川",
          "index": 23
        },
        {
          "id": "odpt.Station:Keikyu.Main.Kanagawa",
          "name": "神奈川",
          "index": 24
        },
        {
          "id": "odpt.Station:Keikyu.Main.Yokohama",
          "name": "横浜",
          "index": 25
        },
        {
          "id": "odpt.Station:Keikyu.Main.Tobe",
          "name": "戸部",
          "index": 26
        },
        {
          "id": "odpt.Station:Keikyu.Main.Hinodecho",
          "name": "日ノ出町",
          "index": 27
        },
        {
          "id": "odpt.Station:Keikyu.Main.Koganecho",
          "name": "黄金町",
          "index": 28
        },
        {
          "id": "odpt.Station:Keikyu.Main.Minamiota",
          "name": "南太田",
          "index": 29
        },
        {
          "id": "odpt.Station:Keikyu.Main.Idogaya",
          "name": "井土ヶ谷",
          "index": 30
        },
        {
          "id": "odpt.Station:Keikyu.Main.Gumyoji",
          "name": "弘明寺",
          "index": 31
        },
        {
          "id": "odpt.Station:Keikyu.Main.Kamiooka",
          "name": "上大岡",
          "index": 32
        },
        {
          "id": "odpt.Station:Keikyu.Main.Byobugaura",
          "name": "屏風浦",
          "index": 33
        },
        {
          "id": "odpt.Station:Keikyu.Main.Sugita",
          "name": "杉田",
          "index": 34
        },
        {
          "id": "odpt.Station:Keikyu.Main.KeikyuTomioka",
          "name": "京急富岡",
          "index": 35
        },
        {
          "id": "odpt.Station:Keikyu.Main.Nokendai",
          "name": "能見台",
          "index": 36
        },
        {
          "id": "odpt.Station:Keikyu.Main.KanazawaBunko",
          "name": "金沢文庫",
          "index": 37
        },
        {
          "id": "odpt.Station:Keikyu.Main.KanazawaHakkei",
          "name": "金沢八景",
          "index": 38
        },
        {
          "id": "odpt.Station:Keikyu.Main.Oppama",
          "name": "追浜",
          "index": 39
        },
        {
          "id": "odpt.Station:Keikyu.Main.KeikyuTaura",
          "name": "京急田浦",
          "index": 40
        },
        {
          "id": "odpt.Station:Keikyu.Main.Anjinzuka",
          "name": "安針塚",
          "index": 41
        },
        {
          "id": "odpt.Station:Keikyu.Main.Hemi",
          "name": "逸見",
          "index": 42
        },
        {
          "id": "odpt.Station:Keikyu.Main.Shioiri",
          "name": "汐入",
          "index": 43
        },
        {
          "id": "odpt.Station:Keikyu.Main.YokosukaChuo",
          "name": "横須賀中央",
          "index": 44
        },
        {
          "id": "odpt.Station:Keikyu.Main.Kenritsudaigaku",
          "name": "県立大学",
          "index": 45
        },
        {
          "id": "odpt.Station:Keikyu.Main.Horinouchi",
          "name": "堀ノ内",
          "index": 46
        },
        {
          "id": "odpt.Station:Keikyu.Main.KeikyuOtsu",
          "name": "京急大津",
          "index": 47
        },
        {
          "id": "odpt.Station:Keikyu.Main.Maborikaigan",
          "name": "馬堀海岸",
          "index": 48
        },
        {
          "id": "odpt.Station:Keikyu.Main.Uraga",
          "name": "浦賀",
          "index": 49
        }
      ]
    },
    {
      "rosen": "147",
      "railway": "odpt.Railway:Keikyu.Airport",
      "name": "空港線",
      "color": "#e60012",
      "code": "KK",
      "live": true,
      "ascending": "odpt.RailDirection:Outbound",
      "descending": "odpt.RailDirection:Inbound",
      "stations": [
        {
          "id": "odpt.Station:Keikyu.Airport.KeikyuKamata",
          "name": "京急蒲田",
          "index": 1
        },
        {
          "id": "odpt.Station:Keikyu.Airport.Kojiya",
          "name": "糀谷",
          "index": 2
        },
        {
          "id": "odpt.Station:Keikyu.Airport.Otorii",
          "name": "大鳥居",
          "index": 3
        },
        {
          "id": "odpt.Station:Keikyu.Airport.AnamoriInari",
          "name": "穴守稲荷",
          "index": 4
        },
        {
          "id": "odpt.Station:Keikyu.Airport.Tenkubashi",
          "name": "天空橋",
          "index": 5
        },
        {
          "id": "odpt.Station:Keikyu.Airport.HanedaAirportTerminal3",
          "name": "羽田空港第３ターミナル",
          "index": 6
        },
        {
          "id": "odpt.Station:Keikyu.Airport.HanedaAirportTerminal1and2",
          "name": "羽田空港第１・第２ターミナル",
          "index": 7
        }
      ]
    },
    {
      "rosen": "148",
      "railway": "odpt.Railway:Keikyu.Daishi",
      "name": "大師線",
      "color": "#e60012",
      "code": "KK",
      "live": true,
      "ascending": "odpt.RailDirection:Outbound",
      "descending": "odpt.RailDirection:Inbound",
      "stations": [
        {
          "id": "odpt.Station:Keikyu.Daishi.KeikyuKawasaki",
          "name": "京急川崎",
          "index": 1
        },
        {
          "id": "odpt.Station:Keikyu.Daishi.Minatocho",
          "name": "港町",
          "index": 2
        },
        {
          "id": "odpt.Station:Keikyu.Daishi.Suzukicho",
          "name": "鈴木町",
          "index": 3
        },
        {
          "id": "odpt.Station:Keikyu.Daishi.Kawasakidaishi",
          "name": "川崎大師",
          "index": 4
        },
        {
          "id": "odpt.Station:Keikyu.Daishi.Higashimonzen",
          "name": "東門前",
          "index": 5
        },
        {
          "id": "odpt.Station:Keikyu.Daishi.Daishibashi",
          "name": "大師橋",
          "index": 6
        },
        {
          "id": "odpt.Station:Keikyu.Daishi.Kojimashinden",
          "name": "小島新田",
          "index": 7
        }
      ]
    },
    {
      "rosen": "149",
      "railway": "odpt.Railway:Keikyu.Zushi",
      "name": "逗子線",
      "color": "#e60012",
      "code": "KK",
      "live": true,
      "ascending": "odpt.RailDirection:Outbound",
      "descending": "odpt.RailDirection:Inbound",
      "stations": [
        {
          "id": "odpt.Station:Keikyu.Zushi.KanazawaHakkei",
          "name": "金沢八景",
          "index": 1
        },
        {
          "id": "odpt.Station:Keikyu.Zushi.Mutsuura",
          "name": "六浦",
          "index": 2
        },
        {
          "id": "odpt.Station:Keikyu.Zushi.Jimmuji",
          "name": "神武寺",
          "index": 3
        },
        {
          "id": "odpt.Station:Keikyu.Zushi.ZushiHayama",
          "name": "逗子・葉山",
          "index": 4
        }
      ]
    },
    {
      "rosen": "150",
      "railway": "odpt.Railway:Keikyu.Kurihama",
      "name": "久里浜線",
      "color": "#e60012",
      "code": "KK",
      "live": true,
      "ascending": "odpt.RailDirection:Outbound",
      "descending": "odpt.RailDirection:Inbound",
      "stations": [
        {
          "id": "odpt.Station:Keikyu.Kurihama.Horinouchi",
          "name": "堀ノ内",
          "index": 1
        },
        {
          "id": "odpt.Station:Keikyu.Kurihama.Shinotsu",
          "name": "新大津",
          "index": 2
        },
        {
          "id": "odpt.Station:Keikyu.Kurihama.Kitakurihama",
          "name": "北久里浜",
          "index": 3
        },
        {
          "id": "odpt.Station:Keikyu.Kurihama.KeikyuKurihama",
          "name": "京急久里浜",
          "index": 4
        },
        {
          "id": "odpt.Station:Keikyu.Kurihama.YrpNobi",
          "name": "YRP野比",
          "index": 5
        },
        {
          "id": "odpt.Station:Keikyu.Kurihama.KeikyuNagasawa",
          "name": "京急長沢",
          "index": 6
        },
        {
          "id": "odpt.Station:Keikyu.Kurihama.Tsukuihama",
          "name": "津久井浜",
          "index": 7
        },
        {
          "id": "odpt.Station:Keikyu.Kurihama.Miurakaigan",
          "name": "三浦海岸",
          "index": 8
        },
        {
          "id": "odpt.Station:Keikyu.Kurihama.Misakiguchi",
          "name": "三崎口",
          "index": 9
        }
      ]
    }
  ],
  "types": {
    "odpt.TrainType:Keikyu.AccessExpress": "アクセス特急",
    "odpt.TrainType:Keikyu.AirportRapidLimitedExpress": "エアポート快特",
    "odpt.TrainType:Keikyu.CommuterLimitedExpress": "通勤特急",
    "odpt.TrainType:Keikyu.EveningWing": "イブニング・ウィング",
    "odpt.TrainType:Keikyu.Express": "急行",
    "odpt.TrainType:Keikyu.LimitedExpress": "特急",
    "odpt.TrainType:Keikyu.Local": "普通",
    "odpt.TrainType:Keikyu.MorningWing": "モーニング・ウィング",
    "odpt.TrainType:Keikyu.RapidLimitedExpress": "快特",
    "odpt.TrainType:Keikyu.Rapid": "快速"
  }
};
}));

