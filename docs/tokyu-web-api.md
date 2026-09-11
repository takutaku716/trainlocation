# 東急線の在線データ

## 取得経路

ブラウザーは `/api/tokyu/{key}` だけを使用する。ローカルは
`node tools/local_server.js 8795`、GitHub Pages は専用 Worker
`https://trainlocation-tokyu-proxy.densha716.workers.dev` を経由する。
既存の京急用 Worker は変更しない。

| 路線 | 路線番号 | TID ID | key / JSON | 取得元 |
| --- | --- | --- | --- | --- |
| 東横線 | 159 | 26001 | toyoko / toyoko.json | 署名付きJSON |
| 目黒線 | 160 | 26002 | meguro / meguro.json | 署名付きJSON |
| 田園都市線 | 161 | 26003 | dento / dento.json | 署名付きJSON |
| 大井町線 | 162 | 26004 | oimachi / oimachi.json | 署名付きJSON |
| 東急新横浜線 | 163 | 26009 | shinyokohama / shinyokohama.json | 署名付きJSON |
| 池上線 | 164 | 26005 | ikegami / iketama.json | w-tid |
| 東急多摩川線 | 165 | 26006 | tamagawa / iketama.json | w-tid |
| 世田谷線 | 166 | 26007 | setagaya / setagaya.json | w-tid |

新横浜線の内部IDは `sh`。路線と変換表は `js/tokyu_routes.js` に定義する。

署名発行は指定された公開API
`https://fp5owad3w3.execute-api.ap-northeast-1.amazonaws.com/prod/external-data-url?key={file}`
を使う。2026-09-10 の確認では小文字の `origin` ヘッダーと
`https://tokyu-tid.s3.amazonaws.com` の組み合わせで成功した。
大文字の `Origin` では同じ値でも拒否された。

返された署名URLは HTTPS、ホスト
`external-data-user.s3.ap-northeast-1.amazonaws.com`、要求したファイルのパスを検証する。
署名パラメーターの生成、フロントへの返却、ログへの保存は行わない。
署名付きGETが403の場合に限り、URL再発行から1回だけ再試行する。
内部用S3、Firebase、秘密鍵、認証情報は使用しない。

w-tid は `https://w-tid.jp/tokyu/iketama.json` と
`https://w-tid.jp/tokyu/setagaya.json` の固定URLのみ使用する。
取得間隔は署名付き15秒、w-tid60秒。ブラウザー・サーバーでファイル単位に
キャッシュし、池上線と多摩川線の取得を共用する。通信中の要求も共用する。
各通信は12秒でタイムアウトする。障害は同じ期間だけ負のキャッシュに保存し、
古い列車を現在の在線として表示しない。取得状況の診断データは内部に保持し、
ファイル名・最終取得時刻・件数の表示は行わない。障害時は共通エラー表示を使う。
w-tid路線のみ第三者配信の表示を残す。時刻は配信元の更新日時ではなく取得日時。

## 変換

駅・駅間コード、行先コードと運行番号表記は
[w-tid公開ページ](https://w-tid.jp/tokyutid.html?meguro) の対応表を参照。
世田谷線の配置は解析時に保存した公開路線HTMLの駅・区間IDを参照。
既存の駅パネル・線路・上下アイコン・詳細ウィンドウを共用する。

- `line_id` で対象路線を選別する。並走区間では `train_line_id` が異なる列車も表示する。
- `station_id` があれば駅、なければ `section_id` の駅間。`up` が上り方向。
- 行先変換表は東横・目黒・新横浜系と田園都市・大井町系を分ける。
  例: 78は前者で渋谷、後者で鷺沼。直通線区コードを特定の終着駅に置き換えない。
- `delay_time` は分。`num_of_cars` が0または99のとき両数は表示しない。
- アイコンは運行番号を表示する。例: 目黒線441は41T。
  内部識別には元の `train_number` を保持する。詳細表示は先頭・末尾が0の8桁を
  `09942310` から `994-231` のように整形する。それ以外の形式は変更しない。
- w-tidで行先が空欄の場合は行先不明。情報がない行先や両数は推測しない。
  取得サンプルでは個々の列車の遅延情報が得られないため、独自の遅延推定はしない。
- 今回は在線の追加のみ。列車時刻表の新規取得は実装していない。
- アイコン色はw-tidの種別文字色に合わせる。各停・B各はblue、G各・S-TRAINは
  limegreen、急行はred、特急・Fライナーはdarkorange、準急はforestgreen、通勤特急は
  orangered。回送のみ従来のグレー。既存SVGの塗り色だけを変更し、形・文字サイズは維持。
  大井町線のB各判定には表示路線ではなく `train_line_id` を使い、並走区間でも区別する。

## テスト・再生成

田園都市線の編成は詳細クリック時だけ公開API
`https://train-info.tokyuapp.com/lines/26003/trains/{operation}/directions/{up|down}`
をブラウザから直接照会する。`Access-Control-Allow-Origin: *` を確認済みで、
Proxyは不要。認証情報は送信せず、取得先を固定する。在線JSONの取得経路は変更しない。
成功は60秒、空応答・失敗は15秒キャッシュし、同時要求を共用する。
`002134` は `2134F`、それ以外の識別形式は切り詰めずそのまま表示する。
在線で両数が未取得の場合のみAPIの車両一覧件数を補う。種別・行先はこのAPIで上書きしない。

田園都市線のAPIから編成を取得できた場合のみ、詳細の編成名を車両情報ボタンにする。
同じレスポンスの `temp` を外気温、`cars[].temp` を車内温度、
`cars[].passenger_rate` を混雑度の段階値として表示する（パーセントには換算しない）。
`51xxF` の5000系のみ `cars[].air_mode` の空調モード列を表示する。
欠損・無効な値は `—`。行先・種別・現在地は既存の在線表示を使用する。
車両情報は取得時刻付きのスナップショットで、編成クリック時には再取得せず、
既存の詳細内で切り替える。「列車詳細に戻る」またはEscapeで元に戻る。
混雑アイコンはローカルの東急アプリ4.24.0解析資料の `vector_crowd_lv1`～`lv6` を
`tools/build_tokyu_crowd_icons.ps1` でSVGに変換している。

東横線・目黒線・新横浜線の編成は `original/tokyu_formation.json` を参照して判定し、
詳細の両数の後ろに括弧書きで表示する。添付の参考実装に合わせ、所属が「み」の場合は
8両、「東」「西」の場合は10両の対照表を使用する。それ以外は取得した両数を使う。
このため現在の参考ロジックでは対照表内の `8西` は使用しない。
判定不能時は非表示。対照表の読み込み失敗時も在線は維持し、60秒後から再試行する。
対照表の正常取得結果はページ内で共用する。

```text
node tools/test_tokyu_location_adapter.cjs
node tools/test_tokyu_proxy.mjs
node tools/test_tokyu_formation.cjs
node tools/test_tokyu_dento_formation.mjs
node tools/test_tokyu_formation_detail.cjs
node tools/test_tokyu_vehicle.cjs
node tools/test_tokyu_vehicle_ui.cjs
npx wrangler deploy --config wrangler.tokyu.toml
```

車両情報UIテストはローカルサーバー（既定8796）とPlaywrightが必要。
`TOKYU_TEST_URL` でURL、`PLAYWRIGHT_CHANNEL` で使用ブラウザを指定できる。
1280・390・320px幅で車両行、画像、戻る操作、横はみ出しを確認する。

テストは `testdata/tokyu` の公開JSONを使用し、実APIに依存しない。
全8路線の駅・駅間アンカーと上下方向、行先表の分離、種別、遅延、運行番号、
空データ、不正JSON、タイムアウト、403再発行上限、キャッシュ共用を検証する。

マスターの再生成には開発用の cheerio@1.1.2 と acorn@8.15.0 を
`.tmp/tokyu-tools` にインストールし、公開ページを
`.tmp/tokyu-source/tokyutid.html` と `.tmp/tokyu-source/setagaya.html` に配置して
`node tools/generate_tokyu_routes.cjs` を実行する。ダウンロードしたJavaScriptは実行せず、
ASTからリテラルの対応表のみを抽出する。
