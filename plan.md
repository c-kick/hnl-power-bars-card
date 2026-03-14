# Plan: Issue #11 — Sync with energy_date_selection component

## Summary

Add an `energy_date_selection` config option that, when enabled, subscribes to Home Assistant's Energy Dashboard date/period picker and displays aggregated statistics for the selected time range instead of current entity values.

## Background

Currently the card reads live entity states (e.g. `sensor.solar_power` = 1234 W). Issue #11 requests that when placed on HA's Energy Dashboard (or any view with a `type: energy-date-selection` card), the card should instead display **summed statistics** for the selected period (e.g. total kWh produced yesterday).

The reference implementation (ha-sankey-chart) achieves this by:
1. Polling `hass.connection._energy` to find the EnergyCollection object
2. Subscribing to the collection's updates (which fire when the user changes the date range)
3. Calling `recorder/statistics_during_period` WebSocket API to fetch statistics
4. Replacing entity state values with the summed statistics for the period

## Implementation Plan

### Step 1: Add energy utility module (`src/energy.js`)

Create a new module with:

- **`getEnergyDataCollection(hass)`** — Access `hass.connection._energy` to retrieve HA's energy data collection (set up by the `energy-date-selection` card on the same view). Returns null if not available.

- **`subscribeEnergyDateSelection(hass, callback)`** — Poll for the energy collection (100ms interval, 10s timeout). Once found, subscribe to updates. Each update provides `{ start, end }` dates. Returns an unsubscribe function.

- **`fetchStatistics(hass, startTime, endTime, entityIds)`** — Call `recorder/statistics_during_period` WebSocket API. Determine period granularity from date range:
  - >35 days → `"month"`
  - >2 days → `"day"`
  - ≤2 days → `"hour"`

  Returns a `Record<entityId, number>` of summed values (using `sum` or `state` statistic type, computing the difference between last and first values for cumulative sensors).

### Step 2: Update the main card (`src/hnl-flow-bars-card.js`)

- **Add `energy_date_selection` to config handling** in `setConfig()` — store `this._rawConfig.energy_date_selection` (boolean, default `false`).

- **Add reactive properties** — Add `_energyStats` (object) and `_energyError` (string) as tracked state.

- **Lifecycle: `connectedCallback()` / `disconnectedCallback()`** — When `energy_date_selection` is true:
  - In `connectedCallback`: call `subscribeEnergyDateSelection()`, store the unsubscribe function. On each update, call `fetchStatistics()` for all configured entity IDs, store results in `_energyStats`, trigger re-render.
  - In `disconnectedCallback`: call the stored unsubscribe function.

- **Modify `_hydrateParsedConfig()`** — When `energy_date_selection` is enabled and `_energyStats` is populated, use the statistic values from `_energyStats[entityId]` instead of `stateObj.state`. If a statistic is missing for an entity, fall back to 0 with a warning.

- **Render error state** — If the energy collection isn't found within timeout, render an `<ha-alert>` explaining that a `type: energy-date-selection` card is required on the same view.

### Step 3: Update the editor (`src/editor/hnl-flow-bars-card-editor.js`)

- Add an `energy_date_selection` toggle (ha-formfield + ha-switch) in the General Settings section, with a description like "Sync with Energy Dashboard date picker".

- Ensure the toggle value is read from and written to the config properly. Clean up the key when it's `false` (matching existing cleanup patterns).

### Step 4: Update constants (`src/const.js`)

- No changes needed unless we want to add a timeout constant (optional, can be inlined).

### Step 5: Add tests (`test/energy.test.js`)

- Test `fetchStatistics` period selection logic (month/day/hour based on date range)
- Test statistic summing/differencing logic
- Test that `_hydrateParsedConfig` uses energy stats when available

### Step 6: Update existing tests

- Ensure `card-logic.test.js` tests still pass (no breaking changes to existing functions since energy mode is opt-in)

## Config Schema Change

```yaml
type: custom:hnl-flow-bars-card
energy_date_selection: true    # NEW - opt-in
production:
  - entity: sensor.solar_energy_total
consumption:
  - entity: sensor.house_energy_total
```

## Key Design Decisions

1. **Opt-in via boolean flag** — Matches the ha-sankey-chart approach. Default is `false` so existing users are unaffected.

2. **Statistic type handling** — Energy sensors are typically cumulative (`state` type). We compute the net value as `last.state - first.state` for the period. For non-cumulative sensors that report `sum`, we use the `sum` field directly.

3. **Polling for energy collection** — HA's energy collection is initialized asynchronously by the `energy-date-selection` card. We must poll `hass.connection._energy` until it appears (with timeout).

4. **Period granularity** — Automatically selected based on date range width, matching HA's own energy dashboard behavior.

5. **Graceful degradation** — If the energy collection isn't available (e.g., card not on energy dashboard), show a clear error message. If statistics are unavailable for a specific entity, show 0 with a warning.

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/energy.js` | **Create** — Energy subscription and statistics fetching |
| `src/hnl-flow-bars-card.js` | **Modify** — Add energy mode lifecycle, config, and data flow |
| `src/editor/hnl-flow-bars-card-editor.js` | **Modify** — Add toggle in editor UI |
| `test/energy.test.js` | **Create** — Tests for energy utilities |

## Risks & Considerations

- **HA internal API** — `hass.connection._energy` is an internal/undocumented API. It may change in future HA versions. However, this is the same approach used by ha-sankey-chart and other community cards, and HA's own energy dashboard cards use the same mechanism.
- **Entity compatibility** — Not all entities have long-term statistics. The card should warn when statistics are unavailable for a configured entity.
- **Performance** — Statistics fetches are async and may take time for large date ranges. Consider showing a loading indicator during fetch.
