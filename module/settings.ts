export const MODULE_ID = 'z-scatter';

const settings = {
	snapTokens: {
		name: 'Snap Tokens',
		scope: 'world',
		config: false,
		type: Boolean,
		default: true,
		onChange: () => {
			if (getSetting('playersBtn')) return;
			canvas.tokens!.placeables.forEach((t) => t.refresh());
		},
	},
	snapTokensPlayerPreference: {
		name: 'Snap Tokens (Player Preference)',
		scope: 'client',
		config: false,
		type: Boolean,
		default: false,
		onChange: () => canvas.tokens!.placeables.forEach((t) => t.refresh()),
	},
	hideBtn: {
		name: `${MODULE_ID}.settings.hideBtn.name`,
		hint: `${MODULE_ID}.settings.hideBtn.hint`,
		scope: 'world',
		config: true,
		type: Boolean,
		default: false,
		requiresReload: true,
	},
	ignoreDead: {
		name: `${MODULE_ID}.settings.ignoreDead.name`,
		hint: `${MODULE_ID}.settings.ignoreDead.hint`,
		scope: 'world',
		config: true,
		type: Boolean,
		default: true,
	},
	playersBtn: {
		name: `${MODULE_ID}.settings.playersBtn.name`,
		hint: `${MODULE_ID}.settings.playersBtn.hint`,
		scope: 'world',
		config: true,
		type: Boolean,
		default: false,
		requiresReload: true,
	},
	scatter: {
		name: `${MODULE_ID}.settings.scatter.name`,
		hint: `${MODULE_ID}.settings.scatter.hint`,
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
} as const;

export type Settings = typeof settings;

export function getSetting<T extends keyof Settings>(name: T) {
	return game.settings.get(MODULE_ID, name) as unknown as ReturnType<Settings[T]['type']>;
}

export function setSetting<T extends keyof Settings>(name: T, value: ReturnType<Settings[T]['type']>) {
	return game.settings.set(MODULE_ID, name, value);
}

Hooks.once('setup', () => {
	for (const [key, setting] of Object.entries(settings)) {
		game.settings.register(MODULE_ID, key, setting as unknown as any);
	}
});
