# JR Kyushu Timetable Cache

JR Kyushu timetables switch service dates at 04:00 JST. The cache Worker starts at about 04:30 JST and saves train detail timetable JSON to Workers KV in small batches.

Cloudflare Cron Triggers use UTC. The configured triggers run every 5 minutes from 04:30 to 06:30 JST:

```text
30,35,40,45,50,55 19 * * *
*/5 20 * * *
0,5,10,15,20,25,30 21 * * *
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
https://<worker-domain>/refresh?reset=1
https://<worker-domain>/refresh?cursor=15
https://<worker-domain>/refresh?token=<TIMETABLE_REFRESH_TOKEN>
```

The Worker processes up to 15 train detail pages per invocation to avoid Cloudflare subrequest limits on the Free plan. If the response contains `nextUrl`, open that URL to continue a manual refresh.

Worker timetable read endpoint:

```text
https://<worker-domain>/timetable/765A
https://<worker-domain>/timetable/765A?date=2026-05-26
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
jrkyushu:timetable:refresh-state
jrkyushu:timetable:YYYY-MM-DD:index
jrkyushu:timetable:YYYY-MM-DD:train:765A
```

## Notes

- The Worker stores scheduled timetable data, not live delay data.
- Special or group trains may not have public train-detail timetable pages.
- The initial source stations are Hakata, Kagoshima-Chuo, Takeo-Onsen, and Nagasaki.
