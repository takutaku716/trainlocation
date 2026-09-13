# 京急 ODPT 位置情報（2026-09-08）

## 対象・取得元

本線（品川～浦賀）、空港線、大師線、逗子線、久里浜線。路線IDは146～150。
[公式カタログ](https://ckan.odpt.org/dataset/keikyu__r_train_location)のチャレンジ2026 APIを利用する。
通常の api-public が空配列でも、京急データが存在しないという意味ではない。APKは不要。
品川～泉岳寺は提供対象外。

## 構成

- Worker: trainlocation-odpt-proxy（workers/odpt_proxy.js、wrangler.odpt.toml）。既存Workerに反映済み。
- 秘密情報: Cloudflareの既存 ODPT_ACCESS_TOKEN_2026。値はローカルやフロントエンドに保存しない。
- アプリ専用API: /api/keikyu/location。京急に固定し、任意URL・クエリ・書込みメソッドは受け付けない。
- /api/keikyu/catalog は5路線の画面用駅・種別定義のみ。JSON-LDの汎用転送ではない。
- 受け付けるOriginは trainlocation.pages.dev と localhost/127.0.0.1:8765。CORSは第三者利用を認証で防ぐ仕組みではない。別の本番ドメインを使う場合は明示的に追加する。
- 通信先は api-challenge.odpt.org のみ。リダイレクトは追従しない。本文や認証情報を例外・ログへ出さない。
- 内部キャッシュ: 列車15秒、カタログ1時間。ブラウザ応答はno-store。長期保存なし。
- 表示: js/keikyu_routes.js、js/keikyu_location_adapter.js、rosen/rosen_146～150.html。

## 表示・安全性

上りInbound、下りOutbound。駅順は公式メタデータから取得。
同一路線の隣接駅のみを駅間に置き、未知の駅間・方向は推測せず除外する。
更新日時が5分を超えたもの、未来の時刻、有効期限超過を除外。更新失敗時には列車位置を消す。
実応答では列車番号・種別・位置を確認。行先・遅延・両数は未提供だったため、未提供時はその旨を表示し、定刻と推定しない。
全駅・上下・隣接区間294ケース、異常系、5路線の実データ配置を検証済み。

## ライセンス・公開時の確認

ユーザーは本タスクでチャレンジ2026への応募予定を確認済み。
[限定ライセンスと特定利用条件](https://developer.odpt.org/challenge_license)に従う。
許諾期限は2027年3月12日。Workerは日本時間3月13日から取得を停止する。
期限後は取得済みデータ・カタログの利用を終了し削除すること。期限延長を自動的に仮定しない。
画面にデータ提供者・加工・非公式表示・免責・未提供項目を記載。
本番サイト公開時は作者の問い合わせ先と応募手続を確認すること。データ提供者へアプリの問い合わせを誘導しない。
フロントエンドの本番サイトへのアップロード／Git pushは今回行っていない。

## 検証コマンド

- node tools/test_keikyu_location_adapter.js
- node tools/test_keikyu_location_adapter.js --live
- node tools/test_odpt_proxy.mjs
- node tools/test_toei_location_adapter.js
- node tools/test_location_background_refresh.js
- node tools/test_top_jrkyushu_mobile_tab.js

再デプロイ: npx wrangler deploy --config wrangler.odpt.toml。シークレットの再入力は不要。
