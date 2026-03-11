export const CARD_VERSION = '1.3.3';
export const CARD_NAME = 'hnl-flow-bars-card';
export const CARD_DESCRIPTION = 'A flow bar visualization card for Home Assistant';

// Default fallback colors (used when HA theme vars are unavailable)
export const FALLBACK_COLOR_PRODUCTION = '#ffd407';
export const FALLBACK_COLOR_CONSUMPTION = '#8b58bf';
export const FALLBACK_COLOR_SHORTFALL = '#ce513a';
export const FALLBACK_COLOR_SURPLUS = '#3c9940';

// Layout + theme definitions
export const DEFAULT_LAYOUT = 'accolade';

export const LAYOUTS = [
    {
        value: 'accolade',
        label: 'Accolade',
        description: 'Bracket connectors between source and destination bars',
        defaultTheme: 'classic',
        themes: [
            { value: 'classic',     label: 'Classic',       description: 'Solid fill with border' },
        ],
    },
    {
        value: 'native',
        label: 'Native',
        description: 'Two stacked bar rows (HA distribution card style)',
        defaultTheme: 'default',
        themes: [
            { value: 'default',       label: 'Default',       description: 'Pill-shaped bars' },
            { value: 'split-pill', label: 'Split pill', description: 'Rounded corners matching HA card radius' },
            { value: 'minimal',     label: 'Minimal',       description: 'Minimalistic' },
            { value: 'contained',  label: 'Contained',     description: 'Destinations contained within sources' },
        ],
    },
];

// Deprecated — kept for backward compatibility, will be removed in a future major version
export const DEFAULT_ACCOLADE_STYLE = 'classic';
export const ACCOLADE_STYLES = [
    { value: 'classic',     label: 'Classic',       description: 'Solid fill with border' },
    { value: 'native',      label: 'Native',        description: 'Matches HA distribution card style' },
    { value: 'native-alt',  label: 'Native alt',    description: 'Native with split corners' },
];
