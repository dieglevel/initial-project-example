import type { BaseRoute } from "@/shared/types/base-path";
import { Route } from "react-router-dom";
import DashboardRoutes from "./_dashboard/routes";
import { _prefix, ProtectedPaths } from "./paths";

const RouteMapper: BaseRoute<typeof ProtectedPaths> = {
  _prefix: _prefix,
  page: {
    dashboard: {
      path: ProtectedPaths.dashboard,
      component: <DashboardRoutes />,
      index: true,
    },
  },
};

export default function ProtectedRoutes() {
  return (
    <>
      <Route path={_prefix}>
        {Object.values(RouteMapper.page).map((page) => (
          <Route
            key={page.path}
            path={page.path}
            index={page.index}
            element={page.component}
          />
        ))}
      </Route>
    </>
  );
}
