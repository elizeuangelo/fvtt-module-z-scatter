export interface AnimationContext {
	duration: number;
	name: string;
	onAnimate: Function[];
	postAnimate: Function[];
	preAnimate: Function[];
	promise: Promise<void>;
	time: number;
	to?: { y?: number; x?: number };
}

export interface TokenDocument {
	id?: string;
	name?: string;
	height: number;
	width: number;
	x: number;
	y: number;
	elevation?: number;
	shape?: number;
	getSnappedPosition?(data?: Partial<Pick<TokenDocument, 'x' | 'y' | 'width' | 'height' | 'elevation' | 'shape'>>): {
		x: number;
		y: number;
		elevation?: number;
	};
	hasStatusEffect(id: string): boolean;
	object?: Token;
}

export interface Token {
	id?: string;
	x: number;
	y: number;
	w: number;
	h: number;
	document: TokenDocument;
	scene: any;
	mesh: any;
	destroyed: boolean;
	visible?: boolean;
	effects: any;
	nameplate: any;
	tooltip: any;
	bars: any;
	target: any;
	border: any;
	hitArea: any;
	targetArrows: any;
	targetPips: any;
	shape: any;
	animationContexts: Map<string, AnimationContext>;
	refresh: () => void;
	_refreshBorder: () => void;
}

export interface RefreshTokenOptions {
	refreshPosition?: boolean;
}

export interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface Offset {
	x: number;
	y: number;
}
