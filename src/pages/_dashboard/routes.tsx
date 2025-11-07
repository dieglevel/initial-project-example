import { Route } from "react-router-dom";
import { DashboardPaths } from "./path";
import DashboardLayout from "./layout";
import ToDoPage from "./_toDo/page";
import ToDoAntdPage from "./_toDoAntd/page";
import PaymentPage from "./_payment/page";

export default function DashboardRoutes() {
	return (
		<>
			<Route path={DashboardPaths._prefix} element={<DashboardLayout />}>
				<Route path={DashboardPaths.todo} element={<ToDoPage />} />
				<Route path={DashboardPaths.todoAntd} element={<ToDoAntdPage />} />
				<Route path={DashboardPaths.payment} element={<PaymentPage />} />
			</Route>
		</>
	);
}
