import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import AppLayout from "./components/layout/AppLayout.jsx";

import RoleRoute from "./components/auth/RoleRoute.jsx";

import AccessDeniedPage from "./pages/AccessDeniedPage.jsx";
import LaptopCreatePage from "./pages/LaptopCreatePage.jsx";
import LaptopDetailsPage from "./pages/LaptopDetailsPage.jsx";
import LaptopEditPage from "./pages/LaptopEditPage.jsx";
import LaptopImportPage from "./pages/LaptopImportPage.jsx";
import LaptopListPage from "./pages/LaptopListPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

import DispatchedOrdersPage from "./pages/orders/DispatchedOrdersPage.jsx";
import PendingOrdersPage from "./pages/orders/PendingOrdersPage.jsx";
import TotalSalesPage from "./pages/orders/TotalSalesPage.jsx";

import UserManagementPage from "./pages/users/UserManagementPage.jsx";

import PermissionRoute from "./routes/PermissionRoute.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";

import ReturnsPage
  from "./pages/returns/ReturnsPage.jsx";


function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <LoginPage />
        }
      />

      <Route
        element={
          <ProtectedRoute />
        }
      >
        <Route
          element={
            <AppLayout />
          }
        >
          <Route
            index
            element={
              <Navigate
                to="/laptops"
                replace
              />
            }
          />

          <Route
            path="/access-denied"
            element={
              <AccessDeniedPage />
            }
          />

          <Route
            path="/users"
            element={
              <RoleRoute
                allowedRoles={[
                  "admin",
                  "sales",
                ]}
              >
                <UserManagementPage />
              </RoleRoute>
            }
          />

          <Route
            element={
              <PermissionRoute
                permission="inventory.view_laptop"
                redirectTo="/access-denied"
              />
            }
          >
            <Route
              path="/laptops"
              element={
                <LaptopListPage />
              }
            />

            <Route
              path="/laptops/:laptopId"
              element={
                <LaptopDetailsPage />
              }
            />
          </Route>

          <Route
            element={
              <PermissionRoute
                permission="inventory.add_laptop"
                redirectTo="/access-denied"
              />
            }
          >
            <Route
              path="/laptops/new"
              element={
                <LaptopCreatePage />
              }
            />

            <Route
              path="/laptops/import"
              element={
                <LaptopImportPage />
              }
            />
          </Route>

          <Route
            element={
              <PermissionRoute
                permission="inventory.change_laptop"
                redirectTo="/access-denied"
              />
            }
          >
            <Route
              path="/laptops/:laptopId/edit"
              element={
                <LaptopEditPage />
              }
            />
          </Route>

          <Route
            element={
              <PermissionRoute
                permission="inventory.view_order"
                redirectTo="/access-denied"
              />
            }
          >
            <Route
              path="/orders"
              element={
                <Navigate
                  to="/orders/pending"
                  replace
                />
              }
            />

            <Route
              path="/orders/pending"
              element={
                <PendingOrdersPage />
              }
            />
          </Route>


          <Route
            path="/orders/dispatched"
            element={
              <RoleRoute
                allowedRoles={[
                  "admin",
                  "sales",
                ]}
              >
                <DispatchedOrdersPage />
              </RoleRoute>
            }
          />

          <Route
            element={
              <PermissionRoute
                permission="inventory.view_sales_report"
                redirectTo="/access-denied"
              />
            }
          >
            <Route
              path="/orders/sales"
              element={
                <TotalSalesPage />
              }
            />
          </Route>

          <Route
            element={
              <PermissionRoute
                permission="inventory.view_return"
                redirectTo="/access-denied"
              />
            }
          >
            <Route
              path="/returns"
              element={
                <RoleRoute
                  allowedRoles={[
                    "admin",
                    "sales",
                    "technician",
                  ]}
                >
                  <ReturnsPage />
                </RoleRoute>
              }
            />
          </Route>
        </Route>
      </Route>

      <Route
        path="*"
        element={
          <NotFoundPage />
        }
      />
    </Routes>
  );
}


export default App;