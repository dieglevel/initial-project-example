import { Toaster } from "@/components/ui/sonner";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "../css/App.css";
import Page from "./page";

// import { AuthDebug } from "../components/AuthDebug"; // Uncomment for debugging

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="*" element={<Page />} />
			</Routes>
			<Toaster richColors theme="light" />
		</BrowserRouter>
	);
}

export default App;
