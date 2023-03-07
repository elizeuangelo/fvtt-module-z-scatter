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
