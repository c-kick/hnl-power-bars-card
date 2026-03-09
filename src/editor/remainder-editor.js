import { LitElement, html, css } from 'lit';

class RemainderEditor extends LitElement {

  static get properties() {
    return {
      hass: { type: Object },
      label: { type: String },
      description: { type: String },
      icon: { type: String },
      remainder: { type: Object },
    };
  }

  _fireChanged() {
    this.dispatchEvent(new CustomEvent('remainder-changed', {
      detail: { remainder: { ...this.remainder } },
      bubbles: true,
      composed: true,
    }));
  }

  _valueChanged(field, ev) {
    const value = ev.target.value;
    this.remainder = { ...this.remainder, [field]: value };
    this._fireChanged();
  }

  render() {
    if (!this.remainder) return html``;

    return html`
      <ha-expansion-panel outlined>
        <span slot="header" class="panel-header">
          ${this.icon ? html`<ha-icon icon=${this.icon} class="panel-icon"></ha-icon>` : ''}
          <span>${this.label || 'Remainder'}</span>
        </span>
        <div class="remainder-content">
          ${this.description ? html`<p class="remainder-description">${this.description}</p>` : ''}
          <div class="remainder-fields">
            <ha-textfield
              .label=${'Display name'}
              .value=${this.remainder.name || ''}
              .helper=${'Label shown on the bar'}
              helperPersistent
              @input=${(ev) => this._valueChanged('name', ev)}
            ></ha-textfield>

            <ha-icon-picker
              .hass=${this.hass}
              .label=${'Icon'}
              .value=${this.remainder.icon || ''}
              @value-changed=${(ev) => {
                this.remainder = { ...this.remainder, icon: ev.detail.value };
                this._fireChanged();
              }}
            ></ha-icon-picker>

            <ha-textfield
              .label=${'Color (CSS)'}
              .value=${this.remainder.color || ''}
              .helper=${'Any CSS color: #hex, rgb(), var(--name)'}
              helperPersistent
              @input=${(ev) => this._valueChanged('color', ev)}
            ></ha-textfield>

            <div class="slider-row">
              <label>Background opacity</label>
              <div class="slider-control">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  .value=${String(this.remainder.bg_opacity || '0.5')}
                  @input=${(ev) => this._valueChanged('bg_opacity', ev)}
                />
                <span class="slider-value">${this.remainder.bg_opacity || '0.5'}</span>
              </div>
            </div>

            <ha-textfield
              .label=${'Text color (CSS)'}
              .value=${this.remainder.text_color || ''}
              @input=${(ev) => this._valueChanged('text_color', ev)}
            ></ha-textfield>

            <ha-textfield
              .label=${'Unit of measurement'}
              .value=${this.remainder.unit_of_measurement || ''}
              @input=${(ev) => this._valueChanged('unit_of_measurement', ev)}
            ></ha-textfield>
          </div>
        </div>
      </ha-expansion-panel>
    `;
  }

  static get styles() {
    return css`
      .panel-header {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .panel-icon {
        --mdc-icon-size: 18px;
        color: var(--secondary-text-color);
        flex-shrink: 0;
      }

      .remainder-content {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 4px 0 12px;
      }

      .remainder-description {
        margin: 0;
        font-size: 0.85em;
        line-height: 1.4;
        color: var(--secondary-text-color);
      }

      .remainder-fields {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      ha-textfield {
        display: block;
      }

      .toggle-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 0;
      }

      .toggle-row span {
        font-size: 0.95em;
        color: var(--primary-text-color);
      }

      .slider-row {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .slider-row label {
        font-size: 0.85em;
        color: var(--primary-text-color);
      }

      .slider-control {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .slider-control input[type="range"] {
        flex: 1;
        height: 4px;
        appearance: none;
        background: var(--divider-color, rgba(0, 0, 0, 0.12));
        border-radius: 2px;
        outline: none;
      }

      .slider-control input[type="range"]::-webkit-slider-thumb {
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--primary-color);
        cursor: pointer;
        border: 2px solid var(--card-background-color, #fff);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      }

      .slider-control input[type="range"]::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--primary-color);
        cursor: pointer;
        border: 2px solid var(--card-background-color, #fff);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      }

      .slider-value {
        min-width: 2.2em;
        text-align: right;
        font-size: 0.85em;
        color: var(--secondary-text-color);
        font-variant-numeric: tabular-nums;
      }
    `;
  }
}

customElements.define('remainder-editor', RemainderEditor);
