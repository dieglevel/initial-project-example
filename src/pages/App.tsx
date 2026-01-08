import NotFoundPage from "@/shared/global-page/401-not-found";

import "@/shared/css/App.css";
import { PublicRoute } from "@/shared/routes/public.route";
import { Route, Routes } from "react-router-dom";
import PublicRoutes from "./public/routes";

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute />}>
        {PublicRoutes()}
      </Route>
      {/* <Route path="/" element={<ProtectedRoute />}>
        {ProtectedRoutes()}
      </Route> */}

      {/* Global Pages */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
