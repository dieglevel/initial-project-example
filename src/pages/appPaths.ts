import { AuthPath } from "./_auth/routes";
import { DashboardPaths } from "./_dashboard/routes";

export const AppPaths = {
	auth: AuthPath,
	dashboard: DashboardPaths,
} as const;
