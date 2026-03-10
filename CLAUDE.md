# HNL Flow Bars Card

Custom Home Assistant Lovelace card — supply vs demand flow visualization.

## Architecture

- **Framework:** LitElement (Lit 3) with shadow DOM
- **Build:** Rollup + terser → single ES module `dist/hnl-flow-bars-card.js`
- **Node.js:** v22 via nvm — always load with `export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"`

## Source files

| File | Purpose |
|---|---|
| `src/hnl-flow-bars-card.js` | Main card: rendering, CSS, HA card API |
| `src/utils.js` | Shared utilities |
| `src/const.js` | Version, card name, default colors, accolade styles |
| `src/editor/hnl-flow-bars-card-editor.js` | Visual editor (parent) |
| `src/editor/entity-list-editor.js` | Entity list sub-editor |
| `src/editor/remainder-editor.js` | Shortfall/surplus sub-editor |

## Key conventions

- **CSS custom properties:** use `--bar-width` / `--bar-grow` (not generic names like `--width` / `--grow` — HA editor inherits and overrides those)
- **Colors:** use `oklch()` for color manipulation; `unsafeCSS()` to interpolate JS constants into LitElement static styles
- **Responsive layout:** CSS container queries with `em` units (not `px`) for breakpoints (`@container card (min-height: 6em)`)
- **HA card API methods:** `setConfig()`, `getGridOptions()`, `getCardSize()`, `getConfigElement()`, `getStubConfig(hass)`
- **Terminology:** Sources (supply/production), Destinations (demand/consumption), Shortfall (demand > supply), Surplus (supply > demand)
- **Layout/CSS changes:** Always use the `frontend-design` plugin for layout and CSS work — it catches specificity conflicts, overflow issues, and grid/flex pitfalls that are easy to miss
- **Before committing:** Always verify the README is up to date with any feature/config/theme changes

## Build & dev

```bash
npm run build    # production build
npm start        # watch mode with dev server on :5000
npm test         # vitest
```

Dev mount: Docker bind mount `dist/hnl-flow-bars-card.js:/config/www/hnl-flow-bars-card.js:ro` — edit src, build, hard-refresh dashboard (no HA restart needed).

## Release flow

**IMPORTANT: Never create releases without explicit user approval.**

1. Bump version in both `src/const.js` and `package.json`
2. Commit and push
3. Wait for **Validate** action (HACS validation) to pass
4. Only when user says so: `gh release create vX.Y.Z --title "vX.Y.Z" --notes "..."`
5. GitHub Action (`.github/workflows/release.yml`) builds and attaches JS asset
6. `npm run build` locally so the dev mount serves the new version

## GitHub Actions

| Workflow | Trigger | Purpose |
|---|---|---|
| `build.yml` | push/PR to main | Build check |
| `release.yml` | release published | Build + attach JS asset to release |
| `validate.yml` | push/PR/daily/manual | HACS compatibility validation |
