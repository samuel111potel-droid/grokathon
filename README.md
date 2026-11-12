# Grokathon

Community layer for the Grok Bot Real Estate Hackathon (London, 12 November 2026).

Shows receptors and planning decisions around the Ratcliffe-on-Soar site: homes, schools, places of worship, 150 m / 300 m rings, and colour-coded planning pins.

## How to run

```bash
npm install
npm run dev
```

Open the printed local URL (default `http://127.0.0.1:5173`).

```bash
npm test
npm run build
```

## Stack

Vite, React, TypeScript, MapLibre GL (OpenFreeMap dark tiles).

## Data

- Prefer `data/live/` when a file exists there, else `data/sample/`.
- Fact-row contract: see `data/README.md`.
- Rows with `check: "fail"` are skipped. `status: "assumption"` shows an amber chip.

## Demo

The two-minute video goes in `/demo`.
