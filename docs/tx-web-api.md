# TX train location

- Route: `location.html#rosen=151` (Akihabara - Tsukuba, all 20 stations).
- Source: official TX WebView API and `https://www.tx-app.com/src.7f791b25.js`.
- Analysis: `apk解析/TX線_列車走行位置解析結果.md`.

## Transport

GitHub Pages reuses the existing Google Cloud Run CORS proxy:
`https://cors-proxy-404216792373.asia-northeast1.run.app/proxy?url=...`.
No new Worker, token or Cloud Run deployment is needed. The browser never
requests external-data.tx-app.com directly. Only these fixed TX paths are built:

- `tid/trains.json` (cache-buster in milliseconds)
- `status.json`
- `stop_stations/YYYY-MM-DD/TRAIN_NUMBER.json` (cache-buster in milliseconds)

Local development uses the same-origin `/api/tx/` handler in
`functions/api/tx/[[path]].js`, served by `tools/local_server.js`. This handler
can also be used with Pages Functions. It validates paths, upstream status and
JSON shape, uses a 12-second timeout, and does not accept arbitrary upstream URLs.

Existing auto-update settings are reused (default 15 seconds; 30/60 seconds
also available). Overlapping TX loads share one promise. Details are fetched
only on click, with a 60-second cache and shared pending requests. No station
timetable crawling is performed. Location failures clear TX positions and retry
on the next update; status failures do not hide otherwise valid trains.

## Mapping

Station IDs 11-30 correspond to numbers 01-20. Up points toward Akihabara.
Platform anchors are `TX151P{stationIndex}U/D`. Interval anchors are
`TX151P{upperIndex}_{lowerIndex}U/D`. As in the official JavaScript, the interval
is immediately before the reference station: up uses next_station_id + 1,
down uses next_station_id. Raw `position` is retained as metadata; it is not
interpreted as a distance or used to interpolate an unverified location.

Fleet is determined only from train_orchestration_number:

| Range | Name |
| --- | --- |
| 1-14 | TX-1000系 |
| 67-70, 72-73 | TX-2000系（増備車） |
| 81-85 | TX-3000系 |
| Other | TX-2000系 |

Fleet names appear after car count in the shared detail header. Train icons use
the existing shared styling, with no fleet-specific colors or stripes.

Kind IDs 6-12 were checked in the official JavaScript: 6 new rapid, 7/8 special
rapid, 9 group, 10/11 empty stock, 12 test run. The A/B/C variants are combined
for display. Unknown kinds are displayed as unknown, without dropping the train.

On click, the current raw array is searched by train_number. The detail date
comes from updated_at converted to JST, including rollover at midnight. No
previous-day guessing is added. Full returned stop order is retained. The shared
timetable renderer shows departure at the first/intermediate stops and arrival
only at the terminus. No separate origin/terminus or fleet summary is displayed.
API station-name qualifiers in parentheses are removed for
consistency with the station diagram. Times after midnight are left unchanged.

## Verification

```sh
node tools/test_tx_location_adapter.js
node tools/test_tx_proxy.mjs
node tools/test_tx_shared_display.js
node tools/test_tx_location_adapter.js --live
node tools/local_server.js 8767
```

Fixtures under `tools/fixtures/tx/` cover fleet boundaries, all kinds, platforms,
both interval directions, delay rounding, JST rollover, missing/malformed data,
matching current trains, cache reuse and API failures. Tests also verify every
station/interval anchor exists in the route HTML. The live option sends the
allowed production Origin when testing the existing proxy outside a browser.

UI policy: reuse shared route components and rendering. Do not add operator-only
credit blocks, explanatory messages, timetable layouts or train icon styling.
TX status is reused from the location load; only non-normal service appears in
the shared operation-information tab. Missing timetable data stays blank, as on
other routes.

Verified on 2026-09-08: live positions for all four fleet classes, full details
for 5403/5401 and 4111, and browser detail rendering for 5405. Desktop and 390px
layouts checked, including the top-page TX selector. Existing Keikyu and Toei
adapter tests also pass. No changes to their fetching or classification logic.
