import { AuthPaths } from "./_auth/paths";
import { DashboardPaths } from "./_dashboard/paths";

export const AppPaths = {
  auth: AuthPaths,
  dashboard: DashboardPaths,
} as const;
