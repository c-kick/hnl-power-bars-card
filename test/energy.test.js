import { describe, it, expect } from 'vitest';
import { selectPeriod, fetchStatistics, getEnergyDataCollection } from '../src/energy.js';

describe('selectPeriod', () => {
    it('returns "hour" for ranges of 2 days or less', () => {
        const start = new Date('2025-01-01T00:00:00Z');
        const end = new Date('2025-01-02T00:00:00Z');
        expect(selectPeriod(start, end)).toBe('hour');
    });

    it('returns "hour" for ranges exactly 2 days', () => {
        const start = new Date('2025-01-01T00:00:00Z');
        const end = new Date('2025-01-03T00:00:00Z');
        expect(selectPeriod(start, end)).toBe('hour');
    });

    it('returns "day" for ranges between 2 and 35 days', () => {
        const start = new Date('2025-01-01T00:00:00Z');
        const end = new Date('2025-01-10T00:00:00Z');
        expect(selectPeriod(start, end)).toBe('day');
    });

    it('returns "day" for exactly 35 days', () => {
        const start = new Date('2025-01-01T00:00:00Z');
        const end = new Date('2025-02-05T00:00:00Z');
        expect(selectPeriod(start, end)).toBe('day');
    });

    it('returns "month" for ranges over 35 days', () => {
        const start = new Date('2025-01-01T00:00:00Z');
        const end = new Date('2025-06-01T00:00:00Z');
        expect(selectPeriod(start, end)).toBe('month');
    });
});

describe('getEnergyDataCollection', () => {
    it('returns null when hass is null', () => {
        expect(getEnergyDataCollection(null)).toBeNull();
    });

    it('returns null when connection has no _energy', () => {
        expect(getEnergyDataCollection({ connection: {} })).toBeNull();
    });

    it('returns the energy collection when available', () => {
        const collection = { subscribe: () => {} };
        const hass = { connection: { _energy: collection } };
        expect(getEnergyDataCollection(hass)).toBe(collection);
    });
});

describe('fetchStatistics', () => {
    it('returns empty object for empty entity list', async () => {
        const hass = { callWS: () => ({}) };
        const result = await fetchStatistics(
            hass,
            new Date('2025-01-01'),
            new Date('2025-01-02'),
            [],
        );
        expect(result).toEqual({});
    });

    it('computes value from state difference for cumulative sensors', async () => {
        const hass = {
            callWS: async () => ({
                'sensor.energy': [
                    { state: 100, sum: null, mean: null },
                    { state: 150, sum: null, mean: null },
                    { state: 250, sum: null, mean: null },
                ],
            }),
        };
        const result = await fetchStatistics(
            hass,
            new Date('2025-01-01'),
            new Date('2025-01-02'),
            ['sensor.energy'],
        );
        expect(result['sensor.energy']).toBe(150); // 250 - 100
    });

    it('computes value from sum difference when state is not available', async () => {
        const hass = {
            callWS: async () => ({
                'sensor.energy': [
                    { state: null, sum: 10, mean: null },
                    { state: null, sum: 30, mean: null },
                    { state: null, sum: 50, mean: null },
                ],
            }),
        };
        const result = await fetchStatistics(
            hass,
            new Date('2025-01-01'),
            new Date('2025-01-02'),
            ['sensor.energy'],
        );
        expect(result['sensor.energy']).toBe(40); // 50 - 10
    });

    it('falls back to mean average when no state or sum', async () => {
        const hass = {
            callWS: async () => ({
                'sensor.temp': [
                    { state: null, sum: null, mean: 20 },
                    { state: null, sum: null, mean: 22 },
                    { state: null, sum: null, mean: 24 },
                ],
            }),
        };
        const result = await fetchStatistics(
            hass,
            new Date('2025-01-01'),
            new Date('2025-01-02'),
            ['sensor.temp'],
        );
        expect(result['sensor.temp']).toBe(22); // (20+22+24)/3
    });

    it('returns null for entities with no statistics', async () => {
        const hass = {
            callWS: async () => ({
                'sensor.missing': [],
            }),
        };
        const result = await fetchStatistics(
            hass,
            new Date('2025-01-01'),
            new Date('2025-01-02'),
            ['sensor.missing'],
        );
        expect(result['sensor.missing']).toBeNull();
    });

    it('returns null for entities not in response', async () => {
        const hass = {
            callWS: async () => ({}),
        };
        const result = await fetchStatistics(
            hass,
            new Date('2025-01-01'),
            new Date('2025-01-02'),
            ['sensor.unknown'],
        );
        expect(result['sensor.unknown']).toBeNull();
    });

    it('selects correct period based on date range', async () => {
        let capturedMsg = null;
        const hass = {
            callWS: async (msg) => {
                capturedMsg = msg;
                return {};
            },
        };

        // 60 day range → should use "month"
        await fetchStatistics(
            hass,
            new Date('2025-01-01'),
            new Date('2025-03-02'),
            ['sensor.a'],
        );
        expect(capturedMsg.period).toBe('month');

        // 7 day range → should use "day"
        await fetchStatistics(
            hass,
            new Date('2025-01-01'),
            new Date('2025-01-08'),
            ['sensor.a'],
        );
        expect(capturedMsg.period).toBe('day');

        // 1 day range → should use "hour"
        await fetchStatistics(
            hass,
            new Date('2025-01-01'),
            new Date('2025-01-02'),
            ['sensor.a'],
        );
        expect(capturedMsg.period).toBe('hour');
    });

    it('handles multiple entities', async () => {
        const hass = {
            callWS: async () => ({
                'sensor.solar': [
                    { state: 0, sum: null, mean: null },
                    { state: 500, sum: null, mean: null },
                ],
                'sensor.grid': [
                    { state: 100, sum: null, mean: null },
                    { state: 300, sum: null, mean: null },
                ],
            }),
        };
        const result = await fetchStatistics(
            hass,
            new Date('2025-01-01'),
            new Date('2025-01-02'),
            ['sensor.solar', 'sensor.grid'],
        );
        expect(result['sensor.solar']).toBe(500);
        expect(result['sensor.grid']).toBe(200);
    });
});
