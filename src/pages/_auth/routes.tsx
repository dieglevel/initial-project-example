import { Outlet, Route } from "react-router-dom";
import LoginPage from "./_login/page";
import { AuthPaths } from "./path";

export default function AuthRoutes() {
	return (
		<>
			<Route path={AuthPaths._prefix} element={<Outlet></Outlet>}>
				<Route index path={AuthPaths.login} element={<LoginPage />} />
			</Route>
		</>
	);
}
