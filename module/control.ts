import { getSetting, setSetting } from './settings.js';

function addControl(sceneControls: any[]) {
	if (!game.user!.isGM) return;
	const tokenControl = sceneControls.find((c) => c.name === 'token')!;

	tokenControl.tools.push({
		name: 'size-snap',
		title: 'Size Snap',
		icon: 'fas fa-diagram-venn',
		toggle: true,
		active: getSetting('snapTokens'),
		onClick: (toggled: boolean) => setSetting('snapTokens', toggled),
	});
}

Hooks.on('getSceneControlButtons', addControl);
