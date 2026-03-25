# Test Mode

`?test=1` を付けて開くと、以下の固定 JSON を優先して読み込みます。

- `testdata/location/location_XX_now.json`
- `testdata/express/express_now.json`
- `testdata/express/express_core.json`
- `testdata/daiya/daiya_XX.json`
- `testdata/daiya/daiya_XX_en.json`
- `testdata/daiya/daiya_XX_tc.json`
- `testdata/daiya/daiya_XX_sc.json`
- `testdata/daiya/daiya_XX_kr.json`
- `testdata/rosen/rosen_now.json`

固定 JSON が存在しない場合は、自動的に通常の本番データへフォールバックします。

利用例:

- `index.html?test=1`
- `location.html?test=1#rosen=51`
