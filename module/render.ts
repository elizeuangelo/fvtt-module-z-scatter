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

	refreshHitArea(token, offset);
	refreshBorder(token, offset);
}

export function resetVisualOffset(token: Token) {
	if (!canRender(token)) return;

	const hadOffset = getOffsetObjects(token).some((object) => !!object.x || !!object.y);
	const hadBorderOffset = !!token.border?.x || !!token.border?.y;
	const hadNameplateOffset = token.nameplate.x !== token.w / 2 || token.nameplate.y !== token.h + 3;
	const size = token.scene.dimensions.size;
	const expectedMeshX = token.document.x + (size / 2) * token.document.width;
	const expectedMeshY = token.document.y + (size / 2) * token.document.height;
	const hadMeshOffset = token.mesh.x !== expectedMeshX || token.mesh.y !== expectedMeshY;

	applyVisualOffset(token, ZERO_OFFSET);

	if (hadOffset || hadBorderOffset || hadNameplateOffset || hadMeshOffset) {
		token.refresh();
	}
}

function getOffsetObjects(token: Token) {
	return [
		token.effects,
		token.bars,
		token.targetArrows,
		token.targetPips,
	].filter(Boolean);
}

function canRender(token: Token) {
	return !!token && !token.destroyed && !!token.document && !!token.scene?.dimensions && !!token.mesh;
}

function refreshHitArea(token: Token, offset: Offset) {
	const shiftedShape = getShiftedShape(token.shape, offset);
	if (shiftedShape) token.hitArea = shiftedShape;
}

function refreshBorder(token: Token, offset: Offset) {
	if (typeof token._refreshBorder !== 'function' || !isDrawableBorderShape(token.shape)) return;

	try {
		token._refreshBorder();
		if (token.border?.position?.set) token.border.position.set(offset.x, offset.y);
		else if (token.border) {
			token.border.x = offset.x;
			token.border.y = offset.y;
		}
	} catch {
		// Grid reconfiguration can leave token.shape in a transient non-drawable state.
	}
}

function isDrawableBorderShape(shape: any) {
	if (typeof shape === 'function') return true;
	if (!globalThis.PIXI) return false;

	return [
		globalThis.PIXI.Rectangle,
		globalThis.PIXI.RoundedRectangle,
		globalThis.PIXI.Circle,
		globalThis.PIXI.Ellipse,
		globalThis.PIXI.Polygon,
	].some((shapeClass) => shape instanceof shapeClass);
}

function getShiftedShape(shape: any, offset: Offset) {
	if (!globalThis.PIXI || !shape) return undefined;
	if (!offset.x && !offset.y) return shape;

	const pixi = globalThis.PIXI;
	if (shape instanceof pixi.Rectangle) {
		return new pixi.Rectangle(shape.x + offset.x, shape.y + offset.y, shape.width, shape.height);
	}
	if (shape instanceof pixi.RoundedRectangle) {
		return new pixi.RoundedRectangle(shape.x + offset.x, shape.y + offset.y, shape.width, shape.height, shape.radius);
	}
	if (shape instanceof pixi.Circle) {
		return new pixi.Circle(shape.x + offset.x, shape.y + offset.y, shape.radius);
	}
	if (shape instanceof pixi.Ellipse) {
		return new pixi.Ellipse(shape.x + offset.x, shape.y + offset.y, shape.width, shape.height);
	}
	if (shape instanceof pixi.Polygon) {
		const shiftedPoints = shape.points.map((value: number, index: number) =>
			value + (index % 2 === 0 ? offset.x : offset.y),
		);
		return new pixi.Polygon(shiftedPoints);
	}

	return undefined;
}
