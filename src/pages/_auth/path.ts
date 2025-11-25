const _prefix = "";

export const AuthPaths = {
	_prefix,
	login: `${_prefix}/login`,
	forgotPassword: `${_prefix}/forgot-password`,
	register: `${_prefix}/register`,
} as const;
