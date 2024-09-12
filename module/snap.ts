import { getSetting } from './settings.js';

interface AnimationContext {
	duration: number;
	name: string;
	onAnimate: Function[];
	postAnimate: Function[];
	preAnimate: Function[];
	promise: Promise<void>;
	time: number;
	to?: { y?: number; x?: number };
}

interface Token {
	x: number;
	y: number;
	w: number;
	h: number;
	document: TokenDocument;
	scene: any;
	mesh: any;
	destroyed: boolean;
	effects: any;
	nameplate: any;
	tooltip: any;
	bars: any;
	target: any;
	border: any;
	hitArea: any;
	animationContexts: Map<string, AnimationContext>;
	refresh: () => void;
	_refreshBorder: () => void;
}

interface TokenDocument {
	height: number;
	width: number;
	x: number;
	y: number;
	hasStatusEffect(id: string): boolean;
	object?: Token;
}

interface RefreshTokenOptions {
	refreshPosition?: boolean;
}

const rad = Math.PI * 2,
	baseRotation = Math.PI / 4;

function repositionToken(token: Token, rotation: number, offset: number, pos = 0) {
	const size = token.scene.dimensions.size,
		x = Math.sin(rotation * pos + baseRotation) * offset * token.document.width * size,
		y = Math.cos(rotation * pos + baseRotation) * offset * token.document.height * size;

	(token.hitArea as any).x = token.effects.x = token.bars.x = token.target.x = -x;
	(token.hitArea as any).y = token.effects.y = token.bars.y = token.target.y = -y;

	token.nameplate.x = token.w / 2 - x;
	token.nameplate.y = token.h + 2 - y;

	token.tooltip.x = token.w / 2 - x;
	token.tooltip.y = -y - 2;

	const gridOffset = size / 2;
	token.mesh.x = token.document.x - x + gridOffset * token.document.width;
	token.mesh.y = token.document.y - y + gridOffset * token.document.height;

	token._refreshBorder();
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
	for (const t of groups.flat()) {
		t.object?.refresh();
	}
}

function resetToken(token: Token) {
	(token.hitArea as any).x = token.effects.x = token.bars.x = token.target.x = 0;
	(token.hitArea as any).y = token.effects.y = token.bars.y = token.target.y = 0;
	token.nameplate.x = token.w / 2;
	token.nameplate.y = token.h + 2;
	token._refreshBorder();
}

function snapToken(token: Token, options: RefreshTokenOptions) {
	if (!getSetting('snapTokens')) {
		resetToken(token);
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
		resetToken(token);
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
	for (let i = 0; i < tokens.length; i++) {
		try {
			repositionToken(tokens[i].object as Token, angle, offset, i);
		} catch {}
	}
}

function checkStatus(token: TokenDocument, status: string[]) {
	return status.some((s) => token.hasStatusEffect(s));
}

Hooks.on('refreshToken', snapToken);
Hooks.on('canvasTearDown', () => (SNAPPED_TOKENS = []));
