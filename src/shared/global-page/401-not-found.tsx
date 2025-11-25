import { Link } from "react-router-dom";
import { Card } from "../components/ui/card";

export default function NotFoundPage() {
	return (
		<Card className="flex flex-col items-center justify-center w-full h-full ">
			<h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
			<p className="text-2xl text-gray-600 mb-8">Page Not Found</p>
			<Link to={"/"} className="text-blue-500 hover:underline">
				Go back to Home
			</Link>
		</Card>
	);
}
