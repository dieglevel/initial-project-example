const _App = "app_";

export const STORAGE_KEYS = {
	ACCESS_TOKEN: `${_App}access_token`,
	REFRESH_TOKEN: `${_App}refresh_token`,
	USER_DATA: `${_App}user_data`,
	USER_TYPE: `${_App}user_type`,
} as const;
