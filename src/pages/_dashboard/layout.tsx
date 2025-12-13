import { Outlet } from "react-router-dom";
export default function DashboardLayout() {
	return (
		<>
			<div className="flex flex-1 flex-col gap-4 p-4 pt-0 h-full">
				<Outlet />
			</div>
		</>
	);
}
