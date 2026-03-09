import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Tests for the core calculation logic in HnlFlowBarsCard.
 *
 * Since _buildBarData and _hydrateParsedConfig are instance methods on a
 * LitElement custom element (which requires a browser DOM), we extract and
 * test the pure logic directly.
 */

// ── Extracted _roundOff logic ──

function roundOff(x, digits = 0) {
    return typeof x === 'number'
        ? Math.round(x * Math.pow(10, digits)) / Math.pow(10, digits)
        : 0;
}

// ── Extracted _buildBarData logic ──

function buildBarData(entities, maxValue, unitOverride, rounding = 0) {
    let total = 0;
    const bars = entities.map((ent) => {
        const value = ent.value;
        const unit = unitOverride || ent.unit_of_measurement;
        const width = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
        total += roundOff(value, rounding);

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

    const remainder = roundOff(maxValue - total, rounding);
    return { bars, total, remainder };
}

// ── Extracted _normalizeEntityConfig logic ──

function normalizeEntityConfig(input) {
    if (typeof input === 'string') {
        return [{ entity: input }];
    }
    if (Array.isArray(input)) {
        return input.map((item) =>
            typeof item === 'string' ? { entity: item } : item
        );
    }
    if (typeof input === 'object' && input.entity) {
        return [input];
    }
    throw new Error('Invalid entity format: ' + JSON.stringify(input));
}

// ── Tests ──

describe('roundOff', () => {
    it('rounds to 0 decimal places by default', () => {
        expect(roundOff(3.7)).toBe(4);
        expect(roundOff(3.2)).toBe(3);
    });

    it('rounds to specified decimal places', () => {
        expect(roundOff(3.456, 2)).toBe(3.46);
        expect(roundOff(3.454, 2)).toBe(3.45);
    });

    it('returns 0 for non-number input', () => {
        expect(roundOff('abc')).toBe(0);
        expect(roundOff(null)).toBe(0);
        expect(roundOff(undefined)).toBe(0);
    });

    it('handles negative numbers', () => {
        expect(roundOff(-3.7)).toBe(-4);
        expect(roundOff(-3.2)).toBe(-3);
    });

    it('handles zero', () => {
        expect(roundOff(0)).toBe(0);
        expect(roundOff(0, 3)).toBe(0);
    });
});

describe('buildBarData', () => {
    const makeEntity = (id, value, unit = 'W') => ({
        entity_id: id,
        name: id,
        value,
        icon: 'mdi:flash',
        color: '#ff0',
        bg_opacity: 'inherit',
        text_color: 'inherit',
        unit_of_measurement: unit,
    });

    it('calculates widths as percentage of maxValue', () => {
        const entities = [
            makeEntity('sensor.a', 300),
            makeEntity('sensor.b', 200),
        ];
        const result = buildBarData(entities, 1000, null);

        expect(result.bars[0].width).toBe(30);
        expect(result.bars[1].width).toBe(20);
    });

    it('calculates total correctly', () => {
        const entities = [
            makeEntity('sensor.a', 300),
            makeEntity('sensor.b', 200),
        ];
        const result = buildBarData(entities, 1000, null);

        expect(result.total).toBe(500);
    });

    it('calculates remainder as maxValue minus total', () => {
        const entities = [
            makeEntity('sensor.a', 300),
            makeEntity('sensor.b', 200),
        ];
        const result = buildBarData(entities, 1000, null);

        expect(result.remainder).toBe(500);
    });

    it('returns zero remainder when total equals maxValue', () => {
        const entities = [
            makeEntity('sensor.a', 600),
            makeEntity('sensor.b', 400),
        ];
        const result = buildBarData(entities, 1000, null);

        expect(result.remainder).toBe(0);
    });

    it('handles zero maxValue gracefully', () => {
        const entities = [makeEntity('sensor.a', 0)];
        const result = buildBarData(entities, 0, null);

        expect(result.bars[0].width).toBe(0);
        expect(result.total).toBe(0);
        expect(result.remainder).toBe(0);
    });

    it('uses unitOverride when provided', () => {
        const entities = [makeEntity('sensor.a', 100, 'kW')];
        const result = buildBarData(entities, 100, 'W');

        expect(result.bars[0].unit_of_measurement).toBe('W');
    });

    it('falls back to entity unit when no override', () => {
        const entities = [makeEntity('sensor.a', 100, 'kWh')];
        const result = buildBarData(entities, 100, null);

        expect(result.bars[0].unit_of_measurement).toBe('kWh');
    });

    it('handles single entity filling entire bar', () => {
        const entities = [makeEntity('sensor.a', 500)];
        const result = buildBarData(entities, 500, null);

        expect(result.bars[0].width).toBe(100);
        expect(result.remainder).toBe(0);
    });

    it('handles empty entity list', () => {
        const result = buildBarData([], 1000, null);

        expect(result.bars).toEqual([]);
        expect(result.total).toBe(0);
        expect(result.remainder).toBe(1000);
    });

    it('rounds total with specified precision', () => {
        const entities = [
            makeEntity('sensor.a', 1.005),
            makeEntity('sensor.b', 2.005),
        ];
        const result = buildBarData(entities, 10, null, 2);

        expect(result.total).toBe(3.01);
        expect(result.remainder).toBe(6.99);
    });
});

describe('normalizeEntityConfig', () => {
    it('wraps a string into an array with entity key', () => {
        expect(normalizeEntityConfig('sensor.power')).toEqual([
            { entity: 'sensor.power' },
        ]);
    });

    it('normalizes array of strings', () => {
        const result = normalizeEntityConfig(['sensor.a', 'sensor.b']);
        expect(result).toEqual([
            { entity: 'sensor.a' },
            { entity: 'sensor.b' },
        ]);
    });

    it('passes through array of objects', () => {
        const input = [{ entity: 'sensor.a', icon: 'mdi:flash' }];
        const result = normalizeEntityConfig(input);
        expect(result).toEqual(input);
    });

    it('handles mixed array of strings and objects', () => {
        const result = normalizeEntityConfig([
            'sensor.a',
            { entity: 'sensor.b', color: '#f00' },
        ]);
        expect(result).toEqual([
            { entity: 'sensor.a' },
            { entity: 'sensor.b', color: '#f00' },
        ]);
    });

    it('wraps a single object into an array', () => {
        const result = normalizeEntityConfig({ entity: 'sensor.a' });
        expect(result).toEqual([{ entity: 'sensor.a' }]);
    });

    it('throws on invalid input', () => {
        expect(() => normalizeEntityConfig(42)).toThrow('Invalid entity format');
        expect(() => normalizeEntityConfig({})).toThrow('Invalid entity format');
    });
});
