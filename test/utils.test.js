import { describe, it, expect } from 'vitest';
import { computeEntityIcon } from '../src/utils.js';

describe('computeEntityIcon', () => {
    it('returns explicit icon from attributes', () => {
        const stateObj = {
            entity_id: 'sensor.test',
            attributes: { icon: 'mdi:custom-icon' },
        };
        expect(computeEntityIcon(stateObj)).toBe('mdi:custom-icon');
    });

    it('returns power icon for sensor with power device_class', () => {
        const stateObj = {
            entity_id: 'sensor.power',
            attributes: { device_class: 'power' },
        };
        expect(computeEntityIcon(stateObj)).toBe('mdi:flash');
    });

    it('returns energy icon for sensor with energy device_class', () => {
        const stateObj = {
            entity_id: 'sensor.energy',
            attributes: { device_class: 'energy' },
        };
        expect(computeEntityIcon(stateObj)).toBe('mdi:lightning-bolt');
    });

    it('returns temperature icon for sensor with temperature device_class', () => {
        const stateObj = {
            entity_id: 'sensor.temp',
            attributes: { device_class: 'temperature' },
        };
        expect(computeEntityIcon(stateObj)).toBe('mdi:thermometer');
    });

    it('returns generic sensor fallback for unknown device_class', () => {
        const stateObj = {
            entity_id: 'sensor.unknown',
            attributes: { device_class: 'something_new' },
        };
        expect(computeEntityIcon(stateObj)).toBe('mdi:eye');
    });

    it('returns generic sensor fallback when no device_class', () => {
        const stateObj = {
            entity_id: 'sensor.bare',
            attributes: {},
        };
        expect(computeEntityIcon(stateObj)).toBe('mdi:eye');
    });

    it('returns domain-specific icon for light', () => {
        const stateObj = {
            entity_id: 'light.living_room',
            attributes: {},
        };
        expect(computeEntityIcon(stateObj)).toBe('mdi:lightbulb');
    });

    it('returns domain-specific icon for switch', () => {
        const stateObj = {
            entity_id: 'switch.pump',
            attributes: {},
        };
        expect(computeEntityIcon(stateObj)).toBe('mdi:toggle-switch');
    });

    it('returns domain-specific icon for climate', () => {
        const stateObj = {
            entity_id: 'climate.hvac',
            attributes: {},
        };
        expect(computeEntityIcon(stateObj)).toBe('mdi:thermostat');
    });

    it('returns ultimate fallback for unknown domain', () => {
        const stateObj = {
            entity_id: 'custom_domain.thing',
            attributes: {},
        };
        expect(computeEntityIcon(stateObj)).toBe('mdi:bookmark-outline');
    });
});
