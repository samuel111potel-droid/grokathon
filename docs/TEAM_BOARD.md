Team board · Thursday 12 November 2026 · drawn from tonight's team talk

# AI plans the data centre. The neighbours object. AI plans it again.

One map. The user picks a site. The app draws a first layout, predicts what the community will object to, then changes the layout to answer the objections. A land value with sources updates each round.

- **Track:** Own idea
- **Audience:** Institutional investors
- **What gets scored:** 2-minute video
- **Team goal:** Top five

## Locked Target Site (All Data Collection)

- **Site:** **Ratcliffe-on-Soar Power Station** & surrounding area, Nottinghamshire (`NG11 0EE`)
- **Coordinates (WGS84):** `52.8652963, -1.2550158` ([Google Maps Link](https://www.google.com/maps/place/Ratcliffe-on-Soar+Power+Station/@52.863973,-1.2573881,4147m/data=!3m1!1e3!4m14!1m7!3m6!1s0x4879e629a4428b85:0x2a1b975e581e6828!2sRatcliffe-on-Soar+Power+Station!8m2!3d52.8652963!4d-1.2550158!16zL20vMDl5M214!3m5!1s0x4879e629a4428b85:0x2a1b975e581e6828!8m2!3d52.8652963!4d-1.2550158!16zL20vMDl5M214))
- **Council / LPA:** **Rushcliffe Borough Council** (5 km radius also touches North West Leicestershire, Erewash, and Broxtowe)
- **DNO:** **National Grid Electricity Distribution (NGED — East Midlands)** (+ NGET 400 kV grid node on-site)
- **All team data collection must focus around this site and its surrounding area:** socio-economic & community data, planning & environmental permitting, power & grid capacity, environmental & brownfield contamination (legacy coal station / ash / remediation / flood / ecology), geospatial layers, and M1 J24 / East Midlands industrial comps.

## Agent plan for tonight

Three people, ten Bots, two Cursor jobs. Site is locked above so every Bot shares the exact same name, centre point, boundary, council and electricity distribution company. Feature freeze is 22:00.

| Lane | Owner | Bots | Cursor job |
| --- | --- | --- | --- |
| Power | Person 2 (Martin & Rio) | P1 Substations · P2 Route and cost | None |
| Community | Teddy | C1 Neighbours · C2 Planning history · C3 Local profile | None |
| Site | Person 3 (Nico & Sam) | S1 Site limits · S2 Rules of thumb | The screen and the layout code |
| Money | Teddy | None. MSCI does not run on Grok Bot | M1 MSCI pulls |
| Shared | Teddy | Lead · Red Team · Director · then Objection Writer | None |

**20:25–20:35 — Set up**
Pick the site. Paste the rules and the briefs.

**20:35–21:10 — Wave 1**
Seven research Bots run at once. MSCI test queries in Cursor. Screen built on sample files.

**21:10–21:30 — Check**
Red Team checks every row. Objection Writer writes cards and three layout rounds.

**21:30–22:00 — Wire in**
Real files replace the samples. Director saves the clips.

**22:00 — Freeze**
Cut the 2-minute video. Submit by 22:50.

---

### Rules for every Bot. Paste first, once.

```text
Rules for every Bot tonight.
Site: Ratcliffe-on-Soar Power Station, centre [52.8652963, -1.2550158], council Rushcliffe Borough Council (check adjacent NW Leicestershire / Erewash / Broxtowe within 5 km), distribution company National Grid Electricity Distribution (NGED East Midlands). Boundary file: /workspace/site.geojson.
1. Write your answer to /workspace/out/<YOUR-ID>.json as a list of rows. Each row:
   {"id": "P1-01", "claim": "plain sentence", "value": 0, "unit": "", "lat": 0, "lon": 0,
    "source_org": "", "url": "", "quote": "the exact words or table cell that hold the value",
    "retrieved": "2026-11-12T20:40Z", "status": "found"}
2. status is "found", "not_found" or "assumption". No value without a url and a quote. If you cannot find it, write not_found. Never estimate.
3. Open every source page. A search snippet is not evidence.
4. Buildings, companies, councils and elected officials in their public role only. No private individuals.
5. Do the task once, for this one site. Do not widen it.
6. Add one line per source to /workspace/receipts/ledger.csv.
7. Hand me the computer for any sign-in or CAPTCHA. Do not create accounts.
8. Post "DONE <ID>: <n> found, <n> not found" in the channel by 21:10.
```

### Lead · Teddy

```text
@Lead Product: a map that puts a data centre layout on this site, predicts what the community will object to, re-plans the layout, and shows a land value with sources. Keep /workspace/board.md. List the seven research jobs (P1, P2, C1, C2, C3, S1, S2) with status. At 21:10 send every file in /workspace/out to Red Team. Then start Objection Writer. Ask me only for judgement calls, on one card. Freeze at 22:00.
```

### P1 Substations and headroom · Person 2

```text
@P1 Find the five nearest substations to the site at 132 kV and below. Use the distribution company's open data portal, capacity map or published development statement. For each: name, voltage, lat, lon, distance to the site centre in km, demand headroom with its unit and the date of the data. Then look for the distribution company's Embedded Capacity Register and the national transmission entry capacity register, and list any projects queued at those substations. Say plainly what is not published above 132 kV.
```

### P2 Route and connection cost · Person 2

```text
@P2 Wait for P1's nearest substation with headroom. Using OpenStreetMap, give the straight-line distance to the site and the shortest route along public roads. List every crossing on that route: railway, motorway, river, protected area. Find a published cost per km for overhead line and for underground cable at that voltage, from a UK network company or regulator document. Quote it. Test this team assumption and say agrees, differs or no source: "about $400,000 per km". Do no arithmetic beyond length times unit cost, and show both numbers.
```

### C1 Neighbours · Teddy

```text
@C1 Using OpenStreetMap and official open data, list what sits near the site boundary. Homes: count residential buildings within 150 m, 300 m and 1 km, and give the lat, lon of the nearest twenty. Schools, places of worship and care homes within 1 km: name, lat, lon, distance, compass bearing from the site centre. Protected areas within 2 km: nature sites, listed buildings, flood zones 2 and 3, from the government body that publishes each. Buildings only. No names of residents.
```

### C2 Planning history · Teddy

```text
@C2 On the council's planning portal, find applications within about 5 km of the site in the last ten years for: data centres, large industrial or logistics buildings, battery storage, solar farms, substations. For each: reference, one-line description, decision, date. Quote the reasons for refusal, or the main objections, exactly as written in the decision notice, officer report or committee minutes. Give the number of objection letters if the report states it. Tag each objection with one theme: noise, traffic, visual, ecology, flood, power or water use, jobs, other.
```

### C3 Local profile and issues · Teddy

```text
@C3 For the ward or wards that hold the site, from Census 2021 and official statistics: population, age bands, employment rate, housing tenure, deprivation decile. From the council website: the ward councillors' parties and the date of the next local election. Then find stated local infrastructure gaps (sewage, roads, school places, flood defence, broadband) in parish council minutes, the council's infrastructure plan or local news. Each gap needs a quote. These are the things a developer could offer to pay for.
```

### S1 Site limits · Person 3

```text
@S1 For the site boundary: the local plan allocation / Local Development Order and the policy that applies, any height or design guidance, brownfield / legacy coal-plant contamination & remediation constraints, agricultural land grade, flood zone (River Soar / Trent), public rights of way, and any pipeline or overhead line that crosses or touches the site (OpenStreetMap, then the operator's own map). For each crossing, find the operator's published stand-off distance and quote it. Test this team assumption and say agrees, differs or no source: "5 metres either side".
```

### S2 Rules of thumb · Person 3

```text
@S2 Find a public source for each number the layout and the valuation will use. For each, give the published value, the quote, the URL, and a verdict against the team's figure: agrees, differs or no source.
Team figures to test:
- AI training rack density about 130 kW per rack; standard cloud about 10 kW per rack
- on-site backup generation at least 50% of critical load
- environmental permitting starts at 50 MW thermal on site (check the UK rule, not only the EU one)
- about 4 MW of IT load per acre
- UK farmland about £10,000 an acre
- unconsented development land two to four times farmland
- powered land about £1m per MW
Also find: typical generator noise in dB at a stated distance, and the UK standard used to assess industrial noise at homes.
```

### Red Team. Start at 21:10 · Teddy

```text
@RedTeam For every row in every file in /workspace/out: open the url, find the quote, check the value is in the quote. Mark pass or fail in a new field "check", with one reason for each fail. Fail any row whose page does not load, whose source is a search snippet, or that names a private individual. Post pass and fail counts per file on the board. Failed rows do not go to the app.
```

### Objection Writer. After Red Team · Teddy

```text
@ObjectionWriter Read C1, C2, C3, S1 and /workspace/layout_round0.json. Write at most six objection cards to /workspace/out/objections.json. Each card: theme, who is affected (a count and a distance from C1), precedent (the C2 row id), severity 1 to 5, and one fix chosen from this list only: move generators away from homes, add acoustic screen, move site access, lower hall height, add tree belt, move substation. Every card cites row ids. Invent no residents and no quotes. Severity rule: 5 if a C2 refusal cites the same theme within 5 km, 3 if an objection cites it, 1 if only C1 distance supports it.
```

### Director · Teddy

```text
@Director Save a clip of each of these to /workspace/clips as it happens: a Bot working the council planning portal; a Bot reading the network capacity map; two Bots handing work over in the channel; Red Team failing a row; one question card to a person. Claim only what the clips show.
```

---

## Engineering & Safety Rules

**The screen and layout code, in Cursor**
- Build against sample files with the same row shape from minute one.
- Code does the geometry and the sums: generator-to-home distance, length times unit cost.
- The model writes words only.

**Hard rules**
- No MSCI rows in the repo. Receipts only: tool, query, time, hash.
- API keys stay in a local `.env` on a laptop. Never on a Bot's computer.
- No personal GitHub login on a Bot or a cloud agent.
- Check the account name on screen before every recording.

**Do not count on**
- A Bot starting a Cursor cloud agent. People carry Bot files into Cursor.
- All seven Bots finishing. Any file that is late is left out, and its figures show as team assumptions.

---

## How to use MSCI best

MSCI's strongest use here is the downside value, not the upside. Its own page says the data centre product covers transactions, pricing and yields, projects from planning through completion with capacity and status, and buyers, sellers and lenders.

| Rank | Ask MSCI for | Where it shows | Confidence it is there |
| --- | --- | --- | --- |
| 1 | Industrial and logistics sales within 25 km, last 3 years: price, size, yield | The downside-as-sheds figure in the last shot | High. Core transaction data |
| 2 | Data centre projects within 50 km, any stage: owner, capacity, status | Pins on the map. A consented scheme nearby is a precedent | Medium |
| 3 | Development land sales within 50 km, by intended use | The middle steps of the value ladder | Medium (`Development Land - Data Center` and `- Industrial`) |
| 4 | Data centre sales in the UK and Europe, last 36 months: price, yield, buyer, seller | Exit value and a named buyer list | Medium |
| 5 | Data centre loans in Europe: lender, amount, rate type, maturity | Who would lend against this site | Medium |
| 6 | UK industrial price history, 2000 to today | A stress on the downside value | Not checked |

**Rules from the MSCI agreement**
- Run MSCI calls in Cursor. Grok Bot is not on its list.
- Query per deal. No bulk download.
- No MSCI rows on GitHub. Delete the local cache after the event.
- Ask the MSCI team if its figures may appear in the video.

Public MSCI context links:
- [Data-Center Capital Markets Mature as Hyperscale Exits Grow](https://www.msci.com/research-and-insights/quick-take/data-center-capital-markets-mature-as-hyperscale-exits-grow) (15 July 2026)
- [MSCI Real Capital Analytics: Data Centers](https://www.msci.com/data-and-analytics/real-estate/data-centers)

---

## Selected UI Direction & Stack

**Recommendation:** **Build B (Before & After AI Re-Plan)**, taking the **near-black map from A** and the **clickable source chips from C**.

| Part | Use | Key needed | Why |
| --- | --- | --- | --- |
| Map | [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/examples/) | No | Open source, rich example library |
| Dark basemap | [OpenFreeMap](https://openfreemap.org/) Dark / Positron | No | No registration, no API keys |
| Satellite | [Esri World Imagery](https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer) | Optional fallback | Sharp single-site imagery |
| Draw red line | [Terra Draw for MapLibre](https://maplibre.org/maplibre-gl-js/docs/examples/draw-geometries-with-terra-draw/) | No | Optional polygon/select toolbar |
| Layout boxes in 3D | [deck.gl on MapLibre](https://deck.gl/gallery/maplibre-overlay) extruded polygons | No | Smooth animated transitions between Round 0 and Round 2 |
| Panels & Source Chips | Tailwind / [shadcn/ui](https://ui.shadcn.com/blocks) | No | Near-black fixed left panel + inline citation chips |

## The two-minute video, as five shots

- **0:00–0:15 — The problem:** Data centres wait on power and on neighbours. One sentence, one map.
- **0:15–0:40 — Pick the site:** Draw/drop the red line. Grid lines and homes light up.
- **0:40–1:10 — The bad plan:** First layout drops in. Objection cards arrive, each with its source.
- **1:10–1:40 — AI re-plans:** Generators slide to the far edge. The risk counter falls.
- **1:40–2:00 — The money:** Value ladder and downside, every figure with a source chip.
