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
