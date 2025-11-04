import { Link, Outlet } from "react-router-dom";

export default function Navbar() {
	return (
		<div className="">
			<div className="relative top-0 left-0 w-screen border-b border-white/10">
				<div className="fixed right-1/2 left-1/2 top-4 transform -translate-x-1/2 flex justify-center items-center text-white font-bold gap-10">
					<Link to="/">Home</Link>
					<Link to="/about">About</Link>
					<Link to="/projects">Project</Link>
					<Link to="/contact">Contact</Link>
				</div>
				<Outlet />
			</div>
		</div>
	);
}
