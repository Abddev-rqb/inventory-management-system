import {
  StrictMode,
} from "react";
import {
  createRoot,
} from "react-dom/client";
import {
  BrowserRouter,
} from "react-router-dom";

import App from "./App.jsx";
import {
  AuthProvider,
} from "./auth/AuthContext.jsx";
import AppErrorBoundary from "./components/errors/AppErrorBoundary.jsx";

import "./index.css";
import "./styles/authentication.css";
import "./styles/components.css";
import "./styles/layout.css";

const rootElement =
  document.getElementById(
    "root",
  );

if (!rootElement) {
  throw new Error(
    'React root element with id "root" was not found.',
  );
}

createRoot(
  rootElement,
).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);