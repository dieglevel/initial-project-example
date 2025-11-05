import { AuthPaths } from "./_auth/path";
import { DashboardPaths } from "./_dashboard/path";

export const AppPaths = {
	auth: AuthPaths,
	dashboard: DashboardPaths,
} as const;
