const _App = "";

// export interface StorageKeysType {
// 	ACCESS_TOKEN: string;
// 	REFRESH_TOKEN: string;
// 	PROFILE_DATA: string;
// 	USER_TYPE: string;
// }

export const STORAGE_KEYS = {
	ACCESS_TOKEN: `${_App}access_token`,
	REFRESH_TOKEN: `${_App}refresh_token`,
	PROFILE_DATA: `${_App}profile_data`,
	USER_TYPE: `${_App}user_type`,
} as const;

export type StorageKeysType = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
