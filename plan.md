# Visual Editor for HNL Power Bars Card — Implementation Plan

## Overview

Home Assistant's Lovelace UI supports a **built-in visual editor system** for custom cards. When a card registers a config element via `static getConfigElement()`, HA renders that element inside its card-configuration dialog instead of showing raw YAML. This is the standard, well-supported approach used by all major custom cards.

The editor is a separate LitElement web component (`hnl-power-bars-card-editor`) that:
- Receives the current config and `hass` object
- Renders form controls for every configuration option
- Fires `config-changed` CustomEvents whenever the user modifies a value
- HA handles the rest (saving, YAML sync, undo, etc.)

---

## Architecture

```
src/
├── hnl-power-bars-card.js          ← existing card (add getConfigElement)
├── editor/
│   ├── hnl-power-bars-card-editor.js   ← main editor component
│   ├── entity-list-editor.js           ← reusable entity list sub-editor
│   └── remainder-editor.js             ← remainder config sub-editor
├── const.js                         ← existing (no changes)
└── utils.js                         ← existing (no changes)
```

**Why split into sub-components?**
Production and consumption are both arrays of entity configs. A reusable `entity-list-editor` avoids duplicating the add/remove/reorder/edit logic. The remainder config is a distinct shape, so it gets its own small sub-editor.

---

## Step-by-Step Implementation

### Step 1: Create the main editor component (`editor/hnl-power-bars-card-editor.js`)

Register a new custom element `hnl-power-bars-card-editor` extending `LitElement`.

**Properties:** `hass`, `_config` (internal copy of the card config).

**`setConfig(config)`** — called by HA with the current card config. Store it internally.

**`render()`** — return a Lit `html` template with these sections:

#### Section A: Global Settings
Using native HA form elements for best UX consistency:

| Option | Control | HA Element |
|---|---|---|
| `unit_of_measurement` | Text input | `<ha-textfield>` |
| `rounding` | Number input (0–6) | `<ha-textfield type="number">` |
| `hide_zero_values` | Toggle | `<ha-switch>` |
| `transparent` | Toggle | `<ha-switch>` |
| `easing` | Toggle | `<ha-switch>` |

#### Section B: Production Entities
Render an `<entity-list-editor>` with:
- `hass` pass-through
- `entities` = current production array
- `label` = "Production Sources"
- `@entities-changed` event listener → update `_config.production`

#### Section C: Consumption Entities
Same as above but for consumption.

#### Section D: Production Remainder (collapsible)
Render a `<remainder-editor>` for `production_remainder`.

#### Section E: Consumption Remainder (collapsible)
Render a `<remainder-editor>` for `consumption_remainder`.

**`_valueChanged()`** — on any input change, fire:
```js
this.dispatchEvent(new CustomEvent("config-changed", {
  detail: { config: this._config },
  bubbles: true, composed: true,
}));
```

**Styling** — Use HA's design tokens (`--primary-text-color`, `--divider-color`, etc.) so the editor looks native. Use `ha-expansion-panel` for collapsible sections.

---

### Step 2: Create the entity list sub-editor (`editor/entity-list-editor.js`)

A reusable component for editing an array of entity configs (used for both production and consumption).

**UI per entity row:**
| Field | Control |
|---|---|
| `entity` | `<ha-entity-picker>` — native HA entity picker with autocomplete |
| `icon` | `<ha-icon-picker>` — native HA icon picker |
| `color` | `<ha-textfield>` (CSS color string) |
| `unit_of_measurement` | `<ha-textfield>` (optional override) |

**Row actions:**
- **Drag handle** — for reordering (use `<ha-sortable>` if available, or manual move-up/move-down buttons as fallback)
- **Delete button** — remove entity from list
- **Add button** — at the bottom, adds a new empty entity row

Each row is rendered inside an `ha-expansion-panel` showing the entity's friendly name as the header, so users can collapse configured entities and focus on the one they're editing.

**Events:** Fires `entities-changed` with the updated array whenever any field changes.

---

### Step 3: Create the remainder sub-editor (`editor/remainder-editor.js`)

For editing `production_remainder` or `consumption_remainder`.

**Fields:**
| Field | Control |
|---|---|
| `name` | `<ha-textfield>` |
| `icon` | `<ha-icon-picker>` |
| `color` | `<ha-textfield>` |
| `bg_opacity` | `<ha-textfield>` |
| `text_color` | `<ha-textfield>` |
| `unit_of_measurement` | `<ha-textfield>` |

Wrapped in an `ha-expansion-panel` so it's collapsible by default (remainder config is optional/advanced).

**Events:** Fires `remainder-changed` with the updated remainder object.

---

### Step 4: Register the editor in the main card

In `hnl-power-bars-card.js`, add:

```js
static getConfigElement() {
  return document.createElement("hnl-power-bars-card-editor");
}
```

And import the editor module at the top of the file so the custom element is registered:

```js
import './editor/hnl-power-bars-card-editor.js';
```

---

### Step 5: Update the Rollup build

The editor files are new ES module imports from the main card file, so Rollup will automatically bundle them — **no rollup config changes needed**. The tree of imports starting from `hnl-power-bars-card.js` will pull in the editor and its sub-components.

Verify the bundled output size stays reasonable (Lit is already included; the editor just adds more templates).

---

### Step 6: Testing & Validation

1. **Manual testing in HA** — Add the card via the UI, confirm the visual editor appears instead of YAML.
2. **Round-trip test** — Configure via editor → switch to YAML view → verify YAML is correct → switch back to editor → verify fields populated correctly.
3. **Edge cases:**
   - Empty config (only required fields)
   - Many entities (5+ production, 5+ consumption)
   - Entity with all optional fields filled
   - Remainder with/without custom values
   - Config created in YAML with shorthand strings (e.g., `production: ["sensor.solar"]`) — editor should handle normalized and raw formats
4. **Styling** — Verify editor looks correct in both light and dark HA themes.

---

## HA Editor Elements Reference

These are built-in HA elements available in the editor context (no imports needed):

| Element | Purpose |
|---|---|
| `<ha-entity-picker>` | Entity selector with autocomplete, filtering by domain |
| `<ha-icon-picker>` | MDI icon selector with search |
| `<ha-textfield>` | Material text input |
| `<ha-switch>` | Toggle switch |
| `<ha-expansion-panel>` | Collapsible section |
| `<ha-sortable>` | Drag-and-drop reordering container |
| `<ha-button>` | Material button |
| `<ha-icon-button>` | Icon-only button |
| `<ha-alert>` | Info/warning banners |

These elements automatically inherit HA theming and provide accessible, consistent UX.

---

## Estimated Scope

| Component | Approximate Lines |
|---|---|
| `hnl-power-bars-card-editor.js` | ~200 |
| `entity-list-editor.js` | ~180 |
| `remainder-editor.js` | ~80 |
| Changes to `hnl-power-bars-card.js` | ~3 |
| **Total new code** | **~460** |

---

## Summary of Changes

1. **New file:** `src/editor/hnl-power-bars-card-editor.js` — main editor orchestrator
2. **New file:** `src/editor/entity-list-editor.js` — reusable entity list editor
3. **New file:** `src/editor/remainder-editor.js` — remainder config editor
4. **Modified:** `src/hnl-power-bars-card.js` — add import + `getConfigElement()` static method
5. **No changes** to build config, dependencies, or existing card rendering logic
