import { Outlet, Route } from "react-router-dom";
import { AuthPaths } from "./path";
import LoginPage from "./_login/page";

export default function AuthRoutes() {
	return (
		<>
			<Route path={AuthPaths._prefix} element={<Outlet></Outlet>}>
				<Route index path={AuthPaths.login} element={<LoginPage />} />
			</Route>
		</>
	);
}
