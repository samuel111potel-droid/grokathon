# Grokathon — Watts Up DC

> **AI plans the data centre. The neighbours object. AI plans it again.**
>
> Built at the Grok Bot Real Estate Hackathon, London, 12 November 2026.

## Locked Target Hero Site (All Data Collection)
All data collection, fixtures, and spatial modelling across this repository are strictly anchored on **Ratcliffe-on-Soar Power Station** and its surrounding area:
- **Site & Pin:** **Ratcliffe-on-Soar Power Station**, Nottinghamshire (`NG11 0EE`) · `52.8652963, -1.2550158` ([Google Maps](https://www.google.com/maps/place/Ratcliffe-on-Soar+Power+Station/@52.863973,-1.2573881,4147m/data=!3m1!1e3!4m14!1m7!3m6!1s0x4879e629a4428b85:0x2a1b975e581e6828!2sRatcliffe-on-Soar+Power+Station!8m2!3d52.8652963!4d-1.2550158!16zL20vMDl5M214!3m5!1s0x4879e629a4428b85:0x2a1b975e581e6828!8m2!3d52.8652963!4d-1.2550158!16zL20vMDl5M214))
- **Council / LPA:** **Rushcliffe Borough Council** (with 5 km surrounding searches also covering adjacent North West Leicestershire, Erewash, and Broxtowe councils)
- **DNO & Grid:** **National Grid Electricity Distribution (NGED — East Midlands)** (`<=132 kV` + ECR) alongside the on-site **NGET 400 kV** substation & NESO TEC queue
- **Required Data Scope Around This Site:** Socio-economic & community data, planning & permitting (LPA portals, LDO/Freeport, EA combustion/environmental permits), power & grid data, environmental & brownfield contamination (legacy coal plant / ash / remediation, flood zones, ecology, acoustics), geospatial constraints, and 25 km M1 J24 / East Midlands industrial downside comps.

## Problem
UK data centre sites stall on two constraints: primary grid headroom and local planning refusal (standby generator noise, visual massing, HGV routing, and Green Belt/ecological impact). Existing site-fit tools draw unmitigated boxes on a map and leave reviewers unable to trace headline power, objection, or land-value numbers back to primary records.

## What It Does
- **Parallel Agent Diligence (`P1`–`S2` + `RedTeam`):** Coordinated Grok Bots pull <=132 kV substation headroom, cable route crossings, residential receptors within 150 m–1 km, 10-year council refusal precedents, and Census/deprivation profiles — audited by a Red Team pass that drops any claim lacking a live URL and verbatim quote.
- **Deliberate Naive Fit -> Animated AI Re-Plan (`Round 0 -> Round 1 -> Round 2`):** Dual MapLibre maps (round 0 vs current), homes coloured by `noiseAtHome` on a five-step dB scale, objection cards from live C2 rows, and a Community tab of C3 ward facts — each figure with a source chip.
- **Institutional Value Ladder + Source Chips:** Updates residual powered-land value each round above a sourced industrial-sheds downside floor, with clickable **Source Chips** opening the exact verbatim quote, URL, timestamp, or SHA-256 query receipt.

## How to Run
```bash
git clone https://github.com/samuel111potel-droid/grokathon.git
cd grokathon
npm install
npm run dev          # opens on http://localhost:5173
npm test
```
Prefer `data/live/{C1,C2,C3,P1,P2,S1,S2}.json` (flat EvidenceRow lists) when present; otherwise `data/sample/`. See `data/README.md`. To check that every figure is sourced:
```bash
python3 scripts/check_traceability.py
```

## Stack
- **Grok Bot:** ten coordinated research bots (`P1`, `P2`, `C1`–`C3`, `S1`, `S2`, `RedTeam`, `ObjectionWriter`, `Director`) that pull public records and check every claim.
- **Cursor:** builds the layout engine, the noise and value maths, and the map UI, plus the MSCI connector for the downside floor.
- **Front end:** Vite, React, TypeScript, MapLibre and deck.gl (3D massing).

## Traceable Data
Every number on screen has a **Source Chip**. Clicking it opens the source URL, the exact quote, when it was retrieved, and the Red Team result. Calculated figures are labelled as estimates and show their method. Assumptions carry a badge, C1 coordinate-derived fails show a grey **computed** chip, and anything we could not find is shown as not found rather than guessed. The full rules are in [`docs/TRACEABILITY_RULES.md`](docs/TRACEABILITY_RULES.md), and `scripts/check_traceability.py` enforces them.

## Team Start Here (Shared Cursor + Grok Bot Setup)
1. [`AGENTS.md`](AGENTS.md) — Shared rules, lane ownership, and clean-room guardrails (auto-loaded by Cursor).
2. [`docs/EXECUTION_PLAN.md`](docs/EXECUTION_PLAN.md) — **Designated Areas of Attack (5 parallel lanes)**, 120-second shot-by-shot storyboard, JSON data contracts, minute-by-minute runbook, and ready-to-paste Cursor prompts.
3. [`docs/TEAM_BOARD.md`](docs/TEAM_BOARD.md) — All 10 Grok Bot prompts (`Lead`, `P1`, `P2`, `C1`–`C3`, `S1`–`S2`, `RedTeam`, `ObjectionWriter`, `Director`) and MSCI query priorities.
4. [`docs/PUBLIC_DATA_SOURCES.md`](docs/PUBLIC_DATA_SOURCES.md) — Tested UK & Ireland free public APIs (`PlanIt`, `NESO`, `Nomis`, `IoD 2025`, `Democracy Club`, `Petitions`, `Overpass`) and contested UK DC precedents.
5. [`docs/PREP_AND_SCRIPT.md`](docs/PREP_AND_SCRIPT.md) — Timetable, judging criteria, pre-recording checklist, and 2-minute voiceover script.
6. [`docs/RULES_CHECK.md`](docs/RULES_CHECK.md) and [`docs/TRACEABILITY_RULES.md`](docs/TRACEABILITY_RULES.md) — Event rules, judging checklist, and the data traceability rules every agent follows.

## Repository Layout (target structure; folders fill in during the build)
```text
AGENTS.md                  # Root Cursor/Bot briefing & strict file ownership
.cursor/                   # Shared MCP config (MSCI RCA MCP), .mdc rules, Bugbot checks
docs/                      # Execution plan, bot prompts, public data APIs, demo script
data/
  site.geojson             # Candidate red-line boundary
  live/                    # Flat EvidenceRow lists from research bots (preferred)
  sample/                  # Fallback fixtures for the dual-map UI
  fixtures/                # Golden sample JSONs (identical schema to data/out/)
  out/                     # Red-Team-verified Bot outputs (P1..S2, objections, M1_summary)
  rounds/                  # Generated Round 0, Round 1, Round 2 3D GeoJSON + metrics
  receipts/                # Source ledger.csv + SHA-256 msci_receipts.json (no raw MSCI rows)
src/
  types/                   # Canonical TypeScript schemas
  engine/                  # Deterministic layout, BS 4142 acoustics & residual valuation
  map/ & components/       # MapLibre Dark + deck.gl 3D extrusions + Source Proof Drawer
demo/                      # Director bot clips & final 2-minute video
```

## Demo
The two-minute video goes in `demo/`.

## Data & Clean-Room Policy
All repository inputs are public open data or synthetic fixtures. No confidential firm, client, or live transaction data, no private resident names, and no row-level MSCI exports are stored in this repository.
