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
        defaultTheme: 'hatched',
        themes: [
            { value: 'hatched',     label: 'Hatched',       description: 'Solid fill, hatched remainders' },
            { value: 'animated',    label: 'Animated',      description: 'Animated diagonal stripes' },
            { value: 'classic',     label: 'Classic',       description: 'Solid fill with border' },
            { value: 'gradient',    label: 'Gradient',      description: 'Horizontal gradient from base to darker shade' },
            { value: 'tapered',     label: 'Tapered wedge', description: 'Narrows toward destination' },
            { value: 'dotted',      label: 'Dotted',        description: 'Thin glowing line with dot pattern' },
        ],
    },
    {
        value: 'native',
        label: 'Native',
        description: 'Two stacked bar rows (HA distribution card style)',
        defaultTheme: 'default',
        themes: [
            { value: 'default',       label: 'Default',       description: 'Pill-shaped bars' },
            { value: 'split-corners', label: 'Split corners', description: 'Rounded corners matching HA card radius' },
            { value: 'gradient',              label: 'Gradient',              description: 'Horizontal gradient from base to darker shade' },
            { value: 'split-corners-gradient', label: 'Split corners gradient', description: 'Split corners with horizontal gradient' },

        ],
    },
];

// Deprecated — kept for backward compatibility, will be removed in a future major version
export const DEFAULT_ACCOLADE_STYLE = 'hatched';
export const ACCOLADE_STYLES = [
    { value: 'hatched',     label: 'Hatched',       description: 'Solid fill, hatched remainders' },
    { value: 'animated',    label: 'Animated',      description: 'Animated diagonal stripes' },
    { value: 'classic',     label: 'Classic',       description: 'Solid fill with border' },
    { value: 'gradient',    label: 'Gradient',      description: 'Horizontal gradient from base to darker shade' },
    { value: 'tapered',     label: 'Tapered wedge', description: 'Narrows toward destination' },
    { value: 'dotted',      label: 'Dotted',        description: 'Thin glowing line with dot pattern' },
    { value: 'native',      label: 'Native',        description: 'Matches HA distribution card style' },
    { value: 'native-alt',  label: 'Native alt',    description: 'Native with split corners' },
];
