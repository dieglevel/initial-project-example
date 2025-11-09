import { Route } from "react-router-dom";
import { DashboardPaths } from "./path";
import DashboardLayout from "./layout";
import ToDoPage from "./_toDo/page";
import ToDoAntdPage from "./_toDoAntd/page";
import PaymentPage from "./_payment/page";
import NotFoundPage from "@/shared/global-page/401-not-found";
import { Card } from "@/shared/components/ui/card";

export default function DashboardRoutes() {
	return (
		<>
			<Route path={DashboardPaths._prefix} element={<DashboardLayout />}>
				<Route path={DashboardPaths.todo} element={<ToDoPage />} />
				<Route path={DashboardPaths.todoAntd} element={<ToDoAntdPage />} />
				<Route path={DashboardPaths.payment} element={<PaymentPage />} />
				<Route
					path="*"
					element={
						<>
							<Card className="w-full h-full">
								<NotFoundPage />
							</Card>
						</>
					}
				/>
			</Route>
		</>
	);
}
