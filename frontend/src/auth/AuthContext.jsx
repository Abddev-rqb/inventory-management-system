import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  loginUser,
} from "../api/authApi.js";

import {
  clearStoredAuth,
  getStoredAuth,
  saveStoredAuth,
} from "../services/authStorage.js";


const AuthContext =
  createContext(null);


function normalizeUser(
  responseData,
) {
  const responseUser =
    responseData?.user ??
    {};

  const isSuperuser =
    Boolean(
      responseUser.is_superuser ??
      responseData
        ?.is_superuser ??
      false,
    );

  const isStaff =
    Boolean(
      responseUser.is_staff ??
      responseData
        ?.is_staff ??
      false,
    );

  let role =
    responseUser.role ??
    responseData?.role ??
    null;

  if (role) {
    role =
      String(role)
        .trim()
        .toLowerCase();
  }

  if (
    !role &&
    (
      isSuperuser ||
      isStaff
    )
  ) {
    role = "admin";
  }

  return {
    ...responseUser,

    id:
      responseUser.id ??
      responseData?.id ??
      null,

    username:
      responseUser.username ??
      responseData?.username ??
      "",

    first_name:
      responseUser.first_name ??
      responseData
        ?.first_name ??
      "",

    last_name:
      responseUser.last_name ??
      responseData
        ?.last_name ??
      "",

    email:
      responseUser.email ??
      responseData?.email ??
      "",

    role,

    is_active:
      responseUser.is_active ??
      responseData
        ?.is_active ??
      true,

    is_staff:
      isStaff,

    is_superuser:
      isSuperuser,
  };
}


function normalizeStoredAuth(
  storedAuth,
) {
  if (
    !storedAuth
  ) {
    return null;
  }

  const storedUser =
    storedAuth.user ??
    null;

  let normalizedUser =
    storedUser;

  if (
    storedUser
  ) {
    const isStaff =
      Boolean(
        storedUser.is_staff,
      );

    const isSuperuser =
      Boolean(
        storedUser.is_superuser,
      );

    let role =
      storedUser.role ??
      null;

    if (role) {
      role =
        String(role)
          .trim()
          .toLowerCase();
    }

    if (
      !role &&
      (
        isStaff ||
        isSuperuser
      )
    ) {
      role =
        "admin";
    }

    normalizedUser = {
      ...storedUser,

      role,

      is_staff:
        isStaff,

      is_superuser:
        isSuperuser,
    };
  }

  return {
    token:
      storedAuth.token ??
      null,

    user:
      normalizedUser,

    permissions:
      Array.isArray(
        storedAuth.permissions,
      )
        ? storedAuth.permissions
        : [],
  };
}


export function AuthProvider({
  children,
}) {
  const [
    auth,
    setAuth,
  ] = useState(
    () =>
      normalizeStoredAuth(
        getStoredAuth(),
      ),
  );


  const login =
    useCallback(
      async (
        username,
        password,
      ) => {
        const responseData =
          await loginUser(
            username,
            password,
          );

        const user =
          normalizeUser(
            responseData,
          );

        const permissions =
          Array.isArray(
            responseData
              ?.permissions,
          )
            ? responseData
                .permissions
            : Array.isArray(
                responseData
                  ?.user
                  ?.permissions,
              )
              ? responseData
                  .user
                  .permissions
              : [];

        const nextAuth = {
          token:
            responseData.token,

          user,

          permissions,
        };

        saveStoredAuth(
          nextAuth,
        );

        setAuth(
          nextAuth,
        );

        return nextAuth;
      },
      [],
    );


  const logout =
    useCallback(
      () => {
        clearStoredAuth();

        setAuth(
          null,
        );
      },
      [],
    );


  const hasPermission =
    useCallback(
      (
        permissionName,
      ) => {
        if (
          !auth?.user
        ) {
          return false;
        }

        const role =
          String(
            auth.user.role ?? "",
          )
            .trim()
            .toLowerCase();

        if (
          auth.user.is_superuser
          ||
          auth.user.is_staff
          ||
          role === "admin"
        ) {
          return true;
        }

        return (
          auth.permissions
            .includes(
              permissionName,
            )
        );
      },
      [
        auth,
      ],
    );


  const hasRole =
    useCallback(
      (
        ...allowedRoles
      ) => {
        if (
          !auth?.user
        ) {
          return false;
        }

        return (
          allowedRoles
            .includes(
              auth.user.role,
            )
        );
      },
      [
        auth,
      ],
    );


  const contextValue =
    useMemo(
      () => {
        const user =
          auth?.user ??
          null;

        const permissions =
          auth?.permissions ??
          [];

        const role =
          user?.role ??
          null;

        const isAdmin =
          Boolean(
            user?.is_superuser ||
            user?.is_staff ||
            role === "admin",
          );

        const isSales =
          role ===
          "sales";

        const isInventoryViewer =
          role ===
          "inventory_viewer";

        return {
          token:
            auth?.token ??
            null,

          user,

          role,

          permissions,

          isAuthenticated:
            Boolean(
              auth?.token,
            ),

          isAdmin,

          isSales,

          isInventoryViewer,

          login,

          logout,

          hasPermission,

          hasRole,
        };
      },
      [
        auth,
        hasPermission,
        hasRole,
        login,
        logout,
      ],
    );


  return (
    <AuthContext.Provider
      value={
        contextValue
      }
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  const context =
    useContext(
      AuthContext,
    );

  if (
    !context
  ) {
    throw new Error(
      (
        "useAuth must be used " +
        "inside AuthProvider."
      ),
    );
  }

  return context;
}