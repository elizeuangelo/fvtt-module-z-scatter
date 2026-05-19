import { snapIsActive } from './control.js';
import { buildCollisionGroups, isGridless } from './geometry.js';
import { calculateOffsets } from './layout.js';
import { applyVisualOffset, resetVisualOffset } from './render.js';
import { getSetting } from './settings.js';
import type { RefreshTokenOptions, Token, TokenDocument } from './types.js';

const POSITION_EPSILON = 0.51;

let SCATTERED_TOKENS = new Set<TokenDocument>();

export function refreshAll(groups: TokenDocument[][] | TokenDocument[] = [...SCATTERED_TOKENS]) {
	for (const token of groups.flat()) {
		token.object?.refresh();
	}
}

function snapToken(token: Token, _options: RefreshTokenOptions) {
	const grid = getSceneGrid(token);

	if (isGridless(grid?.type) || !snapIsActive()) {
		resetTokens([...SCATTERED_TOKENS, token.document]);
		SCATTERED_TOKENS.clear();
		return;
	}

	if (isMoving(token)) return;

	const candidates = getCollisionCandidates(token.scene, grid);
	const groups = buildCollisionGroups(candidates, grid, token.scene.dimensions.size, getSetting('ignoreElevation'));
	const activeTokens = new Set(groups.flat());

	for (const oldToken of SCATTERED_TOKENS) {
		if (!activeTokens.has(oldToken)) resetTokenDocument(oldToken);
	}

	for (const group of groups) {
		const offsets = calculateOffsets(group, token.scene.dimensions.size, getSetting('scatter'));
		for (const groupToken of group) {
			const offset = offsets.get(groupToken);
			if (!offset) continue;
			applyVisualOffset(groupToken.object as Token, offset);
		}
	}

	SCATTERED_TOKENS = activeTokens;
}

function getCollisionCandidates(scene: any, grid: any) {
	const ignoreDead = getSetting('ignoreDead');
	const ignoreMisaligned = getSetting('ignoreMisaligned');

	return scene.tokens.contents.filter(
		(token: TokenDocument) =>
			!!token.object &&
			!token.object.destroyed &&
			token.object.visible !== false &&
			!(ignoreDead && checkStatus(token, ['dead', 'dying', 'unconscious'])) &&
			!(ignoreMisaligned && tokenIsMisaligned(token, grid)),
	);
}

function getSceneGrid(token: Token) {
	return canvas?.grid ?? token.scene?.grid ?? game.scenes.current?.grid;
}

function resetTokens(tokens: TokenDocument[]) {
	for (const token of new Set(tokens)) {
		resetTokenDocument(token);
	}
}

function resetTokenDocument(token: TokenDocument) {
	if (token.object) resetVisualOffset(token.object as Token);
}

function isMoving(token: Token) {
	const animation = [...token.animationContexts.values()].find((ctx) => ctx.to);
	return (
		!!animation &&
		animation.to &&
		((animation.to.x ?? token.x) !== token.x || (animation.to.y ?? token.y) !== token.y)
	);
}

function checkStatus(token: TokenDocument, status: string[]) {
	return status.some((s) => token.hasStatusEffect(s));
}

function tokenIsMisaligned(token: TokenDocument, grid: any) {
	const snapped = token.getSnappedPosition?.({
		x: token.x,
		y: token.y,
		width: token.width,
		height: token.height,
		elevation: token.elevation,
		shape: token.shape,
	});

	if (snapped) return !samePosition(token, snapped);
	if (!grid?.isSquare || !grid?.size) return false;

	const size = grid.size ?? 1;
	return !gridCoordinateIsAligned(token.x, size) || !gridCoordinateIsAligned(token.y, size);
}

function samePosition(a: { x: number; y: number }, b: { x: number; y: number }) {
	return nearlyEqual(a.x, b.x) && nearlyEqual(a.y, b.y);
}

function gridCoordinateIsAligned(value: number, size: number) {
	const remainder = ((value % size) + size) % size;
	return nearlyEqual(remainder, 0) || nearlyEqual(remainder, size);
}

function nearlyEqual(a: number, b: number, epsilon = POSITION_EPSILON) {
	return Math.abs(a - b) <= epsilon;
}

Hooks.on('refreshToken', snapToken);
Hooks.on('canvasTearDown', () => {
	SCATTERED_TOKENS.clear();
});
