import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { App, ConfigProvider } from "antd";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import Main from "./pages/App.tsx";
import { ConfigAntd } from "./shared/common/antd-config-provider.constant.ts";
import { queryClient } from "./shared/lib/query-client.ts";
import { AuthProvider } from "./shared/providers/auth/auth.tsx";

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
