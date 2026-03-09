import { LitElement, html, css } from 'lit';

class RemainderEditor extends LitElement {

  static get properties() {
    return {
      hass: { type: Object },
      label: { type: String },
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
      <ha-expansion-panel .header=${this.label || 'Remainder'} outlined>
        <div class="remainder-fields">
          <ha-textfield
            .label=${'Name'}
            .value=${this.remainder.name || ''}
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
            @input=${(ev) => this._valueChanged('color', ev)}
          ></ha-textfield>

          <ha-textfield
            .label=${'Background opacity'}
            .value=${this.remainder.bg_opacity || ''}
            @input=${(ev) => this._valueChanged('bg_opacity', ev)}
          ></ha-textfield>

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
      </ha-expansion-panel>
    `;
  }

  static get styles() {
    return css`
      .remainder-fields {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 12px 0;
      }
      ha-textfield {
        display: block;
      }
    `;
  }
}

customElements.define('remainder-editor', RemainderEditor);
