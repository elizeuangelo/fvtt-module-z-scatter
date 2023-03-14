import { getSetting } from './settings.js';

type TokenExpanded = Token & { mesh: any; destroyed: boolean; isAnimating: boolean; effects: any; nameplate: any; tooltip: any; bars: any; target: any };

const rad = Math.PI * 2,
	baseRotation = Math.PI / 4;

function repositionToken(token: TokenExpanded, rotation: number, offset: number, pos = 0) {
	const size = (token.scene.dimensions as Canvas.Dimensions).size,
		x = Math.sin(rotation * pos + baseRotation) * offset * token.document.width * size,
		y = Math.cos(rotation * pos + baseRotation) * offset * token.document.height * size;

	token.x = token.border!.x = token.document.x - x;
	token.y = token.border!.y = token.document.y - y;

	const gridOffset = size / 2;
	token.mesh.x = token.border!.x + gridOffset * token.document.width;
	token.mesh.y = token.border!.y + gridOffset * token.document.height;
}

let SNAPPED_TOKENS: TokenDocument[][] = [];

function findGroup(token: TokenDocument) {
	for (const group of SNAPPED_TOKENS) {
		for (const t of group) {
			if (token === t) return group;
		}
	}
}

function sameGroup(oldGroup: TokenDocument[], newGroup: TokenDocument[]) {
	if (oldGroup.length !== newGroup.length) return false;
	for (const t of oldGroup) {
		if (!newGroup.includes(t)) return false;
	}
	return true;
}

export function refreshAll(groups: TokenDocument[][] | TokenDocument[] = SNAPPED_TOKENS) {
	for (const t of SNAPPED_TOKENS.flat()) {
		t.object?.refresh();
	}
}

function snapToken(
	token: TokenExpanded,
	options: Partial<{
		bars: boolean;
		border: boolean;
		effects: boolean;
		elevation: boolean;
		nameplate: boolean;
	}>
) {
	if (token.isAnimating) return;
	if (!getSetting('snapTokens')) {
		return;
	}

	const oldGroup = findGroup(token.document);

	const x = token.document.x,
		y = token.document.y,
		height = token.document.height,
		width = token.document.width;

	const ignoreDead = getSetting('ignoreDead');

	const tokens = token.scene.tokens.contents.filter(
		(token: TokenDocument & { object: any }) =>
			!token.object?.destroyed &&
			token.x === x &&
			token.y === y &&
			token.height === height &&
			token.width === width &&
			!(ignoreDead && checkStatus(token, ['dead', 'dying', 'unconscious'])) &&
			token.object.visible
	);
	if (tokens.length < 2) {
		if (oldGroup) {
			if (oldGroup.length > 1) {
				const idx = oldGroup.indexOf(token.document);
				oldGroup.splice(idx, 1);
				refreshAll(oldGroup);
			} else {
				const idx = SNAPPED_TOKENS.indexOf(oldGroup);
				SNAPPED_TOKENS.splice(idx, 1);
			}
		}
		return;
	}

	if (oldGroup && !sameGroup(oldGroup, tokens)) {
		const idx = oldGroup.indexOf(token.document);
		oldGroup.splice(idx, 1);
		if (oldGroup.length) refreshAll(oldGroup);
		else {
			const idx = SNAPPED_TOKENS.indexOf(oldGroup);
			SNAPPED_TOKENS.splice(idx, 1);
		}
	}
	const newGroup = findGroup(tokens.find((t) => t !== token.document)!);
	if (newGroup) {
		const idx = SNAPPED_TOKENS.indexOf(newGroup);
		SNAPPED_TOKENS.splice(idx, 1);
	}
	SNAPPED_TOKENS.push(tokens);

	const angle = rad / tokens.length;
	const offset = getSetting('scatter');
	for (let i = 0; i < tokens.length; i++) repositionToken(tokens[i].object as TokenExpanded, angle, offset, i);
}

function checkStatus(token: TokenDocument, status: string[]) {
	return status.some((s) => token.hasStatusEffect(s));
}

Hooks.on('refreshToken', snapToken);
Hooks.on('canvasTearDown', () => (SNAPPED_TOKENS = []));

// Fix for a broken function in Foundry VTT
// Will be removed once its fixed in core Foundry
Hooks.on('ready', () => {
	canvas.grid!.grid!.getGridPositionFromPixels = function (x, y) {
		let gs = canvas.dimensions!.size;
		return [Math.floor(y / gs + 0.5), Math.floor(x / gs + 0.5)];
	};
});
