import {
  useState,
} from "react";
import {
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../../auth/AuthContext.jsx";
import ConfirmDialog from "../common/ConfirmDialog.jsx";


function ApplicationHeader({
  isMobileNavigationOpen = false,
  onToggleMobileNavigation,
}) {
  const navigate = useNavigate();

  const {
    user,
    permissions,
    logout,
  } = useAuth();

  const [
    isLogoutDialogOpen,
    setIsLogoutDialogOpen,
  ] = useState(false);

  const roleLabel = getRoleLabel({
    user,
    permissions,
  });


  function openLogoutDialog() {
    setIsLogoutDialogOpen(
      true,
    );
  }


  function closeLogoutDialog() {
    setIsLogoutDialogOpen(
      false,
    );
  }


  function confirmLogout() {
    setIsLogoutDialogOpen(
      false,
    );

    logout();

    navigate(
      "/login",
      {
        replace: true,
      },
    );
  }


  return (
    <>
      <header className="application-header">
        <div className="header-brand-row">
          <button
            type="button"
            className="mobile-navigation-toggle"
            aria-label={
              isMobileNavigationOpen
                ? "Close navigation menu"
                : "Open navigation menu"
            }
            aria-controls="application-sidebar"
            aria-expanded={
              isMobileNavigationOpen
            }
            onClick={
              onToggleMobileNavigation
            }
          >
            <span aria-hidden="true">
              ☰
            </span>
          </button>

          <div className="header-brand">
            <p className="application-eyebrow">
              Inventory Management System
            </p>

            <h1 className="application-title">
              Inventory Management
            </h1>
          </div>
        </div>

        <div className="header-account">
          <div className="header-user-details">
            <span className="header-user-label">
              Signed in as
            </span>

            <strong className="header-username">
              {
                user?.username
                ?? "Unknown user"
              }
            </strong>

            <span className="header-role">
              {roleLabel}
            </span>
          </div>

          <button
            type="button"
            className="button button-secondary"
            onClick={
              openLogoutDialog
            }
          >
            Log out
          </button>
        </div>
      </header>

      <ConfirmDialog
        isOpen={
          isLogoutDialogOpen
        }
        title="Confirm logout"
        message={
          (
            "Are you sure you want to "
            + "end your current inventory session?"
          )
        }
        confirmLabel="Log out"
        cancelLabel="Stay signed in"
        variant="danger"
        onConfirm={
          confirmLogout
        }
        onCancel={
          closeLogoutDialog
        }
      />
    </>
  );
}


function getRoleLabel({
  user,
  permissions,
}) {
  if (user?.is_staff) {
    return "Administrator";
  }

  const permissionSet = new Set(
    permissions,
  );

  if (
    permissionSet.has(
      "inventory.delete_laptop",
    )
  ) {
    return "Inventory Manager";
  }

  if (
    permissionSet.has(
      "inventory.change_laptop",
    )
  ) {
    return "Inventory Operator";
  }

  if (
    permissionSet.has(
      "inventory.add_laptop",
    )
  ) {
    return "Import Operator";
  }

  if (
    permissionSet.has(
      "inventory.view_laptop",
    )
  ) {
    return "Inventory Viewer";
  }

  return "Limited Access";
}


export default ApplicationHeader;
