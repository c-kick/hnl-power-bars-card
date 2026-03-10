# HNL Flow Bars Card — Improvement Backlog

A list of unprioritized, and non-final improvements.

- [ ] **Energy dashboard integration** — Auto-discover HA energy entities; add energy-specific entity filtering in the editor, or an "autopopulate" option.
- [ ] **Localization / i18n** — Add translation support for card labels and editor strings to serve non-English HA users
- [ ] **Statistics / history compatibility** — Make compatible with HA long-term statistics APIs to show historical flow aggregates (daily/weekly), depending on `energy-date-selection` card.
- [ ] **Accessibility** — Add ARIA labels and high-contrast mode support
- [ ] **Easing improvements** — Persist easing state across reloads (e.g. via `sessionStorage`); use exponential smoothing instead of simple rolling average
- [ ] **Container query fallback** — Add basic flexbox fallback for older HA Companion App webviews that lack container query support
- [ ] **CSS variable stability** — Document which `--energy-*` CSS variables the card depends on; add defaults for all of them
- [ ] **TypeScript migration** — Migrate source to TypeScript for compile-time type safety against the evolving HA frontend API
- [ ] **Expand test coverage** — Add integration tests for render output (e.g. using `@open-wc/testing`); test editor config round-trips
- [ ] **CI test step** — Add `npm test` to the `build.yml` GitHub Actions workflow
