import { LitElement, html, css, unsafeCSS } from 'lit';
import {
    FALLBACK_COLOR_PRODUCTION, FALLBACK_COLOR_CONSUMPTION,
    FALLBACK_COLOR_SHORTFALL, FALLBACK_COLOR_SURPLUS,
    LAYOUTS, DEFAULT_LAYOUT,
} from '../const.js';
import { resolveLayoutAndTheme } from '../utils.js';
import './entity-list-editor.js';
import './remainder-editor.js';

class HnlFlowBarsCardEditor extends LitElement {

  static get properties() {
    return {
      hass: { type: Object },
      _config: { state: true },
    };
  }

  setConfig(config) {
    const { layout, theme, gradient, hatched, animated } = resolveLayoutAndTheme(config);
    this._config = {
      ...config,
      layout,
      theme,
      gradient,
      hatched,
      animated,
      production: this._normalizeEntities(config.production),
      consumption: this._normalizeEntities(config.consumption),
    };
  }

  _normalizeEntities(input) {
    if (!input) return [];
    const list = Array.isArray(input) ? input : [input];
    return list.map((item) =>
      typeof item === 'string' ? { entity: item } : { ...item }
    );
  }

  _fireConfigChanged() {
    const config = { ...this._config };

    if (!config.unit_of_measurement) delete config.unit_of_measurement;
    if (!config.energy_date_selection) delete config.energy_date_selection;
    // Remove legacy key
    delete config.accolade_style;
    // Omit defaults to keep YAML clean
    const layoutObj = LAYOUTS.find(l => l.value === config.layout) || LAYOUTS[0];
    if (config.layout === DEFAULT_LAYOUT) delete config.layout;
    if (config.theme === layoutObj.defaultTheme) delete config.theme;

    config.production = config.production.filter((e) => e.entity);
    config.consumption = config.consumption.filter((e) => e.entity);

    const cleanEntity = (ent) => {
      const cleaned = { entity: ent.entity };
      if (ent.name) cleaned.name = ent.name;
      if (ent.icon) cleaned.icon = ent.icon;
      if (ent.color) cleaned.color = ent.color;
      if (ent.unit_of_measurement) cleaned.unit_of_measurement = ent.unit_of_measurement;
      if (ent.bg_opacity) cleaned.bg_opacity = ent.bg_opacity;
      if (ent.text_color) cleaned.text_color = ent.text_color;
      return cleaned;
    };
    config.production = config.production.map(cleanEntity);
    config.consumption = config.consumption.map(cleanEntity);

    ['production_remainder', 'consumption_remainder'].forEach((key) => {
      if (config[key]) {
        const r = config[key];
        const hasCustomValues = r.name || r.icon || r.color || r.bg_opacity || r.text_color || r.unit_of_measurement;
        if (!hasCustomValues) {
          delete config[key];
        }
      }
    });

    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config },
      bubbles: true,
      composed: true,
    }));
  }

  _toggleChanged(field, ev) {
    this._config = { ...this._config, [field]: ev.target.checked };
    this._fireConfigChanged();
  }

  _textChanged(field, ev) {
    this._config = { ...this._config, [field]: ev.target.value };
    this._fireConfigChanged();
  }

  _numberChanged(field, ev) {
    const val = parseInt(ev.target.value, 10);
    this._config = { ...this._config, [field]: isNaN(val) ? 0 : val };
    this._fireConfigChanged();
  }

  _layoutChanged(ev) {
    const newLayout = ev.target.value;
    const layoutObj = LAYOUTS.find(l => l.value === newLayout) || LAYOUTS[0];
    this._config = {
      ...this._config,
      layout: newLayout,
      theme: layoutObj.defaultTheme,
    };
    this._fireConfigChanged();
  }

  _flipSourcesAndDestinations() {
    this._config = {
      ...this._config,
      production: [...(this._config.consumption || [])],
      consumption: [...(this._config.production || [])],
    };
    this._fireConfigChanged();
  }

  _productionChanged(ev) {
    this._config = { ...this._config, production: ev.detail.entities };
    this._fireConfigChanged();
  }

  _consumptionChanged(ev) {
    this._config = { ...this._config, consumption: ev.detail.entities };
    this._fireConfigChanged();
  }

  _productionRemainderChanged(ev) {
    this._config = { ...this._config, production_remainder: ev.detail.remainder };
    this._fireConfigChanged();
  }

  _consumptionRemainderChanged(ev) {
    this._config = { ...this._config, consumption_remainder: ev.detail.remainder };
    this._fireConfigChanged();
  }

  _renderRemainderDiagram() {
    return html`
      <div class="remainder-diagram">
        <div class="diagram-bar diagram-sources">
          <span class="diagram-label">Sources</span>
          <span class="diagram-fill source-fill"></span>
          <span class="diagram-fill shortfall-fill"></span>
        </div>
        <div class="diagram-bar diagram-destinations">
          <span class="diagram-label">Destinations</span>
          <span class="diagram-fill destination-fill"></span>
          <span class="diagram-fill surplus-fill"></span>
        </div>
        <div class="diagram-legend">
          <span class="legend-item">
            <span class="legend-swatch shortfall-swatch"></span>
            Shortfall
          </span>
          <span class="legend-item">
            <span class="legend-swatch surplus-swatch"></span>
            Surplus
          </span>
        </div>
      </div>
    `;
  }

  render() {
    if (!this.hass || !this._config) return html``;

    const usedEntities = [
      ...(this._config.production || []),
      ...(this._config.consumption || []),
    ].map((e) => e.entity).filter(Boolean);

    return html`
      <div class="editor">

        <div class="section">
          <div class="section-header">
            <ha-icon icon="mdi:cog" class="section-icon"></ha-icon>
            <h3>General</h3>
          </div>

          <ha-textfield
            .label=${'Unit of measurement'}
            .value=${this._config.unit_of_measurement || ''}
            .helper=${'Override the unit for all entities (e.g. W, L/min, m\u00B3)'}
            helperPersistent
            @input=${(ev) => this._textChanged('unit_of_measurement', ev)}
          ></ha-textfield>

          <ha-textfield
            .label=${'Decimal places'}
            .value=${String(this._config.rounding ?? 0)}
            type="number"
            min="0"
            max="6"
            @input=${(ev) => this._numberChanged('rounding', ev)}
          ></ha-textfield>

          <div class="toggle-row">
            <div class="toggle-label">
              <span>Energy date selection</span>
              <span class="toggle-description">Sync with the Energy Dashboard date picker to show statistics for the selected period</span>
            </div>
            <ha-switch
              .checked=${this._config.energy_date_selection ?? false}
              @change=${(ev) => this._toggleChanged('energy_date_selection', ev)}
            ></ha-switch>
          </div>

          <div class="toggle-row">
            <div class="toggle-label">
              <span>Hide zero values</span>
              <span class="toggle-description">Hide bars with a value of zero</span>
            </div>
            <ha-switch
              .checked=${this._config.hide_zero_values ?? true}
              @change=${(ev) => this._toggleChanged('hide_zero_values', ev)}
            ></ha-switch>
          </div>

          <div class="toggle-row">
            <div class="toggle-label">
              <span>Transparent background</span>
              <span class="toggle-description">Remove the card background</span>
            </div>
            <ha-switch
              .checked=${this._config.transparent ?? true}
              @change=${(ev) => this._toggleChanged('transparent', ev)}
            ></ha-switch>
          </div>

          ${this._config.layout !== 'native' ? html`
          <div class="toggle-row">
            <div class="toggle-label">
              <span>Slanted edge</span>
              <span class="toggle-description">Slant the right edge of source labels</span>
            </div>
            <ha-switch
              .checked=${this._config.slanted_edge ?? true}
              @change=${(ev) => this._toggleChanged('slanted_edge', ev)}
            ></ha-switch>
          </div>
          ` : null}

          <div class="toggle-row">
            <div class="toggle-label">
              <span>Borders</span>
              <span class="toggle-description">Show inset borders on bars</span>
            </div>
            <ha-switch
              .checked=${this._config.borders ?? (this._config.layout === 'native')}
              @change=${(ev) => this._toggleChanged('borders', ev)}
            ></ha-switch>
          </div>

          <div class="toggle-row">
            <div class="toggle-label">
              <span>Gradient</span>
              <span class="toggle-description">Horizontal gradient from base to darker shade</span>
            </div>
            <ha-switch
              .checked=${this._config.gradient ?? false}
              @change=${(ev) => this._toggleChanged('gradient', ev)}
            ></ha-switch>
          </div>

          <div class="toggle-row">
            <div class="toggle-label">
              <span>Hatched</span>
              <span class="toggle-description">Hatched background pattern on surplus and shortfall</span>
            </div>
            <ha-switch
              .checked=${this._config.hatched ?? false}
              @change=${(ev) => this._toggleChanged('hatched', ev)}
            ></ha-switch>
          </div>

          <div class="toggle-row">
            <div class="toggle-label">
              <span>Animated</span>
              <span class="toggle-description">Animates animatable components, such as background patterns</span>
            </div>
            <ha-switch
              .checked=${this._config.animated ?? false}
              @change=${(ev) => this._toggleChanged('animated', ev)}
            ></ha-switch>
          </div>

          <div class="toggle-row">
            <div class="toggle-label">
              <span>Show names</span>
              <span class="toggle-description">Show entity names when there is enough room</span>
            </div>
            <ha-switch
              .checked=${this._config.show_names ?? true}
              @change=${(ev) => this._toggleChanged('show_names', ev)}
            ></ha-switch>
          </div>

          <div class="select-row">
            <div class="select-label">
              <span>Layout</span>
              <span class="toggle-description">Bar structure and geometry</span>
            </div>
            <select
              .value=${this._config.layout || DEFAULT_LAYOUT}
              @change=${this._layoutChanged}
            >
              ${LAYOUTS.map((l) => html`
                <option value="${l.value}" ?selected=${(this._config.layout || DEFAULT_LAYOUT) === l.value}>
                  ${l.label}
                </option>
              `)}
            </select>
          </div>

          ${(LAYOUTS.find(l => l.value === this._config.layout) || LAYOUTS[0]).themes.length > 1 ? html`
          <div class="select-row">
            <div class="select-label">
              <span>Theme</span>
              <span class="toggle-description">Visual style of connectors and fills</span>
            </div>
            <select
              .value=${this._config.theme}
              @change=${(ev) => this._textChanged('theme', ev)}
            >
              ${(LAYOUTS.find(l => l.value === this._config.layout) || LAYOUTS[0]).themes.map((t) => html`
                <option value="${t.value}" ?selected=${this._config.theme === t.value}>
                  ${t.label}
                </option>
              `)}
            </select>
          </div>
          ` : null}
        </div>

        <div class="divider"></div>

        <entity-list-editor
          .hass=${this.hass}
          .entities=${this._config.production || []}
          .usedEntities=${usedEntities}
          .label=${'Sources'}
          .description=${'Entities that supply or produce units \u2014 shown in the top bar.'}
          .icon=${'mdi:arrow-right-bold-box'}
          @entities-changed=${this._productionChanged}
        ></entity-list-editor>

        <div class="flip-row">
          <div class="divider flip-divider"></div>
          <ha-button @click=${this._flipSourcesAndDestinations}>
            <ha-icon icon="mdi:swap-vertical" slot="icon"></ha-icon>
            Flip sources &amp; destinations
          </ha-button>
          <div class="divider flip-divider"></div>
        </div>

        <entity-list-editor
          .hass=${this.hass}
          .entities=${this._config.consumption || []}
          .usedEntities=${usedEntities}
          .label=${'Destinations'}
          .description=${'Entities that consume or use units \u2014 shown in the bottom bar.'}
          .icon=${'mdi:arrow-left-bold-box'}
          @entities-changed=${this._consumptionChanged}
        ></entity-list-editor>

        <div class="divider"></div>

        <div class="section">
          <div class="section-header">
            <ha-icon icon="mdi:scale-unbalanced" class="section-icon"></ha-icon>
            <h3>Remainders</h3>
          </div>
          <p class="section-description">
            When sources and destinations are unequal, a remainder bar
            appears to account for the difference.
          </p>

          ${this._renderRemainderDiagram()}

          <remainder-editor
            .hass=${this.hass}
            .label=${'Shortfall'}
            .description=${'When total demand exceeds supply. Shown on the source side (top bar) to fill the gap.'}
            .icon=${'mdi:arrow-down-bold-circle-outline'}
            .remainder=${this._config.production_remainder || {}}
            @remainder-changed=${this._productionRemainderChanged}
          ></remainder-editor>

          <remainder-editor
            .hass=${this.hass}
            .label=${'Surplus'}
            .description=${'When total supply exceeds demand. Shown on the destination side (bottom bar) as the excess.'}
            .icon=${'mdi:arrow-up-bold-circle-outline'}
            .remainder=${this._config.consumption_remainder || {}}
            @remainder-changed=${this._consumptionRemainderChanged}
          ></remainder-editor>
        </div>

      </div>
    `;
  }

  static get styles() {
    return css`
      .editor {
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 16px 0;
      }

      .section {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .section-header {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .section-icon {
        --mdc-icon-size: 20px;
        color: var(--primary-color);
        flex-shrink: 0;
      }

      h3 {
        margin: 0;
        font-size: 1em;
        font-weight: 500;
        color: var(--primary-text-color);
      }

      .section-description {
        margin: -4px 0 4px 0;
        font-size: 0.85em;
        line-height: 1.4;
        color: var(--secondary-text-color);
      }

      .divider {
        height: 1px;
        background: var(--divider-color, rgba(0, 0, 0, 0.12));
      }

      .flip-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .flip-divider {
        flex: 1;
      }

      .toggle-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 0;
        gap: 16px;
      }

      .toggle-label {
        display: flex;
        flex-direction: column;
        gap: 1px;
        min-width: 0;
      }

      .toggle-label > span:first-child {
        color: var(--primary-text-color);
        font-size: 0.95em;
      }

      .toggle-description {
        font-size: 0.8em;
        color: var(--secondary-text-color);
      }

      ha-textfield {
        display: block;
      }

      .select-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 0;
        gap: 16px;
      }

      .select-label {
        display: flex;
        flex-direction: column;
        gap: 1px;
        min-width: 0;
      }

      .select-label > span:first-child {
        color: var(--primary-text-color);
        font-size: 0.95em;
      }

      select {
        appearance: auto;
        padding: 6px 8px;
        border-radius: 4px;
        border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
        background: var(--card-background-color, var(--primary-background-color));
        color: var(--primary-text-color);
        font-size: 0.9em;
        cursor: pointer;
        min-width: 140px;
      }

      /* Remainder diagram */
      .remainder-diagram {
        display: flex;
        flex-direction: column;
        gap: 3px;
        padding: 12px;
        border-radius: 8px;
        background: var(--card-background-color, var(--primary-background-color));
        border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
      }

      .diagram-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        height: 26px;
      }

      .diagram-label {
        font-size: 0.75em;
        color: var(--secondary-text-color);
        width: 80px;
        text-align: right;
        flex-shrink: 0;
      }

      .diagram-fill {
        height: 100%;
        border-radius: 4px;
        transition: flex-basis 0.3s ease;
      }

      .source-fill {
        flex: 3 0 0;
        background: ${unsafeCSS(FALLBACK_COLOR_PRODUCTION)};
        opacity: 0.75;
      }

      .shortfall-fill {
        flex: 1 0 0;
        background: repeating-linear-gradient(
          -45deg,
          ${unsafeCSS(FALLBACK_COLOR_SHORTFALL)} 0px,
          ${unsafeCSS(FALLBACK_COLOR_SHORTFALL)} 3px,
          transparent 3px,
          transparent 6px
        );
        opacity: 0.6;
        border-radius: 4px;
      }

      .destination-fill {
        flex: 3 0 0;
        background: ${unsafeCSS(FALLBACK_COLOR_CONSUMPTION)};
        opacity: 0.75;
      }

      .surplus-fill {
        flex: 1 0 0;
        background: repeating-linear-gradient(
          -45deg,
          ${unsafeCSS(FALLBACK_COLOR_SURPLUS)} 0px,
          ${unsafeCSS(FALLBACK_COLOR_SURPLUS)} 3px,
          transparent 3px,
          transparent 6px
        );
        opacity: 0.6;
        border-radius: 4px;
      }

      .diagram-legend {
        display: flex;
        gap: 16px;
        padding: 6px 0 2px 88px;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 0.75em;
        color: var(--secondary-text-color);
      }

      .legend-swatch {
        width: 10px;
        height: 10px;
        border-radius: 2px;
        flex-shrink: 0;
      }

      .shortfall-swatch {
        background: ${unsafeCSS(FALLBACK_COLOR_SHORTFALL)};
        opacity: 0.7;
      }

      .surplus-swatch {
        background: ${unsafeCSS(FALLBACK_COLOR_SURPLUS)};
        opacity: 0.7;
      }
    `;
  }
}

customElements.define('hnl-flow-bars-card-editor', HnlFlowBarsCardEditor);
