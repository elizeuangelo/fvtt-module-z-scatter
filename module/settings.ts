export const SYSTEM_ID = 'z-scatter';

const settings = {
	snapTokens: {
		name: 'Snap Tokens',
		scope: 'world',
		config: false,
		type: Boolean,
		default: true,
		onChange: (value) => canvas.tokens!.placeables.forEach((t) => t.refresh()),
	},
} as const;

export type Settings = typeof settings;

export function getSetting<T extends keyof Settings>(name: T) {
	return game.settings.get(SYSTEM_ID, name) as unknown as ReturnType<Settings[T]['type']>;
}

export function setSetting<T extends keyof Settings>(name: T, value: ReturnType<Settings[T]['type']>) {
	return game.settings.set(SYSTEM_ID, name, value);
}

Hooks.once('setup', () => {
	for (const [key, setting] of Object.entries(settings)) {
		game.settings.register(SYSTEM_ID, key, setting as unknown as any);
	}
});
