# Grokathon

Our project for the Grok Bot Real Estate Hackathon, London, 12 November 2026.

## What it does

One screen for the Ratcliffe-on-Soar power station site (Nottinghamshire, ≈52.865, −1.255): dual maps (round 0 vs current), homes coloured by `noiseAtHome` on a five-step dB scale, objection cards with precedent quotes and C3 mitigation offers, and a Community tab of ward facts. Every on-screen claim carries a source chip backed by a fact row in `data/`.

## How to run

1. Clone this repo.
2. Install Node 22+ and run `npm install`.
3. Start the app with `npm run dev` and open the printed local URL (default `http://localhost:5173`).
4. Click **Re-plan** to step through rounds 0 → 1 → 2 (blocks animate over 1.5s). Click again on round 2 to reset.
5. Run unit tests with `npm test`.
6. Optional production build: `npm run build` then `npm run preview`.

Data loads from `data/live/` when a file exists there, otherwise from `data/sample/`. See `data/README.md` for the fact-row contract.

## Stack

Vite, React, TypeScript, MapLibre GL, deck.gl, Vitest. Sample facts are marked `assumption` for the hackathon.

## Demo

The two-minute video goes in `/demo`. Screenshots of each round live with the PR.
