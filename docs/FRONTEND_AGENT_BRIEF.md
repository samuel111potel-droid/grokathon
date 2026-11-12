# FRONTEND_AGENT_BRIEF.md — Lane 5 (UI, map, Grok co-pilot)

> Added by Rio (Lane 5) at 21:20. **Humans: read Part A (2 minutes). Agents: read Part B.** This brief adds to `AGENTS.md` and `docs/EXECUTION_PLAN.md` and does not replace them. The two rule changes in Part B §5 need the team's agreement.

---

# Part A — For teammates (2-minute read)

- **Rio builds the UI, map and Grok co-pilot.** The screen is a Grid Status-style dashboard:
  - **Left:** panel with round stepper, risk gauge, objection feed, and Community / Environment / Power tabs.
  - **Centre:** the 3D map, switchable between **Satellite 3D** (satellite + terrain), **Dark**, **Grid flows** (animated power lines) and **Columns** (headroom bars).
  - **Bottom right:** the Value Ladder. **Every number opens its source.**
- **Grok co-pilot:** a floating bar on the map. You ask, and Grok's own cursor flies to things, draws the 300 m ring, measures distances, pins sourced labels and runs the re-plan. **The video replays real recorded Grok answers**, so nothing can fail on stage.
- **Teammate 1 (community), by 21:40:** `data/out/C1–C3.json`, `data/out/receptors.geojson`, `data/out/objections.json`. Optional: `data/out/layers/areas.geojson` (ward stats + official election results) for heat maps.
- **Teammate 2 (test fit and numbers):**
  - **By 21:25:** `src/types/schema.ts` and `data/fixtures/`.
  - **By 21:40:** `P1`, `P2`, `S1`, `S2`, `power_route.geojson`, `M1_summary.json`, and environment layers in `data/out/layers/` (`flood`, `contamination`, `ecology`, `lines`, `fibre`).
  - **By 21:50:** `data/rounds/round0..2.json`. Keep feature ids **the same across rounds**, because the UI animates by id.
- **Two rule changes to agree now:**
  1. The Grok co-pilot is allowed as a command bar that outputs map actions. It is not a chat window.
  2. The video uses replay. Live Grok runs only through a local dev-server proxy, and only if the Wi-Fi is stable. Add `XAI_API_KEY=` and `XAI_MODEL=` to `.env.example`.
- **Cut tonight:** investment memo / PDF export (repo rule).
- **22:00:** feature freeze. `python3 scripts/check_traceability.py` must show 0 errors.

### Paste this at the top of your Cursor prompts
```text
Lane 5 UI (Rio) consumes your files; follow docs/FRONTEND_AGENT_BRIEF.md Part B + EXECUTION_PLAN §4 exactly.
- Never edit src/App.tsx, src/map/, src/components/, src/styles/, src/agent/, data/agent/ (Lane 5).
- EvidenceRow/ObjectionCard/LayoutRound/MSCIReceipt shapes are fixed by EXECUTION_PLAN §4. LayoutRound must include metric_sources {key:{method,citation_ids}} for every metric and underwrite field; features need properties {id, kind, label, height_m, color} and STABLE ids across round0..2.
- New layer files (GeoJSON FeatureCollection, properties {id, kind, label, citation_ids[]}): data/out/layers/flood.geojson (zone 2|3), contamination.geojson, ecology.geojson, lines.geojson (voltage_kv, overhead|underground), fibre.geojson, areas.geojson (optional: metrics{}, election{body,date,winner,shares}, metric_citation_ids{}).
- Substations = P1 rows with lat/lon/value; route = data/out/power_route.geojson; homes = data/out/receptors.geojson.
- Every citation_id must resolve to a check:"pass" row, an "assumption" row with basis, or an MSCI receipt. No raw MSCI rows, no private names, no numbers the UI would have to invent.
- Deadlines: schema.ts + fixtures 21:25 · data/out + layers 21:40 · rounds 21:50 · freeze 22:00.
```

---

# Part B — For agents (full spec)

## 0. Who owns what tonight (3 people)

| Person | Lanes | Writes (exclusive) | Delivers to the UI |
|---|---|---|---|
| **Rio** — front end | Lane 5 | `package.json`, `vite.config.ts`, `index.html`, `src/App.tsx`, `src/map/`, `src/components/`, `src/styles/`, `src/agent/`, `data/agent/` | — |
| **Teammate 1** — community | Lane 2 | `data/out/C1–C3.json`, `data/out/receptors.geojson`, `data/out/objections.json`, `data/receipts/ledger.csv`, optional `data/out/layers/areas.geojson` | Receptors, precedents, ward profile, stakeholders, pain points, objection cards |
| **Teammate 2** — test fit and numbers | Lanes 1, 3, 4 | `src/types/schema.ts`, `src/engine/*`, `data/site.geojson`, `data/fixtures/`, `data/rounds/round0..2.json`, `data/out/P1–P2.json`, `data/out/S1–S2.json`, `data/out/power_route.geojson`, `data/out/M1_summary.json`, `data/receipts/msci_receipts.json`, `data/out/layers/{flood,contamination,ecology,fibre,lines}.geojson` | 3D test fit per round, power, environment, value ladder |

`AGENTS.md` still lists Lane 5 as Nico; update it to Rio. The UI **never** edits `src/types/` or `src/engine/`. It imports them.

## 1. Stack (matches the repo README)
Vite + React + TypeScript + Tailwind. MapLibre GL JS + deck.gl through `@deck.gl/mapbox` `MapboxOverlay` (`interleaved: true`). `@turf/turf` for UI geometry (rings, measure lines, nearest feature). `npm run dev` serves on :5173. No backend service. The only server code is a **Vite dev-server middleware** in `vite.config.ts` for the Grok proxy (§5).

## 2. Data loading (no network at demo time)
- Load with `import.meta.glob('/data/**/*.json', { eager: true })`. Load `.geojson` with `import.meta.glob('/data/**/*.geojson', { eager: true, query: '?raw', import: 'default' })` and parse it.
- For each file, prefer `data/out/<name>` and fall back to `data/fixtures/<name>`. If a fixture is on screen, show a small **"sample data"** badge.
- Drop every `EvidenceRow` with `check === "fail"`. Status `not_found` renders as "not found". Status `assumption` gets an amber "assumption" badge with its `basis`.
- **Contracts are EXECUTION_PLAN §4**: `EvidenceRow`, `ObjectionCard`, `LayoutRound` (with `metric_sources`), `MSCIReceipt`. Import the types from `src/types/schema.ts`. If that file isn't on `main` by 21:25, Rio may create it **verbatim from §4** and must tell teammate 2.
- **New layer files** (not in §4 yet; all are GeoJSON FeatureCollections). Every feature has `properties: { id, kind, label, citation_ids: string[] }` plus extras:
  - `data/out/layers/flood.geojson`: `zone` (2 or 3)
  - `data/out/layers/contamination.geojson`: `kind` (`ash`, `coal_stock`, `remediation`)
  - `data/out/layers/ecology.geojson`: `designation` (SSSI and similar)
  - `data/out/layers/lines.geojson`: `voltage_kv`, `kind` (`overhead` or `underground`)
  - `data/out/layers/fibre.geojson`
  - `data/out/layers/areas.geojson` (optional, ward/LSOA): `metrics: { median_age, employment_rate, elec_engineering_workers, deprivation_decile }`, `election: { body, date, winner, shares }`, `metric_citation_ids: { <metric>: [ids] }`
  - Substations come from `P1` rows (lat, lon, value = headroom). The route comes from `data/out/power_route.geojson`. Homes come from `data/out/receptors.geojson`.

## 3. Screen (Grid Status-style dashboard, recorded at 1440×900)
```
┌ Header 44px: Site · Rushcliffe BC · NGED East Midlands · "Red Team 22/24 pass" · View: [Satellite 3D][Dark][Grid flows][Columns] ┐
├ LEFT 28% docked panel ───────────┬ MAP 72% ───────────────────────────────────────────────────────────────────────┤
│ Round stepper R0 → R1 → R2        │  3D test fit (teammate 2's LayoutRound features, extruded by height_m)          │
│ [AI Re-Plan Layout →]             │  receptor pins red > 45 dBA / green ≤ 42 dBA (thresholds come from data)         │
│ Objection risk gauge              │  acoustic ring · HV route · precedent pins · callouts added by Grok              │
│ Tabs: Feed | Community |          │                                                                                  │
│   Environment | Power             │                         ┌ Value Ladder (bottom-right) ┐                          │
│ dense tables: label|value|unit|chip│   ◉ Grok   [Ask Grok… (G)]  ← floating co-pilot bar, bottom-centre             │
└───────────────────────────────────┴─────────────────────────────── Source Proof Drawer (slides from right) ┘
```
- **View modes** (header toggle):
  1. **Satellite 3D**: Esri World Imagery + DEM terrain + hillshade (like the MapLibre hybrid satellite/terrain example). Used for the establishing shot.
  2. **Dark**: OpenFreeMap dark (repo default); deck layers glow.
  3. **Grid flows**: animated `TripsLayer` along the power route and lines (like kepler.gl NYC trips).
  4. **Columns**: `ColumnLayer` for substation headroom, or ward metrics (like the deck.gl column-layer example).
- **Terrain gotcha:** deck.gl extrusions don't sit on MapLibre terrain. Switch terrain off automatically whenever the test fit or columns are shown. The site is flat river valley.
- Free sources: Esri `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}` (attribution required). DEM: AWS terrarium `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png` (`encoding: "terrarium"`). Dark: OpenFreeMap, falling back to `https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json`.
- Use the colours from EXECUTION_PLAN Lane 5: red line `#f43f5e`, halls `#38bdf8`, generators `#ef4444`, substation/BESS `#818cf8`, barrier/tree belt `#10b981`. Panel `#090d16` at 92% opacity. Use Inter, plus a mono font with tabular numbers for figures.
- Keyboard: `1`/`2`/`3` rounds, `R` re-plan animation, `B` acoustic ring, `G` focus the Grok bar, `V` cycle view modes, `Space` run the next Grok step in replay.

## 4. Traceability in the UI (enforced by `scripts/check_traceability.py`)
- **No figure typed into JSX.** Every number is read from data and wrapped in `<SourceChip id=…>`, including the risk score, dBA and £. The check script warns on literals like `58 dBA` or `£6.8m` in `.tsx` files.
- Calculated metrics (`predicted_receptor_dba`, `objection_risk_score`, `approval_probability_pct`, `bs4142_compliant`, land values) show an **"estimate"** chip. The drawer shows `metric_sources[key].method` and the input `citation_ids`.
- MSCI figures show the aggregated value plus the receipt (`query_summary`, `retrieved`, `sha256`). No raw rows.
- Community and political data: ward/LSOA aggregates and official election results only. Public office holders appear in their public role only. No private individuals.

## 5. Grok co-pilot ("Clippy-style", acts on the map)
**What it is:** a floating Grok orb with a command bar on the map. The user types or clicks a suggestion chip, or clicks a map feature and chooses "Ask Grok about this". Grok answers in one or two lines and **acts on the map**. A labelled **Grok cursor** glides to each target, shows a click ripple and performs the action. Each action appears as a step line in the left Feed (`→ fly_to P1-02`, `✓ ring 300 m`, `✓ callout [C1-04]`). This is a structured action feed, not a free-form chat window.

**Action API (all executed in the browser, validated before running):**
| Action | Args | Effect |
|---|---|---|
| `fly_to` | `target` (`"site"`, `"row:<id>"`, `"feature:<id>"`) or `{lon, lat, zoom?, pitch?, bearing?}` | Camera flight |
| `set_view` | `"satellite3d"`, `"dark"`, `"flows"` or `"columns"` | View mode |
| `toggle_layer` | `id`, `on` | Layer toggle |
| `draw_ring` | `center` (`row:`/`feature:`/lonlat), `radius_m`, `label` | Turf circle plus a count of receptors inside (counted by code) |
| `measure` | `from`, `to` | Turf line plus a distance label (computed by code) |
| `add_callout` | `at`, `title`, `text`, `citation_ids[]` | Pinned card. **Rejected if any id is unknown or failed** |
| `highlight` | `ids[]` | Pulse features |
| `set_round` | `0`, `1` or `2` | Swap teammate 2's LayoutRound (animated). This is how Grok "builds" the test fit |
| `apply_fix` | one of the 6 allowed fixes | Jumps to the round whose `applied_fixes` contains it |
| `open_source` | `id` | Open the Source Proof Drawer |

**Modes:**
- `?mode=replay` (default for recording): plays `data/agent/script.json`, a list of `{ prompt, reply, actions[], delay_ms }`, with typing and the cursor animation. No network.
- `?mode=live`: the browser POSTs `{ prompt, selection, view, round }` to `/api/grok`. A Vite middleware reads `XAI_API_KEY` and `XAI_MODEL` from `.env` (never sent to the client) and calls the xAI API (OpenAI-compatible, `https://api.x.ai/v1/chat/completions`) with the action API as tools. It returns `{ reply, actions }`.
- `?mode=record`: live mode that also appends each exchange to a downloadable `script.json`, which is then committed to `data/agent/`. **The video replays real Grok output.**

**System prompt rules:** use only facts from rows with `check: "pass"` or status `assumption` (labelled as such). Cite ids in square brackets. Never estimate. Distances, counts, dB and £ come from code or data, never from the model. If something isn't in the data, say "not in our data". No private individuals.

**Repo rule changes the team must agree (proposed):**
1. EXECUTION_PLAN §1 says "No generic chat window". Change it to: *"No generic chat window. The Grok co-pilot is a command bar whose output is structured map actions and step lines."*
2. EXECUTION_PLAN §1 says "No live LLM calls in the browser during the demo". Change it to: *"Recording uses replay mode from recorded real Grok output. Live mode goes through a local dev-server proxy only, and only if venue Wi-Fi is stable."*
3. Add `XAI_API_KEY=` and `XAI_MODEL=` to `.env.example`.

## 6. Out of scope tonight
PDF or investment-memo export (repo rule), auth, multi-site search, freehand drawing on stage (use "Drop red line" animation), side-by-side compare maps.

## 7. Deadlines
- 21:25: `src/types/schema.ts` and `data/fixtures/` on `main` (teammate 2).
- 21:40: real `data/out/*` files and `data/out/layers/*` (teammates 1 and 2).
- 21:50: `data/rounds/round0..2.json` regenerated from real data (teammate 2).
- 22:00: feature freeze.
- Before recording: `python3 scripts/check_traceability.py` shows 0 errors.
