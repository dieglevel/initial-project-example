import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./pages/App.tsx";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./shared/lib/query-client.ts";
import { BrowserRouter } from "react-router-dom";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import { SidebarProvider } from "./shared/components/ui/sidebar.tsx";
import { AuthProvider } from "./shared/providers/auth.provider.tsx";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<SidebarProvider>
				<ReactQueryDevtools initialIsOpen={false} />
				<BrowserRouter>
					<AuthProvider>
						<App />
					</AuthProvider>
					<Toaster richColors theme="light" />
				</BrowserRouter>
			</SidebarProvider>
		</QueryClientProvider>
	</StrictMode>,
);
