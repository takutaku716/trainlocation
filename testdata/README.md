# Test Mode

`?test=1` を付けると、`testdata` 配下の固定 JSON を優先して読み込みます。

対象ファイル:
- `testdata/location/location_XX_now.json`
- `testdata/express/express_now.json`
- `testdata/express/express_core.json`
- `testdata/daiya/daiya_XX.json`
- `testdata/daiya/daiya_XX_en.json`
- `testdata/daiya/daiya_XX_tc.json`
- `testdata/daiya/daiya_XX_sc.json`
- `testdata/daiya/daiya_XX_kr.json`
- `testdata/rosen/rosen_now.json`

`?test=1&scenario=name` を付けると、まず `testdata/name/...` を探し、無ければ通常の `testdata/...` にフォールバックします。

例:
- `index.html?test=1`
- `location.html?test=1#rosen=51`
- `location.html?test=1&scenario=tracking#rosen=52`