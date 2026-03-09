export const CARD_VERSION = '1.2.2';
export const CARD_NAME = 'hnl-flow-bars-card';
export const CARD_DESCRIPTION = 'A flow bar visualization card for Home Assistant';

// Default colors — aligned with HA Energy Dashboard conventions
export const COLOR_SOURCE = '#ff9800';           // --energy-solar-color (orange)
export const COLOR_SHORTFALL = '#488fc2';         // --energy-grid-consumption-color (blue)
export const COLOR_DESTINATION = '#488fc2';       // --energy-grid-consumption-color (blue)
export const COLOR_SURPLUS = '#8353d1';           // --energy-grid-return-color (purple)

// Default text colors for remainders
export const TEXT_COLOR_SHORTFALL = '#fff';
export const TEXT_COLOR_SURPLUS = '#fff';

// Accolade style variants
export const DEFAULT_ACCOLADE_STYLE = 'hatched';
export const ACCOLADE_STYLES = [
    { value: 'hatched',     label: 'Hatched',       description: 'Solid fill, hatched remainders' },
    { value: 'classic',     label: 'Classic',       description: 'Solid fill with border' },
    { value: 'gradient',    label: 'Gradient fade', description: 'Fades from source color downward' },
    { value: 'tapered',     label: 'Tapered wedge', description: 'Narrows toward destination' },
    { value: 'dotted',      label: 'Dotted',        description: 'Thin glowing line with dot pattern' },
    { value: 'dashed',      label: 'Dashed rail',   description: 'Dashed border, cross-hatch fill' },
    { value: 'shadow',      label: 'Shadow',        description: 'Invisible body, shadow only' },
    { value: 'double-line', label: 'Double line',   description: 'Twin lines, sparse stripes' },
];
