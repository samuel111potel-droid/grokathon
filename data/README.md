# Data contract

Every fact row uses this shape:

```json
{
  "id": "C1-150",
  "claim": "plain sentence",
  "value": 0,
  "unit": "",
  "lat": 0,
  "lon": 0,
  "source_org": "",
  "url": "",
  "quote": "exact words or table cell that hold the value",
  "retrieved": "2026-11-12",
  "status": "found",
  "check": "pass"
}
```

- `status`: `found` | `not_found` | `assumption`
- `check`: `pass` | `fail` — rows with `fail` are skipped by the UI
- Prefer `data/live/<file>` when present, else `data/sample/<file>`

## Community layer files

| File | Role |
| --- | --- |
| `site.geojson` | Site boundary polygon (fact fields in `properties`) |
| `C1.json` | Homes, schools, places of worship, buffer rings, building counts |
| `C2.json` | Nearby planning applications (one pin per row) |
