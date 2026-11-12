# AGENTS.md — Grokathon Shared Agent Briefing

> **Pitch:** *AI plans the data centre. The neighbours object. AI plans it again.*
>
> **Event:** Grok Bot Real Estate Hackathon · London · Thursday 12 November 2026 (Code freeze **22:00** internal / **23:00** hard submission + 2-minute video).

Read this file first before touching code or data. Detailed choreography, schemas, and per-lane runbooks live in [`docs/EXECUTION_PLAN.md`](docs/EXECUTION_PLAN.md) and [`docs/TEAM_BOARD.md`](docs/TEAM_BOARD.md).

---

## Ground Rules for Every Agent (read first, always apply)

Every person, Cursor agent and Grok Bot working on this repo must follow these rules. If a task conflicts with them, the rules win. Stop and flag it instead of working around them.

1. **Follow the event rules.** Build only during the event, with one team repo. Hard freeze at 23:00, with nothing pushed after that, and a video of 2:00 or less. See `docs/RULES_CHECK.md`.
2. **Every figure is traceable.** Follow `docs/TRACEABILITY_RULES.md`. Every number has a link plus a word-for-word quote, or is labelled as an estimate (with its method) or an assumption. Only Red Team `pass` rows reach the screen.
3. **Never invent anything.** No made-up figures, quotes, URLs, planning references, sources or citations. If you cannot find it, write `status: "not_found"` and move on.
4. **Public data only, plus receipted MSCI.** Use public sources from `docs/PUBLIC_DATA_SOURCES.md`. MSCI goes in as aggregated ranges with a SHA-256 receipt only. No raw MSCI rows in tracked files, and raw scratch stays in `data/cache/`.
5. **No confidential or personal names.** No employer, client, live deal, counterparty or internal tool names anywhere. No private residents' names, only buildings, councils, companies and public officials.
6. **No secrets in git.** Keys stay in `.env`, which is gitignored. Never commit credit codes, tokens or passwords.
7. **Stay in your lane.** Only edit the files your lane owns (section 2). Write to the agreed JSON shapes in `docs/EXECUTION_PLAN.md` section 4 so files swap in without code changes.
8. **One site only.** All data is for Ratcliffe-on-Soar and its search rings (section 0).
9. **Check before you push.** Run `python3 scripts/check_traceability.py` and make sure it shows 0 errors before pushing data or screens. Pull before you push, and never force-push.
10. **Say what you did.** When you finish, report which files you changed, how many rows were found, not found or failed, and anything you could not source.

### Paste-in for Grok Bots (they cannot read this repo)

Paste this at the top of every Grok Bot brief:

```text
Ground rules: Research only Ratcliffe-on-Soar Power Station (NG11 0EE, 52.8652963,-1.2550158) and its surrounding area. Use public sources only. Every figure must come with the source organisation, a live URL, the exact word-for-word quote containing it, and the time you retrieved it. Never invent or estimate a figure, quote, URL or planning reference; if you cannot find it, mark it not_found. Do not name private individuals, only buildings, councils, companies and public officials. Do not mention any employer, client or live deal. Return only JSON in the agreed EvidenceRow shape.
```

---

## 0. Locked Hero Site — All Repo Data Collection Targets This Area Only

**Every teammate, Cursor agent, and Grok Bot in this repository MUST anchor all data collection, fixtures, spatial layers, and analysis on this single site and its surrounding area:**

- **Target Site:** **Ratcliffe-on-Soar Power Station** (and immediate surrounding area, Nottinghamshire, `NG11 0EE`)
- **Reference Pin (WGS84):** `52.8652963, -1.2550158` ([Google Maps Satellite View](https://www.google.com/maps/place/Ratcliffe-on-Soar+Power+Station/@52.863973,-1.2573881,4147m/data=!3m1!1e3!4m14!1m7!3m6!1s0x4879e629a4428b85:0x2a1b975e581e6828!2sRatcliffe-on-Soar+Power+Station!8m2!3d52.8652963!4d-1.2550158!16zL20vMDl5M214!3m5!1s0x4879e629a4428b85:0x2a1b975e581e6828!8m2!3d52.8652963!4d-1.2550158!16zL20vMDl5M214))
- **Primary LPA / Council:** **Rushcliffe Borough Council** (Nottinghamshire County Council). *Note: 2–5 km surrounding radii cross river/county boundaries into **North West Leicestershire District Council**, **Erewash Borough Council**, and **Broxtowe Borough Council** — include adjacent cross-boundary portals in regional searches.*
- **DNO & Transmission Context:** **National Grid Electricity Distribution (NGED — East Midlands)** for `<=132 kV` distribution/ECR, plus on-site/adjacent **National Grid Electricity Transmission (NGET)** `400 kV` substation & NESO TEC queue context.
- **Surrounding Communities / Receptors:** Ratcliffe-on-Soar village, Kingston on Soar, Thrumpton, Barton in Fabis, Gotham, Kegworth, Long Eaton, Clifton, and East Midlands Parkway / M1 J24 / A453 corridor.

### Mandatory Site-Centred Data Scope Across All Lanes
All data gathering across the team must be centred on **Ratcliffe-on-Soar and its surrounding search rings (`150 m` / `300 m` / `1 km` / `5 km` / `25 km`)**, specifically covering:
1. **Socio-Economic & Community Data:** Census 2021 & IoD deprivation profile (Gotham ward & neighbouring parishes), nearby residential receptors, schools/care homes/places of worship, local councillor representation, and parish/council infrastructure gaps.
2. **Planning & Permitting Data:** Rushcliffe Borough Council (including Ratcliffe-on-Soar LDO / East Midlands Freeport planning history) & 5 km surrounding LPA applications/refusals/objections, plus Environment Agency (EA) environmental & Medium Combustion Plant / IED (`>=50 MWth`) permitting requirements.
3. **Power & Grid Data:** NGED East Midlands `<=132 kV` substations, demand headroom, Embedded Capacity Register (ECR), NESO TEC queue, HV route corridors, rail/river/trunk-road crossings, and published connection unit costs.
4. **Environmental & Contamination Data:** Former coal-fired power station brownfield land contamination, pulverised fuel ash (PFA) / ground remediation & demolition constraints, EA Flood Zones 2 & 3 (River Soar & River Trent confluence), SSSI / ecological designations (e.g. Lockington Marshes, Attenborough Gravel Pits, Thrumpton), air quality, and BS 4142 night-time acoustic baselines.
5. **Geospatial & Physical Site Data:** Site red-line polygon (`data/site.geojson`), topography/cooling-tower/hall height envelope, overhead transmission corridors & easements, Midland Main Line / East Midlands Parkway rail edge, A453 / M1 J24 HGV access, and Public Rights of Way (PRoW).
6. **Capital Markets & Comps (`25–50 km`):** M1 J24 / East Midlands Gateway industrial & logistics transactions for the downside floor, plus regional data centre & powered/development land benchmarks.

---

## 1. Demo-First Engineering Doctrine

We are optimising **100% for a 2-minute judged video and a 2-minute live stage run**, NOT a general-purpose SaaS platform.

1. **If it is not visible in one of the 5 video shots, do not build it.** No auth, login walls, multi-tenant dashboards, settings modals, PDF export pipelines, or free-form chat sidebars.
2. **One hero UK site, three deterministic layout rounds (`Round 0` -> `Round 1` -> `Round 2`).**
   - `Round 0 (Naive Fit)` **must be visibly flawed on purpose**: backup diesel generators placed near the residential edge, tall halls exposed, HGV access near homes — triggering high objection risk.
   - `Round 1` & `Round 2` animate concrete spatial mitigations (`move generators away from homes`, `add acoustic screen`, `move site access`, `lower hall height`, `add tree belt`, `move substation`), visibly dropping the objection risk score and updating the land value ladder.
3. **Zero live network calls during the demo recording.** Bots and scripts write verified JSON files into `data/out/` and `data/rounds/`. The web app loads local static JSON (starting from `data/fixtures/` from minute one, hot-swapped to verified `data/out/` at wire-in) so transitions run at 60 fps with zero spinners.
4. **Code does geometry and arithmetic; models write words and extract quotes.** Distances (m/km), dB attenuation, MW capacity, capex (`km * unit_cost`), and residual land values are computed deterministically in TypeScript (`src/engine/`), never hallucinated by an LLM.
5. **Every number and objection on screen has a clickable Source Chip** (`[P1-01]`, `[C2-03]`, `[S2-04]`, `[MSCI-R1]`) that opens the exact verbatim quote, source organisation, URL, timestamp, and Red Team verification status.

---

## 2. Designated Areas of Attack (Strict File Ownership)

Never edit files outside your assigned lane without coordinating first — this keeps parallel Cursor agents and Grok Bots merge-conflict-free.

| Lane | Scope | Exclusive Write Paths | Primary Inputs / Tools |
| --- | --- | --- | --- |
| **Lane 1 — Power & Grid** | Nearest <=132 kV substations, DNO headroom, ECR/TEC queue, road/straight-line route, crossings, £/km connection cost | `data/out/P1.json`, `data/out/P2.json`, `scripts/power/` | Grok Bots `P1`, `P2`, DNO open portals, NESO CKAN, OSM |
| **Lane 2 — Community, Planning & Red Team** | Nearby homes/receptors (`150m`/`300m`/`1km`), 5 km council refusals & verbatim objection quotes, Census/IoD ward profile, Red Team check, max 6 objection cards | `data/out/C1.json`, `data/out/C2.json`, `data/out/C3.json`, `data/out/objections.json`, `data/receipts/ledger.csv`, `demo/clips/` | Grok Bots `C1`–`C3`, `RedTeam`, `ObjectionWriter`, `Director`, PlanIt, Nomis |
| **Lane 3 — Capital Markets & Downside** | Industrial/logistics 25 km downside floor, DC project pins, land value ladder benchmarks + SHA-256 query receipts | `data/receipts/msci_receipts.json`, `data/out/M1_summary.json`, `src/engine/underwrite.ts` | Cursor + `MSCI RCA MCP` (local cache gitignored; receipts only in git) |
| **Lane 4 — Site Physics & Layout Solver** | Site boundary, easements/flood/height limits (`S1`), sourced rules of thumb (`S2`), parametric 3D layout generator & dB/risk calculator across Rounds 0–2 | `data/site.geojson`, `data/out/S1.json`, `data/out/S2.json`, `data/rounds/`, `data/fixtures/`, `src/engine/layout.ts`, `src/engine/acoustics.ts`, `src/types/` | Grok Bots `S1`, `S2`, Cursor deterministic TypeScript solver |
| **Lane 5 — Demo Stage UI (Map + 3D + Feed)** | Near-black MapLibre + `deck.gl` extruded 3D layout, animated Round 0->1->2 transition, left Agent/Objection feed, bottom/right Value Ladder, Source Proof Drawer | `src/App.tsx`, `src/map/`, `src/components/`, `src/styles/`, `index.html`, `package.json`, `vite.config.ts` | MapLibre GL JS, OpenFreeMap Dark, `deck.gl`, Tailwind / shadcn |

---

## 3. Hard Guardrails (Non-Negotiable)

- **No confidential firm, live deal, client, or counterparty names** anywhere in code, data, comments, commits, UI, or video. Public/synthetic site data only.
- **No raw MSCI rows in git.** Never commit row-level MSCI exports. Commit only aggregated summary assumptions approved for display plus cryptographic query receipts (`tool`, `query`, `retrieved`, `sha256`) in `data/receipts/msci_receipts.json`. Raw local pulls stay in gitignored `data/cache/`.
- **No private individuals.** Buildings, companies, councils, and elected officials in their public role only. Strip any resident name from planning comments.
- **No unsourced numbers.** Every `EvidenceRow` must carry `status: "found" | "not_found" | "assumption"`. Any `"found"` row requires both a live `url` and verbatim `quote` verified by Red Team (`check: "pass"`). Failed rows are excluded from the UI.
- **Secrets stay in `.env` (gitignored).** Reference environment variables via `.env.example` names or `${env:VAR}` in `.cursor/mcp.json`.
