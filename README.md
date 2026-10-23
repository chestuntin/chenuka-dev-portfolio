# Chenuka Jayathilake — Portfolio

Live: https://chenuka-jay.pages.dev/

The homepage opens a 3D desk and CRT monitor. Windows XP starts with the portfolio open in an Internet Explorer 6-style window. Closing it reveals the desktop. External portfolio links open in real browser tabs. Start → Restart runs the BIOS and Windows startup sequence.

## Repository layout

- `experience/`: editable React/Vite source and assets; see its README and asset notices.
- `dist/`: prebuilt production website, committed for the existing Cloudflare Pages Git deployment.
- `functions/api/views.js`: existing visit-counter endpoint, backed by the existing `VISITS_DB` D1 binding.
- `migrations/`: existing visit-counter schema.
- `wrangler.toml`: existing Pages project and production database binding.

## Routes

- `/`: 3D desk and CRT.
- `/xp/`: standalone XP desktop.
- `/portfolio/`: plain portfolio and animated garden footer.
- `/chenuka-jayathilake-cv.pdf` and `/chenuka-jayathilake-bachelors-thesis.pdf`: original PDF URLs, preserved.

## Develop and release

Requires Node 22.13 or newer (Node 24 recommended).

```sh
npm --prefix experience ci
npm --prefix experience run dev
```

Rebuild the committed release from the repository root:

```sh
node scripts/build-homepage.mjs
```

Commit both source and updated `dist/`, then push `main`. Cloudflare Pages serves `dist/` with no build command. The root has no npm installation step; dependencies belong to the editable source. Existing Pages Functions and D1 data are preserved.

The prior plain-homepage deployment is retained in Git history at commit `fc3f1d233a79ace7765b39a16b81b52d2c5efd6e`.

## Asset provenance

The retained 3D scene is a reference-derived study, not newly authored artwork. See `experience/README.md`, `experience/public/icons/SOURCES.md`, and the scene vendor license notices for provenance.
