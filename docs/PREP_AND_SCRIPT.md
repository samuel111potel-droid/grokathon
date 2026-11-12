# Hackathon Timetable, Judging Criteria & Narration Guide

**Event:** Grok Bot Real Estate Hackathon · Thursday 12 November 2026, 18:00–00:00 GMT · London

---

## 1. Official Schedule

| Time | Milestone |
| --- | --- |
| 18:00 | Doors & networking |
| 18:15 | Kick-off, credit claims, tracks revealed |
| 18:30 | Hacking begins |
| 19:30 | Dinner (hacking continues) |
| 22:00 | **Internal team feature freeze** (begin dry-run & video capture) |
| 22:30 | Official 30-minute warning |
| 23:00 | **Hard code freeze.** Submit team GitHub repo + 2-minute demo video |
| 23:30 | Top five live demos (2 minutes each) |
| 23:40 | Final judging & awards |
| 00:00 | Close |

---

## 2. Published Judging Criteria

Every screen decision and line of narration in our 2-minute video targets these five pillars:

1. **Relevance to a real-estate problem** — UK powered land & data centre planning risk, bridging grid capacity, neighbour objections, and industrial downside value.
2. **Quality of execution** — One end-to-end 3D spatial re-planning loop (`Round 0 -> Round 1 -> Round 2`) running deterministically without UI clutter or loading spinners.
3. **Effective use of Grok Bot and Cursor** — Coordinated parallel Grok Bots (`P1`–`S2`, `RedTeam`, `ObjectionWriter`, `Director`) feeding verified JSON artifacts into a Cursor-built 3D layout & residual valuation engine + MSCI RCA MCP downside check.
4. **Traceable data** — Every figure, refusal precedent, and valuation assumption carries a clickable **Source Chip** opening its verbatim quote, URL, timestamp, and Red Team check status.
5. **Practical usefulness** — Gives an investment committee an actionable consent-ready site layout *and* a sourced land value ladder with a logistics downside floor in minutes.

---

## 3. Clean-Room Data & Recording Checklist (Run at 22:15)

- [ ] **Zero confidential data:** No employer, internal tool, live deal, client, or counterparty names anywhere in repo, UI, or browser tabs.
- [ ] **Zero private individuals:** Planning history and neighbour layers cite buildings, councils, companies, and public officials only — never private residents.
- [ ] **Zero raw MSCI rows in git:** `data/receipts/msci_receipts.json` holds query metadata and SHA-256 hashes only; confirm on-site with MSCI mentors before displaying specific MSCI figures in the recorded video (toggle `USE_PUBLIC_BENCHMARKS_ONLY` if needed).
- [ ] **Clean recording chrome:** Hide personal bookmarks, notifications, and personal email/account badges before hitting record.
- [ ] **Runtime <= 1:58:** Leave a 2-second safety buffer under the 2:00 cap.

---

## 4. Two-Minute Voiceover Script (Aligned to the 5 Shots)

- **0:00–0:15 — The Problem:**
  *"Every UK data centre deal stalls on two things: finding grid power, and surviving the planning committee. Standard feasibility tools draw boxes on a map — they ignore the neighbours until refusal."*
- **0:15–0:40 — Pick the Site & Parallel Agents:**
  *"We drop a red line on a candidate industrial site. Seven Grok Bots fan out in parallel — pulling primary substation headroom, cable route crossings, residential buildings within 300 metres, and ten years of council refusal notices — audited by a Red Team bot that strips any claim without a verbatim quote."*
- **0:40–1:10 — Round 0 (The Naive Plan & Pushback):**
  *"Round 0 maximises megawatts — and makes the classic mistake: thirty-two standby diesel generators sit 142 metres from homes, breaching night-time BS 4142 noise limits. Six sourced objection cards fire immediately, citing real nearby planning refusals."*
- **1:10–1:40 — AI Re-Plans (Rounds 1 & 2):**
  *"Click Re-Plan. The engine relocates the generator yard 340 metres to the industrial edge, adds a six-metre acoustic wall and twenty-metre woodland belt, steps hall heights down, and attaches a local ward infrastructure offer. Receptor noise drops below 40 dB, and objection risk falls from 84 to 21."*
- **1:40–2:00 — The Money & Verifiable Lineage:**
  *"Even with a modest megawatt trim, risk-adjusted land value jumps — anchored above a sourced industrial-sheds downside floor. Click any number on screen, and you land on the exact quote, URL, and Red Team receipt."*
