import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { App, ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import Main from "./pages/App.tsx";
import { AuthProvider } from "./shared/auth/auth.provider.tsx";
import { ConfigAntd } from "./shared/common/antd-config-provider.constant.ts";
import { queryClient } from "./shared/lib/query-client.ts";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider {...ConfigAntd} locale={viVN}>
      <App>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <ReactQueryDevtools initialIsOpen={false} />
              <Main />
            </AuthProvider>
          </QueryClientProvider>
        </BrowserRouter>
      </App>
    </ConfigProvider>
  </StrictMode>,
);
