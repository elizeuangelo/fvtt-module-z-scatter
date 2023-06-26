export const SYSTEM_ID = 'z-scatter';
const settings = {
    snapTokens: {
        name: 'Snap Tokens',
        scope: 'world',
        config: false,
        type: Boolean,
        default: true,
        onChange: (value) => canvas.tokens.placeables.forEach((t) => t.refresh()),
    },
    scatter: {
        name: 'Scattering',
        hint: 'How much the tokens will scatter around?',
        scope: 'world',
        config: true,
        type: Number,
        default: 0.4,
        range: {
            min: 0.01,
            max: 1,
            step: 0.01,
        },
    },
    ignoreDead: {
        name: 'Ignore Special Cases',
        hint: 'Dead or incapacitated tokens will not be snapped.',
        scope: 'world',
        config: true,
        type: Boolean,
        default: true,
    },
    sizeOrder: {
        name: 'Smaller Tokens in Front',
        hint: 'Takes smaller tokens in front of bigger ones, for better management in the grid.',
        scope: 'world',
        config: true,
        type: Boolean,
        default: true,
    },
};
export function getSetting(name) {
    return game.settings.get(SYSTEM_ID, name);
}
export function setSetting(name, value) {
    return game.settings.set(SYSTEM_ID, name, value);
}
Hooks.once('setup', () => {
    for (const [key, setting] of Object.entries(settings)) {
        game.settings.register(SYSTEM_ID, key, setting);
    }
});
