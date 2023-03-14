function setOrder(token: Token) {
	token.document.sort = +token.controlled - (token.document.width + token.document.height);
}

Hooks.on('refreshToken', setOrder);
