# HNL Flow Bars Card

A custom Home Assistant Lovelace card that visualizes supply vs demand flows as proportional horizontal bars with accolade connectors.

<img width="514" height="58" alt="image" src="https://github.com/user-attachments/assets/dde718e3-3ade-4140-9413-dba374cc8b0a" />

Production sources (e.g. solar, battery) are shown on top with slanted labels and bracket connectors. Consumption destinations (e.g. house, EV charger) are shown below. Bar widths scale proportionally, with optional remainder bars showing grid import/export.

The main purpose of this card is to show source(s), destination(s), surplus and shortfall - all in one.

So if you need to see:
- How much units are generated?
- How much units are consumed?
- Does anything remain? Or do we fall short?

> units can be solar, water, gas, kilograms, liters, apples, oranges - whatever you want!

Then is the card for you.

## Basic idea

<img width="443" height="233" alt="hnl-flow-bars-card" src="https://github.com/user-attachments/assets/7d2be7f2-a128-4a2d-a7b1-b2caf632d79e" />

The card compares sources (production) against destinations (consumption) as proportional bars. Two possible scenarios:

- A. When sources produce more than destinations consume, the leftover appears as a surplus bar.
- B. When destinations need more than sources provide, the gap appears as a shortfall bar.

Both bars scale proportionally so you can see the balance at a glance.

## Examples
### Example 1 - Current energy flow
- Show how much solar power is generated
- How much of it is consumed
- If something remains: how much flows back to the grid?
- If we fall short: how much is drawn from the grid?

<img width="470" height="62" alt="image" src="https://github.com/user-attachments/assets/caed18fc-78ca-4418-8432-bdad4e134ce2" />

<sub>1a: 805W surplus</sub>

<img width="471" height="63" alt="image" src="https://github.com/user-attachments/assets/427557fe-cc5e-4481-b5fa-4998d5a4ae5f" />

<sub>1b: 822W Shortfall</sub>

### Example 2 - Total energy flow
- Show how much solar power was generated today
- How much of it was consumed
- How much was returned to the grid
- How much was drawn additionally from the grid

<img width="469" height="63" alt="image" src="https://github.com/user-attachments/assets/d2828741-d399-4aa6-99d0-61a1953a8882" />

<sub>2a: 7kWh shortfall</sub>

<img width="471" height="62" alt="image" src="https://github.com/user-attachments/assets/5df197ca-89ae-4f24-a889-59f9dd43aa1a" />

<sub>2b: 7kWh surplus</sub>

### Example 3 - Layout variants

#### Small (half width)
The card performs very well in small spaces (as this was the initial intended purpose when I started work on it). Here's both current power distribution and daily use in two small cards, 6 columns 1 row each:

<img width="514" height="58" alt="image" src="https://github.com/user-attachments/assets/8fec86bd-3b9a-4978-9804-46cd82f56997" />

#### Larger (higher)
Or, spread over 2 rows, with `Show names` enabled:

<img width="472" height="112" alt="image" src="https://github.com/user-attachments/assets/75beb743-19da-467a-a276-da5fa374f36f" />

### Example 4 - Compare whatever you like

As long as the entities you use have a numeric (int/float/decimal) value, you can use them - even if it makes no sense at all.

<img width="468" height="60" alt="image" src="https://github.com/user-attachments/assets/3ee0b6f3-1653-4ce5-9732-84b6a36aa39c" />

## Don't we already have the Distribution Card for this?

We do, but I found that card falls short when you need insight in one glance. See the difference for yourself:

<img width="458" height="186" alt="image" src="https://github.com/user-attachments/assets/adc6b306-0b84-476f-965a-c197813e1c17" />

## Installation

### HACS (recommended)
1. Open HACS → three-dot menu → Custom repositories
2. Add `c-kick/hnl-flow-bars-card` with category **Dashboard**
3. Install "HNL Flow Bars Card"
4. Restart Home Assistant

### Manual
1. Download `hnl-flow-bars-card.js` from the [latest release](https://github.com/c-kick/hnl-flow-bars-card/releases)
2. Copy it to `/config/www/hnl-flow-bars-card.js`
3. Add the resource in Settings → Dashboards → Resources:
   - URL: `/local/hnl-flow-bars-card.js`
   - Type: JavaScript Module

## Configuration

The card is equipped with a visual editor, with which you can adjust all settings.

### General settings

<img width="506" height="555" alt="image" src="https://github.com/user-attachments/assets/f147d4f6-3bb2-4e6c-848f-6ccc782376cf" />

### Entites & surplus/shortfall

<img width="512" height="643" alt="image" src="https://github.com/user-attachments/assets/96f2c126-4d4a-4f3e-8ee0-18e059d99559" />

### Settings per entity:

<img width="490" height="563" alt="image" src="https://github.com/user-attachments/assets/c33db103-bed5-497d-98a2-8e0ac5502549" />

### Card options

| Option | Type | Default | Description |
|---|---|---|---|
| `production` | list | **required** | Production source entities |
| `consumption` | list | **required** | Consumption destination entities |
| `unit_of_measurement` | string | from entity | Override unit for all bars |
| `rounding` | number | `0` | Decimal places for displayed values |
| `hide_zero_values` | bool | `true` | Hide bars with zero values |
| `transparent` | bool | `true` | Remove card background |
| `easing` | bool | `true` | Smooth value transitions over time |
| `slanted_edge` | bool | `true` | Slant the right edge of source labels |
| `fill_height` | bool | `true` | Stretch to fill the available card height |
| `show_names` | bool | `true` | Show entity names when the card is tall enough |
| `theme` | string | `hatched` | Visual theme (see [Themes](#themes) below). Also accepts `accolade_style` for backward compatibility. |
| `grid_options` | object | `{}` | Override HA grid sizing (e.g. `{ columns: 6, rows: 2 }`) |
| `production_remainder` | object | | Config for production remainder bar |
| `consumption_remainder` | object | | Config for consumption remainder bar |

### Entity options

| Option | Type | Default | Description |
|---|---|---|---|
| `entity` | string | **required** | Entity ID |
| `name` | string | `friendly_name` | Custom display name (shown when card is tall enough) |
| `icon` | string | auto-detected | MDI icon override (defaults: `mdi:solar-power-variant` for sources, `mdi:power-plug` for destinations) |
| `color` | string | auto-generated | CSS color (`#hex`, `rgb()`, `var(--name)`) |
| `bg_opacity` | string | `inherit` | Background opacity (0–1) |
| `text_color` | string | `inherit` | Text color override |
| `unit_of_measurement` | string | from entity | Unit override |

### Remainder options

| Option | Type | Default | Description |
|---|---|---|---|
| `name` | string | `Shortfall` / `Surplus` | Label |
| `icon` | string | `mdi:eye` | MDI icon |
| `color` | string | theme variable | CSS color |
| `bg_opacity` | string | `inherit` | Background opacity |
| `text_color` | string | theme variable | Text color |
| `unit_of_measurement` | string | from entity | Unit override |

### Themes

The `accolade_style` option controls the visual style of the bracket connectors and background patterns. Available themes:

| Value | Description |
|---|---|
| `hatched` | **(default)** Solid fill with hatched pattern on remainder bars |
| `animated` | Animated diagonal stripes on remainder bars (shortfall scrolls left, surplus scrolls right) |
| `classic` | Solid fill with border, no hatching |
| `gradient` | Fades from source color downward |
| `tapered` | Narrows toward destination (Sankey-diagram feel) |
| `dotted` | Thin glowing line with dot-grid background |
| `dashed` | Dashed border with cross-hatch fill |
| `shadow` | Invisible body with inset shadow and vertical lines |
| `double-line` | Twin parallel lines with sparse diagonal stripes |
| `native` | Two stacked pill-shaped bars — matches the HA Energy Distribution Card style (no accolade connectors) |

### YAML Configuration

```yaml
type: custom:hnl-flow-bars-card
unit_of_measurement: W
rounding: 0
hide_zero_values: true
transparent: true
easing: true
slanted_edge: true
fill_height: true
show_names: true
theme: hatched
production:
  - entity: sensor.solar_power
    icon: mdi:solar-power-variant
  - entity: sensor.battery_discharge
    icon: mdi:battery-arrow-down
    name: Battery
    color: "#4caf50"
consumption:
  - entity: sensor.house_power
    icon: mdi:home
    name: House
  - entity: sensor.ev_charger_power
    icon: mdi:car-electric
    color: "#2196f3"
production_remainder:
  name: Grid import
  icon: mdi:transmission-tower-import
consumption_remainder:
  name: Grid export
  icon: mdi:transmission-tower-export
```

### Responsive behavior

The card adapts to its available height:

- **Compact (1 row):** Only icon + value shown in source labels and destinations.
- **Taller layouts (2+ rows, or `fill_height: true`):** Entity names automatically appear below the value in both source labels and destination bars when there is enough vertical space. The threshold is content-relative (based on `em` units, not fixed pixels), so it scales with font size.
- **`show_names: false`:** Disables entity names entirely, regardless of available space.

### Entity warnings

The card shows inline warnings when:
- An entity is not found in Home Assistant
- An entity state is `unavailable` or `unknown`
- An entity has a non-numeric state

### Editor features

The visual editor includes:
- **Entity management:** Add, remove, and reorder entities with up/down buttons per list.
- **Flip button:** Swap all sources and destinations in one click.
- **Entity deduplication:** Already-used entities are excluded from the picker to prevent duplicates.
- **Per-entity customization:** Name, icon, color, text color, background opacity, and unit override per entity.
- **Remainder editors:** Customize shortfall and surplus appearance with a visual diagram explaining the concept.

## Default colors

The card's default colors follow the Home Assistant Energy Dashboard conventions:

| Bar type | Default color | HA variable | Notes |
|---|---|---|---|
| **Sources** | `#ff9800` (orange) | `--energy-solar-color` | Production/supply entities |
| **Destinations** | `#488fc2` (blue) | `--energy-grid-consumption-color` | Consumption/demand entities |
| **Shortfall** | `#488fc2` (blue) | `--energy-grid-consumption-color` | Demand that sources couldn't cover |
| **Surplus** | `#8353d1` (purple) | `--energy-grid-return-color` | Supply that destinations didn't use |

Destinations and shortfall share the same blue because both represent consumption from the grid's perspective — shortfall is the portion of demand that had to be imported. With the default `hatched` theme, remainder bars get a diagonal stripe pattern to visually distinguish them from regular bars.

These defaults are defined in `src/const.js` and can be overridden per entity/remainder in the card config. The card also exposes CSS custom properties for theme-level overrides:

```css
:host {
  /* Base source/destination colors */
  --hnl-flow-bars-color-production: #ff9800;
  --hnl-flow-bars-color-consumption: #488fc2;

  /* Auto-generated palette variants (0–4 per side, shifted in hue/lightness) */
  --hnl-flow-bars-color-production-0: /* base */;
  --hnl-flow-bars-color-production-1: /* darker, hue-shifted */;
  --hnl-flow-bars-color-production-2: /* lighter, hue-shifted */;
  --hnl-flow-bars-color-production-3: /* darker, wider hue shift */;
  --hnl-flow-bars-color-production-4: /* lighter, wider hue shift */;
  /* Same pattern for consumption-0 through consumption-4 */

  /* Remainder colors and text */
  --hnl-flow-bars-color-production-remainder: #488fc2;
  --hnl-flow-bars-text-color-production-remainder: #fff;
  --hnl-flow-bars-color-consumption-remainder: #8353d1;
  --hnl-flow-bars-text-color-consumption-remainder: #fff;
}
```

## Grid sizing

The card defaults to 12 columns × 1 row in HA section views (`min_columns: 3`, `min_rows: 1`). Override with `grid_options` in the card config, or resize via the HA UI.

## Development

```bash
git clone https://github.com/c-kick/hnl-flow-bars-card.git
cd hnl-flow-bars-card
npm install
npm start    # watch mode with dev server on :5000
npm run build  # production build
```

## License

MIT





