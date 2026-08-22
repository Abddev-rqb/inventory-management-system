import {
  NavLink,
} from "react-router-dom";

import {
  useAuth,
} from "../../auth/AuthContext.jsx";


function ApplicationSidebar({
  onNavigate,
}) {
  const {
    user,
    hasPermission,
  } = useAuth();

  const role =
    user?.role;

  const isAdmin =
    Boolean(
      user?.is_staff ||
      user?.is_superuser ||
      role === "admin",
    );

  const isSales =
    role === "sales";

  const isInventoryViewer =
    role ===
    "inventory_viewer";

  const canViewLaptops =
    hasPermission(
      "inventory.view_laptop",
    );

  const canViewOrders =
    hasPermission(
      "inventory.view_order",
    );

  const canViewDispatched =
    canViewOrders &&
    !isInventoryViewer;

  const canViewSales =
    !isInventoryViewer &&
    (
      isAdmin ||
      hasPermission(
        "inventory.view_sales_report",
      )
    );

  const canManageUsers =
    isAdmin ||
    isSales;


  return (
    <nav
      className="sidebar-navigation"
      aria-label="Primary navigation"
    >
      {canViewLaptops ? (
        <NavLink
          to="/laptops"
          className={
            getNavigationClassName
          }
          onClick={
            onNavigate
          }
        >
          Laptop Inventory
        </NavLink>
      ) : null}


      {canViewOrders ? (
        <div className="sidebar-navigation-group">
          <p className="sidebar-navigation-heading">
            Orders
          </p>

          <NavLink
            to="/orders/pending"
            className={
              getNavigationClassName
            }
            onClick={
              onNavigate
            }
          >
            Pending Orders
          </NavLink>


          {canViewDispatched ? (
            <NavLink
              to="/orders/dispatched"
              className={
                getNavigationClassName
              }
              onClick={
                onNavigate
              }
            >
              Dispatched
            </NavLink>
          ) : null}


          {canViewSales ? (
            <NavLink
              to="/orders/sales"
              className={
                getNavigationClassName
              }
              onClick={
                onNavigate
              }
            >
              Total Sales
            </NavLink>
          ) : null}
        </div>
      ) : null}


      {canManageUsers ? (
        <div className="sidebar-navigation-group">
          <p className="sidebar-navigation-heading">
            Access Control
          </p>

          <NavLink
            to="/users"
            className={
              getNavigationClassName
            }
            onClick={
              onNavigate
            }
          >
            Users
          </NavLink>
        </div>
      ) : null}


      {!isInventoryViewer &&
      hasPermission(
        "inventory.view_return",
      ) ? (
        <NavLink
          to="/returns"
          className={
            getNavigationClassName
          }
          onClick={
            onNavigate
          }
        >
          Returns
        </NavLink>
      ) : null}
    </nav>
  );
}


function getNavigationClassName({
  isActive,
}) {
  return [
    "sidebar-navigation-link",

    isActive
      ? "sidebar-navigation-link-active"
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}


export default ApplicationSidebar;
