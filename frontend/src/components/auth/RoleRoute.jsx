import {
  Navigate,
} from "react-router-dom";

import {
  useAuth,
} from "../../auth/AuthContext.jsx";


function RoleRoute({
  allowedRoles,
  children,
}) {
  const {
    user,
  } = useAuth();

  const isAdmin =
    Boolean(
      user?.is_staff ||
      user?.is_superuser ||
      user?.role === "admin",
    );

  const effectiveRole =
    isAdmin
      ? "admin"
      : user?.role;

  if (
    !allowedRoles.includes(
      effectiveRole,
    )
  ) {
    return (
      <Navigate
        to="/laptops"
        replace
      />
    );
  }

  return children;
}


export default RoleRoute;