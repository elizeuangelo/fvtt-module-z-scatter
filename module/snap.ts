import { snapIsActive } from './control.js';
import { buildCollisionGroups, isGridless } from './geometry.js';
import { calculateOffsets } from './layout.js';
import { applyVisualOffset, resetVisualOffset } from './render.js';
import { getSetting } from './settings.js';
import type { Offset, RefreshTokenOptions, Token, TokenDocument } from './types.js';

const POSITION_EPSILON = 0.51;
const MOVEMENT_FIELDS = new Set(['x', 'y', 'elevation', 'width', 'height', 'shape']);

let SCATTERED_TOKENS = new Map<TokenDocument, Offset>();
let LAYOUT_REFRESH_QUEUED = false;
let QUEUED_SCENE: any;

export function refreshAll(groups: TokenDocument[][] | TokenDocument[] = [...SCATTERED_TOKENS.keys()]) {
	queueLayoutRefresh();
	for (const token of groups.flat()) token.object?.refresh();
}

function snapToken(token: Token, options: RefreshTokenOptions) {
	const grid = getSceneGrid(token);

	if (isGridless(grid?.type) || !snapIsActive()) {
		resetScatteredTokens();
		return;
	}

	if (shouldRecalculateFromRefresh(token, options)) queueLayoutRefresh(token.scene);

	const offset = SCATTERED_TOKENS.get(token.document);
	if (!offset || isMoving(token)) return;

	applyVisualOffset(token, offset, {
		refreshBorder: !!(options.refreshBorder || options.refreshShape || options.refreshSize),
	});
}

function recalculateScene(scene: any) {
	const grid = getSceneGridForScene(scene);
	if (!scene || isGridless(grid?.type) || !snapIsActive()) {
		resetScatteredTokens();
		return;
	}

	const candidates = getCollisionCandidates(scene, grid);
	const groups = buildCollisionGroups(candidates, grid, scene.dimensions.size, getSetting('ignoreElevation'));
	const nextOffsets = new Map<TokenDocument, Offset>();

	for (const group of groups) {
		const offsets = calculateOffsets(group, scene.dimensions.size, getSetting('scatter'));
		for (const groupToken of group) {
			const offset = offsets.get(groupToken);
			if (offset) nextOffsets.set(groupToken, offset);
		}
	}

	for (const oldToken of SCATTERED_TOKENS.keys()) {
		if (!nextOffsets.has(oldToken)) resetTokenDocument(oldToken);
	}

	for (const [tokenDocument, offset] of nextOffsets) {
		const previous = SCATTERED_TOKENS.get(tokenDocument);
		const offsetChanged = !previous || !sameOffset(previous, offset);
		const object = tokenDocument.object as Token | undefined;
		if (object && !isMoving(object)) applyVisualOffset(object, offset, { refreshBorder: offsetChanged });
	}

	SCATTERED_TOKENS = nextOffsets;
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

function getSceneGridForScene(scene: any) {
	return canvas?.scene === scene ? canvas?.grid : scene?.grid;
}

function resetTokenDocument(token: TokenDocument) {
	if (token.object) resetVisualOffset(token.object as Token);
}

function resetScatteredTokens() {
	for (const token of SCATTERED_TOKENS.keys()) resetTokenDocument(token);
	SCATTERED_TOKENS.clear();
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

function sameOffset(a: Offset, b: Offset) {
	return nearlyEqual(a.x, b.x) && nearlyEqual(a.y, b.y);
}

function shouldRecalculateFromRefresh(token: Token, options: RefreshTokenOptions) {
	if (isMoving(token)) return false;
	if (!options.refreshPosition && !options.refreshSize && !options.refreshShape && !options.refreshElevation) {
		return false;
	}
	return true;
}

function queueLayoutRefresh(scene: any = canvas?.scene) {
	QUEUED_SCENE = scene ?? QUEUED_SCENE;
	if (LAYOUT_REFRESH_QUEUED) return;

	LAYOUT_REFRESH_QUEUED = true;
	nextFrame(() => {
		LAYOUT_REFRESH_QUEUED = false;
		const scene = QUEUED_SCENE;
		QUEUED_SCENE = undefined;
		recalculateScene(scene ?? canvas?.scene);
	});
}

function afterTokenMovement(document: TokenDocument, movement: any) {
	if (movement.pending?.waypoints?.length) return;

	const movementId = movement.id;
	nextFrame(() => {
		const object = document.object as (Token & { movementAnimationPromise?: Promise<void> }) | undefined;
		const currentMovement = document.movement ?? object?.document?.movement;
		if (currentMovement?.id && currentMovement.id !== movementId) return;

		const animationEnded =
			currentMovement?.animation?.ended ??
			movement.animation?.ended ??
			object?.movementAnimationPromise ??
			Promise.resolve();

		Promise.resolve(animationEnded).finally(() => {
			nextFrame(() => {
				const latestMovement = document.movement ?? object?.document?.movement;
				if (latestMovement?.id && latestMovement.id !== movementId) return;
				queueLayoutRefresh(object?.scene ?? canvas?.scene);
			});
		});
	});
}

function documentAffectsLayout(changed: Record<string, unknown>) {
	if (Object.keys(changed).some((key) => MOVEMENT_FIELDS.has(key))) return true;
	if ('hidden' in changed) return true;
	if ('flags' in changed) return true;
	return false;
}

function nextFrame(callback: () => void) {
	if (typeof requestAnimationFrame === 'function') requestAnimationFrame(callback);
	else setTimeout(callback, 0);
}

Hooks.on('refreshToken', snapToken);
Hooks.on('moveToken', afterTokenMovement);
Hooks.on('createToken', (document: TokenDocument) => queueLayoutRefresh(document.object?.scene ?? canvas?.scene));
Hooks.on('deleteToken', (document: TokenDocument) => {
	resetTokenDocument(document);
	SCATTERED_TOKENS.delete(document);
	queueLayoutRefresh(canvas?.scene);
});
Hooks.on('updateToken', (document: TokenDocument, changed: Record<string, unknown>, options: any = {}) => {
	if (options._movement?.[document.id]) return;
	if (documentAffectsLayout(changed)) queueLayoutRefresh(document.object?.scene ?? canvas?.scene);
});
Hooks.on('canvasTearDown', () => {
	SCATTERED_TOKENS.clear();
	QUEUED_SCENE = undefined;
	LAYOUT_REFRESH_QUEUED = false;
});
