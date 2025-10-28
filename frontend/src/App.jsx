import React, { useLayoutEffect, useState, Suspense, lazy } from "react";
import {
  Routes,
  Route,
  Navigate,
  Router,
  unstable_HistoryRouter as HistoryRouter,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider, useAuth } from "./components/AuthContext"; // AuthProvider'ı import et
import { SettingsProvider } from "./hooks/SettingsContext";
import { PendingCountProvider } from "./contexts/PendingCountContext";
import { history } from "./history";
import Loader from "./components/Loader"; // Suspense için Loader
import Layout from "./components/Layout";
import PrivateRoute from "./components/PrivateRoute";

// Sayfaları lazy-loading için import et
const LoginPage = React.lazy(() => import("./pages/LoginPage"));
const DashboardPage = React.lazy(() => import("./pages/DashboardPage"));
const AdminPanelPage = React.lazy(() => import("./pages/AdminPanelPage"));
const ProfilePage = React.lazy(() => import("./pages/ProfilePage"));
const AssignmentsPage = lazy(() => import("./pages/AssignmentsPage"));
const AssignmentEditPage = lazy(() => import("./pages/AssignmentEditPage"));
const ItemsPage = lazy(() => import("./pages/ItemsPage"));
const LocationsPage = lazy(() => import("./pages/LocationsPage"));
const AuditLogPage = lazy(() => import("./pages/AuditLogPage"));
const PersonnelReportPage = lazy(() => import("./pages/PersonnelReportPage"));
const PendingAssignmentsPage = lazy(() =>
  import("./pages/PendingAssignmentsPage")
);
const PersonnelDetailsPage = lazy(() => import("./pages/PersonnelDetailsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ItemReportPage = React.lazy(() => import("./pages/ItemReportPage"));
const SearchResultsPage = lazy(() => import("./pages/SearchResultsPage"));

// Kök dizine gelen istekleri yönlendiren bileşen
const RootRedirect = () => {
  const { userInfo } = useAuth();
  // Kullanıcı giriş yapmışsa /dashboard'a, yapmamışsa /login'e yönlendir.
  return userInfo ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Navigate to="/login" replace />
  );
};

function App() {
  const [state, setState] = useState({
    action: history.action,
    location: history.location,
  });

  useLayoutEffect(() => history.listen(setState), []);

  return (
    <>
      <HistoryRouter history={history}>
        <AuthProvider>
          <PendingCountProvider>
            <SettingsProvider>
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar
              />
              <Suspense fallback={<Loader />}>
                <Routes>
                  <Route path="/" element={<RootRedirect />} />
                  <Route path="/login" element={<LoginPage />} />

                  {/* Layout ve PrivateRoute ile korunan yollar */}
                  <Route
                    path="/"
                    element={
                      <PrivateRoute>
                        <Layout />
                      </PrivateRoute>
                    }
                  >
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route
                      path="admin"
                      element={
                        <PrivateRoute requiredPermission="admin">
                          <AdminPanelPage />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="audit-logs"
                      element={
                        <PrivateRoute requiredPermission="audit-logs">
                          <AuditLogPage />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="assignments"
                      element={
                        <PrivateRoute requiredPermission="zimmetler">
                          <AssignmentsPage />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="items"
                      element={
                        <PrivateRoute requiredPermission="items">
                          <ItemsPage />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="locations"
                      element={
                        <PrivateRoute requiredPermission="locations">
                          <LocationsPage />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="personnel-report"
                      element={
                        <PrivateRoute requiredPermission="personnel-report">
                          <PersonnelReportPage />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="item-report"
                      element={
                        <PrivateRoute requiredPermission="item-report">
                          <ItemReportPage />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="pending-assignments"
                      element={<PendingAssignmentsPage />}
                    />
                    <Route
                      path="personnel/:personnelId/details"
                      element={<PersonnelDetailsPage />}
                    />
                    <Route
                      path="assignment/:id/edit"
                      element={<AssignmentEditPage />}
                    />
                    <Route path="search" element={<SearchResultsPage />} />
                  </Route>
                  <Route path="*" element={<h1>404 - Sayfa Bulunamadı</h1>} />
                </Routes>
              </Suspense>
            </SettingsProvider>
          </PendingCountProvider>
        </AuthProvider>
      </HistoryRouter>
    </>
  );
}

export default App;
