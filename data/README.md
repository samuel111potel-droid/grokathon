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

- `status`: `found` | `not_found` | `assumption` | `computed`
- `check`: `pass` | `fail`
- UI skips rows where `status` is `not_found` **or** `check` is `fail`
- `assumption` → amber chip · `computed` → grey chip labelled **computed**
- Prefer `data/live/<file>` when present, else `data/sample/<file>`

## Community / layout files

| File | Role |
| --- | --- |
| `site.geojson` | Site boundary polygon |
| `C1.json` | Homes, schools, worship, rings, counts |
| `C2.json` | Planning applications |
| `S1.json` | Site limit rows (`S1-10` height, `S1-05` floor area, `S1-HOME`) |
| `P1.json` | 400 kV substation, 720 MW application (`P1-17`), TEC queue rows |
| `objections.json` | Objection cards (who raised, quote, design response, source ids) |
| `layout_round0.json` … `layout_round2.json` | Layout blocks for the three rounds |
