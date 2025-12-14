import { Route } from "react-router-dom";
import DashboardLayout from "./layout";
import NotFoundPage from "@/shared/global-page/401-not-found";
import DashboardHomePage from "./_home/page";
import type { BaseRoute } from "@/shared/types/base-path";
import { _prefix, DashboardPaths } from "./paths";

const RouteMapper: BaseRoute<typeof DashboardPaths> = {
	_prefix: _prefix,
	page: {
		dashboard: {
			path: DashboardPaths.dashboard,
			component: <DashboardHomePage />,
			index: true,
		},
		home: {
			component: <DashboardHomePage />,
			path: DashboardPaths.home,
		},
	},
};

export default function DashboardRoutes() {
	return (
		<>
			<Route path={_prefix} element={<DashboardLayout />}>
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
