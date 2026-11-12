# Rules check: make sure ConsentLoop DC does not break the hackathon rules

Run through this before the 22:00 feature freeze and again before submitting at 23:00. Every box must be ticked.

Sources: the published event page (luma.com/spacexai-hvld), the Discord #claim-credits instructions, and our own rules in `AGENTS.md` and `.cursor/rules/data-safety.mdc`. If the official track sheet from kick-off says something different, the track sheet wins. Paste its wording into section 7 below.

## 1. Submission rules (the event)

- [ ] **One GitHub repo per team.** Ours is `github.com/samuel111potel-droid/grokathon`. It is public so the judges can open it.
- [ ] **A two-minute video, submitted by 23:00 code freeze.** Keep it at 1:58 or less. Use the submission link the organisers sent.
- [ ] **No commits after 23:00.** The final push happens before 23:00. Judges may check commit times.
- [ ] **Team of five or fewer.** The repo collaborators are Sam, Rio-Lai, cid02465417 and teddyjames1995.
- [ ] **Work was built tonight.** The repo history starts at 18:52 on 12 November. Public libraries and public data are fine. Do not paste in a finished product built before the event.
- [ ] **Track is declared.** We are on **Own idea**, aimed at institutional investors.
- [ ] **The top five demo live at 23:30 for two minutes.** Have the app running locally and the video ready as a backup.

## 2. Judging criteria (what we are scored on)

| Criterion | How we meet it | Check |
| --- | --- | --- |
| Relevance to a real estate problem | UK data centre sites stall on grid power and planning refusal | [ ] Said in the first 15 seconds of the video |
| Quality of execution | One working loop: Round 0, then Round 1, then Round 2, with no spinners or broken screens | [ ] Runs end to end three times in a row |
| Effective use of Grok Bot and Cursor | Grok Bot research agents feed JSON files, and Cursor builds the map and valuation screen | [ ] Video shows both tools doing real work |
| Traceable data | Every number has a Source Chip with URL, verbatim quote and timestamp | [ ] Click any figure in the demo and it opens its source |
| Practical usefulness | An investment committee gets a consent-ready layout and a sourced land value | [ ] Closing line of the video says this |

## 3. Data and confidentiality (our hard rules)

- [ ] **No employer, client, live deal or counterparty names** anywhere in the repo, the app, the video, or open browser tabs during recording. That includes internal tools and project codenames.
- [ ] **No private individuals.** Planning and neighbour data names buildings, councils, companies and public officials only. Never residents' names from planning portals.
- [ ] **Public data only for the site.** Ratcliffe-on-Soar Power Station is public. All figures come from public sources listed in `docs/PUBLIC_DATA_SOURCES.md`, or are clearly badged as an assumption.
- [ ] **No silent hard-coded numbers.** Every displayed metric links to a `citation_id` with a passing check, or shows an "assumption" badge.
- [ ] **Failed evidence is hidden.** Rows with `check: "fail"` never appear on screen.

## 3a. Data traceability (a judging criterion, so it must be airtight)

Run `python3 scripts/check_traceability.py` after Red Team finishes, and `--live` once before recording. It must end with **0 errors**.

- [ ] **Every "found" row has a live URL, a word-for-word quote, a source organisation, a retrieval time and a Red Team `pass`.** `--live` re-opens each URL and confirms the quote is really on the page.
- [ ] **Every objection card cites rows that exist and passed.** No card points at a failed or missing row.
- [ ] **Every figure on the round screens is explained.** Each round file has a `metric_sources` entry for every metric and underwrite line, with either `citation_ids` (a quoted source) or a `method` (how we calculated it).
- [ ] **Calculated figures are labelled as ours, not as facts.** Noise level, objection risk score, approval chance, BS 4142 pass or fail, and land values come from our engine. Their Source Chip shows the method and the inputs it used, and the video calls them estimates.
- [ ] **Assumptions show an "assumption" badge** and say what they are based on.
- [ ] **MSCI figures cite a receipt** (`MSCI-R1` and so on) with a real SHA-256 hash, not the example hash from the plan.
- [ ] **No figures typed straight into the screen code.** The script flags any MW, km, dB, £ or % figure written directly into a `.tsx` or `.jsx` file.
- [ ] **Sample data is never presented as real.** If `data/fixtures/` is still in use at recording time, the screen says "sample data".
- [ ] **The demo click works:** clicking two figures in the video opens the quote, URL, timestamp and Red Team pass.

Suggested `metric_sources` shape for each round file:

```json
"metric_sources": {
  "nearest_home_to_gen_m": { "citation_ids": ["C1-01"] },
  "predicted_receptor_dba": { "method": "Point-source decay from generator sound power over distance, minus screening", "citation_ids": ["S2-07", "C1-01"] },
  "objection_risk_score": { "method": "Weighted sum of open objection card severities, 0 to 100" }
}
```

## 4. MSCI data (licensed, so extra care)

MSCI RCA access was given for the event. It is licensed data, not public data.

- [ ] **No raw MSCI rows in git.** Only query metadata and SHA-256 hashes go in `data/receipts/msci_receipts.json`. Only aggregated ranges go in `data/out/M1_summary.json`.
- [ ] **Raw scratch stays in `data/cache/`,** which is gitignored. Run `git check-ignore -v data/cache/*` to confirm.
- [ ] **Ask the MSCI mentors on site before showing specific MSCI figures in the video.** If unsure, switch on `USE_PUBLIC_BENCHMARKS_ONLY`.
- [ ] **MSCI is labelled as MSCI** wherever its figures appear, and it is not presented as our own data.

## 5. Secrets and accounts

- [ ] **No API keys or tokens in git.** `.env` is gitignored. Only `.env.example` with blank values is committed.
- [ ] **Credit codes are not shared or committed.** The Cursor redeem link and other credit codes are tied to each person's check-in.
- [ ] **Clean screen while recording.** Hide bookmarks, notifications, email badges and personal account names.

## 6. Final checks before pushing (run these commands)

```bash
# Nothing secret or raw is about to be committed
git status --short
git check-ignore -v data/cache/* .env

# No confidential names in tracked files (should print nothing)
git ls-files | xargs grep -n -i -E "<employer>|<client>|<deal codename>" 

# No keys in tracked files (should print nothing)
git ls-files | xargs grep -n -E "sk-[A-Za-z0-9]{20}|api[_-]?key *[:=] *['\"]?[A-Za-z0-9]{16}"
```

Replace the placeholders in the second command with any names the team must keep out. Do not write those names into this file.

## 7. Official track sheet wording

Paste the exact rules or principles from the kick-off track sheet here, then add a check box for anything not already covered above.

- [ ] ...
