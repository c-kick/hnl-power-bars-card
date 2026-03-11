import { LAYOUTS, DEFAULT_LAYOUT } from './const.js';

/**
 * Resolves legacy `theme` / `accolade_style` config into separate `layout` + `theme` values.
 * Shared by the card and the editor so migration logic lives in one place.
 */
export function resolveLayoutAndTheme(config) {
    const legacy = config.theme || config.accolade_style;

    // New-style: explicit layout already set
    if (config.layout) {
        const layoutObj = LAYOUTS.find(l => l.value === config.layout) || LAYOUTS[0];
        const validThemes = layoutObj.themes.map(t => t.value);
        let theme = config.theme;
        let gradient = config.gradient ?? false;
        let hatched = config.hatched ?? false;
        let animated = config.animated ?? false;

        // Migrate themes that are now toggles
        if (theme === 'gradient') {
            theme = layoutObj.defaultTheme;
            gradient = true;
        } else if (theme === 'split-corners-gradient') {
            theme = 'split-pill';
            gradient = true;
        } else if (theme === 'split-corners') {
            theme = 'split-pill';
        } else if (theme === 'hatched') {
            theme = layoutObj.defaultTheme;
            hatched = true;
        } else if (theme === 'animated') {
            theme = layoutObj.defaultTheme;
            animated = true;
        }

        theme = validThemes.includes(theme) ? theme : layoutObj.defaultTheme;
        return { layout: layoutObj.value, theme, gradient, hatched, animated };
    }

    // Legacy single-value migration
    const LEGACY_MAP = {
        'native':     { layout: 'native', theme: 'default' },
        'native-alt': { layout: 'native', theme: 'split-pill' },
    };

    const toggles = {
        gradient: config.gradient ?? false,
        hatched: config.hatched ?? false,
        animated: config.animated ?? false,
    };

    if (legacy && LEGACY_MAP[legacy]) {
        return { ...LEGACY_MAP[legacy], ...toggles };
    }

    // Default: accolade layout, validate theme against its theme list
    const accoladeLayout = LAYOUTS[0];
    const validThemes = accoladeLayout.themes.map(t => t.value);
    let theme = legacy;

    // Migrate legacy themes that are now toggles
    if (theme === 'gradient') {
        theme = accoladeLayout.defaultTheme;
        toggles.gradient = true;
    } else if (theme === 'hatched') {
        theme = accoladeLayout.defaultTheme;
        toggles.hatched = true;
    } else if (theme === 'animated') {
        theme = accoladeLayout.defaultTheme;
        toggles.animated = true;
    }

    return {
        layout: 'accolade',
        theme: validThemes.includes(theme) ? theme : accoladeLayout.defaultTheme,
        ...toggles,
    };
}

/**
 * Resolves an icon for a given Home Assistant state object.
 *
 * Delegates to HA's built-in icon resolution (via stateIcon from the frontend)
 * when available, falling back to a minimal local mapping only when needed.
 */

let _stateIconFn = null;
let _stateIconLoaded = false;

async function _loadStateIcon() {
    if (_stateIconLoaded) return;
    _stateIconLoaded = true;
    try {
        // HA frontend exposes stateIcon in its common utilities.
        // Variable-based paths prevent Rollup from resolving these at build time;
        // they only exist at runtime inside the HA browser environment.
        const paths = ['/frontend_latest/state-icon.js', '/hacsfiles/state-icon.js'];
        for (const p of paths) {
            try {
                const mod = await import(/* @vite-ignore */ p);
                if (mod?.stateIcon) {
                    _stateIconFn = mod.stateIcon;
                    return;
                }
            } catch {
                // try next path
            }
        }
    } catch {
        // Not available — fall through to local fallback
    }
}

// Kick off loading immediately on import
_loadStateIcon();

export function computeEntityIcon(stateObj) {
    // Explicit icon override always wins
    if (stateObj.attributes.icon) {
        return stateObj.attributes.icon;
    }

    // Use HA's built-in resolution if available
    if (_stateIconFn) {
        try {
            const icon = _stateIconFn(stateObj);
            if (icon) return icon;
        } catch {
            // fall through to local fallback
        }
    }

    // Minimal local fallback — kept intentionally small
    const domain = stateObj.entity_id.split('.')[0];
    const deviceClass = stateObj.attributes.device_class;

    if (domain === 'sensor') {
        switch (deviceClass) {
            case 'temperature':
                return 'mdi:thermometer';
            case 'humidity':
                return 'mdi:water-percent';
            case 'pressure':
                return 'mdi:gauge';
            case 'motion':
                return 'mdi:run';
            case 'power':
                return 'mdi:flash';
            case 'battery':
                return 'mdi:battery';
            case 'energy':
                return 'mdi:lightning-bolt';
            default:
                return 'mdi:eye';
        }
    }

    switch (domain) {
        case 'light':
            return 'mdi:lightbulb';
        case 'switch':
            return 'mdi:toggle-switch';
        case 'binary_sensor':
            return 'mdi:alert-circle-outline';
        case 'cover':
            return 'mdi:window-shutter';
        case 'climate':
            return 'mdi:thermostat';
        case 'media_player':
            return 'mdi:play-circle';
        default:
            return 'mdi:bookmark-outline';
    }
}
