import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./components/AuthContext";

// Ana Bileşenler
import Loader from "./components/Loader";
import Layout from "./components/Layout";
import PrivateRoute from "./components/PrivateRoute";

// İskelet Arayüzleri
const AssignmentsPageSkeleton = lazy(() =>
  import("./components/skeletons/AssignmentsPageSkeleton")
);

// Sayfalar (Lazy-loading)
const LoginPage = lazy(() => import("./pages/LoginPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const AdminPanelPage = lazy(() => import("./pages/AdminPanelPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const AssignmentsPage = lazy(() => import("./pages/AssignmentsPage"));
const AssignmentEditPage = lazy(() => import("./pages/AssignmentEditPage"));
const ItemsPage = lazy(() => import("./components/items/ItemsPage"));
const LocationsPage = lazy(() => import("./pages/LocationsPage"));
const AuditLogPage = lazy(() => import("./pages/AuditLogPage"));
const PersonnelReportPage = lazy(() => import("./pages/PersonnelReportPage"));
const PendingAssignmentsPage = lazy(() =>
  import("./pages/PendingAssignmentsPage")
);
const PersonnelDetailsPage = lazy(() => import("./pages/PersonnelDetailsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ItemReportPage = lazy(() => import("./pages/ItemReportPage"));
const SearchResultsPage = lazy(() => import("./pages/SearchResultsPage"));

// Kök dizine gelen istekleri yönlendiren bileşen
const RootRedirect = () => {
  const { userInfo } = useAuth();
  return userInfo ? (
    <Navigate to={`/${window.location.href.split("/")[3]}`} replace />
  ) : (
    <Navigate to="/login" replace />
  );
};

const AppRoutes = () => {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center">
          <Loader />
        </div>
      }
    >
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RootRedirect />} />

        {/* Layout ve PrivateRoute ile korunan yollar */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route
            path="dashboard"
            element={
              <Suspense
                fallback={
                  <div className="p-8">
                    <Loader />
                  </div>
                }
              >
                <DashboardPage />
              </Suspense>
            }
          />
          <Route
            path="profile"
            element={
              <Suspense
                fallback={
                  <div className="p-8">
                    <Loader />
                  </div>
                }
              >
                <ProfilePage />
              </Suspense>
            }
          />
          <Route
            path="settings"
            element={
              <Suspense
                fallback={
                  <div className="p-8">
                    <Loader />
                  </div>
                }
              >
                <SettingsPage />
              </Suspense>
            }
          />
          <Route
            path="admin"
            element={
              <Suspense
                fallback={
                  <div className="p-8">
                    <Loader />
                  </div>
                }
              >
                <PrivateRoute requiredPermission="admin">
                  <AdminPanelPage />
                </PrivateRoute>
              </Suspense>
            }
          />
          <Route
            path="audit-logs"
            element={
              <Suspense
                fallback={
                  <div className="p-8">
                    <Loader />
                  </div>
                }
              >
                <PrivateRoute requiredPermission="audit-logs">
                  <AuditLogPage />
                </PrivateRoute>
              </Suspense>
            }
          />
          {/* AssignmentsPage için özel iskelet arayüzü */}
          <Route
            exact
            path="assignments"
            element={
              <PrivateRoute requiredPermission="zimmetler">
                <Suspense fallback={<AssignmentsPageSkeleton />}>
                  <AssignmentsPage />
                </Suspense>
              </PrivateRoute>
            }
          />
          <Route
            path="items"
            element={
              <Suspense
                fallback={
                  <div className="p-8">
                    <Loader />
                  </div>
                }
              >
                <PrivateRoute requiredPermission="items">
                  <ItemsPage />
                </PrivateRoute>
              </Suspense>
            }
          />
          <Route
            path="locations"
            element={
              <Suspense
                fallback={
                  <div className="p-8">
                    <Loader />
                  </div>
                }
              >
                <PrivateRoute requiredPermission="locations">
                  <LocationsPage />
                </PrivateRoute>
              </Suspense>
            }
          />
          <Route
            path="personnel-report"
            element={
              <Suspense
                fallback={
                  <div className="p-8">
                    <Loader />
                  </div>
                }
              >
                <PrivateRoute requiredPermission="personnel-report">
                  <PersonnelReportPage />
                </PrivateRoute>
              </Suspense>
            }
          />
          <Route
            path="item-report"
            element={
              <Suspense
                fallback={
                  <div className="p-8">
                    <Loader />
                  </div>
                }
              >
                <PrivateRoute requiredPermission="item-report">
                  <ItemReportPage />
                </PrivateRoute>
              </Suspense>
            }
          />
          <Route
            path="pending-assignments"
            element={
              <Suspense
                fallback={
                  <div className="p-8">
                    <Loader />
                  </div>
                }
              >
                <PendingAssignmentsPage />
              </Suspense>
            }
          />
          <Route
            path="personnel/:personnelId/details"
            element={
              <Suspense
                fallback={
                  <div className="p-8">
                    <Loader />
                  </div>
                }
              >
                <PersonnelDetailsPage />
              </Suspense>
            }
          />
          <Route
            path="assignment/:id/edit"
            element={
              <Suspense
                fallback={
                  <div className="p-8">
                    <Loader />
                  </div>
                }
              >
                <AssignmentEditPage />
              </Suspense>
            }
          />
          <Route
            path="search"
            element={
              <Suspense
                fallback={
                  <div className="p-8">
                    <Loader />
                  </div>
                }
              >
                <SearchResultsPage />
              </Suspense>
            }
          />
        </Route>

        <Route path="*" element={<h1>404 - Sayfa Bulunamadı</h1>} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
