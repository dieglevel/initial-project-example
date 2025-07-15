import { Route, Routes } from "react-router-dom";
import { About } from "./app/about/page";
import { Layout } from "./app/layout";
import Home from "./app/page";

function App() {
	return (
		<Routes>
			<Route path="/" element={<Layout />}>
				<Route index element={<Home />} />
				<Route path="about" element={<About />} />
			</Route>
		</Routes>
	);
}

export default App;
