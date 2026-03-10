# HNL Flow Bars Card

A custom Home Assistant Lovelace card that visualizes supply vs demand flows as proportional horizontal bars with accolade connectors.

<img width="517" height="66" alt="image" src="https://github.com/user-attachments/assets/c1421f81-6b61-482d-9745-588a23a45472" />

Production sources (e.g. solar, battery) are shown on top with slanted labels and bracket connectors. Consumption destinations (e.g. house, EV charger) are shown below. Bar widths scale proportionally, with optional remainder bars showing grid import/export.

The main purpose of this card is to show source(s), destination(s), surplus and shortfall - all in one.

So if you need to see:
- How much [x] is generated?
- How much of it is consumed?
- Does anything remain? Or do we fall short?

> x = solar, water, gas, apples, oranges - whatever you want.

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

<img width="474" height="72" src="https://github.com/user-attachments/assets/d836f34a-3950-4c76-8cdc-40e5454569fa" />

<sub>1a: 527W surplus</sub>

<img width="471" height="66" alt="image" src="https://github.com/user-attachments/assets/f9f0d65b-bbd4-4dda-861c-60616947e18a" />

<sub>1b: 2386W Shortfall</sub>

### Example 2 - Total energy flow
- Show how much solar power was generated today
- How much of it was consumed
- How much was returned to the grid
- How much was drawn additionally from the grid

<img width="471" height="68" alt="image" src="https://github.com/user-attachments/assets/d308d241-b9e7-45f5-9cf9-db120b82359e" />

<sub>2a: 6kWh shortfall</sub>

<img width="471" height="64" alt="image" src="https://github.com/user-attachments/assets/c30a26e2-b909-44e8-8a8b-6e2ec8eba2e3" />

<sub>2b: 6kWh surplus</sub>

### Example 3 - Small mode
The card performs very well in small spaces. Here's both current power distribution and daily use in two small cards, 6 columns 1 row each:

<img width="512" height="58" alt="image" src="https://github.com/user-attachments/assets/8430fbe9-8361-49ef-a150-5e52a06769f2" />

## Don't we already have the Distribution Card for this?

We do, but I found that card falls short when you need insight in one glance. See the difference for yourself:

<img width="415" height="192" alt="image" src="https://github.com/user-attachments/assets/710acb08-59fb-4531-b93d-219ea11f5045" />

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














