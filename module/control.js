export let snapTokens = true;
function addControl(sceneControls) {
    if (game.users.filter((u) => u.isGM && u.active)[0] !== game.user)
        return;
    const tokenControl = sceneControls.find((c) => c.name === 'token');
    tokenControl.tools.push({
        name: 'size-snap',
        title: 'Size Snap',
        icon: 'fas fa-diagram-venn',
        toggle: true,
        active: snapTokens,
        onClick: (toggled) => (snapTokens = toggled),
    });
}
Hooks.on('getSceneControlButtons', addControl);
