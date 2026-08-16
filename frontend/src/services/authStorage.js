const AUTH_STORAGE_KEY = "inventory_auth";

export function getStoredAuth() {
  const storedValue = sessionStorage.getItem(
    AUTH_STORAGE_KEY,
  );

  if (!storedValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(storedValue);

    if (
      typeof parsedValue !== "object" ||
      parsedValue === null ||
      typeof parsedValue.token !== "string" ||
      parsedValue.token.trim() === ""
    ) {
      clearStoredAuth();
      return null;
    }

    return parsedValue;
  } catch {
    clearStoredAuth();
    return null;
  }
}

export function saveStoredAuth(authData) {
  sessionStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify(authData),
  );
}

export function clearStoredAuth() {
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getStoredToken() {
  return getStoredAuth()?.token ?? null;
}