import type { Offset, Token } from './types.js';

const ZERO_OFFSET: Offset = { x: 0, y: 0 };

export function applyVisualOffset(token: Token, offset: Offset) {
	if (!canRender(token)) return;

	const objects = getOffsetObjects(token);
	for (const object of objects) {
		object.x = offset.x;
		object.y = offset.y;
	}

	token.nameplate.x = token.w / 2 + offset.x;
	token.nameplate.y = token.h + 2 + offset.y;

	token.tooltip.x = token.w / 2 + offset.x;
	token.tooltip.y = offset.y - 2;

	const size = token.scene.dimensions.size;
	const gridOffset = size / 2;
	token.mesh.x = token.document.x + offset.x + gridOffset * token.document.width;
	token.mesh.y = token.document.y + offset.y + gridOffset * token.document.height;

	refreshShape(token);
	token._refreshBorder();
}

export function resetVisualOffset(token: Token) {
	if (!canRender(token)) return;

	const hadOffset = getOffsetObjects(token).some((object) => !!object.x || !!object.y);
	const hadNameplateOffset = token.nameplate.x !== token.w / 2 || token.nameplate.y !== token.h + 3;
	const size = token.scene.dimensions.size;
	const expectedMeshX = token.document.x + (size / 2) * token.document.width;
	const expectedMeshY = token.document.y + (size / 2) * token.document.height;
	const hadMeshOffset = token.mesh.x !== expectedMeshX || token.mesh.y !== expectedMeshY;

	applyVisualOffset(token, ZERO_OFFSET);

	if (hadOffset || hadNameplateOffset || hadMeshOffset) {
		token.refresh();
	}
}

function refreshShape(token: Token) {
	if (!token.shape?.points) return;

	const size = token.scene.dimensions.size;
	const width = size * token.document.width;
	const height = size * token.document.height;

	token.shape.points = [0, 0, width, 0, width, height, 0, height];
	if (token.shape.points[0] !== 0 || token.shape.points[1] !== 0) return;

	const pointX = token.shape.x ?? 0;
	const pointY = token.shape.y ?? 0;
	token.shape.points = token.shape.points.map((value, index) =>
		index % 2 === 0 ? value + pointX : value + pointY,
	);
}

function getOffsetObjects(token: Token) {
	return [
		token.hitArea,
		token.effects,
		token.bars,
		token.targetArrows,
		token.targetPips,
	].filter(Boolean);
}

function canRender(token: Token) {
	return !!token && !token.destroyed && !!token.document && !!token.scene?.dimensions && !!token.mesh;
}
