import { useAuth } from "@/shared/hooks/use-auth";
import { Button } from "antd";

export default function DashboardHomePage() {
	const { logout } = useAuth();

	return (
		<>
			<Button onClick={logout}>Đăng xuất</Button>
		</>
	);
}
