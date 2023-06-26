import { getSetting } from './settings.js';
const rad = Math.PI * 2, baseRotation = Math.PI / 4;
function repositionToken(token, rotation, offset, pos = 0, base = baseRotation) {
    const size = token.scene.dimensions.size, x = Math.sin(rotation * pos + base) * offset * token.document.width * size, y = Math.cos(rotation * pos + base) * offset * token.document.height * size;
    token.border.x = token.document.x - x;
    token.border.y = token.document.y - y;
    token.hitArea.x = token.effects.x = token.bars.x = token.target.x = -x;
    token.hitArea.y = token.effects.y = token.bars.y = token.target.y = -y;
    token.nameplate.x = token.w / 2 - x;
    token.nameplate.y = token.h + 2 - y;
    token.tooltip.x = token.w / 2 - x;
    token.tooltip.y = -y - 2;
    const gridOffset = size / 2;
    token.mesh.x = token.border.x + gridOffset * token.document.width;
    token.mesh.y = token.border.y + gridOffset * token.document.height;
}
function repositionTokens(tokens) {
    const angle = rad / tokens.length;
    const offset = getSetting('scatter');
    tokens.forEach((token, i) => repositionToken(token.object, angle, offset, i));
}
function repositionSmallerTokens(smallerTokens, biggerToken) {
    const maxX = biggerToken.width - 1, maxY = biggerToken.height - 1;
    const angle = rad / (smallerTokens.length * 2);
    const offset = getSetting('scatter');
    let extraTokens = 0;
    smallerTokens.forEach((token, i) => {
        const posX = (token.x - biggerToken.x) / canvas.grid.size - maxX / 2, posY = (token.y - biggerToken.y) / canvas.grid.size - maxY / 2;
        const rotation = Math.atan2(-posX, -posY) - baseRotation * (smallerTokens.length - 1);
        repositionToken(token.object, angle, offset, i + extraTokens, rotation);
        if (maxX === 0 || maxY === 0) {
        }
    });
}
let SNAPPED_TOKENS = [];
function findGroup(token) {
    for (const group of SNAPPED_TOKENS) {
        for (const t of group) {
            if (token === t)
                return group;
        }
    }
}
function sameGroup(oldGroup, newGroup) {
    if (oldGroup.length !== newGroup.length)
        return false;
    for (const t of oldGroup) {
        if (!newGroup.includes(t))
            return false;
    }
    return true;
}
export function refreshAll(groups = SNAPPED_TOKENS) {
    for (const t of SNAPPED_TOKENS.flat()) {
        t.object?.refresh();
    }
}
function snapToken(token, options) {
    if (getSetting('sizeOrder'))
        token.document.sort = +token.controlled - (token.document.width + token.document.height);
    if (token.isAnimating)
        return;
    if (!getSetting('snapTokens')) {
        token.hitArea.x = token.effects.x = token.bars.x = token.target.x = 0;
        token.hitArea.y = token.effects.y = token.bars.y = token.target.y = 0;
        return;
    }
    const oldGroup = findGroup(token.document);
    const x = token.document.x, y = token.document.y, height = token.document.height, width = token.document.width;
    const ignoreDead = getSetting('ignoreDead');
    const contents = token.scene.tokens.contents.filter((token) => token.object &&
        !token.object?.destroyed &&
        !(ignoreDead && checkStatus(token, ['dead', 'dying', 'unconscious'])) &&
        !(token.hidden || !game.user.isGM));
    const biggerTokens = contents.filter((token) => {
        if (token.height <= height && token.width <= width)
            return;
        const posX = (token.x - x) / canvas.grid.size + token.width;
        const posY = (token.y - y) / canvas.grid.size + token.height;
        return posX > 0 && posX <= token.width && posY > 0 && posY <= token.height;
    });
    const smallerTokens = contents.filter((token) => {
        if (token.height >= height || token.width >= width)
            return;
        const posX = (x - token.x) / canvas.grid.size + width;
        const posY = (y - token.y) / canvas.grid.size + height;
        return posX > 0 && posX <= width && posY > 0 && posY <= height;
    });
    smallerTokens.forEach((token) => token.object.refresh());
    const tokens = contents.filter((token) => !token.object?.destroyed && token.x === x && token.y === y && token.height === height && token.width === width);
    if (tokens.length < 2) {
        token.hitArea.x = token.effects.x = token.bars.x = token.target.x = 0;
        token.hitArea.y = token.effects.y = token.bars.y = token.target.y = 0;
        if (oldGroup) {
            if (oldGroup.length > 1) {
                const idx = oldGroup.indexOf(token.document);
                oldGroup.splice(idx, 1);
                refreshAll(oldGroup);
            }
            else {
                const idx = SNAPPED_TOKENS.indexOf(oldGroup);
                SNAPPED_TOKENS.splice(idx, 1);
            }
        }
        if (biggerTokens.length === 1)
            repositionSmallerTokens(tokens, biggerTokens[0]);
        return;
    }
    if (oldGroup && !sameGroup(oldGroup, tokens)) {
        const idx = oldGroup.indexOf(token.document);
        oldGroup.splice(idx, 1);
        if (oldGroup.length)
            refreshAll(oldGroup);
        else {
            const idx = SNAPPED_TOKENS.indexOf(oldGroup);
            SNAPPED_TOKENS.splice(idx, 1);
        }
    }
    const newGroup = findGroup(tokens.find((t) => t !== token.document));
    if (newGroup) {
        const idx = SNAPPED_TOKENS.indexOf(newGroup);
        SNAPPED_TOKENS.splice(idx, 1);
    }
    SNAPPED_TOKENS.push(tokens);
    if (biggerTokens.length !== 1)
        repositionTokens(tokens);
    else
        repositionSmallerTokens(tokens, biggerTokens[0]);
}
function checkStatus(token, status) {
    return status.some((s) => token.hasStatusEffect(s));
}
Hooks.on('refreshToken', snapToken);
Hooks.on('canvasTearDown', () => (SNAPPED_TOKENS = []));
