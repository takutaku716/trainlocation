# 京急公式Web APIへの切替

京急の在線取得はODPTから、公開Webの `https://app-kq.net/api/train` へ変更。
Pagesとローカルでは同一オリジンの `/api/keikyu/location` を使用する。
GitHub Pagesでは既存の `trainlocation-odpt-proxy` Workerの `/api/keikyu/web/location` を使用する。
この経路はODPTを呼ばず、京急公式Web APIを使用する。Workerの許可Originには `https://takutaku716.github.io` を登録する。
`functions/api/keikyu/[[path]].js` を含めてCloudflare Pagesにデプロイする。
追加のWorkerやAPIトークン設定は不要。ローカルでは `tools/local_server.js` が同じハンドラーを実行する。

- 在線更新時はまず一覧を描画し、画面内とその周辺の列車について行先を非同期取得する。同時取得は最大3件。
- 詳細を開いたとき、公式の配置表の `line_code` と配列 `O`、`direction - 1`、`train_no` から詳細キーを作る。
- `/api/keikyu/timetable/{key}` 経由で行先・両数・時刻を取得する。通過駅は停車駅表に出さない。
- 詳細は60秒キャッシュし、同時の同一キー取得をまとめる。失敗は30秒キャッシュする。詳細クリックにも同じキャッシュを利用する。
- `is_alert=1`でも詳細を取得し、詳細ウィンドウに運行乱れによる行先・両数変更の注意書きを表示する。方向不明、列番0は詳細取得を行わない。
- 取得失敗時も在線位置と種別は表示する。5分を超えた位置情報は除外する。
- 公式APIはブラウザ用のUser-Agentで取得する。トークンや認証Cookieは使用しない。

配置表は `node tools/generate_keikyu_position_map.js` で生成する。
入力は `apk解析/keikyu_web_assets/trainPosControll.js` の `C` 定数のみで、外部JavaScript本体は実行しない。
解析メモの路線コードの説明と実際の定数は一致しないため、実際の `C` と `O` に従う。
U065は公式の説明が北久里浜～堀ノ内をまとめた区間で、公式の新大津の描画アンカーに対応させる。

確認コマンド：

```text
node tools/test_keikyu_location_adapter.js
node tools/test_keikyu_proxy.js
```
