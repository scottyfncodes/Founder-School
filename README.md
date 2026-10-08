# Software Founder School

**Learn how the machine works.** A mobile-first, interactive field guide that teaches software founders
how modern web apps actually work — by tapping, dragging, breaking and fixing things — so they can make
better decisions, question AI coding agents, and recognize risk.

- 12 worlds, ~48 short lessons, each built around a real interaction (simulations, labs, sorters, sliders)
- A persistent, interactive architecture map that grows as you learn
- Levels earned by demonstrated understanding (first-try answers), not by completion
- Founder reality-check scenarios, a searchable glossary, and a capstone company simulation with a readiness report
- No backend, no account: progress lives in your browser; works offline after the first visit

## Develop

```bash
npm install
npm run dev       # http://localhost:5173
npm run check     # typecheck + lint + content tests + production build
npm run e2e       # Playwright: plays every lesson & scenario on phone-sized viewports
```

Content lives in `src/content/` (one file per world). See [`docs/AUTHORING.md`](docs/AUTHORING.md).

Deployed on Vercel from `main`.
