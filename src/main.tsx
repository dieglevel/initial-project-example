import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./pages/App.tsx";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/query-client.ts";
import { BrowserRouter } from "react-router-dom";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import { SidebarProvider } from "./components/ui/sidebar.tsx";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<SidebarProvider>
				<ReactQueryDevtools initialIsOpen={false} />
				<BrowserRouter>
					<App />
					<Toaster richColors theme="light" />
				</BrowserRouter>
			</SidebarProvider>
		</QueryClientProvider>
	</StrictMode>,
);
