import type { BaseRoute } from "@/shared/types/base-path";
import { Route } from "react-router-dom";
import LoginPage from "./_auth/_login/page";
import DemoPage from "./_demo/page";
import { _prefix, PublicPaths } from "./paths";

const RouteMapper: BaseRoute<typeof PublicPaths> = {
  _prefix: _prefix,
  page: {
    auth: {
      path: PublicPaths.auth,
      component: <LoginPage />,
      index: true,
    },
    demo: {
      path: PublicPaths.demo,
      component: <DemoPage />,
    },
  },
};

export default function PublicRoutes() {
  return (
    <>
      <Route path={RouteMapper._prefix}>
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
