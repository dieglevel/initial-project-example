import { Route } from "react-router-dom";
import { DashboardPaths } from "./path";
import DashboardLayout from "./layout";
import ToDoPage from "./_toDo/page";
import NotFoundPage from "@/shared/global-page/401-not-found";
import { Card } from "@/shared/components/ui/card";

export default function DashboardRoutes() {
	return (
		<>
			<Route path={DashboardPaths._prefix} element={<DashboardLayout />}>
				<Route path={DashboardPaths.todo} element={<ToDoPage />} />
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
