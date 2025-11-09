import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/shared/components/ui/card";
import LoginForm from "./components/LoginForm";
import { Link } from "react-router-dom";
import { AppPaths } from "@/pages/appPaths";

export default function LoginPage() {
	return (
		<div className="flex h-screen w-full items-center justify-center">
			<Card className="w-[400px]">
				<CardHeader className="font-bold">Login</CardHeader>
				<CardContent>
					<LoginForm />
				</CardContent>
				<CardFooter>
					{/* Register or Forgot Password link */}
					<div className="w-full text-center">
						<Link
							to={AppPaths.auth.forgotPassword}
							className="text-sm text-blue-500 hover:underline"
						>
							Quên mật khẩu?
						</Link>
					</div>
					<div className="w-full text-center">
						<Link
							to={AppPaths.auth.register}
							className="text-sm text-blue-500 hover:underline"
						>
							Đăng ký
						</Link>
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}
