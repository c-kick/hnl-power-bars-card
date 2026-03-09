import { LitElement, html, css } from 'lit';
import './entity-list-editor.js';
import './remainder-editor.js';

class HnlPowerBarsCardEditor extends LitElement {

  static get properties() {
    return {
      hass: { type: Object },
      _config: { state: true },
    };
  }

  setConfig(config) {
    this._config = {
      ...config,
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

    // Clean up empty optional fields to keep YAML tidy
    if (!config.unit_of_measurement) delete config.unit_of_measurement;

    // Clean entity arrays: remove entries with no entity selected
    config.production = config.production.filter((e) => e.entity);
    config.consumption = config.consumption.filter((e) => e.entity);

    // Strip empty optional fields from entities
    const cleanEntity = (ent) => {
      const cleaned = { entity: ent.entity };
      if (ent.icon) cleaned.icon = ent.icon;
      if (ent.color) cleaned.color = ent.color;
      if (ent.unit_of_measurement) cleaned.unit_of_measurement = ent.unit_of_measurement;
      if (ent.bg_opacity) cleaned.bg_opacity = ent.bg_opacity;
      if (ent.text_color) cleaned.text_color = ent.text_color;
      return cleaned;
    };
    config.production = config.production.map(cleanEntity);
    config.consumption = config.consumption.map(cleanEntity);

    // Clean remainder objects: only include if user customized them
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

  render() {
    if (!this.hass || !this._config) return html``;

    return html`
      <div class="editor">

        <div class="section">
          <h3>General Settings</h3>

          <ha-textfield
            .label=${'Unit of measurement'}
            .value=${this._config.unit_of_measurement || ''}
            @input=${(ev) => this._textChanged('unit_of_measurement', ev)}
          ></ha-textfield>

          <ha-textfield
            .label=${'Decimal places (rounding)'}
            .value=${String(this._config.rounding ?? 0)}
            type="number"
            min="0"
            max="6"
            @input=${(ev) => this._numberChanged('rounding', ev)}
          ></ha-textfield>

          <div class="toggle-row">
            <span>Hide zero values</span>
            <ha-switch
              .checked=${this._config.hide_zero_values ?? true}
              @change=${(ev) => this._toggleChanged('hide_zero_values', ev)}
            ></ha-switch>
          </div>

          <div class="toggle-row">
            <span>Transparent background</span>
            <ha-switch
              .checked=${this._config.transparent ?? true}
              @change=${(ev) => this._toggleChanged('transparent', ev)}
            ></ha-switch>
          </div>

          <div class="toggle-row">
            <span>Smooth transitions (easing)</span>
            <ha-switch
              .checked=${this._config.easing ?? false}
              @change=${(ev) => this._toggleChanged('easing', ev)}
            ></ha-switch>
          </div>
        </div>

        <entity-list-editor
          .hass=${this.hass}
          .entities=${this._config.production || []}
          .label=${'Production Sources'}
          @entities-changed=${this._productionChanged}
        ></entity-list-editor>

        <entity-list-editor
          .hass=${this.hass}
          .entities=${this._config.consumption || []}
          .label=${'Consumption Destinations'}
          @entities-changed=${this._consumptionChanged}
        ></entity-list-editor>

        <remainder-editor
          .hass=${this.hass}
          .label=${'Production Remainder (Grid Import)'}
          .remainder=${this._config.production_remainder || {}}
          @remainder-changed=${this._productionRemainderChanged}
        ></remainder-editor>

        <remainder-editor
          .hass=${this.hass}
          .label=${'Consumption Remainder (Grid Export)'}
          .remainder=${this._config.consumption_remainder || {}}
          @remainder-changed=${this._consumptionRemainderChanged}
        ></remainder-editor>

      </div>
    `;
  }

  static get styles() {
    return css`
      .editor {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 16px 0;
      }
      .section {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      h3 {
        margin: 0;
        font-size: 1em;
        font-weight: 500;
        color: var(--primary-text-color);
      }
      .toggle-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 0;
      }
      .toggle-row span {
        color: var(--primary-text-color);
      }
      ha-textfield {
        display: block;
      }
    `;
  }
}

customElements.define('hnl-power-bars-card-editor', HnlPowerBarsCardEditor);
