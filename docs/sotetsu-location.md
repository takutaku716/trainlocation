# Sotetsu Train Positions

## Scope

- 167: Main Line, Yokohama to Ebina.
- 168: Izumino Line, Futamatagawa to Shonandai.
- 169: Sotetsu Shin-Yokohama Line, Shin-Yokohama to Nishiya.

Only `https://external-data.sotetsuapp.com/tid/trains.json` is fetched.
Its public response permits cross-origin requests. The shared client caches
responses for 15 seconds across these routes and uses a 15-second timeout.
The site's existing automatic refresh and error presentation are reused.
JR and Tokyu position feeds are not fetched. Outside stations are retained
in the destination dictionary only, not in the displayed track layout.

## Mapping

Station and kind tables were extracted from the public Sotetsu WebView
`https://www.sotetsuapp.com/sotetsu-frontend.b7ab8e3d.js` on 2026-09-14.
Delay values are minutes. Station IDs are not sequential at junctions:
interval anchors follow the route's ordered station list, not ID arithmetic.
Shared junction stations can appear on more than one route.

Train details reuse the common destination, number, car count, location and
delay display. This integration does not provide timetables or formation
identification. Non-numeric placeholder train IDs (such as `K...`) are not
treated as actual train numbers; the separate app operation lookup is not
included. Unknown kinds retain an unknown label rather than guessing.

## Verification

Run `node tools/test_sotetsu_location_adapter.cjs` for offline fixtures.
With the local site server on port 8796 and Playwright installed, run
`node tools/test_sotetsu_ui.cjs` for desktop/mobile UI checks using Edge.
Run `node tools/verify_sotetsu_live.cjs` for optional live browser retrieval.
Set `SOTETSU_TEST_URL` to test another server or the published site.

To regenerate route tables, place the public JavaScript at
`.tmp/sotetsu-source/app.js`, install Acorn in the development environment,
then run `tools/extract_sotetsu_master.cjs` and
`tools/generate_sotetsu_routes.cjs`. No downloaded JavaScript is executed.
