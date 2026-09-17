# 併走区間のテストモード

- 東横線: `location.html?tokyu_test=parallel#rosen=159`
- 目黒線: `location.html?tokyu_test=parallel#rosen=160`
- 田園都市線: `location.html?tokyu_test=parallel#rosen=161`
- 大井町線: `location.html?tokyu_test=parallel#rosen=162`

`testdata/tokyu_parallel_trains.json` を読み込み、実際の在線APIは呼び出さない。
4路線の全駅・全駅間に上下各2本以上を配置する。
併走区間は内側（目黒線・大井町線）対外側（東横線・田園都市線）が2対1・1対2・3対2になるよう混在させる。
田園調布〜日吉、二子玉川〜溝の口の駅・駅間だけ固定レーンを適用する。列車自身のtrain_line_idを使用し、列車数が異なっても列を固定する。
全列車番号はTESTで始まる架空番号。更新時刻にはテストデータであることを明示する。
自動更新でも同じJSONを再読込する。列車詳細から外部の車両情報APIは呼び出さない。
他路線は通常の取得を維持する。URLから `?tokyu_test=parallel` を削除して再読込すると通常モードに戻る。

JSONを直接編集可能。初期データを再生成する場合は `node tools/generate_tokyu_parallel_fixture.cjs`。
