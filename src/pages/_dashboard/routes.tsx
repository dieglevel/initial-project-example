import { Route } from "react-router-dom";
import { DashboardPaths } from "./path";
import DashboardLayout from "./layout";
import ToDoPage from "./_toDo/page";

export default function DashboardRoutes() {
	return (
		<>
			<Route path={DashboardPaths._prefix} element={<DashboardLayout />}>
				<Route index path={DashboardPaths.todo} element={<ToDoPage />} />
			</Route>
		</>
	);
}
