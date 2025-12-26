import NotFoundPage from "@/shared/global-page/401-not-found";

import { ProtectedRoute } from "@/shared/routes/protected.route";
import { PublicRoute } from "@/shared/routes/public.route";
import "@shared/css/App.css";
import { Route, Routes } from "react-router-dom";
import AuthRoutes from "./_auth/routes";
import DashboardRoutes from "./_dashboard/routes";

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute />}>
        {AuthRoutes()}
      </Route>
      <Route path="/" element={<ProtectedRoute />}>
        {DashboardRoutes()}
      </Route>

      {/* Global Pages */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
