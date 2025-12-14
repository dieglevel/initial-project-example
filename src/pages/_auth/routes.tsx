import { Outlet, Route } from "react-router-dom";
import LoginPage from "./_login/page";
import type { BaseRoute } from "@/shared/types/base-path";

const _prefix = "";

export const AuthPath = {
	login: `${_prefix}/login`,
	forgotPassword: `${_prefix}/forgot-password`,
};

const RouteMapper: BaseRoute<typeof AuthPath> = {
	_prefix,
	page: {
		login: {
			path: AuthPath.login,
			component: <LoginPage />,
			index: true,
		},
		forgotPassword: {
			component: <div>Forgot Password Page</div>,
			path: AuthPath.forgotPassword,
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
