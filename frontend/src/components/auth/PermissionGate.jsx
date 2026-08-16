import { useAuth } from "../../auth/AuthContext.jsx";

function PermissionGate({
  permission,
  children,
  fallback = null,
}) {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return fallback;
  }

  return children;
}

export default PermissionGate;