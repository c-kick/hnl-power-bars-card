# HNL Flow Bars Card — Improvement Backlog

Items identified via SWOT analysis against the
[Home Assistant Custom Card Developer Docs](https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card/).

## Opportunities

- [ ] **Card features API** — Implement [custom card features](https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card-feature/) (e.g. toggle production/consumption view, time-range selector)
- [ ] **Energy dashboard integration** — Auto-discover HA energy entities; add energy-specific entity filtering in the editor
- [ ] **Localization / i18n** — Add translation support for card labels and editor strings to serve non-English HA users
- [ ] **Statistics / history integration** — Use HA long-term statistics APIs to show historical flow aggregates (daily/weekly)
- [ ] **Accessibility** — Add ARIA labels, keyboard navigation, and high-contrast mode support
- [ ] **Easing improvements** — Persist easing state across reloads (e.g. via `sessionStorage`); use exponential smoothing instead of simple rolling average

## Threat mitigation

- [ ] **Reduce reliance on internal HA components** — Wrap `ha-entity-picker`, `ha-icon-picker`, `ha-expansion-panel`, etc. with fallback checks so editor degrades gracefully on HA updates
- [ ] **`loadCardHelpers` deprecation** — Monitor for official replacements; consider lazy-loading editor components without `window.loadCardHelpers()`
- [ ] **Container query fallback** — Add basic flexbox fallback for older HA Companion App webviews that lack container query support
- [ ] **CSS variable stability** — Document which `--energy-*` CSS variables the card depends on; add defaults for all of them

## Code quality

- [ ] **TypeScript migration** — Migrate source to TypeScript for compile-time type safety against the evolving HA frontend API
- [ ] **Expand test coverage** — Add integration tests for render output (e.g. using `@open-wc/testing`); test editor config round-trips
- [ ] **CI test step** — Add `npm test` to the `build.yml` GitHub Actions workflow
