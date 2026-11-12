# Bugbot Review Rules — Grokathon

Flag as **blocking** any PR or commit that:
1. Commits API keys, tokens, cookies, `.env` files, or credentials of any kind.
2. Commits row-level MSCI transaction/project records (only SHA-256 receipts in `data/receipts/msci_receipts.json` and aggregated benchmark assumptions are permitted).
3. Includes private individual names (e.g. resident objectors scraped from planning portals) or confidential employer, client, or live deal names.
4. Hardcodes headline valuation, MW, distance, or noise numbers in UI components without wiring them to `LayoutRound` / `EvidenceRow` citation IDs.
5. Introduces blocking runtime network calls in the frontend demo path without an instant local JSON fallback (`data/out/` -> `data/fixtures/`).
