import { Route } from "react-router-dom";
import { DashboardPaths } from "./path";
import DashboardLayout from "./layout";
import NotFoundPage from "@/shared/global-page/401-not-found";
import DashboardHomePage from "./_home/page";

export default function DashboardRoutes() {
	return (
		<>
			<Route path={DashboardPaths._prefix} element={<DashboardLayout />}>
				<Route path={DashboardPaths.home} element={<DashboardHomePage />} />
				<Route
					path="*"
					element={
						<>
							<NotFoundPage />
						</>
					}
				/>
			</Route>
		</>
	);
}
