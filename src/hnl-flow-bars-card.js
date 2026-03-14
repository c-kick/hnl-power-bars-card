import { LitElement, html, css } from 'lit';
import { computeEntityIcon, resolveLayoutAndTheme } from './utils.js';
import {
    CARD_VERSION, CARD_NAME, CARD_DESCRIPTION,
} from './const.js';
import { subscribeEnergyDateSelection, fetchStatistics } from './energy.js';
import './editor/hnl-flow-bars-card-editor.js';

console.info(
    `%c ${CARD_NAME.toUpperCase()} %c v${CARD_VERSION} `,
    'color: white; background: #555; font-weight: bold;',
    'color: white; background: #007acc; font-weight: bold;',
);

window.customCards = window.customCards || [];
window.customCards.push({
    type: CARD_NAME,
    name: 'HNL Flow Bars Card',
    description: CARD_DESCRIPTION,
    preview: true,
    documentationURL: 'https://github.com/c-kick/hnl-flow-bars-card',
});

class HnlFlowBarsCard extends LitElement {

    _updatedParsedConfig = null;
    _energyStats = null;
    _energyError = null;
    _energyLoading = false;
    _energyUnsub = null;

    //part of LitElement interface
    static get properties() {
        return {
            hass: {},
            layout: { type: String },
            _energyStats: { state: true },
            _energyError: { state: true },
            _energyLoading: { state: true },
        };
    }

    connectedCallback() {
        super.connectedCallback();
        this._subscribeEnergy();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._unsubscribeEnergy();
    }

    _subscribeEnergy() {
        if (!this._rawConfig?.energy_date_selection) return;

        this._energyLoading = true;
        this._energyError = null;

        subscribeEnergyDateSelection(this.hass, async (data) => {
            if (!this.hass) return;

            const entityIds = [
                ...this._rawConfig.production.map(p => p.entity),
                ...this._rawConfig.consumption.map(c => c.entity),
            ];

            try {
                const stats = await fetchStatistics(
                    this.hass,
                    data.start,
                    data.end || new Date(),
                    entityIds,
                );
                this._energyStats = stats;
                this._energyLoading = false;
                this._energyError = null;
                // Invalidate parsed config so it re-renders with new stats
                this._updatedParsedConfig = this._hydrateParsedConfig();
                this.requestUpdate();
            } catch (err) {
                this._energyError = err.message || 'Failed to fetch statistics';
                this._energyLoading = false;
            }
        }).then(unsub => {
            this._energyUnsub = unsub;
        }).catch(err => {
            this._energyError = err.message;
            this._energyLoading = false;
        });
    }

    _unsubscribeEnergy() {
        if (this._energyUnsub) {
            this._energyUnsub();
            this._energyUnsub = null;
        }
        this._energyStats = null;
        this._energyError = null;
        this._energyLoading = false;
    }

    _roundOff(x, digits = this._parsedConfig.rounding) {
        return typeof x === "number"
            ? Math.round(x * Math.pow(10, digits)) / Math.pow(10, digits)
            : 0;
    }

    _dispatchHassEvent(node, type, detail, options = {}) {
        const event = new CustomEvent(type, {
            detail,
            bubbles: options.bubbles ?? true,
            cancelable: options.cancelable ?? false,
            composed: options.composed ?? true,
        });
        node.dispatchEvent(event);
        return event;
    }

    _handleAction(entityId, actionType = 'tap') {
        if (!entityId) return;

        const actionConfig = {
            entity: entityId,
            tap_action: { action: 'more-info' },
            hold_action: { action: 'more-info' },
            double_tap_action: { action: 'none' },
        };

        this._dispatchHassEvent(this, "hass-action", {
            config: actionConfig,
            action: actionType,
        });
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
            const fallbackVar = `var(--hnl-flow-bars-color-${colorType}-${index % 4}, var(--hnl-flow-bars-color-default))`;

            if (!stateObj) {
              return {
                entity_id: entityId,
                name: item.name || entityId,
                value: 0,
                icon: item.icon || fallbackIcon,
                color: item.color || fallbackVar,
                bg_opacity: item.bg_opacity || 'inherit',
                text_color: item.text_color || 'inherit',
                unit_of_measurement: item.unit_of_measurement,
                warning: `${entityId}: entity not found`,
              };
            }

            // Use energy statistics when available, otherwise use live state
            const useEnergy = this._rawConfig.energy_date_selection && this._energyStats;
            const raw = useEnergy && this._energyStats[entityId] != null
                ? String(this._energyStats[entityId])
                : stateObj.state;
            const isUnavailable = raw === 'unavailable' || raw === 'unknown';
            const parsed = parseFloat(raw);
            const isNonNumeric = !isUnavailable && isNaN(parsed);
            let value = Math.max(0, parsed || 0);
            const displayName = item.name || stateObj.attributes.friendly_name || entityId;
            let warning = null;
            if (useEnergy && this._energyStats[entityId] == null) {
              warning = `${displayName}: no statistics available for this period`;
            } else if (isUnavailable) {
              warning = `${displayName}: ${raw}`;
            } else if (isNonNumeric) {
              warning = `${displayName}: non-numeric state "${raw}"`;
            }

            const unit = item.unit_of_measurement ?? stateObj.attributes.unit_of_measurement;

            return {
              entity_id: entityId,
              name: displayName,
              value,
              icon: item.icon || computeEntityIcon(stateObj) || fallbackIcon,
              color: item.color || fallbackVar,
              bg_opacity: item.bg_opacity || 'inherit',
              text_color: item.text_color || 'inherit',
              hatched: item.hatched || false,
              unit_of_measurement: unit,
              warning,
            };
          });
        };


        const production = hydrate(
            this._rawConfig.production,
            'mdi:solar-power-variant',
            'production',
        );
        const consumption = hydrate(
            this._rawConfig.consumption,
            'mdi:power-plug',
            'consumption',
        );

        return {
            production,
            consumption,
            consumption_remainder: this._rawConfig.consumption_remainder,
            production_remainder: this._rawConfig.production_remainder,
            rounding: this._rawConfig.rounding,
            hide_zero_values: this._rawConfig.hide_zero_values,
            unit_of_measurement: this._rawConfig.unit_of_measurement,
            card_class: [
                this._rawConfig.transparent ? 'transparent' : '',
                this._rawConfig.theme === 'minimal' ? 'minimal' : '',
            ].filter(Boolean).join(' '),
            warnings: [...production, ...consumption].filter((ent) => ent.warning),
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
        return this._roundOff(ent.value) > 0 || !this._parsedConfig.hide_zero_values;
    }

    get _flowBarsClasses() {
        const { layout, theme } = this._rawConfig;
        const classes = [];

        // Layout
        if (layout === 'native') classes.push('native');
        if (theme === 'split-pill') classes.push('alternative');
        if (this._rawConfig.gradient) classes.push('gradient');

        // Layout modifiers
        if (!this._rawConfig.slanted_edge) classes.push('no-slant');
        if (!this._rawConfig.borders) classes.push('no-borders');

        if (!this._rawConfig.show_names) classes.push('hide-names');

        // Theme
        if (theme === 'minimal') classes.push('minimal');
        if (theme === 'contained') classes.push('contained');

        // Toggles
        if (this._rawConfig.animated) classes.push('animated');

        return classes.join(' ');
    }

    _getAccoladeClasses(isRemainder = false) {
        if (isRemainder && this._rawConfig.hatched) {
            return 'hatched';
        }
        return '';
    }

    _renderSourceLabel(ent) {
        return html`<hnl-flow-bar-source-label title="${ent.name}: ${this._roundOff(ent.value)} ${this._parsedConfig.unit_of_measurement || ent.unit_of_measurement || ''}" style="--background-color:${ent.color};--text-color:${ent.text_color};--bar-width:${ent.width}%;--source-bg-opacity:${ent.bg_opacity};cursor:pointer;" @click=${() => this._handleAction(ent.entity_id)}><span>
            <span class="source-value"><ha-icon icon="${ent.icon || 'mdi:eye'}"></ha-icon>
            <span>${this._roundOff(ent.value)} ${this._parsedConfig.unit_of_measurement || ent.unit_of_measurement}</span></span>
            <span class="entity-name">${ent.name}</span>
          </span></hnl-flow-bar-source-label>`;
    }

    _renderAccolade(ent) {
        return html`<hnl-flow-bar-source-accolade class="${this._getAccoladeClasses()}" style="--background-color:${ent.color};--bar-width:${ent.width}%;--accolade-bg-opacity:${ent.bg_opacity};"></hnl-flow-bar-source-accolade>`;
    }

    _renderDestination(ent) {
        return html`<hnl-flow-bar-destination title="${ent.name}: ${this._roundOff(ent.value)} ${this._parsedConfig.unit_of_measurement || ent.unit_of_measurement || ''}" style="--background-color:${ent.color};--destination-bg-opacity:${ent.bg_opacity};--text-color:${ent.text_color};--bar-width:${ent.width}%;cursor:pointer;" @click=${() => this._handleAction(ent.entity_id)}><span>
            <span class="destination-value"><ha-icon icon="${ent.icon}"></ha-icon>
            <span>${this._roundOff(ent.value)} ${this._parsedConfig.unit_of_measurement || ent.unit_of_measurement}</span></span>
            <span class="entity-name">${ent.name}</span>
          </span></hnl-flow-bar-destination>`;
    }

    _renderRemainder(type, remainderValue) {
        const cfg = this._parsedConfig[`${type}_remainder`];
        const unit = cfg.unit_of_measurement || this._parsedConfig.unit_of_measurement || '';
        const hatchedClass = this._rawConfig.hatched ? 'hatched' : '';
        if (type === 'production') {
            return html`<hnl-flow-bar-source-label class="${hatchedClass}" title="${cfg.name}: ${remainderValue} ${unit}" style="--background-color:${cfg.color};--text-color:${cfg.text_color};--source-bg-opacity:${cfg.bg_opacity};"><span>
                <span class="source-value"><ha-icon icon="${cfg.icon}"></ha-icon>
                <span>${remainderValue} ${cfg.unit_of_measurement || this._parsedConfig.unit_of_measurement}</span></span>
                <span class="entity-name">${cfg.name}</span>
                </span></hnl-flow-bar-source-label>`;
        }
        return html`<hnl-flow-bar-destination class="${hatchedClass}" title="${cfg.name}: ${remainderValue} ${unit}" style="--background-color:${cfg.color};--destination-bg-opacity:${cfg.bg_opacity};"><span>
            <span class="destination-value"><ha-icon icon="${cfg.icon}"></ha-icon>
            <span>${remainderValue} ${cfg.unit_of_measurement || this._parsedConfig.unit_of_measurement}</span></span>
            <span class="entity-name">${cfg.name}</span>
            </span></hnl-flow-bar-destination>`;
    }

    _renderRemainderAccolade(type) {
        const cfg = this._parsedConfig[`${type}_remainder`];
        return html`<hnl-flow-bar-source-accolade class="${this._getAccoladeClasses(true)}" style="--background-color:${cfg.color};--accolade-bg-opacity:${cfg.bg_opacity};"></hnl-flow-bar-source-accolade>`;
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

        if (this._rawConfig.energy_date_selection && this._energyError) {
            return html`
                <ha-card class="${this._parsedConfig.card_class}">
                    <div class="card-content">
                        <ha-alert alert-type="error">${this._energyError}</ha-alert>
                    </div>
                </ha-card>
            `;
        }

        if (this._rawConfig.energy_date_selection && this._energyLoading && !this._energyStats) {
            return html`
                <ha-card class="${this._parsedConfig.card_class}">
                    <div class="card-content">
                        <ha-alert alert-type="info">Loading energy data…</ha-alert>
                    </div>
                </ha-card>
            `;
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
                ${this._parsedConfig.warnings.length ? html`
                    <div class="card-warnings">
                        ${this._parsedConfig.warnings.map((ent) => html`
                            <ha-alert alert-type="warning">${ent.warning}</ha-alert>
                        `)}
                    </div>
                ` : null}
                <div class="card-content">
        <hnl-flow-bars class="${this._flowBarsClasses}">
            <hnl-flow-bar-source-group>
                <hnl-flow-bar-source-labels>
                    ${visibleProd.map((ent) => this._renderSourceLabel(ent))}
                    ${totals.production_remainder > 0 ? this._renderRemainder('production', totals.production_remainder) : null}
                </hnl-flow-bar-source-labels>
                <hnl-flow-bar-source-accolades>
                    ${visibleProd.map((ent) => this._renderAccolade(ent))}
                    ${totals.production_remainder > 0 ? this._renderRemainderAccolade('production') : null}
                </hnl-flow-bar-source-accolades>
            </hnl-flow-bar-source-group>
            <hnl-flow-bar-destination-group>
                ${visibleCons.map((ent) => this._renderDestination(ent))}
                ${totals.consumption_remainder > 0 ? this._renderRemainder('consumption', totals.consumption_remainder) : null}
            </hnl-flow-bar-destination-group>
        </hnl-flow-bars>
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

        const resolved = resolveLayoutAndTheme(config);
        this._rawConfig = {
            production: this._normalizeEntityConfig(config.production),
            consumption: this._normalizeEntityConfig(config.consumption),
            production_remainder: {
                name: config.production_remainder?.name || "Shortfall",
                icon: config.production_remainder?.icon || 'mdi:eye',
                color: config.production_remainder?.color || 'var(--hnl-flow-bars-color-shortfall)',
                bg_opacity: config.production_remainder?.bg_opacity || 'inherit',
                text_color: config.production_remainder?.text_color || 'inherit',
                unit_of_measurement: config.production_remainder?.unit_of_measurement || null
            },
            consumption_remainder: {
                name: config.consumption_remainder?.name || "Surplus",
                icon: config.consumption_remainder?.icon || 'mdi:eye',
                color: config.consumption_remainder?.color || 'var(--hnl-flow-bars-color-surplus)',
                bg_opacity: config.consumption_remainder?.bg_opacity || 'inherit',
                text_color: config.consumption_remainder?.text_color || 'inherit',
                unit_of_measurement: config.consumption_remainder?.unit_of_measurement || null
            },
            ...resolved,
            slanted_edge: config.slanted_edge ?? true,
            borders: config.borders ?? (resolved.layout === 'native'),

            show_names: config.show_names ?? true,
            hide_zero_values: config.hide_zero_values ?? true,
            rounding: config.rounding ?? 0,
            transparent: config.transparent ?? true,
            unit_of_measurement: config.unit_of_measurement,
            energy_date_selection: config.energy_date_selection ?? false,
            grid_options: config.grid_options || {},
        };

        // Re-subscribe if energy mode changed while connected
        if (this.isConnected) {
            this._unsubscribeEnergy();
            this._subscribeEnergy();
        }
    }


    //part of HASS card API
    static getConfigElement() {
        return document.createElement("hnl-flow-bars-card-editor");
    }

    //part of HASS card API
    static getStubConfig(hass) {
        if (!hass) {
            return {
                production: [{ entity: "sensor.solar_power" }],
                consumption: [{ entity: "sensor.house_power" }],
            };
        }

        // Find numeric sensor entities, preferring power/energy ones
        const states = Object.values(hass.states);
        const numeric = states.filter(
            (s) =>
                s.entity_id.startsWith("sensor.") &&
                !isNaN(parseFloat(s.state)) &&
                isFinite(s.state)
        );

        // Prefer power (W) sensors, then energy (kWh/Wh), then any numeric sensor
        const byPreference = (keyword) =>
            numeric.find(
                (s) =>
                    s.entity_id.includes(keyword) ||
                    (s.attributes.device_class || "") === keyword
            );

        const source =
            byPreference("solar") ||
            byPreference("power") ||
            numeric[0];
        const dest =
            numeric.find(
                (s) =>
                    s !== source &&
                    (s.entity_id.includes("consumption") ||
                        s.entity_id.includes("house") ||
                        s.entity_id.includes("load") ||
                        (s.attributes.device_class || "") === "power")
            ) ||
            numeric.find((s) => s !== source) ||
            source;

        return {
            production: [{ entity: source?.entity_id || "sensor.solar_power" }],
            consumption: [{ entity: dest?.entity_id || "sensor.house_power" }],
        };
    }

    //part of HASS card API — masonry view sizing (1 unit = 50px)
    getCardSize() {
        return this._rawConfig?.grid_options?.rows || 1;
    }

    //part of HASS card API — section view grid sizing
    getGridOptions() {
        return { columns: 12, min_columns: 3, rows: 1, min_rows: 1 };
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
                --min-bar-width: min-content;

                --hnl-flow-bars-color-default: hsl(205, 90%, 55%);

                /* Base colors */
                --hnl-flow-bars-color-production: #ffd407;
                --hnl-flow-bars-color-production-0: oklch(from var(--hnl-flow-bars-color-production) l c h);
                --hnl-flow-bars-color-production-1: oklch(from var(--hnl-flow-bars-color-production) calc(l * 0.92) c calc(h - 15));
                --hnl-flow-bars-color-production-2: oklch(from var(--hnl-flow-bars-color-production) calc(l * 1.08) c calc(h + 15));
                --hnl-flow-bars-color-production-3: oklch(from var(--hnl-flow-bars-color-production) calc(l * 0.85) c calc(h - 30));

                --hnl-flow-bars-color-consumption: #8b58bf;
                --hnl-flow-bars-color-consumption-0: oklch(from var(--hnl-flow-bars-color-consumption) l c h);
                --hnl-flow-bars-color-consumption-1: oklch(from var(--hnl-flow-bars-color-consumption) calc(l * 0.92) c calc(h - 15));
                --hnl-flow-bars-color-consumption-2: oklch(from var(--hnl-flow-bars-color-consumption) calc(l * 1.08) c calc(h + 15));
                --hnl-flow-bars-color-consumption-3: oklch(from var(--hnl-flow-bars-color-consumption) calc(l * 0.85) c calc(h - 30));

                /* Remainder / shortfall+surplus colors */
                --hnl-flow-bars-color-shortfall: #ce513a;
                --hnl-flow-bars-color-surplus: #3c9940;

                display: block;
                height: 100%;
                min-height: var(--row-height, 56px);
                font-size: var(--font-size, 0.8em);
                font-weight: 500;
            }

            hnl-flow-bars *,
            hnl-flow-bars *::before,
            hnl-flow-bars *::after {
                box-sizing: border-box;
            }

            ha-card {
                display: block;
                height: 100%;
                overflow: hidden;
            }
			ha-card hnl-flow-bars {
                container-type: size;
                container-name: card;
			}
            ha-card.transparent {
                background: none;
                border: none;
                box-shadow: none;
            }
            ha-card.transparent > .card-content {
				padding: 0;
			}
            ha-card.transparent {
				border-radius: 0;
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


            /* ═══ LAYOUT: Accolade (default) ═══ */
            hnl-flow-bars {
                display: grid;
                align-self: stretch;
                flex-basis: 100%;
                justify-items: stretch;
                gap: 0;
                grid-template-rows: 1fr var(--accolade-height, 5px) 1fr;
                border-radius: var(--border-radius, 8px);
                overflow: hidden;
                max-height: 100%;
            }

            hnl-flow-bar-source-group {
                display: grid;
                grid-column: 1;
                grid-row: 1 / -1;
                grid-template-rows: 1fr var(--accolade-height, 5px) 1fr;
                z-index: 2;
                overflow: hidden;
            }

            hnl-flow-bar-destination-group {
                display: flex;
                grid-column: 1;
                grid-row: 3;
                z-index: 3;
                overflow: hidden;
                gap: 0;
            }

            hnl-flow-bar-source-labels,
            hnl-flow-bar-source-accolades {
                display: flex;
                z-index: 2;
                gap: 0;
            }

            hnl-flow-bar-source-labels {
                grid-row: 1;
                align-items: flex-end;
                container-type: size;
            }

            hnl-flow-bar-source-accolades {
                grid-row: 2 / -1;
                z-index: 3;
            }

            hnl-flow-bar-source-label,
            hnl-flow-bar-source-accolade,
            hnl-flow-bar-destination {
                display: flex;
                flex: var(--bar-grow, 0) 1 var(--bar-width, 0);
                transition: flex-basis 0.3s ease;
				font-size: clamp(var(--ha-font-size-xs, 9px), 22cqb, 14px);
                --mdc-icon-size: min(1.25em, 1.2em);
                --label-padding: 0.15em 0.5em;
                --label-edge-padding: 0.7em;
            }
			
			hnl-flow-bar-source-group,
			hnl-flow-bar-destination-group {
				container-type: size;
			}

            hnl-flow-bar-source-label {
                min-width: var(--min-bar-width);
            }
            hnl-flow-bar-source-accolade {
                min-width: var(--min-bar-width);
            }

            hnl-flow-bar-source-label:last-child,
            hnl-flow-bar-source-accolade:last-child,
            hnl-flow-bar-destination:last-child {
                --bar-grow: 1;
            }

            /* ═══ PRESENTATIONAL (shared) ═══ */
            hnl-flow-bar-destination {
                align-items: center;
                justify-content: center;
                padding: 0 1.5cqi;
                --adjusted-bg-color: oklch(from var(--background-color) l calc(c * 1.2) h / var(--destination-bg-opacity));
                --bg-gradient: linear-gradient(transparent, transparent);
                --bg-hatched: linear-gradient(transparent, transparent);
                background: var(--bg-hatched), var(--bg-gradient), var(--adjusted-bg-color);
                color: var(--text-color, oklch(from var(--background-color) clamp(0, (0.6 - l) * infinity, 1) 0 0));
                overflow: hidden;
                min-width: var(--min-bar-width);
                box-shadow: inset 0 0 0 2px var(--background-color);
            }
            hnl-flow-bar-destination:last-child {
                border-radius: 0 max(0px, calc(var(--border-radius, 8px) - var(--accolade-height))) 0 0;
            }

            hnl-flow-bar-source-accolade {
                grid-row: 2;
                border: var(--accolade-border-width, var(--accolade-height, 2px)) solid var(--adjusted-bg-color, green);
                border-bottom: 0;
                --bg-hatched: linear-gradient(transparent, transparent);
                background: var(--bg-hatched), oklch(from var(--background-color) l c h / var(--accolade-bg-opacity));
                color: oklch(from var(--background-color) calc(l * .3) c h / 1);
                --adjusted-bg-color: oklch(from var(--background-color) calc(l) calc(c) h / 1);
                overflow: hidden;
                min-width: var(--border-radius, 8px);
            }

            hnl-flow-bar-source-accolade:last-child {
                border-radius: 0 var(--border-radius, 8px) 0 0;
            }
            hnl-flow-bar-source-accolades > :first-child:not(:only-child),
            hnl-flow-bar-source-accolade:nth-child(n+2):not(:last-child) {
              border-right: 0;
            }

            hnl-flow-bar-source-label > span,
            hnl-flow-bar-destination > span {
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

            hnl-flow-bar-destination > span {
                --span-bg-color: oklch(from var(--adjusted-bg-color) calc(l * 0.8) c h / 1);
                background-color: var(--span-bg-color);
                color: var(--text-color, oklch(from var(--span-bg-color) round(1.21 - l) 0 0 / 1));
                border-radius: clamp(5cqb, var(--border-radius, 8px), var(--ha-card-border-radius, 14px));
            }

            hnl-flow-bar-source-label {
                --slanted-edge: 20px;
                --correction: min(var(--accolade-height), calc(var(--ha-card-border-radius, 14px) / 2), var(--accolade-border-width));
                padding-right: calc(var(--border-radius, 8px) - var(--correction, 0px));
                margin-bottom: calc(-1 * var(--correction, 5px));
                justify-content: start;
                overflow: hidden;
            }

            hnl-flow-bar-source-label > span {
                --adjusted-bg-color: oklch(from var(--background-color) calc(l) calc(c) h / 1);
                --bg-gradient: linear-gradient(transparent, transparent);
                --bg-hatched: linear-gradient(transparent, transparent);
                align-items: center;
                background: var(--bg-hatched), var(--bg-gradient), var(--adjusted-bg-color, rgba(0, 0, 0, 0.4));
                color: var(--text-color, oklch(from var(--background-color) clamp(0, (0.6 - l) * infinity, 1) 0 0));
                padding: 10cqb 1.5cqi;
                padding-right: calc((var(--label-edge-padding) / 2) + var(--slanted-edge, 20px));
                clip-path: polygon(0 0, calc(100% - var(--slanted-edge, 20px)) 0%, 100% 100%, 0% 100%);
                border-top-left-radius: var(--border-radius, 8px);
            }

            .source-value,
            .destination-value {
                display: flex;
                align-items: center;
                gap: inherit;
            }

            /* Entity names — hidden by default, shown when card is tall enough */
            .entity-name {
                display: none;
                opacity: 0.8;
                text-align: center;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                padding: 0 4px;
                max-width: 100%;
            }

            /* When card is tall enough, show entity names */
            @container card (min-height: 6em) {
                hnl-flow-bar-source-label > span {
                    display: grid;
                    gap: 2px;
                }

                hnl-flow-bar-source-label .entity-name {
                    display: block;
                    opacity: 0.85;
                    min-width: 0;
                }

                hnl-flow-bar-destination {
                    min-width: 0;
                }

                hnl-flow-bar-destination > span {
                    flex-direction: column;
                    gap: 2px;
                }

                hnl-flow-bar-destination .entity-name {
                    display: block;
                    color: inherit;
                    opacity: 0.85;
                }
            }

            /* When card is tall enough, scale up spacing */
            @container card (min-height: 12em) {
                hnl-flow-bars {
                    --accolade-height: 10px;
                }
            }

            /* Hide names when disabled */
            hnl-flow-bars.hide-names .entity-name {
                display: none !important;
            }

            /* ═══ TOGGLE: Animated — keyframes ═══ */
            /* 3-layer: gradient (static), hatched (animated), base (static) */
            @keyframes stripe-scroll-left-3 {
                0% { background-position: 0 0, 0 0, 0 0; }
                100% { background-position: -8.485px 0, 0 0, 0 0; }
            }
            @keyframes stripe-scroll-right-3 {
                0% { background-position: 0 0, 0 0, 0 0; }
                100% { background-position: 8.485px 0, 0 0, 0 0; }
            }
            /* 2-layer: hatched (animated), base (static) — for accolades */
            @keyframes stripe-scroll-left-2 {
                0% { background-position: 0 0, 0 0; }
                100% { background-position: -8.485px 0, 0 0; }
            }
            @keyframes stripe-scroll-right-2 {
                0% { background-position: 0 0, 0 0; }
                100% { background-position: 8.485px 0, 0 0; }
            }

            /* ═══ TOGGLE: Gradient ═══ */
            hnl-flow-bars.gradient hnl-flow-bar-source-label > span {
                --bg-gradient: linear-gradient(
                    to left,
                    oklch(from var(--background-color) l c h / 1),
                    oklch(from var(--background-color) calc(l * 0.85) c calc(h - 30) / 1)
                );
            }
            hnl-flow-bars.gradient hnl-flow-bar-destination {
                --bg-gradient: linear-gradient(
                    to left,
                    oklch(from var(--background-color) l calc(c * 1.2) h / var(--destination-bg-opacity)),
                    oklch(from var(--background-color) calc(l * 0.85) calc(c * 1.2) calc(h - 30) / var(--destination-bg-opacity))
                );
            }

            /* ═══ LAYOUT: Native ═══ */
            hnl-flow-bars.native {
                grid-template-rows: 1fr 1fr;
                gap: 6px;
                padding: 0;
                border-radius: 0;
            }
			hnl-flow-bars.native.alternative {
				gap: 2px;
			}
            hnl-flow-bars.native hnl-flow-bar-source-group {
                display: flex;
                grid-row: 1;
            }
            hnl-flow-bars.native hnl-flow-bar-source-accolades {
                display: none;
            }
            hnl-flow-bars.native hnl-flow-bar-source-labels {
                flex: 1;
                align-items: stretch;
            }
            hnl-flow-bars.native hnl-flow-bar-destination-group {
                grid-row: 2;
            }

            /* Padding to prevent pill ends clipping against card border-radius
            ha-card.transparent .card-content:has(.native) {
                padding: 8px;
            } */

            /* Source labels — full bars, no slant */
            hnl-flow-bars.native hnl-flow-bar-source-label {
                --slanted-edge: 0px;
                padding-right: 0;
                margin-bottom: 0;
                --correction: 0px;
                --bg-gradient: linear-gradient(transparent, transparent);
                --bg-hatched: linear-gradient(transparent, transparent);
                background: var(--bg-hatched), var(--bg-gradient), oklch(from var(--background-color) l c h / var(--source-bg-opacity, 1));
                justify-content: center;
                border-radius: 0;
                box-shadow: inset 0 0 0 2px var(--background-color);
            }
            hnl-flow-bars.native hnl-flow-bar-source-label > span {
                clip-path: none;
                background: none;
                padding-right: calc(var(--font-size, 0.8em) * 0.5);
                border-radius: 0;
                border-top-left-radius: 0;
                justify-items: center;
            }
            /* Rounded ends only on outer edges */
            hnl-flow-bars.native hnl-flow-bar-source-label:first-child {
                border-radius: 9999px 0 0 9999px;
            }
            hnl-flow-bars.native hnl-flow-bar-source-label:last-child {
                border-radius: 0 9999px 9999px 0;
            }
            hnl-flow-bars.native hnl-flow-bar-source-label:only-child {
                border-radius: 9999px;
            }

            /* Destination bars — rounded ends only on outer edges, no inner span background */
            hnl-flow-bars.native hnl-flow-bar-destination {
                border-radius: 0;
            }
            hnl-flow-bars.native hnl-flow-bar-destination > span {
                --span-bg-color: var(--adjusted-bg-color);
                background: none;
                border-radius: 0;
            }
            hnl-flow-bars.native hnl-flow-bar-destination:first-child {
                border-radius: 9999px 0 0 9999px;
            }
            hnl-flow-bars.native hnl-flow-bar-destination:last-child {
                border-radius: 0 9999px 9999px 0;
            }
            hnl-flow-bars.native hnl-flow-bar-destination:only-child {
                border-radius: 9999px;
            }
			
			/* ═══ NATIVE THEME: Split corners ═══ */
			hnl-flow-bars.native.alternative {
				--ha-card-border-radius: 3cqi;
			}
            hnl-flow-bars.native.alternative hnl-flow-bar-source-label:first-child {
                border-radius: var(--ha-card-border-radius,var(--ha-border-radius-lg)) 0 0 0;
            }
            hnl-flow-bars.native.alternative hnl-flow-bar-source-label:last-child {
                border-radius: 0 var(--ha-card-border-radius,var(--ha-border-radius-lg)) 0 0;
            }
            hnl-flow-bars.native.alternative hnl-flow-bar-source-label:only-child {
                border-radius: var(--ha-card-border-radius,var(--ha-border-radius-lg)) var(--ha-card-border-radius,var(--ha-border-radius-lg)) 0 0;
            }
            hnl-flow-bars.native.alternative hnl-flow-bar-destination:first-child {
                border-radius: 0 0 0 var(--ha-card-border-radius,var(--ha-border-radius-lg));
            }
            hnl-flow-bars.native.alternative hnl-flow-bar-destination:last-child {
                border-radius: 0 0 var(--ha-card-border-radius,var(--ha-border-radius-lg)) 0;
            }
            hnl-flow-bars.native.alternative hnl-flow-bar-destination:only-child {
                border-radius: 0 0 var(--ha-card-border-radius,var(--ha-border-radius-lg)) var(--ha-card-border-radius,var(--ha-border-radius-lg));
            }

            /* ═══ NATIVE TOGGLE: Gradient ═══ */
            hnl-flow-bars.native.gradient hnl-flow-bar-source-label {
                --bg-gradient: linear-gradient(
                    to left,
                    oklch(from var(--background-color) l c h / var(--source-bg-opacity, 1)),
                    oklch(from var(--background-color) calc(l * 0.85) c calc(h - 30) / var(--source-bg-opacity, 1))
                );
            }
            hnl-flow-bars.native.gradient hnl-flow-bar-destination {
                --bg-gradient: linear-gradient(
                    to left,
                    oklch(from var(--background-color) l calc(c * 1.2) h / var(--destination-bg-opacity)),
                    oklch(from var(--background-color) calc(l * 0.85) calc(c * 1.2) calc(h - 30) / var(--destination-bg-opacity))
                );
            }
			
            /* ═══ NATIVE THEME: Minimal ═══ */
			hnl-flow-bars.native.minimal {
                gap: 2px;
			}
			hnl-flow-bars.native.minimal hnl-flow-bar-destination {
				box-shadow: inset 0 1px 0 1px var(--background-color);
				border-radius: 0 !important;
			}
			hnl-flow-bars.native.minimal hnl-flow-bar-source-label {
				box-shadow: inset 0 -1px 0 1px var(--background-color);
				border-radius: 0 !important;
			}
			
            /* ═══ NATIVE THEME: Contained ═══ */
			hnl-flow-bars.native.contained hnl-flow-bar-source-group {
				grid-row: 1 / -1;
			}
			hnl-flow-bars.native.contained hnl-flow-bar-destination-group {
				margin: min(1cqi, 4cqb);
				height: 50cqb;
				border-radius: 15cqb;
			}
			hnl-flow-bars.native.contained hnl-flow-bar-source-label > span {
				height: 50cqb;
			}
			hnl-flow-bars.native.contained hnl-flow-bar-source-label:first-child {
				border-radius: 15cqb 0 0 15cqb;
			}
			hnl-flow-bars.native.contained hnl-flow-bar-source-label:last-child {
				border-radius: 0 15cqb 15cqb 0;
			}
			hnl-flow-bars.native.contained hnl-flow-bar-source-label:only-child {
				border-radius: 15cqb;
			}
			hnl-flow-bars.native.contained hnl-flow-bar-destination:first-child {
				border-radius: 15cqb 0 0 15cqb;
			}
			hnl-flow-bars.native.contained hnl-flow-bar-destination:last-child {
				border-radius: 0 15cqb 15cqb 0;
			}
			hnl-flow-bars.native.contained hnl-flow-bar-destination:only-child {
				border-radius: 15cqb;
			}
			
            /* ═══ LAYOUT MODIFIER: No borders ═══ */
            hnl-flow-bars.no-borders hnl-flow-bar-source-label,
            hnl-flow-bars.no-borders hnl-flow-bar-destination {
                box-shadow: none;
            }
			
            /* ═══ LAYOUT MODIFIER: No slanted edge ═══ */
            hnl-flow-bars.no-slant hnl-flow-bar-source-label {
                --slanted-edge: 0px;
                padding-right: 0;
            }
            hnl-flow-bars.no-slant:not(.native) hnl-flow-bar-source-label > span {
                clip-path: none;
                border-top-right-radius: var(--border-radius, 8px);
            }
			
            /* ═══ LAYOUT MODIFIER: Fill height (always on) ═══ */
            hnl-flow-bar-source-label {
                height: 100%;
            }
            hnl-flow-bar-source-label > span {
                align-self: stretch;
                justify-content: center;
            }

            /* ═══ TOGGLE: Hatched ═══ */
            hnl-flow-bar-destination.hatched > span {
                background-color: oklch(from var(--adjusted-bg-color) calc(l * 0.8) c h / 0.6);
            }

            hnl-flow-bars hnl-flow-bar-source-accolade.hatched,
            hnl-flow-bars hnl-flow-bar-destination.hatched,
            hnl-flow-bars hnl-flow-bar-source-label.hatched {
                --hatch-opacity: var(--source-bg-opacity);
                --bg-hatched: repeating-linear-gradient(
                    -45deg,
                    oklch(from var(--background-color) calc(l * 1.1) c h / var(--hatch-opacity, 1)) 0px,
                    oklch(from var(--background-color) calc(l * 1.1) c h / var(--hatch-opacity, 1)) 3px,
                    transparent 3px,
                    transparent 6px
                );
            }
            /* 3-layer background-size: gradient, hatched, base */
            hnl-flow-bars hnl-flow-bar-source-label.hatched > span,
            hnl-flow-bars hnl-flow-bar-source-label.hatched,
            hnl-flow-bars hnl-flow-bar-destination.hatched {
                background-size: 8.485px 8.485px, auto, auto;
            }
            /* 2-layer background-size: hatched, base (accolade has no gradient layer) */
            hnl-flow-bars hnl-flow-bar-source-accolade.hatched {
                background-size: 8.485px 8.485px, auto;
            }
            hnl-flow-bars hnl-flow-bar-source-label.hatched {
                --hatch-opacity: var(--source-bg-opacity);
            }
            hnl-flow-bars hnl-flow-bar-source-accolade.hatched {
                --hatch-opacity: var(--accolade-bg-opacity);
            }
            hnl-flow-bars hnl-flow-bar-destination.hatched {
                --hatch-opacity: var(--destination-bg-opacity);
            }

            /* 3-layer elements: destinations scroll right, source-labels scroll left */
            hnl-flow-bars.animated hnl-flow-bar-destination.hatched {
                animation: stripe-scroll-right-3 0.6s linear infinite;
            }
            hnl-flow-bars.animated hnl-flow-bar-source-label.hatched {
                animation: stripe-scroll-left-3 0.6s linear infinite;
            }
            /* Accolade source-label: animate the > span (where background lives) */
            hnl-flow-bars.animated hnl-flow-bar-source-label.hatched > span {
                animation: stripe-scroll-left-3 0.6s linear infinite;
            }
            /* 2-layer elements: accolades scroll left */
            hnl-flow-bars.animated hnl-flow-bar-source-accolade.hatched {
                animation: stripe-scroll-left-2 0.6s linear infinite;
            }

        `;
    }
}

customElements.define("hnl-flow-bars-card", HnlFlowBarsCard);
