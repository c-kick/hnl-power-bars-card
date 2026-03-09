import { LitElement, html, css } from 'lit';

// Force HA to load ha-entity-picker by creating a temporary entities card
const loadEntityPicker = async () => {
  if (customElements.get('ha-entity-picker')) return;
  const ch = await window.loadCardHelpers?.();
  if (ch) {
    const card = await ch.createCardElement({ type: 'entities', entities: [] });
    card && await card.constructor.getConfigElement?.();
  }
};
loadEntityPicker();

class EntityListEditor extends LitElement {

  static get properties() {
    return {
      hass: { type: Object },
      entities: { type: Array },
      label: { type: String },
      description: { type: String },
      icon: { type: String },
    };
  }

  constructor() {
    super();
    this.entities = [];
  }

  _fireChanged() {
    this.dispatchEvent(new CustomEvent('entities-changed', {
      detail: { entities: [...this.entities] },
      bubbles: true,
      composed: true,
    }));
  }

  _addEntity() {
    this.entities = [...this.entities, { entity: '' }];
    this._fireChanged();
  }

  _removeEntity(index) {
    this.entities = this.entities.filter((_, i) => i !== index);
    this._fireChanged();
  }

  _moveEntity(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= this.entities.length) return;
    const updated = [...this.entities];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    this.entities = updated;
    this._fireChanged();
  }

  _entityFieldChanged(index, field, value) {
    const updated = [...this.entities];
    updated[index] = { ...updated[index], [field]: value };
    this.entities = updated;
    this._fireChanged();
  }

  _getEntityName(entityConfig) {
    const entityId = entityConfig.entity;
    if (!entityId) return 'New entity';
    const stateObj = this.hass?.states[entityId];
    return stateObj?.attributes?.friendly_name || entityId;
  }

  _renderEntityRow(entity, index) {
    const name = this._getEntityName(entity);

    return html`
      <ha-expansion-panel .header=${name} outlined>
        <div slot="icons" class="row-actions">
          <ha-icon-button
            .label=${'Move up'}
            @click=${(ev) => { ev.stopPropagation(); this._moveEntity(index, -1); }}
            ?disabled=${index === 0}
          >
            <ha-icon icon="mdi:arrow-up"></ha-icon>
          </ha-icon-button>
          <ha-icon-button
            .label=${'Move down'}
            @click=${(ev) => { ev.stopPropagation(); this._moveEntity(index, 1); }}
            ?disabled=${index === this.entities.length - 1}
          >
            <ha-icon icon="mdi:arrow-down"></ha-icon>
          </ha-icon-button>
          <ha-icon-button
            .label=${'Remove'}
            @click=${(ev) => { ev.stopPropagation(); this._removeEntity(index); }}
          >
            <ha-icon icon="mdi:delete"></ha-icon>
          </ha-icon-button>
        </div>

        <div class="entity-fields">
          <ha-entity-picker
            .hass=${this.hass}
            .value=${entity.entity || ''}
            .label=${'Entity'}
            .allowCustomEntity=${true}
            @value-changed=${(ev) =>
              this._entityFieldChanged(index, 'entity', ev.detail.value)}
          ></ha-entity-picker>

          <ha-icon-picker
            .hass=${this.hass}
            .label=${'Icon (optional)'}
            .value=${entity.icon || ''}
            @value-changed=${(ev) =>
              this._entityFieldChanged(index, 'icon', ev.detail.value)}
          ></ha-icon-picker>

          <ha-textfield
            .label=${'Color (CSS, optional)'}
            .value=${entity.color || ''}
            .helper=${'Any CSS color: #hex, rgb(), var(--name)'}
            helperPersistent
            @input=${(ev) =>
              this._entityFieldChanged(index, 'color', ev.target.value)}
          ></ha-textfield>

          <ha-textfield
            .label=${'Text color (CSS, optional)'}
            .value=${entity.text_color || ''}
            @input=${(ev) =>
              this._entityFieldChanged(index, 'text_color', ev.target.value)}
          ></ha-textfield>

          <div class="slider-row">
            <label>Background opacity</label>
            <div class="slider-control">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                .value=${String(entity.bg_opacity || '0.5')}
                @input=${(ev) =>
                  this._entityFieldChanged(index, 'bg_opacity', ev.target.value)}
              />
              <span class="slider-value">${entity.bg_opacity || '0.5'}</span>
            </div>
          </div>

          <ha-textfield
            .label=${'Unit of measurement (optional)'}
            .value=${entity.unit_of_measurement || ''}
            @input=${(ev) =>
              this._entityFieldChanged(index, 'unit_of_measurement', ev.target.value)}
          ></ha-textfield>
        </div>
      </ha-expansion-panel>
    `;
  }

  render() {
    return html`
      <div class="entity-list">
        <div class="section-header">
          ${this.icon ? html`<ha-icon icon=${this.icon} class="section-icon"></ha-icon>` : ''}
          <h3>${this.label || 'Entities'}</h3>
        </div>
        ${this.description ? html`<p class="section-description">${this.description}</p>` : ''}
        ${this.entities.map((ent, i) => this._renderEntityRow(ent, i))}
        <ha-button @click=${this._addEntity}>
          <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
          Add entity
        </ha-button>
      </div>
    `;
  }

  static get styles() {
    return css`
      .entity-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
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
        margin: -2px 0 4px 0;
        font-size: 0.85em;
        line-height: 1.4;
        color: var(--secondary-text-color);
      }

      .entity-fields {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 12px 0;
      }

      .row-actions {
        display: flex;
        align-items: center;
      }

      ha-textfield,
      ha-entity-picker {
        display: block;
      }

      ha-button {
        align-self: flex-start;
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

customElements.define('entity-list-editor', EntityListEditor);
