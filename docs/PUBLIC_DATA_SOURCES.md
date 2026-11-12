# Public Open-Data APIs & Contested Data Centre Precedents (UK & Ireland)

Reference pack for **Lane 1 (Power)** and **Lane 2 (Community & Planning History)**. All endpoints below are public open data; endpoints marked `(tested)` returned live data on 12 November 2026.

---

## 1. Programmatic Public APIs (No Paid Keys Required)

### Planning Applications, Decisions & Constraint Layers
| Source | Endpoint / URL | What It Returns | Access & Notes |
| --- | --- | --- | --- |
| **PlanIt** `(tested)` | `https://www.planit.org.uk/api/applics/json` | UK council planning applications: description, decision state (`Permitted`, `Conditions`, `Rejected`, `Withdrawn`, `Undecided`), dates, `lat`/`lng`, ward, parish, `n_comments`, `appeal_status`, `appeal_result`, `docs_url` | Free JSON/GeoJSON, no key, `pg_sz` up to 300 (pause politely between requests). Query `"data centre"` returned 888 records on 12 Nov 2026. |
| **MHCLG Planning Data** | `https://www.planning.data.gov.uk/entity.json?dataset=...` | Green belt, conservation areas, listed buildings, flood risk zones, Article 4, tree preservation orders, brownfield land | Free REST JSON/GeoJSON (OGL). *Note: returned intermittent HTTP 503 on 12 Nov 2026 — cache early or use PlanIt for applications.* |
| **NSIP Register (PINS)** `(tested)` | `https://national-infrastructure-consenting.planninginspectorate.gov.uk/api/applications-download` | All England & Wales Development Consent Order (DCO) projects: type, region, grid reference, stage, key dates | Free CSV download, no key (562 rows on 12 Nov 2026). |
| **Ireland National Planning DB** `(tested)` | `https://services.arcgis.com/NzlPQPKn5QF9v2US/arcgis/rest/services/IrishPlanningApplications/FeatureServer/0` | All Irish council applications since 2012 with decisions, ITM coords, and `AppealDecision` | Free ArcGIS REST SQL/GeoJSON, no key. |

### Power, Grid Headroom & Environmental Constraints
| Source | Endpoint / URL | What It Returns | Access & Notes |
| --- | --- | --- | --- |
| **NESO Data Portal** `(tested)` | `https://api.neso.energy/api/3/action/package_search` | Transmission Entry Capacity (TEC) register, connections queue, national demand datasets | Free CKAN REST API, open licence. |
| **UK DNO Open Portals** | NGED, UKPN, SSEN, ENWL, Northern Powergrid, SPEN open data portals | Primary/BSP <=132 kV substation coordinates, firm capacity, peak demand, demand headroom, and Embedded Capacity Register (ECR) | Free open portals (ArcGIS / CKAN / CSV exports). |
| **Environment Agency** | `https://environment.data.gov.uk/` | Flood Map for Planning (Flood Zones 2 & 3 WMS/WFS/GeoJSON), water stress areas | Free OGL APIs & WMS tiles. |
| **OpenStreetMap Overpass** | `https://overpass-api.de/api/interpreter` | Residential building footprints (`building=residential|house|apartments`), schools, care homes, substations (`power=substation`), lines (`power=line`), railways, rivers | Free, no key. Cache responses locally in `data/out/`. |

### Community Profile, Ward Politics & Local Sentiment
| Source | Endpoint / URL | What It Returns | Access & Notes |
| --- | --- | --- | --- |
| **Nomis (ONS Census 2021)** `(tested)` | `https://www.nomisweb.co.uk/api/v01/` | Census 2021 tables from Output Area / LSOA / Ward upwards: age bands, tenure (`TS054`), economic activity, qualifications | Free REST JSON/CSV (OGL), no key required for single-ward pulls. |
| **ONS Open Geography** | `https://geoportal.statistics.gov.uk` | Ward, parish, LSOA, and local authority boundaries & point-in-polygon lookups | Free ArcGIS REST API (OGL). |
| **English Indices of Deprivation 2025** | `https://www.gov.uk/government/statistics/english-indices-of-deprivation-2025` | IMD deciles and 7 domain scores across 33,755 LSOAs | Free OGL CSV/XLSX. |
| **Democracy Club** `(tested)` | `https://candidates.democracyclub.org.uk/api/next/` | Ward-level UK election candidates, parties, and results | Free REST API (CC BY). |
| **Open Council Data UK** | `https://opencouncildata.co.uk/history.php` | Party composition and political control of every UK council | Free CSV. |
| **UK Parliament Petitions** `(tested)` | `https://petition.parliament.uk/petitions.json?q=...` | Petition signatures broken down by Westminster constituency (e.g. Petition `776949` on AI data centres & BESS outside AI Growth Zones: 43,684 signatures) | Free JSON API, no key (OGL). |
| **GDELT DOC 2.0** `(tested)` | `https://api.gdeltproject.org/api/v2/doc/doc` | Local & national news coverage and tone (`1 req / 5s` rate limit) | Free REST API, no key. |

---

## 2. Contested UK Data Centre Precedents (Reference Calibration Set)

Comment counts below are live `PlanIt` `n_comments` values retrieved on 12 November 2026:

| Scheme | Authority & Ref | Status / Outcome | Primary Material Grounds & Signal |
| --- | --- | --- | --- |
| **Larbert, Glenbervie (300 MW AI campus)** | Falkirk `P/26/0237/FUL` | Pending | **7,265 comments**; ~200 standby diesel generators, 24-hour noise, tree loss raised at pre-determination hearing |
| **Spango Valley, Inverkip (former IBM)** | Inverclyde `26/0136/IC` | Pending PPP | **2,210 comments** |
| **East Park & Ride, Llanrumney** | Cardiff `26/00109/HYB` | Pending hybrid | **1,644 comments** |
| **Land east of South Mimms, Potters Bar** | Hertsmere `24/1152/OUTEI` | Outline granted Feb 2025; REM `26/1187/REM` pending | **1,472 comments**; Green Belt siting, 62% local survey opposition (Peeroo & Wolf 2026) |
| **Former Mercure Hotel, Watford** | Hertsmere `25/1781/FUL` | Pending | **1,222 comments** |
| **Arena Essex, Purfleet** | Thurrock `25/00573/OUT` | Pending | **842 comments** |
| **Ipswich Road, Keswick** | South Norfolk `2026/2957` | Pending | **717 comments** |
| **Bedmond Road, Abbots Langley** | Three Rivers `23/1068/OUT` | Refused by LPA Jan 2024; allowed on SoS appeal `3346061` (May 2025) | **75 comments**; Green Belt harm vs unmet digital infrastructure need |
| **Woodlands Park, Iver** | Buckinghamshire | Refused by LPA June 2024; allowed by SoS July 2025 (grey belt) | Parish council & MP objections; Green Belt & visual massing |
| **South Gyle (213 MW)** | City of Edinburgh | Refused unanimously early 2026 | Power/climate compliance under NPF4 ("green data centre" test) |

---

## 3. Empirical Predictors of Planning Pushback (Published Literature)

Use these grounded relationships to justify the deterministic risk score weights in `src/engine/`:
1. **Material planning grounds dominate attitudinal factors** — Landscape/visual massing, acoustic impact (BS 4142), highways/HGV routing, and Green Belt harm outweigh general sentiment in committee decisions (*Roddis et al., Applied Energy 2018*).
2. **Scale & campus MW** — Larger capacity and building envelope lower local acceptance odds (*Harper et al., Energy Policy 2019*); 100 MW+ schemes attract the highest objection volumes in the UK dataset.
3. **Proximity & visibility to dwellings** — Receptor distance within 300 m–1 km strongly drives mobilisation and local electoral pressure on ward councillors (*Roddis et al. 2018; Stokes, AJPS 2016*).
4. **Actionable design & community mitigation** — Moving diesel generators off the residential edge, acoustic screening, height reduction, woodland screening, and visible local infrastructure contributions directly neutralise the material refusal grounds (*SEC Newgate UK Data Centre Research 2026: positive support rises from ~33% to >60% when concrete mitigations and benefits are shown*).
