import { Navigate, Route, Routes } from "react-router-dom";
import "../css/App.css";
import AuthRoutes from "./_auth/routes";
import DashboardRoutes from "./_dashboard/routes";
import { ProtectedRoute, PublicRoute } from "@/shared/providers/auth.provider";
import NotFoundPage from "@/shared/global-page/401-not-found";
import { AppPaths } from "./appPaths";

function App() {
	return (
		<Routes>
			<Route path="/" element={<PublicRoute />}>
				{AuthRoutes()}
			</Route>
			<Route path="/" element={<ProtectedRoute />}>
				{DashboardRoutes()}
			</Route>

			{/* Global Pages */}
			<Route path="*" element={<NotFoundPage />} />
			<Route
				index
				element={<Navigate to={AppPaths.dashboard.todo} replace />}
			/>
		</Routes>
	);
}

export default App;
