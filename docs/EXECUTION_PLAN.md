# Grokathon Execution Plan & Designated Areas of Attack

**Project:** *AI plans the data centre. The neighbours object. AI plans it again.*
**Format:** Demo-Maximised Hackathon Blueprint (Thursday 12 November 2026 · Freeze **22:00** · Submit **22:50–23:00**)
**Visual Target:** Hybrid **Look B (Before & After AI Re-Plan)** + **Look A (Near-Black Investor Map + 3D Extrusions)** + **Look C (Clickable Source Chips on Every Figure)**
**Locked Hero Site:** **Ratcliffe-on-Soar Power Station** (`52.8652963, -1.2550158`, Rushcliffe Borough Council, NGED East Midlands — [Google Maps](https://www.google.com/maps/place/Ratcliffe-on-Soar+Power+Station/@52.863973,-1.2573881,4147m/data=!3m1!1e3!4m14!1m7!3m6!1s0x4879e629a4428b85:0x2a1b975e581e6828!2sRatcliffe-on-Soar+Power+Station!8m2!3d52.8652963!4d-1.2550158!16zL20vMDl5M214!3m5!1s0x4879e629a4428b85:0x2a1b975e581e6828!8m2!3d52.8652963!4d-1.2550158!16zL20vMDl5M214)). **All socio-economic/community, planning/permitting, power, environmental, contamination, geospatial, and market data collection across the repo targets this site and its surrounding area.**

---

## 1. Strategic Premise: Why General Tools Lose Hackathons (and How We Win)

Most hackathon teams spend 3.5 hours building horizontal plumbing (authentication, generic search bars, multi-site CRUD, live uncached API wrappers, settings pages) and arrive at 22:30 with a spinner-ridden app that looks identical to existing GIS viewers.

Judges score **a 120-second video** (and a 120-second live top-5 stage run) against five tests:
1. **Real-estate relevance** — Powered land & planning refusal is the #1 bottleneck in European/UK digital infrastructure; institutional investors immediately understand *upside as consented MW vs downside as industrial sheds*.
2. **Quality of execution** — One seamless, deterministic closed loop on **one real UK site** that looks and moves like a finished institutional product.
3. **Effective use of Grok Bot & Cursor** — Ten coordinated Grok Bots doing real open-web/portal research + Red Team verification, handed cleanly into a Cursor-engineered 3D geometric solver and MSCI RCA MCP capital-markets check.
4. **Traceable data** — Every MW, km, £/acre, dB figure, and council objection has an inline **Source Chip** opening the verbatim quote, URL, timestamp, and Red Team `PASS` stamp.
5. **Practical usefulness** — Answers the Investment Committee's two real questions on one screen: *"How do we make this site consentable?"* and *"What can we pay today given grid/planning capex and industrial downside?"*

### What We Explicitly Refuse to Build Tonight
- **No** multi-site search box or freehand polygon drawing requirement during the live pitch (include a 1-click **"Load Candidate Boundary"** / animated red-line reveal so the presenter cannot mis-click on stage; optional Terra Draw toggle only if trivial).
- **No** live LLM or external HTTP calls in the browser during the demo. All Grok Bot outputs, Red Team checks, and MSCI receipts compile to static JSON in `data/` before 21:45.
- **No** generic chat window. Agent activity renders as a structured **Step & Objection Feed** (`P1`..`S2` -> `Red Team` -> `Objection Cards` -> `Re-Plan Action`).
- **No** PDF export, user accounts, database migrations, or backend server unless strictly needed — a pure static Vite + TypeScript + MapLibre + `deck.gl` bundle (`npm run dev` / static build) cannot 500-error on stage.

---

## 2. The 120-Second Storyboard (Every Feature Maps to a Shot)

Design the screen around these five shots and nothing else:

| Timestamp | Shot | What Happens on Screen | Judging Criterion Nailed |
| --- | --- | --- | --- |
| **0:00–0:15** | **1. The Hook** | Near-black UK map zooms into the candidate site. Headline banner: *"Data centres wait on two things: grid power and the neighbours."* One click drops the red-line boundary. | Relevance |
| **0:15–0:40** | **2. Constraints Light Up** | Nearest <=132 kV substations + grid connection route + crossings (`P1`, `P2`) draw in electric blue; residential receptors (`150m` / `300m` / `1km` rings from `C1`) pulse warm amber; flood/easement corridors (`S1`) shade in. | Grok Bot + Traceable Data |
| **0:40–1:10** | **3. Round 0 — The Naive Plan & Council Pushback** | **Round 0** 3D massing drops onto the site: 4 data halls + diesel backup generator bank placed right beside the nearest homes. Red 300 m acoustic contour engulfs residential pins (`>55 dB` night receptor alert). Left feed populates up to **6 Objection Cards** (`objections.json`), each citing real local refusal/objection records (`[C2-01]`, `[C1-04]`) + Red Team `18/20 Verified` badge. | Grok Bot + Red Team + Real-Estate Realism |
| **1:10–1:40** | **4. AI Re-Plans (Round 0 -> Round 1 -> Round 2)** | Presenter clicks **"Re-plan for Consent"**. `deck.gl` smoothly animates generators sliding to the far industrial boundary, halls stepping down in height, HGV access moving off the residential lane, and a 15 m landscaped bund + acoustic barrier appearing. Acoustic ring clears every home (`<42 dB` BS 4142 compliant). Objection Risk gauge drops **84 -> 49 -> 24 / 100**. Community S106 package (`C3` ward infrastructure gap) attaches. | Visual "Wow" Moment + Execution |
| **1:40–2:00** | **5. The Money & The Proof Click** | Bottom-right **Value Ladder** updates live across rounds: *Agricultural Base -> Industrial Sheds Downside Floor (MSCI 25 km comps) -> Naive DC Plan (Risk-Adjusted) -> Re-Planned Consentable Powered Land (net of grid route + mitigation capex)*. Presenter clicks **two Source Chips** (one council refusal quote, one grid headroom / £-per-km cell) — the **Source Proof Drawer** slides open showing the verbatim quote, source URL, timestamp, and `RedTeam: PASS`. | Traceable Data + Institutional Usefulness |

---

## 3. Designated Areas of Attack (5 Parallel Workstreams)

Each lane owns **disjoint directories and output files**. Nobody waits on anyone else: Lane 5 (UI) builds against `data/fixtures/` immediately at 20:40 while Lanes 1–4 populate `data/out/` and `src/engine/`.

### Lane 1 — Power & Grid Intelligence
- **Owners:** Martin & Rio (*Person 2 on Team Board*)
- **Owned Files:**
  - `data/out/P1.json` — Five nearest substations <=132 kV, voltage, coordinates, distance (km), demand headroom (MVA/MW), Embedded Capacity Register (ECR) & NESO TEC queued MW, explicit note on >132 kV visibility.
  - `data/out/P2.json` — Nearest viable substation route (straight-line km + road-corridor km + GeoJSON polyline in `data/out/power_route.geojson`), rail/motorway/river/protected crossings, regulator/DNO published unit cost (£/km OHL vs underground cable at target voltage), verdict on team `$400k/km` assumption (`agrees` | `differs` | `no_source`).
- **Execution Steps:**
  1. Use locked candidate site: **Ratcliffe-on-Soar Power Station** (`52.8652963, -1.2550158`), LPA **Rushcliffe Borough Council**, DNO **National Grid Electricity Distribution (NGED — East Midlands)** (+ NGET 400 kV transmission substation context).
  2. Run Grok Bot `P1` against NGED Connected Data Portal / open capacity map / ECR + NESO CKAN (`https://api.neso.energy/api/3/action/package_search`).
  3. Run Grok Bot `P2` on the winning substation from `P1` using OSM routing + Ofgem RIIO-ED2 / DNO charging statement unit cost tables.
  4. Log every URL + timestamp to `data/receipts/ledger.csv` and hand `P1.json` + `P2.json` to Red Team at **21:10**.
- **Fallback at 21:15:** If DNO portal throttles, keep OSM substation coordinates + distance exact and mark headroom/unit-cost rows `"status": "assumption"` so UI renders cleanly with an honest `ASSUMPTION` badge.

---

### Lane 2 — Community, Planning Precedents & Red Team Verification
- **Owner:** Teddy (+ Grok Bot orchestration: `Lead`, `C1`, `C2`, `C3`, `RedTeam`, `ObjectionWriter`, `Director`)
- **Owned Files:**
  - `data/out/C1.json` + `data/out/receptors.geojson` — Residential building counts within `150 m`, `300 m`, `1 km` + coordinates of nearest 20 homes (buildings only, zero resident names); schools, care homes, places of worship within `1 km`; SSSI / Natura / listed buildings / EA Flood Zones 2 & 3 within `2 km`.
  - `data/out/C2.json` — Planning applications within ~5 km (last 10 years) for DCs, large B8/B2 logistics, BESS, solar, substations (via PlanIt API `https://www.planit.org.uk/api/applics/json` + council Idox portal). Exact decision, date, `n_comments`/objection count, and verbatim refusal/objection quotes tagged `noise | traffic | visual | ecology | flood | power_water | jobs | other`.
  - `data/out/C3.json` — Census 2021 (Nomis API) + English Indices of Deprivation 2025 ward profile, Open Council Data / Democracy Club councillor party & next local election date, and quoted parish/council infrastructure gaps (roads, flood defence, drainage, community facilities) for targeted S106 benefit.
  - `data/out/objections.json` — Output of `ObjectionWriter` (max 6 cards, severity `1 | 3 | 5` strictly per rule, each mapped to one of the 6 allowed fixes and citing `C1`/`C2`/`C3`/`S1` row IDs).
  - `data/receipts/ledger.csv` & `demo/clips/` — Full source ledger + `Director` screen clips of bots working portals & Red Team failing any weak row.
- **Execution Steps:**
  1. Launch `C1`, `C2`, `C3` simultaneously at **20:35**.
  2. At **21:10**, run `RedTeam` across all `/out/*.json` files: verify live URL load, exact substring quote match, and zero private individual names. Add `"check": "pass" | "fail"` and `"fail_reason"`.
  3. Immediately run `ObjectionWriter` against `check === "pass"` rows + `data/rounds/round0.json` to emit `data/out/objections.json` by **21:25**.

---

### Lane 3 — Capital Markets, MSCI Downside Floor & Value Ladder
- **Owners:** Teddy & Sam (executed in **Cursor** via `MSCI RCA MCP` — never on Grok Bot)
- **Owned Files:**
  - `data/receipts/msci_receipts.json` — Public-safe audit receipts (`receipt_id`, `tool`, `query_summary`, `radius_km`, `retrieved`, `sha256_of_response`). **Zero raw MSCI rows in git.**
  - `data/out/M1_summary.json` — Clean benchmark parameters consumed by the valuation engine (e.g. regional industrial/logistics yield band & £/sqft downside floor, regional DC precedent count, plus `S2` public fallbacks where MSCI has no coverage).
  - `src/engine/underwrite.ts` — Deterministic residual valuation & Value Ladder calculator.
- **Execution Steps:**
  1. In Cursor, run the ranked MSCI RCA MCP queries from `TEAM_BOARD.md`:
     - Rank 1: Industrial & logistics sales within 25 km (last 36 months) -> establishes **Downside-as-Sheds Floor** (if grid/DC consent fails, what is the site worth as B8 logistics?).
     - Rank 2: Data centre projects within 50–100 km -> precedent context.
     - Rank 3–4: UK/Europe DC & development land transactions -> exit yield / £-per-MW cross-check.
  2. Hash raw responses into `data/receipts/msci_receipts.json` (store any raw scratch file only in gitignored `data/cache/` and delete after event). Confirm with MSCI mentors on-site before showing specific MSCI numbers in the final video; build a 1-flag switch (`USE_PUBLIC_BENCHMARKS_ONLY`) in `underwrite.ts` so we can toggle cleanly in 2 seconds if needed!
  3. Implement `computeUnderwrite(roundLayout, siteParams, powerCost, benchmarks)` in `src/engine/underwrite.ts` returning the 4-bar **Value Ladder** for each round:
     - **Step 1 — Agricultural Baseline** (£/acre × acres, sourced via `S2`)
     - **Step 2 — Industrial / Logistics Downside Floor** (sheds GIA × rent / yield less build cost, sourced via `M1`/`S2`)
     - **Step 3 — Round 0 Naive DC Residual** (heavilyhaircut by high refusal probability / delay discount)
     - **Step 4 — Current Round Re-Planned Powered Land Value** (gross powered-land value at consented IT MW less grid connection capex `P2`, acoustic/bund/landscaping mitigation capex, S106 package `C3`, and residual planning risk adjustment)

---

### Lane 4 — Site Physics, Rules of Thumb & 3D Parametric Layout Engine
- **Owners:** Sam & Chris (*Site physics, pub-maths verification `S1`/`S2`, deterministic geometry*)
- **Owned Files:**
  - `data/site.geojson` — Candidate site red-line polygon (WGS84), area in acres/hectares, centroid, access points, industrial vs residential edge tags.
  - `data/out/S1.json` — Local plan allocation / Ratcliffe-on-Soar LDO & East Midlands Freeport policy, height guidance, brownfield / legacy coal-plant land contamination & remediation constraints, agricultural land classification (ALC) grade, EA flood zone (River Soar / Trent), ecology, PRoW, overhead line / pipeline crossings + published operator stand-off distances.
  - `data/out/S2.json` — Publicly sourced verification (`agrees | differs | no_source`) for every rule of thumb:
    - Rack density (~130 kW AI training vs ~10 kW cloud)
    - Backup generation ratio (>=50%–100% critical IT load)
    - UK Medium Combustion Plant Directive / IED permitting threshold (50 MWth aggregated thermal input -> Environment Agency permit trigger)
    - IT load density (~3–4 MW per acre)
    - Land value steps (~£10k/acre farmland, 2–4x unconsented industrial/employment, ~£1m/MW powered land)
    - Generator acoustic source level (~100–110 dBA LWA / ~75–85 dBA at 10 m with standard container) + **BS 4142:2014+A1:2019** residential night-time rating level method.
  - `src/types/schema.ts` — Canonical TypeScript interfaces shared across engine and UI.
  - `src/engine/layout.ts` & `src/engine/acoustics.ts` — Deterministic generator of `data/rounds/round0.json`, `round1.json`, `round2.json` + golden fixtures in `data/fixtures/`:
    - **Round 0 (Naive Max-MW Fit):** Packs maximum halls + places diesel generator compound on the near edge (`~140 m` from nearest residential receptor), 18 m hall ridge height, HGV access on residential road, no bund/barrier. Result: receptor noise `~58 dBA` (fails BS 4142 night background), high visual/traffic/noise severity -> **Objection Risk: 84/100**.
    - **Round 1 (Generator Relocation + Acoustic Screen):** Applies fixes `move generators away from homes` + `add acoustic screen` + `move site access`. Generators shift to far industrial edge (`~480 m` from nearest home) behind a 6 m acoustic wall (`-10 dB` barrier + `-11 dB` distance attenuation). Receptor noise drops to `~39 dBA`. **Objection Risk: 46/100**.
    - **Round 2 (Consent-Ready Scheme + Community Offer):** Applies `lower hall height` (18 m -> 13.5 m sunken/stepped), `add tree belt` (20 m native woodland buffer on residential edge, slight net developable area trim e.g. 64 MW -> 56 MW IT load, honest trade-off!), `move substation`, plus `C3` local infrastructure contribution. **Objection Risk: 21/100** — *Net Risk-Adjusted Land Value peaks despite slightly lower gross MW because consent probability & schedule certainty jump!* **(This trade-off — slightly fewer gross MW, much higher risk-adjusted land value — is an institutional-grade insight judges will love.)**

---

### Lane 5 — Demo Stage UI (MapLibre + `deck.gl` + Animated Re-Plan + Source Drawer)
- **Owner:** Nico (*Person 3 frontend*)
- **Owned Files:**
  - `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`
  - `src/App.tsx`, `src/map/`, `src/components/`, `src/styles/`
- **Visual Design Spec (Strict Anti-Slop Institutional Dark UI):**
  - **Canvas (72% width right/full-bleed):** `MapLibre GL JS` using `OpenFreeMap` Dark basemap (zero API key failure risk!) + 1-click Satellite toggle (`Esri World Imagery`). Pitched at `48 deg` bearing `-18 deg` so `deck.gl` `PolygonLayer` 3D extrusions read immediately as real massing:
    - Site red-line boundary (`#f43f5e` crisp stroke)
    - Data Halls (`#38bdf8` translucent slate-cyan extruded to `height_m`)
    - Diesel Backup Generators (`#f97316` / `#ef4444` extruded blocks + animated radial dB contour ring on ground)
    - On-site Substation & BESS (`#818cf8` indigo blocks + dashed glowingHV route line to `P1` grid substation)
    - Acoustic Barrier & Native Tree Belt (`#10b981` emerald buffer polygon appearing in Rounds 1–2)
    - Residential Receptor Pins (`C1` homes within 300 m glowing red when `dB > 45`, turning cool green when `<= 42 dB`) + Planning Precedent Pins (`C2` nearby refusals/approvals clickable on map).
  - **Left Docked Panel (28% width, fixed, dark glass `#090d16/92`):**
    - **Header:** Site title, DNO & LPA badges, `Red Team Verified` pill (`e.g. 22/24 rows passed`).
    - **Round Stepper & Primary CTA:** `Round 0: Naive Fit` -> `Round 1: Acoustic Swap` -> `Round 2: Consent-Ready` + prominent **"AI Re-Plan Layout ->"** button (and `Spacebar` shortcut for smooth video recording!).
    - **Objection Risk Thermometer:** Animated score `84 -> 46 -> 21` with breakdown pills (`Noise`, `Visual`, `Highways`, `Grid/Ecology`).
    - **Objection & Mitigation Feed:** Up to 6 compact cards from `objections.json`. Each card shows severity badge (`SEV 5`), affected homes (`14 homes < 300m [C1-02]`), precedent chip (`Refused 2.4km away [C2-01]`), and applied AI fix (`Moved gen yard +340m & added 6m screen -> -19 dB`).
  - **Bottom-Right Floating Card — Institutional Value Ladder:**
    - Compact 4-row horizontal waterfall bar (`Farmland` -> `Sheds Downside Floor` -> `Round 0 Risk-Adj` -> `Current Round Powered Land`) + key metrics (`IT Load MW`, `Grid Capex £m`, `Nearest Home dBA`, `Net Land Value £m / £ per acre`), **every single number wrapped in a `<SourceChip id="..."/>`**.
  - **Slide-Over Source Proof Drawer:**
    - Clicking *any* `<SourceChip>` highlights the row and opens a clean drawer displaying: `id`, `claim`, `value + unit`, `source_org`, verbatim `quote` highlighted in a callout block, `retrieved` UTC timestamp, `RedTeam: PASS` stamp, and clickable external `url` (or SHA-256 `MSCI Receipt` hash).

---

## 4. Canonical JSON Data Contracts (`src/types/schema.ts`)

Every Bot, script, fixture, and UI component **must** adhere to these exact shapes so `data/fixtures/` swaps cleanly with `data/out/` at 21:30 with zero code edits.

### 4.1 `EvidenceRow` (`data/out/P1.json`, `P2.json`, `C1.json`, `C2.json`, `C3.json`, `S1.json`, `S2.json`)
```json
[
  {
    "id": "P1-01",
    "claim": "Nearest primary substation with published demand headroom is East Halton 33/11kV at 2.1 km.",
    "value": 18.5,
    "unit": "MVA",
    "lat": 53.6682,
    "lon": -0.2741,
    "source_org": "Northern Powergrid Open Data Portal",
    "url": "https://npg-opendata.portal.arcgis.com/...",
    "quote": "East Halton Primary — Firm Capacity 40 MVA, Peak Demand 21.5 MVA, Demand Headroom 18.5 MVA",
    "retrieved": "2026-11-12T20:45:00Z",
    "status": "found",
    "check": "pass",
    "verdict": "agrees",
    "theme": "power_water"
  }
]
```
- Allowed `status`: `"found" | "not_found" | "assumption"`
- Allowed `check` (added by Red Team): `"pass" | "fail"` (with optional `"fail_reason"`). UI filters out `"check": "fail"`.

### 4.2 `ObjectionCard` (`data/out/objections.json`)
```json
[
  {
    "id": "OBJ-01",
    "theme": "noise",
    "title": "Night-time standby diesel generator testing & tonal hum near dwellings",
    "affected_summary": "19 residential buildings within 300 m (nearest at 142 m)",
    "severity": 5,
    "precedent_id": "C2-01",
    "receptor_ids": ["C1-01", "C1-02"],
    "fix": "move generators away from homes",
    "secondary_fix": "add acoustic screen",
    "resolved_in_round": 1,
    "citation_ids": ["C1-01", "C2-01", "S2-07"]
  }
]
```
- Allowed `fix` enum (strict):
  1. `"move generators away from homes"`
  2. `"add acoustic screen"`
  3. `"move site access"`
  4. `"lower hall height"`
  5. `"add tree belt"`
  6. `"move substation"`

### 4.3 `LayoutRound` (`data/rounds/round0.json`, `round1.json`, `round2.json`)
```json
{
  "round": 0,
  "label": "Round 0 · Naive Max-Density Fit",
  "summary": "Unmitigated 64 MW IT layout places standby diesel compound on eastern boundary 142 m from dwellings.",
  "applied_fixes": [],
  "metrics": {
    "it_load_mw": 64,
    "gross_site_acres": 24.5,
    "hall_height_m": 18.0,
    "nearest_home_to_gen_m": 142,
    "predicted_receptor_dba": 58.4,
    "bs4142_compliant": false,
    "objection_risk_score": 84,
    "approval_probability_pct": 22
  },
  "underwrite": {
    "farmland_baseline_gbp_m": 0.25,
    "industrial_downside_gbp_m": 6.8,
    "gross_powered_land_gbp_m": 64.0,
    "grid_connection_capex_gbp_m": 4.2,
    "mitigation_and_s106_capex_gbp_m": 0.0,
    "risk_adjusted_land_value_gbp_m": 13.1,
    "citation_ids": ["S2-04", "S2-05", "S2-06", "P2-02", "MSCI-R1"]
  },
  "features": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": {
          "id": "gen-bank-1",
          "kind": "generators",
          "label": "32x 3MW Standby Diesel Generators",
          "height_m": 8.5,
          "color": "#ef4444"
        },
        "geometry": { "type": "Polygon", "coordinates": [[[-0.26, 53.67], [-0.259, 53.67], [-0.259, 53.671], [-0.26, 53.671], [-0.26, 53.67]]] }
      }
    ]
  }
}
```

### 4.4 `MSCIReceipt` (`data/receipts/msci_receipts.json`)
```json
[
  {
    "id": "MSCI-R1",
    "tool": "MSCI RCA MCP · get_rai_results",
    "query_summary": "Industrial & logistics investment transactions within 25 km, trailing 36 months (downside floor check)",
    "retrieved": "2026-11-12T20:55:00Z",
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "display_note": "Aggregated yield/floor benchmark only; no row-level MSCI records stored in repository."
  }
]
```

---

## 5. Minute-by-Minute Execution Timeline & Kill-Switch Protocol

| Window | Milestone | Concrete Deliverable | Hard Gate / Kill-Switch |
| --- | --- | --- | --- |
| **20:35–20:45** | **Lock Site & Fixtures** | Commit `data/site.geojson` + complete `data/fixtures/` (`P1`..`S2`, `objections.json`, `round0..2.json`). Paste universal Bot rules + launch all 7 Wave-1 Grok Bots (`P1`, `P2`, `C1`, `C2`, `C3`, `S1`, `S2`). | Do **not** debate a second site after 20:45. Lock one site and go. |
| **20:45–21:10** | **Parallel Build Wave** | **Lane 5 (UI):** Scaffold Vite + React + MapLibre Dark + `deck.gl` 3D extrusions rendering `data/fixtures/` + Round 0->1->2 animation + Source Proof Drawer. **Lane 4:** Code deterministic `layout.ts`, `acoustics.ts`, `underwrite.ts`. **Lane 3:** Run MSCI RCA MCP pulls in Cursor & log SHA-256 receipts. | By **21:10**, clicking `Round 0 -> Round 1 -> Round 2` on screen **must already animate on fixture data**. |
| **21:10–21:30** | **Red Team & Objections** | Bots post `DONE`. `RedTeam` audits every `/out/*.json` row (`check: pass/fail`). `ObjectionWriter` writes `data/out/objections.json` from verified `C1`–`C3` + `S1` rows. `Director` saves Bot clips into `demo/clips/`. | Any Bot not finished by **21:15** is frozen; missing figures fall back to `S2` / team assumptions tagged `"status": "assumption"`. |
| **21:30–22:00** | **Wire-In & Polish** | Swap UI data loader from `data/fixtures/` to verified `data/out/` + regenerated `data/rounds/round0..2.json`. Verify every visible number opens a populated Source Proof Drawer. Check zero resident names, zero firm/internal names, zero raw MSCI rows. | **22:00 FEATURE FREEZE.** No new UI components or dependencies after 22:00. |
| **22:00–22:25** | **Choreography & Dry Run** | Add keyboard hotkeys (`1`, `2`, `3` for rounds; `R` for smooth AI Re-plan animation; `B` for acoustic halo toggle) so the video take has zero fumbling mouse clicks. Check account names/avatars visible on screen. | Cut any secondary panel that clutters the 5-shot storyboard. |
| **22:25–22:45** | **Record 2-Minute Video** | Record 2 clean takes following Section 2 storyboard + splice 8–10 seconds of `Director` Bot/Red-Team clip at 0:35 if crisp. Save final MP4 to `demo/` (or external upload link + README note if >100 MB). | Keep total runtime **<= 1:58** (never exceed 2:00). |
| **22:45–22:55** | **Final Audit, Push & Submit** | Run secret/cleanliness check (`git status`, grep for `.env` / confidential terms / raw MSCI data), update `README.md` brackets, `git push origin main`, submit repo URL + video before **23:00**. | Stop touching `main` once submitted so top-5 live demo at 23:30 runs from a known-good state. |

### Progressive De-Scoping Ladder (If Behind Schedule)
1. **Cut first:** Freehand Terra Draw polygon drawing -> replace with 1-click **"Drop Candidate Red-Line"** animation.
2. **Cut second:** Side-by-side dual-map swipe (`maplibre-gl-compare`) -> single full-bleed 3D dark map that smoothly animates polygons from Round 0 -> Round 1 -> Round 2 in place (actually *cleaner* on video and half the WebGL memory).
3. **Cut third:** Live spline road-routing geometry -> straight/waypoint GeoJSON HV line from substation to site with crossing pins.
4. **NEVER CUT:** (a) Bad Round 0 -> Mitigated Round 2 3D animation, (b) Real sourced Objection Cards, (c) Value Ladder + Downside Sheds Floor, and (d) Clickable Source Chip -> Verbatim Quote Drawer. **Those four pieces ARE the winning demo.**

---

## 6. Ready-to-Paste Long-Running Cursor Agent Prompts (Per Lane)

After `git pull`, each teammate can paste their lane's prompt directly into Cursor Agent mode:

### Prompt A — Lane 4 (Deterministic Engine & Golden Fixtures)
```text
Read AGENTS.md and docs/EXECUTION_PLAN.md. You own Lane 4 (src/types/, src/engine/, data/site.geojson, data/fixtures/, data/rounds/).
Build:
1. src/types/schema.ts implementing EvidenceRow, ObjectionCard, LayoutRound, and MSCIReceipt exactly as specified in docs/EXECUTION_PLAN.md Section 4.
2. Realistic synthetic/public baseline fixtures in data/site.geojson and data/fixtures/ (P1.json, P2.json, C1.json, C2.json, C3.json, S1.json, S2.json, objections.json, msci_receipts.json) centred on Ratcliffe-on-Soar Power Station (52.8652963, -1.2550158 · Rushcliffe Borough Council · NGED East Midlands) and its surrounding area (covering power, community/socio-economic, planning/permitting, environmental/contamination, and geospatial constraints) so the UI runs end-to-end immediately, plus a loader that prefers data/out/*.json when present (filtering check !== "fail") and falls back to data/fixtures/*.json.
3. Deterministic TypeScript modules src/engine/acoustics.ts, src/engine/underwrite.ts, and src/engine/layout.ts that generate Round 0 (Naive max-density fit with diesel generators ~140m from homes, failing BS 4142 night receptor dB), Round 1 (generators relocated to far industrial edge + 6m acoustic barrier + access moved), and Round 2 (stepped 13.5m halls + 20m native tree belt + community S106 offer, showing higher net risk-adjusted land value despite modest MW trim).
Write a CLI script scripts/build_rounds.ts to regenerate data/rounds/round0..2.json whenever data/out/*.json updates, and verify with unit/smoke checks. Do not touch src/components/ or src/map/.
```

### Prompt B — Lane 5 (Demo Stage 3D Map, Animated Re-Plan & Source Drawer)
```text
Read AGENTS.md, docs/EXECUTION_PLAN.md, and docs/TEAM_BOARD.md. You own Lane 5 (package.json, vite.config.ts, index.html, src/App.tsx, src/map/, src/components/, src/styles/).
Build a high-craft dark institutional web app optimised strictly for our 5-shot 2-minute hackathon demo:
1. Vite + React + TypeScript + Tailwind + MapLibre GL JS (OpenFreeMap Dark basemap + 1-click Esri World Imagery satellite toggle, zero API keys required) + @deck.gl/mapbox MapboxOverlay rendering 3D extruded site massing (halls, standby generators, substation/BESS, acoustic wall, tree belt), pulsed residential receptor rings (red when >45 dBA, emerald when <=42 dBA), substation HV route, and nearby planning precedent pins.
2. Smooth choreographed transition between Round 0 -> Round 1 -> Round 2 (both via left-panel Round stepper / "AI Re-Plan Layout" button and keyboard shortcuts 1/2/3/R/B for clean video capture), interpolating generator/hall positions, acoustic contour radius, Objection Risk gauge (84 -> 46 -> 21), and Value Ladder bars.
3. Left docked Agent & Objection Feed showing verified research counts, Red Team PASS pill, and the 6 Objection Cards with severity, receptor counts, council refusal precedent chip, and applied fix.
4. Bottom-right Value Ladder waterfall card (Agricultural Base -> Sheds Downside Floor -> Round 0 Risk-Adj -> Current Round Powered Land) where EVERY figure and objection renders a clickable <SourceChip> opening the slide-over Source Proof Drawer (verbatim quote, source_org, timestamp, RedTeam PASS badge, external URL or SHA-256 MSCI receipt).
Consume data from data/rounds/ and data/out/ (with automatic fallback to data/fixtures/). Zero network spinners on stage.
```

### Prompt C — Lane 3 (MSCI RCA MCP Downside & Receipts Runner)
```text
Read AGENTS.md, docs/TEAM_BOARD.md ("How to use MSCI best"), and docs/EXECUTION_PLAN.md (Lane 3).
Using the configured "MSCI RCA MCP" server:
1. Run targeted single-site queries around Ratcliffe-on-Soar Power Station (52.8652963, -1.2550158): (a) industrial & logistics sales within 25 km (M1 J24 / East Midlands Gateway corridor) over the last 36 months (yield & price/area for our downside-as-sheds floor), (b) data centre projects within 50-100 km, and (c) UK development land / data centre capital-market benchmarks.
2. NEVER write raw row-level MSCI records to any tracked file. Save raw scratch output only under gitignored data/cache/ if needed, write SHA-256 query audit entries (id, tool, query_summary, retrieved, sha256) to data/receipts/msci_receipts.json, and write aggregated benchmark ranges + a USE_PUBLIC_BENCHMARKS_ONLY fallback toggle to data/out/M1_summary.json.
```
