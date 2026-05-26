# JR Kyushu Timetable Cache

JR Kyushu timetables switch service dates at 04:00 JST. The cache Worker is intended to run at about 04:30 JST and save train detail timetable JSON to Workers KV.

Cloudflare Cron Triggers use UTC, so 04:30 JST is:

```text
30 19 * * *
```

## Bindings

Create a Workers KV namespace and bind it to both the Worker and the Pages project.

| Binding name | Purpose |
| --- | --- |
| `JRKYUSHU_TIMETABLE_KV` | Stores JR Kyushu train timetable JSON |

Optional manual refresh protection:

| Variable name | Purpose |
| --- | --- |
| `TIMETABLE_REFRESH_TOKEN` | If set, `/refresh` requires this token |

## Worker

Use `wrangler.jrkyushu-timetable.example.toml` as the starting point.

```powershell
Copy-Item wrangler.jrkyushu-timetable.example.toml wrangler.jrkyushu-timetable.toml
```

Replace `replace_with_kv_namespace_id`, then deploy:

```powershell
wrangler deploy -c wrangler.jrkyushu-timetable.toml
```

Manual refresh:

```text
https://<worker-domain>/refresh
https://<worker-domain>/refresh?token=<TIMETABLE_REFRESH_TOKEN>
```

## Pages Functions API

Latest index:

```text
/api/jrkyushu/timetable
```

Train detail:

```text
/api/jrkyushu/timetable/765A
/api/jrkyushu/timetable/765A?date=2026-05-26
```

KV keys:

```text
jrkyushu:timetable:latest
jrkyushu:timetable:YYYY-MM-DD:index
jrkyushu:timetable:YYYY-MM-DD:train:765A
```

## Notes

- The Worker stores scheduled timetable data, not live delay data.
- Special or group trains may not have public train-detail timetable pages.
- The initial source stations are Hakata, Kagoshima-Chuo, Takeo-Onsen, and Nagasaki.
