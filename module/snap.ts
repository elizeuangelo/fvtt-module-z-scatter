import { snapTokens } from './control.js';

const offset = 0.5;

function checkTokenGridPosition(token: TokenDocument, height: number, width: number, size: number) {
	const x = ~~(height / token.height / size + 0.5);
	const y = ~~(width / token.width / size + 0.5);
	return { x, y };
}

function snapToken(token: TokenDocument, diff: Partial<TokenDocument>, options: any, userId: string) {
	if (game.users!.filter((u) => u.isGM && u.active)[0] !== game.user) return;
	if (!snapTokens) return;
	if (!('x' in diff) && !('y' in diff)) return;

	const scene = token.parent!;
	const dimensions = scene.dimensions as Canvas.Dimensions;
	const height = dimensions.height + dimensions.sceneY * 2;
	const width = dimensions.width + dimensions.sceneX * 2;

	const tokenPos = checkTokenGridPosition(token, height, width, dimensions.size);

	const updatePos = scene.tokens.contents.filter((t) => {
		if (t.height !== token.height || t.width !== token.width) return false;
		const pos = checkTokenGridPosition(t, height, width, dimensions.size);
		return tokenPos.x === pos.x && tokenPos.y === pos.y;
	});

	for (const t of updatePos) {
	}
}

Hooks.on('updateToken', snapToken);
