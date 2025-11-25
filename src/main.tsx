import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./pages/App.tsx";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./shared/lib/query-client.ts";
import { BrowserRouter } from "react-router-dom";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import { SidebarProvider } from "./shared/components/ui/sidebar.tsx";
import { AuthProvider } from "./shared/providers/auth.tsx";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<BrowserRouter>
			<QueryClientProvider client={queryClient}>
				<AuthProvider>
					<SidebarProvider>
						<ReactQueryDevtools initialIsOpen={false} />
						<App />
						<Toaster richColors theme="light" position="top-center" />
					</SidebarProvider>
				</AuthProvider>
			</QueryClientProvider>
		</BrowserRouter>
	</StrictMode>,
);
