import SidebarLayout from "@/shared/components/layout/main-layout";
import { Outlet } from "react-router-dom";
export default function DashboardLayout() {
	return (
		<>
			<SidebarLayout>
				<Outlet />
			</SidebarLayout>
		</>
	);
}
