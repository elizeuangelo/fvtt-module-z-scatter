import { getSetting, setSetting } from './settings.js';

function addControl(sceneControls: { tokens: { tools: { sizeSnap: any } } }) {
	if (!game.user!.isGM) return;

	sceneControls.tokens.tools.sizeSnap = {
		name: 'sizeSnap',
		title: game.i18n.localize("z-scatter.sizeSnap.title"),
		icon: 'fas fa-diagram-venn',
		toggle: true,
		active: getSetting('snapTokens'),
		onChange: (event, toggled: boolean) => {
			setSetting('snapTokens', toggled);
		},
	};
}

Hooks.on('getSceneControlButtons', addControl);
