# JR Kyushu Train Navi timetable integration

JR Kyushu conventional-line location adapters can request Train Navi timetable data lazily. The request is sent only when a user opens a train detail dialog.

## Train metadata

Add the following object to a normalized location train:

```js
{
  cbango: "4131M",
  source: "jrkyushu",
  jrKyushu: {
    trainNavi: {
      drivingRouteCode: "600",
      stationCode: "91101270",
      currentStationCode: "91101320",
      upperLowerKbn: "1",
      drivingBaseDate: "2026-08-30"
    }
  }
}
```

- `currentStationCode` is the current station, or the next usable station in the train's direction.
- `stationCode` may be the page's anchor station. It defaults to `currentStationCode`.
- `trainNumber` defaults to `cbango` and may include the Train Navi suffix, such as `M`, `D`, or `H`.
- If `trainSignCode` and the other identity fields are available, add them under `trainNavi`. The Worker then skips the station departure-list lookup.

If the train cannot be matched, the existing location, destination, and timetable data remain unchanged.

## Worker endpoints

The `trainlocation-jrkyushu-timetable-cache` Worker exposes:

- `/trainnavi/timetable`: resolves a train number at the supplied station and returns normalized timetable rows.
- `/trainnavi/operation-status`: validated passthrough for station departure data.
- `/trainnavi/train-info`: validated passthrough for a fully identified train.

Operation status is cached for 10 seconds and train details for 30 seconds. The Worker only accepts known parameters and does not act as an arbitrary URL proxy.

Deploy changes with:

```powershell
npx wrangler deploy --config wrangler.jrkyushu-timetable.toml
```
