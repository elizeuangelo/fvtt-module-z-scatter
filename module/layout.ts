import { getTokenRect, rectsOverlap } from './geometry.js';
import type { Offset, Rect, TokenDocument } from './types.js';

const MAX_ITERATIONS = 8;
const PADDING = 2;
const BASE_ROTATION = Math.PI / 4;

export function calculateOffsets(group: TokenDocument[], gridSize: number, scatter: number) {
	const offsets = new Map<TokenDocument, Offset>();
	if (group.length < 2) return offsets;

	const bounds = getBounds(group.map((token) => getTokenRect(token, gridSize)));
	const groupCenter = centerOf(bounds);
	const angleStep = (Math.PI * 2) / group.length;

	for (let i = 0; i < group.length; i++) {
		const token = group[i];
		const rect = getTokenRect(token, gridSize);
		const center = centerOf(rect);
		let direction = normalize({
			x: center.x - groupCenter.x,
			y: center.y - groupCenter.y,
		});

		if (!direction.x && !direction.y) {
			direction = {
				x: Math.sin(angleStep * i + BASE_ROTATION),
				y: Math.cos(angleStep * i + BASE_ROTATION),
			};
		}

		offsets.set(token, {
			x: direction.x * scatter * Math.max(token.width, 0.5) * gridSize,
			y: direction.y * scatter * Math.max(token.height, 0.5) * gridSize,
		});
	}

	for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
		let changed = false;

		for (let i = 0; i < group.length; i++) {
			for (let j = i + 1; j < group.length; j++) {
				const a = group[i];
				const b = group[j];
				const aRect = shiftedRect(getTokenRect(a, gridSize), offsets.get(a)!);
				const bRect = shiftedRect(getTokenRect(b, gridSize), offsets.get(b)!);
				if (!rectsOverlap(aRect, bRect)) continue;

				const push = getSeparation(aRect, bRect, i, j);
				const aWeight = tokenArea(b) / (tokenArea(a) + tokenArea(b));
				const bWeight = tokenArea(a) / (tokenArea(a) + tokenArea(b));
				const aOffset = offsets.get(a)!;
				const bOffset = offsets.get(b)!;

				aOffset.x -= push.x * aWeight;
				aOffset.y -= push.y * aWeight;
				bOffset.x += push.x * bWeight;
				bOffset.y += push.y * bWeight;

				offsets.set(a, clampOffset(a, aOffset, gridSize, scatter));
				offsets.set(b, clampOffset(b, bOffset, gridSize, scatter));
				changed = true;
			}
		}

		if (!changed) break;
	}

	return offsets;
}

function shiftedRect(rect: Rect, offset: Offset): Rect {
	return {
		x: rect.x + offset.x,
		y: rect.y + offset.y,
		width: rect.width,
		height: rect.height,
	};
}

function getSeparation(a: Rect, b: Rect, i: number, j: number): Offset {
	const aCenter = centerOf(a);
	const bCenter = centerOf(b);
	const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
	const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);

	if (overlapX < overlapY) {
		const direction = bCenter.x === aCenter.x ? (j > i ? 1 : -1) : Math.sign(bCenter.x - aCenter.x);
		return { x: direction * (overlapX + PADDING), y: 0 };
	}

	const direction = bCenter.y === aCenter.y ? (j > i ? 1 : -1) : Math.sign(bCenter.y - aCenter.y);
	return { x: 0, y: direction * (overlapY + PADDING) };
}

function clampOffset(token: TokenDocument, offset: Offset, gridSize: number, scatter: number) {
	const max = gridSize * scatter * Math.max(1, Math.sqrt(token.width * token.height)) * 1.5;
	const length = Math.hypot(offset.x, offset.y);
	if (length <= max || !length) return offset;

	return {
		x: (offset.x / length) * max,
		y: (offset.y / length) * max,
	};
}

function getBounds(rects: Rect[]): Rect {
	const minX = Math.min(...rects.map((rect) => rect.x));
	const minY = Math.min(...rects.map((rect) => rect.y));
	const maxX = Math.max(...rects.map((rect) => rect.x + rect.width));
	const maxY = Math.max(...rects.map((rect) => rect.y + rect.height));

	return {
		x: minX,
		y: minY,
		width: maxX - minX,
		height: maxY - minY,
	};
}

function centerOf(rect: Rect) {
	return {
		x: rect.x + rect.width / 2,
		y: rect.y + rect.height / 2,
	};
}

function normalize(offset: Offset) {
	const length = Math.hypot(offset.x, offset.y);
	if (!length) return { x: 0, y: 0 };

	return {
		x: offset.x / length,
		y: offset.y / length,
	};
}

function tokenArea(token: TokenDocument) {
	return Math.max(token.width * token.height, 0.25);
}
