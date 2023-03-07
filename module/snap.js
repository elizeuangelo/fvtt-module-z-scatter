import { snapTokens } from './control.js';
function snapToken(token, diff, options, userId) {
    if (game.users.filter((u) => u.isGM && u.active)[0] !== game.user)
        return;
    if (!snapTokens)
        return;
    if (!('x' in diff) && !('y' in diff))
        return;
}
Hooks.on('updateToken', snapToken);
