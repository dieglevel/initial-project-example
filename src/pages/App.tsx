import { Routes } from "react-router-dom";
import "../css/App.css";
import AuthRoutes from "./_auth/routes";
import DashboardRoutes from "./_dashboard/routes";

function App() {
	return (
		<Routes>
			{AuthRoutes()}
			{DashboardRoutes()}
		</Routes>
	);
}

export default App;
