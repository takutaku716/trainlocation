# 京成線の走行位置

## 対象

公式ページ: https://zaisen.tid-keisei.jp/html/select.html

| 路線ID | 路線 |
| --- | --- |
| 152 | 京成本線 |
| 153 | 東成田線・芝山鉄道線 |
| 154 | 成田スカイアクセス線・北総線 |
| 155 | 押上線 |
| 156 | 金町線 |
| 157 | 千葉線・千原線 |
| 158 | 松戸線 |

## 取得と描画

- 京成は公式の `/data/traffic_info.json` のTS（駅）とEK（駅間）を使用する。
- 松戸線は `/data/matsudo_train_info.json`、`matsudo_date.json`、`matsudo_status.json` と公式区間IDマスターを使用する。
- 更新間隔・駅選択・列車詳細・遅延表示は既存画面の共通処理を使用する。配信時刻が5分以上古い場合は列車を表示しない。
- GitHub Pagesでは既存のGoogle Cloud CORS Proxyを使用し、公式ドメインへブラウザから直接アクセスしない。京急Workerは変更しない。
- ローカルは `/api/keisei/` の固定パスハンドラーを使用する。任意URLの転送は許可しない。
- 列車クリック時のみ `/data/diainf/{列番}.json`、松戸線は `/data/diainf_SK/{列番}.json` を取得する。成功結果は60秒キャッシュし、同時要求をまとめる。
- `stop.json` を使って途中駅も解決する。`pa=0` の停車駅のみ、始発・途中駅は発時刻、終着駅は着時刻を共通時刻表へ渡す。24時以降の定刻表記を保持する。

## アイコン

普通は従来通り。急行・特急・快速・快速特急（快特）・通勤特急・アクセス特急は京急／浅草線の既存SVG・色・文字サイズを使用する。

スカイライナーはS、モーニングライナーはM、イブニングライナーはE、シティライナーはC。既存の1文字用形状・文字サイズを維持し、指定色 #10306C を使用する。
未知の種別コードは保留。列車は非表示にせず、標準形状の「？」で配置し、詳細内には公式種別名を残す。

## 再生成とテスト

`tools/generate_keisei_routes.ps1` が公式マスターと路線SVGをXMLとして読み、`js/keisei_master.js` と路線HTMLを生成する。
公式JavaScriptは実行しない。SVG内の駅・列車アンカーと座標マスターで投影し、駅間の向きは公式のPART_TRAIN_U/Dを用いる。
`.tmp/keisei-source/` に取得済みデータがあれば利用する。更新する場合はキャッシュを差し替える。`-RefreshFixtures` は実JSONをテスト用に保存するオプション。

```text
node tools/test_keisei_location_adapter.js
node tools/test_keisei_proxy.mjs
node tools/test_keikyu_train_icons.js
```

fixtureで全路線の配置先、駅マスター、上り下り、未知種別、鮮度、停車駅と通過駅を検証する。
運行情報XMLの独自表示は今回追加していない。
