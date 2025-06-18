import {getSetting, setSetting} from './settings.js';

function addControl(sceneControls: { tokens: { tools: {} } }) {
    if (!game.user!.isGM) return;

    sceneControls.tokens.tools.sizeSnap = {
        name: 'sizeSnap',
        title: 'Size Snap',
        icon: 'fas fa-diagram-venn',
        toggle: true,
        active: getSetting('snapTokens'),
        onChange: (event, toggled: boolean) => {
            setSetting('snapTokens', toggled)
        },
    }
}

Hooks.on('getSceneControlButtons', addControl);
