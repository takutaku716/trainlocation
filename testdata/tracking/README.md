# Tracking Scenario

追跡動作の確認用シナリオです。

使い方:
- `location.html?test=1&scenario=tracking#rosen=52`
- `location.html?test=1&scenario=tracking#rosen=53&cbango=4001D`

このシナリオでは、必要な JSON だけを `testdata/tracking/` 配下に置きます。
存在しないファイルは通常の `testdata/`、さらにその次に本番データへフォールバックします。

上書き候補:
- `location/location_02_now.json`
- `location/location_07_now.json`
- `location/location_09_now.json`
- `express/express_now.json`
- `express/express_core.json`
- `rosen/rosen_now.json`

追跡確認では、次のような状態を作ると使いやすいです。
- 1本は走行中
- 1本は遅延あり
- 1本は次回更新で消える

