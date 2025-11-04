import { Toaster } from "@/components/ui/sonner";
import { Route, Routes, useLocation } from "react-router-dom";
import "../css/App.css";
import { AnimatePresence, motion } from "framer-motion";
import Home from "./home";
import About from "./about";
import PageTransition from "@/components/motion/page-transition";
import Navbar from "@/components/Navbar";

// import { AuthDebug } from "../components/AuthDebug"; // Uncomment for debugging

function App() {
	const location = useLocation();

	return (
		<AnimatePresence mode="wait">
			<motion.div>
				<Routes location={location} key={location.pathname}>
					<Route path="/" element={<Navbar />}>
						<Route
							path="/"
							element={
								<PageTransition>
									<Home />
								</PageTransition>
							}
						/>
						<Route
							path="/about"
							element={
								<PageTransition>
									<About />
								</PageTransition>
							}
						/>
					</Route>
				</Routes>
				<Toaster richColors theme="light" />
			</motion.div>
		</AnimatePresence>
	);
}

export default App;
