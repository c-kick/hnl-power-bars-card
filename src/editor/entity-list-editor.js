import { LitElement, html, css } from 'lit';

class EntityListEditor extends LitElement {

  static get properties() {
    return {
      hass: { type: Object },
      entities: { type: Array },
      label: { type: String },
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
            allow-custom-entity
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
            @input=${(ev) =>
              this._entityFieldChanged(index, 'color', ev.target.value)}
          ></ha-textfield>

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
        <h3>${this.label || 'Entities'}</h3>
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
      h3 {
        margin: 16px 0 4px;
        font-size: 1em;
        font-weight: 500;
        color: var(--primary-text-color);
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
    `;
  }
}

customElements.define('entity-list-editor', EntityListEditor);
