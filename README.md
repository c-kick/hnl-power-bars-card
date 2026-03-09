# HNL Flow Bars Card

A custom Home Assistant Lovelace card that visualizes supply vs demand flows as proportional stacked bars with accolade connectors.

<img width="517" height="66" alt="image" src="https://github.com/user-attachments/assets/c1421f81-6b61-482d-9745-588a23a45472" />

Production sources (e.g. solar, battery) are shown on top with slanted labels and bracket connectors. Consumption destinations (e.g. house, EV charger) are shown below. Bar widths scale proportionally, with optional remainder bars showing grid import/export.

The main purpose of this card is to show source(s), destination(s), surplus and shortfall - all in one.

So if you need to see:
- How much [x] is generated?
- How much of it is consumed?
- Does anything remain? Or do we fall short?

> x = solar, water, gas, apples, oranges - whatever you want.

Then is the card for you.

## Examples
### Example 1 - Current energy flow
- Show how much solar power is generated
- How much of it is consumed
- If something remains: how much flows back to the grid?
- If we fall short: how much is drawn from the grid?

<img width="427" height="80" alt="image" src="https://github.com/user-attachments/assets/fec15f27-d84c-4d79-a6b2-3f99b3c31113" />

<img width="432" height="79" alt="image" src="https://github.com/user-attachments/assets/e50429d7-7646-4dc0-b83d-672f120e9d7c" />


### Example 2 - Total energy flow
- Show how much solar power was generated today
- How much of it was consumed
- How much was returned to the grid
- How much was drawn additionally from the grid

<img width="430" height="83" alt="image" src="https://github.com/user-attachments/assets/8cf637e8-d219-4867-a424-0eb84d677b6c" />

### Example 3 - Gas usage today (sources and destination flipped)
- How much gas was spent on central heating
- How much gas was spent on warm water
- Show how much gas was consumed in total

<img width="443" height="82" alt="image" src="https://github.com/user-attachments/assets/180823a1-7141-470e-a984-9ba6db907d3e" />

Or, smaller, with less decimals and slightly different colors + dotted theme

<img width="209" height="56" alt="image" src="https://github.com/user-attachments/assets/4c137778-5e72-4090-b4ee-210890fb9a5b" />

## Installation

### HACS (recommended)
1. Open HACS → Frontend → three-dot menu → Custom repositories
2. Add `c-kick/hnl-flow-bars-card` as a **Dashboard** repository
3. Install "HNL Flow Bars Card"
4. Restart Home Assistant

### Manual
1. Download `hnl-flow-bars-card.js` from the [latest release](https://github.com/c-kick/hnl-flow-bars-card/releases)
2. Copy it to `/config/www/hnl-flow-bars-card.js`
3. Add the resource in Settings → Dashboards → Resources:
   - URL: `/local/hnl-flow-bars-card.js`
   - Type: JavaScript Module

## Configuration

```yaml
type: custom:hnl-flow-bars-card
unit_of_measurement: W
rounding: 0
hide_zero_values: true
transparent: true
easing: false
accolade_style: hatched
production:
  - entity: sensor.solar_power
    icon: mdi:solar-power-variant
  - entity: sensor.battery_discharge
    icon: mdi:battery-arrow-down
    color: "#4caf50"
consumption:
  - entity: sensor.house_power
    icon: mdi:home
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

### Card options

| Option | Type | Default | Description |
|---|---|---|---|
| `production` | list | **required** | Production source entities |
| `consumption` | list | **required** | Consumption destination entities |
| `unit_of_measurement` | string | from entity | Override unit for all bars |
| `rounding` | number | `0` | Decimal places for displayed values |
| `hide_zero_values` | bool | `true` | Hide bars with zero values |
| `transparent` | bool | `true` | Remove card background |
| `easing` | bool | `false` | Smooth value transitions |
| `accolade_style` | string | `hatched` | Visual theme (see [Themes](#themes) below) |
| `production_remainder` | object | | Config for production remainder bar |
| `consumption_remainder` | object | | Config for consumption remainder bar |

### Entity options

| Option | Type | Default | Description |
|---|---|---|---|
| `entity` | string | **required** | Entity ID |
| `icon` | string | auto-detected | MDI icon override |
| `color` | string | auto-generated | CSS color |
| `bg_opacity` | string | `inherit` | Background opacity |
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
| `classic` | Solid fill with border, no hatching |
| `gradient` | Fades from source color downward |
| `tapered` | Narrows toward destination (Sankey-diagram feel) |
| `dotted` | Thin glowing line with dot-grid background |
| `dashed` | Dashed border with cross-hatch fill |
| `shadow` | Invisible body with inset shadow and vertical lines |
| `double-line` | Twin parallel lines with sparse diagonal stripes |

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
  --hnl-flow-bars-color-production: #ff9800;
  --hnl-flow-bars-color-consumption: #488fc2;
  --hnl-flow-bars-color-production-remainder: #488fc2;
  --hnl-flow-bars-color-consumption-remainder: #8353d1;
}
```

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


