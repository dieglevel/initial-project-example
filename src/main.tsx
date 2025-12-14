import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Main from "./pages/App.tsx";
import { App } from "antd";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./shared/lib/query-client.ts";
import { BrowserRouter } from "react-router-dom";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider } from "./shared/providers/auth/auth.tsx";
import { ConfigProvider } from "antd";
import { ConfigAntd } from "./shared/common/antd-config-provider.constant.ts";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<BrowserRouter>
			<ConfigProvider {...ConfigAntd}>
				<App>
					<QueryClientProvider client={queryClient}>
						<AuthProvider>
							<ReactQueryDevtools initialIsOpen={false} />
							<Main />
						</AuthProvider>
					</QueryClientProvider>
				</App>
			</ConfigProvider>
		</BrowserRouter>
	</StrictMode>,
);
