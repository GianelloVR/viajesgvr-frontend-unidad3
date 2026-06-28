import { Routes, Route, Navigate } from "react-router-dom";
import { useKeycloak } from "@react-keycloak/web";

import Navbar from "./components/Navbar";
import PackagesPage from "./pages/PackagesPage";
import PackageDetailPage from "./pages/PackageDetailPage";
import LoginPage from "./pages/LoginPage";
import MyReservationsPage from "./pages/MyReservationsPage";
import ProfilePage from "./pages/ProfilePage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminPackagesPage from "./pages/AdminPackagesPage";
import AdminEditPackagePage from "./pages/AdminEditPackagePage";
import AdminReservationsPage from "./pages/AdminReservationsPage";
import AdminPaymentsPage from "./pages/AdminPaymentsPage";
import AdminCreatePackagePage from "./pages/AdminCreatePackagePage";
import AdminSalesReportPage from "./pages/AdminSalesReportPage";
import AdminRankingReportPage from "./pages/AdminRankingReportPage";
import CartPage from "./pages/CartPage";

function App() {
  const { keycloak, initialized } = useKeycloak();

  if (!initialized) {
    return (
      <>
        <Navbar />
        <div style={{ color: "white", textAlign: "center", marginTop: "40px" }}>
          Cargando autenticación...
        </div>
      </>
    );
  }

  const roles = keycloak.tokenParsed?.realm_access?.roles || [];

  const isAuthenticated = keycloak.authenticated;
  const isAdmin = isAuthenticated && roles.includes("ADMIN");

  const AuthRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/" replace />;
  };

  const AdminRoute = ({ children }) => {
    return isAdmin ? children : <Navigate to="/" replace />;
  };

  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<PackagesPage />} />
        <Route path="/packages/:id" element={<PackageDetailPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/profile"
          element={
            <AuthRoute>
              <ProfilePage />
            </AuthRoute>
          }
        />

        <Route
          path="/my-reservations"
          element={
            <AuthRoute>
              <MyReservationsPage />
            </AuthRoute>
          }
        />

        <Route
          path="/cart"
          element={
            <AuthRoute>
              <CartPage />
            </AuthRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsersPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/packages"
          element={
            <AdminRoute>
              <AdminPackagesPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/packages/create"
          element={
            <AdminRoute>
              <AdminCreatePackagePage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/packages/:id/edit"
          element={
            <AdminRoute>
              <AdminEditPackagePage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/reservations"
          element={
            <AdminRoute>
              <AdminReservationsPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/payments"
          element={
            <AdminRoute>
              <AdminPaymentsPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/reports/sales"
          element={
            <AdminRoute>
              <AdminSalesReportPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/reports/ranking"
          element={
            <AdminRoute>
              <AdminRankingReportPage />
            </AdminRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;