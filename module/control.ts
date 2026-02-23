import { getSetting, setSetting } from './settings.js';

function addControl(sceneControls: { tokens: { tools: { sizeSnap: any } } }) {
	if (!getSetting('playersBtn') && !game.user!.isGM) return;
	if (getSetting('hideBtn')) return;

	sceneControls.tokens.tools.sizeSnap = {
		name: 'sizeSnap',
		title: game.i18n.localize('z-scatter.sizeSnap.title'),
		icon: 'fas fa-diagram-venn',
		toggle: true,
		active: getSetting('snapTokens'),
		onChange: (_event, toggled: boolean) => {
			if (getSetting('playersBtn')) {
				setSetting('snapTokensPlayerPreference', toggled);
			} else {
				setSetting('snapTokens', toggled);
			}
		},
	};
}

Hooks.on('getSceneControlButtons', addControl);
