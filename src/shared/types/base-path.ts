export interface BaseRoute<T> {
	_prefix: string;
	page: {
		[key in keyof T]: {
			path: string;
			component: React.ReactNode;
			index?: boolean;
		};
	};
}
