# 東横線・目黒線の車両詳細

既存の編成判定表で編成名が判明した列車について、列車詳細の編成名から共通の車両情報画面を開く。
田園都市線の温度・空調表示は従来どおり維持する。

## 取得元

- 参照ページ: https://tokyu-tid.s3.amazonaws.com/car_infos
- 編成・混雑情報: `POST https://cars-info.tokyuapp.com/fetchInfo`
- 車両設備マスター: https://tokyu-master-data.s3-ap-northeast-1.amazonaws.com/cars_master.json
- 設備マスターの保存先: `original/tokyu_cars_master.json`（2026-09-17取得）。更新時はこのJSONを差し替える。

POSTは参照ページと同じJSON本文とContent-Typeを使う。APIは `Access-Control-Allow-Origin: *` を返すため直接取得する。
APIレスポンスに含まれるリクエスト診断情報は保存・表示しない。
取得成功は60秒、失敗は15秒キャッシュし、同時リクエストをまとめる。

編成名は既存の `tokyu_formation.json` を優先する。設備は形式・両数・編成番号が一致するマスターから選ぶ。
混雑度は公式ページの13段階から6段階への対応を適用する。休日など混雑データがない場合は空欄相当のダッシュとし、空いていると推測しない。
温度はこのAPIに含まれないため、東横線・目黒線では温度列を表示しない。
マスターにない設備も推測しない。API失敗時は通常の列車詳細と既存の編成名を維持する。

## テスト

`node tools/test_tokyu_cars.cjs`

`node tools/test_tokyu_cars_ui.cjs`（Playwrightとローカルサーバー8796番が必要）
