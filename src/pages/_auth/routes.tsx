import type { BaseRoute } from "@/shared/types/base-path";
import { Outlet, Route } from "react-router-dom";
import LoginPage from "./_login/page";
import { _prefix, AuthPaths } from "./paths";

const RouteMapper: BaseRoute<typeof AuthPaths> = {
  _prefix: _prefix,
  page: {
    login: {
      path: AuthPaths.login,
      component: <LoginPage />,
      index: true,
    },
    forgotPassword: {
      component: <div>Forgot Password Page</div>,
      path: AuthPaths.forgotPassword,
    },
  },
};

export default function AuthRoutes() {
  return (
    <>
      <Route path={RouteMapper._prefix} element={<Outlet></Outlet>}>
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
