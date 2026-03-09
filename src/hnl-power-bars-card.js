import { LitElement, html, css } from 'lit';
import { computeEntityIcon } from './utils.js';
import { CARD_VERSION, CARD_NAME, CARD_DESCRIPTION } from './const.js';

console.info(
    `%c ${CARD_NAME.toUpperCase()} %c v${CARD_VERSION} `,
    'color: white; background: #555; font-weight: bold;',
    'color: white; background: #007acc; font-weight: bold;',
);

window.customCards = window.customCards || [];
window.customCards.push({
    type: CARD_NAME,
    name: 'HNL Power Bars Card',
    description: CARD_DESCRIPTION,
});

class HnlPowerBarsCard extends LitElement {

    _updatedParsedConfig = null;
    _previousValues = {};

    //part of LitElement interface
    static get properties() {
        return {
            hass: {},
        };
    }

    _roundOff(x, digits = this._parsedConfig.rounding) {
        return typeof x === "number"
            ? Math.round(x * Math.pow(10, digits)) / Math.pow(10, digits)
            : 0;
    }

    _dispatchHassEvent(node, type, detail, options = {}) {
        const event = new Event(type, {
            bubbles: options.bubbles ?? true,
            cancelable: options.cancelable ?? false,
            composed: options.composed ?? true,
        });
        event.detail = detail;
        node.dispatchEvent(event);
        return event;
    }

    _handleMoreInfo(entityId) {
        if (entityId) {
            this._dispatchHassEvent(this, "hass-more-info", {
                entityId,
            });
        }
    }

    get _parsedConfig() {
        if (!this._updatedParsedConfig && this.hass) {
            this._updatedParsedConfig = this._hydrateParsedConfig();
        }
        return this._updatedParsedConfig;
    }

    _hydrateParsedConfig() {
        const hydrate = (items, fallbackIcon, colorType) => {
          return items.map((item, index) => {
            const entityId = item.entity;
            const stateObj = this.hass?.states[entityId];
            const fallbackVar = `var(--hnl-power-bars-color-${colorType}-${index % 8}, var(--hnl-power-bars-color-default))`;

            if (!stateObj) {
              return {
                entity_id: entityId,
                name: entityId,
                value: 0,
                icon: item.icon || fallbackIcon,
                color: item.color || fallbackVar,
                bg_opacity: item.bg_opacity || 'inherit',
                text_color: item.text_color || 'inherit',
                unit_of_measurement: item.unit_of_measurement,
              };
            }

            let value = Math.max(0, parseFloat(stateObj.state) || 0);

            if (this._rawConfig.easing) {
              const prev = this._previousValues[entityId] ?? value;
              value = (prev + value) / 2;
              this._previousValues[entityId] = value;
            }

            const unit = item.unit_of_measurement ?? stateObj.attributes.unit_of_measurement;

            return {
              entity_id: entityId,
              name: stateObj.attributes.friendly_name ?? entityId,
              value,
              icon: item.icon || computeEntityIcon(stateObj) || fallbackIcon,
              color: item.color || fallbackVar,
              bg_opacity: item.bg_opacity || 'inherit',
              text_color: item.text_color || 'inherit',
              unit_of_measurement: unit,
            };
          });
        };


        return {
            production: hydrate(
                this._rawConfig.production,
                'mdi:solar-power-variant',
                'production',
            ),
            consumption: hydrate(
                this._rawConfig.consumption,
                'mdi:power-plug',
                'consumption',
            ),
            consumption_remainder: this._rawConfig.consumption_remainder,
            production_remainder: this._rawConfig.production_remainder,
            rounding: this._rawConfig.rounding,
            hide_zero_values: this._rawConfig.hide_zero_values,
            unit_of_measurement: this._rawConfig.unit_of_measurement,
            card_class: this._rawConfig.transparent ? 'transparent' : ''
        };
    }

    _buildBarData(entities, maxValue, unitOverride) {
        let total = 0;
        const bars = entities.map((ent) => {
            const value = ent.value;
            const unit = unitOverride || ent.unit_of_measurement;
            const width = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
            total += this._roundOff(value);

            return {
                entity_id: ent.entity_id,
                name: ent.name ?? ent.entity_id,
                value,
                icon: ent.icon,
                color: ent.color,
                bg_opacity: ent.bg_opacity,
                text_color: ent.text_color,
                width,
                unit_of_measurement: unit,
            };
        });

        const remainder = this._roundOff(maxValue - total);
        return { bars, total, remainder };
    }

    _shouldShowBar(ent) {
        return ent.value > 0 || !this._parsedConfig.hide_zero_values;
    }

    _renderSourceLabel(ent) {
        return html`<hnl-power-bar-source-label title="${ent.name}: ${this._roundOff(ent.value)} ${this._parsedConfig.unit_of_measurement || ent.unit_of_measurement || ''}" style="--background-color:${ent.color};--text-color:${ent.text_color};--width:${ent.width}%;cursor:pointer;" @click=${() => this._handleMoreInfo(ent.entity_id)}><span>
            <ha-icon icon="${ent.icon || computeEntityIcon(ent)}"></ha-icon>
            <span>${this._roundOff(ent.value)} ${this._parsedConfig.unit_of_measurement || ent.unit_of_measurement}</span>
          </span></hnl-power-bar-source-label>`;
    }

    _renderAccolade(ent) {
        return html`<hnl-power-bar-source-accolade style="--background-color:${ent.color};--width:${ent.width}%;--accolade-bg-opacity:${ent.bg_opacity};"></hnl-power-bar-source-accolade>`;
    }

    _renderDestination(ent) {
        return html`<hnl-power-bar-destination title="${ent.name}: ${this._roundOff(ent.value)} ${this._parsedConfig.unit_of_measurement || ent.unit_of_measurement || ''}" style="--background-color:${ent.color};--destination-bg-opacity:${ent.bg_opacity};--text-color:${ent.text_color};--width:${ent.width}%;cursor:pointer;" @click=${() => this._handleMoreInfo(ent.entity_id)}><span>
            <ha-icon icon="${ent.icon}"></ha-icon>
            <span>${this._roundOff(ent.value)} ${this._parsedConfig.unit_of_measurement || ent.unit_of_measurement}</span>
          </span></hnl-power-bar-destination>`;
    }

    _renderRemainder(type, remainderValue) {
        const cfg = this._parsedConfig[`${type}_remainder`];
        const unit = cfg.unit_of_measurement || this._parsedConfig.unit_of_measurement || '';
        if (type === 'production') {
            return html`<hnl-power-bar-source-label title="${cfg.name}: ${remainderValue} ${unit}" style="--background-color:${cfg.color};--text-color:${cfg.text_color};"><span>
                <ha-icon icon="${cfg.icon}"></ha-icon>
                <span>${remainderValue} ${cfg.unit_of_measurement || this._parsedConfig.unit_of_measurement}</span>
                </span></hnl-power-bar-source-label>`;
        }
        return html`<hnl-power-bar-destination title="${cfg.name}: ${remainderValue} ${unit}" style="--background-color:${cfg.color};--destination-bg-opacity:${cfg.bg_opacity};"><span>
            <ha-icon icon="${cfg.icon}"></ha-icon>
            <span>${remainderValue} ${cfg.unit_of_measurement || this._parsedConfig.unit_of_measurement}</span>
            </span></hnl-power-bar-destination>`;
    }

    _renderRemainderAccolade(type) {
        const cfg = this._parsedConfig[`${type}_remainder`];
        return html`<hnl-power-bar-source-accolade style="--background-color:${cfg.color};--accolade-bg-opacity:${cfg.bg_opacity};"></hnl-power-bar-source-accolade>`;
    }

    _normalizeEntityConfig(input) {
        if (typeof input === "string") {
            return [{ entity: input }];
        }
        if (Array.isArray(input)) {
            return input.map((item) =>
                typeof item === "string" ? { entity: item } : item
            );
        }
        if (typeof input === "object" && input.entity) {
            return [input];
        }
        throw new Error("Invalid entity format: " + JSON.stringify(input));
    }

    //part of LitElement interface
    render() {
        if (!this.hass || !this._parsedConfig) {
            return html``;
        }

        const productionTotal = this._parsedConfig.production.reduce((sum, ent) => sum + ent.value, 0);
        const consumptionTotal = this._parsedConfig.consumption.reduce((sum, ent) => sum + ent.value, 0);

        const maxValue = this._roundOff(Math.max(productionTotal, consumptionTotal));

        const {
            bars: prodBars,
            total: prodSum,
            remainder: prodRemainder
        } = this._buildBarData(
            this._parsedConfig.production,
            maxValue,
            this._parsedConfig.unit_of_measurement
        );

        const {
            bars: consBars,
            total: consSum,
            remainder: consRemainder
        } = this._buildBarData(
            this._parsedConfig.consumption,
            maxValue,
            this._parsedConfig.unit_of_measurement
        );

        const barData = {
            production: prodBars,
            consumption: consBars,
        };

        const totals = {
            production: prodSum,
            production_remainder: prodRemainder,
            consumption: consSum,
            consumption_remainder: consRemainder,
        };

        const visibleProd = barData.production.filter((ent) => this._shouldShowBar(ent));
        const visibleCons = barData.consumption.filter((ent) => this._shouldShowBar(ent));

        return html`
            <ha-card class="${this._parsedConfig.card_class}">
                <div class="card-content">
        <hnl-power-bars>
            <hnl-power-bar-source-group>
                <hnl-power-bar-source-labels>
                    ${visibleProd.map((ent) => this._renderSourceLabel(ent))}
                    ${totals.production_remainder > 0 ? this._renderRemainder('production', totals.production_remainder) : null}
                </hnl-power-bar-source-labels>
                <hnl-power-bar-source-accolades>
                    ${visibleProd.map((ent) => this._renderAccolade(ent))}
                    ${totals.production_remainder > 0 ? this._renderRemainderAccolade('production') : null}
                </hnl-power-bar-source-accolades>
            </hnl-power-bar-source-group>
            <hnl-power-bar-destination-group>
                ${visibleCons.map((ent) => this._renderDestination(ent))}
                ${totals.consumption_remainder > 0 ? this._renderRemainder('consumption', totals.consumption_remainder) : null}
            </hnl-power-bar-destination-group>
        </hnl-power-bars>
                </div>
            </ha-card>
        `;
    }

    //part of HASS card API
    updated(changedProps) {
        if (!changedProps.has("hass")) return;

        const changedHass = changedProps.get("hass");
        if (!changedHass) return;

        const prevStates = changedHass.states;
        const currentStates = this.hass.states;

        // Collect all relevant entity_ids from the config
        const relevantEntities = [
            ...this._rawConfig.production.map((p) => p.entity),
            ...this._rawConfig.consumption.map((c) => c.entity),
        ];

        const anyChanged = relevantEntities.some((entity_id) => {
            const oldState = prevStates[entity_id];
            const newState = currentStates[entity_id];
            return !oldState || !newState || oldState.state !== newState.state;
        });

        if (anyChanged) {
            this._updatedParsedConfig = this._hydrateParsedConfig();
        }
    }

    //part of HASS card API
    setConfig(config) {
        if (!config.production || !config.consumption) {
            throw new Error("You need to define both production and consumption entities");
        }

        this._rawConfig = {
            production: this._normalizeEntityConfig(config.production),
            consumption: this._normalizeEntityConfig(config.consumption),
            production_remainder: {
                name: config.production_remainder?.name || "Production remainder",
                icon: config.production_remainder?.icon || 'mdi:eye',
                color: config.production_remainder?.color || 'var(--hnl-power-bars-color-production-remainder)',
                bg_opacity: config.production_remainder?.bg_opacity || 'inherit',
                text_color: config.production_remainder?.text_color || 'var(--hnl-power-bars-text-color-production-remainder)',
                unit_of_measurement: config.production_remainder?.unit_of_measurement || null
            },
            consumption_remainder: {
                name: config.consumption_remainder?.name || "Consumption remainder",
                icon: config.consumption_remainder?.icon || 'mdi:eye',
                color: config.consumption_remainder?.color || 'var(--hnl-power-bars-color-consumption-remainder)',
                bg_opacity: config.consumption_remainder?.bg_opacity || 'inherit',
                text_color: config.consumption_remainder?.text_color || 'var(--hnl-power-bars-text-color-consumption-remainder)',
                unit_of_measurement: config.consumption_remainder?.unit_of_measurement || null
            },
            easing: config.easing ?? false,
            hide_zero_values: config.hide_zero_values ?? true,
            rounding: config.rounding ?? 0,
            transparent: config.transparent ?? true,
            unit_of_measurement: config.unit_of_measurement,
            grid_options: config.grid_options || {},
        };
    }


    //part of HASS card API
    static getStubConfig() {
        return {
            production: [{ entity: "sensor.solar_power" }],
            consumption: [{ entity: "sensor.house_power" }],
        };
    }

    //part of HASS card API
    // The height of your card. Home Assistant uses this to automatically
    // distribute all cards over the available columns.
    getCardSize() {
        return this._rawConfig?.grid_options?.rows || 3; // default to 3 if unspecified
    }

    //part of LitElement interface
    static get styles() {
        return css`
            :host {
                --accolade-height: 8px;
                --accolade-border-width: 2px;
                --accolade-bg-opacity: 0.4;
                --destination-bg-opacity: 0.65;
                --border-radius: calc(var(--ha-card-border-radius, 14px) / 2);
                --font-size: min(calc(0.12em * var(--column-size)), var(--card-primary-font-size, 14px));
                --mdc-icon-size: min(calc(var(--font-size, 0.8em) + 0.5em), 1.2em);
                --label-edge-padding: calc(var(--font-size, 0.8em) * .7);
                --label-padding: calc(var(--font-size, 0.8em) * 0.15) calc(var(--font-size, 0.8em) * 0.5);

                --hnl-power-bars-color-default: hsl(205, 90%, 55%);

                --hnl-power-bars-color-production: #ffc107;
                --hnl-power-bars-color-production-0: oklch(from var(--hnl-power-bars-color-production) l c h / 1);
                --hnl-power-bars-color-production-1: oklch(from var(--hnl-power-bars-color-production) calc(l * .9) c calc(h - 10) / 1);
                --hnl-power-bars-color-production-2: oklch(from var(--hnl-power-bars-color-production) calc(l * 1.1) c calc(h + 10) / 1);
                --hnl-power-bars-color-production-3: oklch(from var(--hnl-power-bars-color-production) calc(l * .9) c calc(h - 30) / 1);
                --hnl-power-bars-color-production-4: oklch(from var(--hnl-power-bars-color-production) calc(l * 1.1) c calc(h + 30) / 1);

                --hnl-power-bars-color-production-remainder: var(--energy-grid-consumption-color-1);
                --hnl-power-bars-text-color-production-remainder: #FFF;

                --hnl-power-bars-color-consumption: var(--energy-grid-consumption-color);
                --hnl-power-bars-color-consumption-0: oklch(from var(--hnl-power-bars-color-consumption) l c h / 1);
                --hnl-power-bars-color-consumption-1: oklch(from var(--hnl-power-bars-color-consumption) calc(l * .9) c calc(h - 10) / 1);
                --hnl-power-bars-color-consumption-2: oklch(from var(--hnl-power-bars-color-consumption) calc(l * 1.1) c calc(h + 10) / 1);
                --hnl-power-bars-color-consumption-3: oklch(from var(--hnl-power-bars-color-consumption) calc(l * .9) c calc(h - 30) / 1);
                --hnl-power-bars-color-consumption-4: oklch(from var(--hnl-power-bars-color-consumption) calc(l * 1.1) c calc(h + 30) / 1);

                --hnl-power-bars-color-consumption-remainder: #00c1a0;
                --hnl-power-bars-text-color-consumption-remainder: #000e;

                font-size: var(--font-size, 0.8em);
                font-weight: 500;
            }

            hnl-power-bars *,
            hnl-power-bars *::before,
            hnl-power-bars *::after {
                box-sizing: border-box;
            }

            ha-card {
                display: block;
                height: 100%;
                overflow: hidden;
            }
            ha-card.transparent {
                background: none;
                overflow: unset;
            }

            .card-content {
                display: flex;
                position: absolute;
                inset: 0;
                flex-direction: row;
                flex-wrap: nowrap;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                padding: 8px;
            }
            ha-card.transparent .card-content {
                padding: 0;
            }


            /* Layout */
            hnl-power-bars {
                display: grid;
                align-self: center;
                flex-basis: 100%;
                justify-items: stretch;
                gap: 0;
                grid-template-rows: 1fr var(--accolade-height, 5px) 1fr;
                border-radius: var(--border-radius, 8px);
                overflow: hidden;
                max-height: 100%;
            }

            hnl-power-bar-source-group {
                display: grid;
                grid-column: 1;
                grid-row: 1 / -1;
                grid-template-rows: 1fr var(--accolade-height, 5px) 1fr;
                z-index: 2;
                overflow: hidden;
            }

            hnl-power-bar-destination-group {
                display: flex;
                grid-column: 1;
                grid-row: 3;
                z-index: 3;
                overflow: hidden;
                gap: 0;
            }

            hnl-power-bar-source-labels,
            hnl-power-bar-source-accolades {
                display: flex;
                z-index: 2;
                gap: 0;
            }

            hnl-power-bar-source-labels {
                grid-row: 1;
            }

            hnl-power-bar-source-accolades {
                grid-row: 2 / -1;
                z-index: 3;
            }

            hnl-power-bar-source-label,
            hnl-power-bar-source-accolade,
            hnl-power-bar-destination {
                display: flex;
                flex: var(--grow, 0) 1 var(--width, 0);
                transition: flex-basis 0.3s ease;
            }

            hnl-power-bar-source-label:last-child,
            hnl-power-bar-source-accolade:last-child,
            hnl-power-bar-destination:last-child {
                --grow: 1;
            }

            /* Presentational */
            hnl-power-bar-destination {
                align-items: center;
                justify-content: center;
                padding: max(.15cqi,2px);
                background-color: var(--adjusted-bg-color);
                color: white;
                --adjusted-bg-color: oklch(from var(--background-color) l calc(c * 1.2) h / var(--destination-bg-opacity));
            }
            hnl-power-bar-destination:last-child {
                border-radius: 0 max(0px, calc(var(--border-radius, 8px) - var(--accolade-height))) 0 0;
            }

            hnl-power-bar-source-accolade {
                grid-row: 2;
                border: var(--accolade-border-width, var(--accolade-height, 2px)) solid var(--adjusted-bg-color, green);
                border-bottom: 0;
                background: oklch(from var(--background-color) l c h / var(--accolade-bg-opacity));
                color: oklch(from var(--background-color) calc(l * .3) c h / 1);
                --adjusted-bg-color: oklch(from var(--background-color) calc(l) calc(c) h / 1);
                overflow: hidden;
                min-width: var(--border-radius, 8px);
            }

            hnl-power-bar-source-accolade:last-child {
                border-radius: 0 var(--border-radius, 8px) 0 0;
            }
            hnl-power-bar-source-accolades > :first-child:not(:only-child),
            hnl-power-bar-source-accolade:nth-child(n+2):not(:last-child) {
              border-right: 0;
            }

            hnl-power-bar-source-label > span,
            hnl-power-bar-destination > span {
                display: flex;
                max-width: 100%;
                gap: 3px;
                padding: var(--label-padding, 0.2em 0.4em);
                margin: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                border-radius: min(0.4cqb,var(--border-radius, 8px));
                max-height: 100%;
                align-items: center;
            }

            hnl-power-bar-destination > span {
                background-color: oklch(from var(--adjusted-bg-color) calc(l * 0.8) c h / 1);
            }

            hnl-power-bar-source-label {
                --slanted-edge: 20px;
                --correction: min(var(--accolade-height), calc(var(--ha-card-border-radius, 14px) / 2), var(--accolade-border-width));
                padding-right: calc(var(--border-radius, 8px) - var(--correction, 0px));
                margin-bottom: calc(-1 * var(--correction, 5px));
            }

            hnl-power-bar-source-label > span {
                --adjusted-bg-color: oklch(from var(--background-color) calc(l) calc(c) h / 1);
                align-items: center;
                background: var(--adjusted-bg-color, rgba(0, 0, 0, 0.4));
                border-bottom-left-radius: 0;
                border-bottom-right-radius: 0;
                border-top-right-radius: 0;
                color: var(--text-color, oklch(from var(--adjusted-bg-color) calc(l * .3) c h / 1));
                padding-right: calc((var(--label-edge-padding) / 2) + var(--slanted-edge, 20px));
                clip-path: polygon(0 0, calc(100% - var(--slanted-edge, 20px)) 0%, 100% 100%, 0% 100%);
            }

        `;
    }
}

customElements.define("hnl-power-bars-card", HnlPowerBarsCard);
