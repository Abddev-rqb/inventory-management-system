import {
  Navigate,
  Outlet,
} from "react-router-dom";

import { useAuth } from "../auth/AuthContext.jsx";

function PermissionRoute({
  permission,
  redirectTo = "/laptops",
}) {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return (
      <Navigate
        to={redirectTo}
        replace
      />
    );
  }

  return <Outlet />;
}

export default PermissionRoute;