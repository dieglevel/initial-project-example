import { Navigate, Route, Routes } from "react-router-dom";
import "../css/App.css";
import AuthRoutes from "./_auth/routes";
import DashboardRoutes from "./_dashboard/routes";
import { ProtectedRoute, PublicRoute } from "@/providers/AuthProvider";
import NotFoundPage from "@/globalPage/NotFound";
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
