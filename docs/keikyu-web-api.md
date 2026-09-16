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
- 京急はCloudflareから直接取得し、403の場合は既存のGoogle Cloud CORS Proxyへフォールバックする。単独取得の検証で在線にも403が発生したため、外部中継の撤去は見送った。
- 上流fetchは既存の `cf.cacheEverything` と `cacheTtl`（在線15秒、詳細60秒）を使用する。

2026-09-09の検証では、公開Workerの `8201-0-1502D` は200で37駅分を取得できた後、再検証で上流403となった。
`8501-0-782` もWorkerからは403だが、同じヘッダーを使用したローカル直接取得では200だった。
したがってキャッシュを唯一の原因と断定できず、Cloudflareからの時刻表取得の安定性は未解決。
HTTPステータスの異なる応答は実測であり、京急側の拒否ルールやIP制限の存在までは確認できていない。
時刻表が全件取得できないとの報告を受け、公開Workerを調査前の `21d68e25-f53d-4075-b11b-a9f3a0f49da0` へロールバックし、ローカルの取得処理も戻した。
復旧後は1402K・1608D・1316Tの公開経由の時刻表取得が200となることを確認。1502D・782の失敗は残る。

## 分離環境での再照会検証

`tools/wrangler.keikyu-diagnostic.toml` の別名Workerを `wrangler dev --remote` で検証した。本番デプロイは変更していない。
1608Dは通常URLで200、1502D・782は通常URLで403。一方、同じヘッダーと列車キーで `?retry={現在のUnix分}` を追加した照会では両列車とも200になった。
60秒のキャッシュ期限を超える65秒後にも同じ結果を確認（1502Dは37駅、782は7駅）。再照会の応答は `CF-Cache-Status: MISS` であり、検証環境に保存済みの成功応答を読むだけではなかった。

候補は「通常取得を維持し、403の場合だけ異なるキャッシュキーで1回再照会し、それも失敗したら既存の外部中継へ進む」。全リクエストのキャッシュ無効化や無制限の再試行は行わない。
キャッシュキーや経路に関連する差は実測したが、京急側の拒否ルールの原因特定には至っていない。三列車・二回の成功は全列車・全時間帯での安定を保証しない。
検証コードは固定した三列車だけに限定し、時刻表データの公開プロキシとして常設しない。

オフライン検証：`node tools/test_keikyu_retry_candidate.mjs`

## 再照会処理の公開

2026-09-09、Worker版 `a833965e-4d03-45c9-b611-f944316a16f8` に反映。
通常の時刻表取得が403の場合のみ、`?retry={現在のUnix分}` を付けて同じヘッダー・キャッシュ設定で1回再照会する。
追加照会のタイムアウトは4秒。追加照会がHTTPエラーや通信失敗なら、従来のGoogle Cloud CORS Proxyへ進む。
在線取得は変更しない。公開経由で在線69件と、1608D・1502D・782・1402Kの時刻表がすべて200となることを確認した。
実装の回帰テストは `node tools/test_keikyu_proxy.js`。

配置表は `node tools/generate_keikyu_position_map.js` で生成する。
入力は `apk解析/keikyu_web_assets/trainPosControll.js` の `C` 定数のみで、外部JavaScript本体は実行しない。
解析メモの路線コードの説明と実際の定数は一致しないため、実際の `C` と `O` に従う。
U065は公式の説明が北久里浜～堀ノ内をまとめた区間で、公式の新大津の描画アンカーに対応させる。

確認コマンド：

```text
node tools/test_keikyu_location_adapter.js
node tools/test_keikyu_proxy.js
```
