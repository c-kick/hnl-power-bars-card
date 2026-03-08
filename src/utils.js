export function computeEntityIcon(stateObj) {
    // Explicit icon override?
    if (stateObj.attributes.icon) {
        return stateObj.attributes.icon;
    }

    const domain = stateObj.entity_id.split('.')[0];
    const deviceClass = stateObj.attributes.device_class;

    // Sensor device_class-specific icons
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
                return 'mdi:eye'; // generic sensor fallback
        }
    }

    // Generic fallback per domain
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
            return 'mdi:bookmark-outline'; // ultimate fallback
    }
}
