# Data contract

Every quantitative or geographic claim on screen is a **fact row**. Apps must load rows from `data/live/` when a file exists there, otherwise from `data/sample/`.

## Fact row

One JSON object (or GeoJSON feature `properties`) with these fields:

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | string | Stable identifier (e.g. `C1`, `P1`, `SITE`) |
| `claim` | string | What the row asserts |
| `value` | number \| null | Numeric value when known; `null` if computed in-app from geometry |
| `unit` | string | Unit for `value` (e.g. `m`, `MW`, `homes`, `score`) |
| `lat` | number | Latitude (WGS84) associated with the claim |
| `lon` | number | Longitude (WGS84) associated with the claim |
| `source_org` | string | Organisation or provenance label |
| `url` | string | Link to the source page |
| `quote` | string | Short excerpt supporting the claim |
| `retrieved` | string | ISO date (`YYYY-MM-DD`) when the row was captured |
| `status` | `"found"` \| `"not_found"` \| `"assumption"` | Evidence quality |
| `check` | `"pass"` \| `"fail"` | Local validation result for the row |

### Rules

- Numbers shown in the UI must each carry a **source chip** tied to one or more fact-row `id`s.
- If `status` is `"assumption"`, the chip is amber and labelled **assumption**.
- Opening a chip shows `quote` and opens `url`.
- Arithmetic (distances, counts, risk) lives in application code (`src/lib/score.ts`). Models do not sum.

## Layout files

A layout file (`layout_roundN.json`) is a JSON **array of blocks**:

```json
{
  "id": "G1",
  "kind": "hall" | "generator" | "battery" | "substation",
  "polygon": [[lon, lat], ...],
  "height_m": 18
}
```

Polygons are closed rings in WGS84 `[lon, lat]` order.

## Sample files

| File | Role |
| --- | --- |
| `site.geojson` | ~600 m square site boundary (centre ≈ 52.865, −1.255) |
| `C1.json` | Twenty home points south-east of the site |
| `C2.json` | Screening radius for homes near generators |
| `P1.json` | Design IT load to keep across re-plans |
| `S1.json` | Objection-risk metric documentation |
| `S2.json` | Nearest generator–home distance metric documentation |
| `objections.json` | Four objection cards (`theme`, `who_affected`, `fix`, `row_ids`, `severity` 1–5) |
| `layout_round0.json` | Generators on the edge nearest the homes |
| `layout_round1.json` | Intermediate layout |
| `layout_round2.json` | Generators on the far edge |

All sample rows use `"status": "assumption"`.
