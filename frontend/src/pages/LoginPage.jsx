import {
  useState,
} from "react";

import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../auth/AuthContext.jsx";

import {
  getFirstFieldError,
  parseApiError,
} from "../services/apiError.js";

import AlertMessage from "../components/common/AlertMessage.jsx";


function LoginPage() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    isAuthenticated,
    login,
  } = useAuth();

  const [
    username,
    setUsername,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    formError,
    setFormError,
  ] = useState("");

  const [
    fieldErrors,
    setFieldErrors,
  ] = useState({});

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);


  if (
    isAuthenticated
  ) {
    return (
      <Navigate
        to="/laptops"
        replace
      />
    );
  }


  function handleUsernameChange(
    event,
  ) {
    setUsername(
      event.target.value,
    );

    setFormError(
      "",
    );

    setFieldErrors(
      (currentErrors) => ({
        ...currentErrors,
        username:
          undefined,
        nonField:
          undefined,
      }),
    );
  }


  function handlePasswordChange(
    event,
  ) {
    setPassword(
      event.target.value,
    );

    setFormError(
      "",
    );

    setFieldErrors(
      (currentErrors) => ({
        ...currentErrors,
        password:
          undefined,
        nonField:
          undefined,
      }),
    );
  }


  async function handleSubmit(
    event,
  ) {
    event.preventDefault();

    setFormError(
      "",
    );

    setFieldErrors(
      {},
    );

    const trimmedUsername =
      username.trim();

    const nextFieldErrors =
      {};

    if (
      !trimmedUsername
    ) {
      nextFieldErrors.username =
        "Username is required.";
    }

    if (
      !password
    ) {
      nextFieldErrors.password =
        "Password is required.";
    }

    if (
      Object.keys(
        nextFieldErrors,
      ).length > 0
    ) {
      setFieldErrors(
        nextFieldErrors,
      );

      return;
    }

    setIsSubmitting(
      true,
    );

    try {
      await login(
        trimmedUsername,
        password,
      );

      const destination =
        location.state
          ?.from
          ?.pathname ??
        "/laptops";

      navigate(
        destination,
        {
          replace:
            true,
        },
      );
    } catch (error) {
      const status =
        error?.response?.status;

      /*
       * DRF token authentication normally
       * returns HTTP 400 when the username
       * or password is incorrect.
       *
       * We deliberately use one generic
       * message so we do not reveal whether
       * a particular username exists.
       */
      if (
        status === 400
      ) {
        setFormError(
          (
            "Invalid username or "
            + "password."
          ),
        );

        setFieldErrors(
          {},
        );

        return;
      }

      /*
       * Login throttling.
       */
      if (
        status === 429
      ) {
        setFormError(
          (
            "Too many login attempts. "
            + "Please try again later."
          ),
        );

        setFieldErrors(
          {},
        );

        return;
      }

      /*
       * For other API validation responses,
       * continue using the application's
       * normal error parser.
       */
      const parsedError =
        parseApiError(
          error,
        );

      const usernameError =
        getFirstFieldError(
          parsedError,
          "username",
        );

      const passwordError =
        getFirstFieldError(
          parsedError,
          "password",
        );

      const nonFieldError =
        getFirstFieldError(
          parsedError,
          "non_field_errors",
        );

      setFieldErrors({
        username:
          usernameError,

        password:
          passwordError,

        nonField:
          nonFieldError,
      });

      /*
       * Avoid exposing technical errors such
       * as "Request failed with status code 500"
       * directly on the login screen.
       */
      if (
        status >= 500
      ) {
        setFormError(
          (
            "Unable to sign in right now. "
            + "Please try again."
          ),
        );

        return;
      }

      if (
        !error?.response
      ) {
        setFormError(
          (
            "Unable to reach the server. "
            + "Check your connection "
            + "and try again."
          ),
        );

        return;
      }

      setFormError(
        parsedError.message ||
        (
          "Unable to sign in. "
          + "Please try again."
        ),
      );
    } finally {
      setIsSubmitting(
        false,
      );
    }
  }


  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-heading">
          <p className="application-eyebrow">
            Inventory Management System
          </p>

          <h1>
            Sign in
          </h1>

          <p>
            Use your account to
            access inventory records.
          </p>
        </div>


        {formError ? (
          <AlertMessage
            variant="error"
            title="Unable to sign in"
            message={
              formError
            }
          >
            {fieldErrors.nonField ? (
              <span>
                {fieldErrors.nonField}
              </span>
            ) : null}
          </AlertMessage>
        ) : null}


        <form
          className="login-form"
          onSubmit={
            handleSubmit
          }
          noValidate
        >
          <div className="form-field">
            <label htmlFor="username">
              Username
            </label>

            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={
                username
              }
              disabled={
                isSubmitting
              }
              onChange={
                handleUsernameChange
              }
              aria-invalid={
                Boolean(
                  fieldErrors.username,
                )
              }
              aria-describedby={
                fieldErrors.username
                  ? "username-error"
                  : undefined
              }
            />

            {fieldErrors.username ? (
              <span
                id="username-error"
                className="field-error"
                role="alert"
              >
                {fieldErrors.username}
              </span>
            ) : null}
          </div>


          <div className="form-field">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={
                password
              }
              disabled={
                isSubmitting
              }
              onChange={
                handlePasswordChange
              }
              aria-invalid={
                Boolean(
                  fieldErrors.password,
                )
              }
              aria-describedby={
                fieldErrors.password
                  ? "password-error"
                  : undefined
              }
            />

            {fieldErrors.password ? (
              <span
                id="password-error"
                className="field-error"
                role="alert"
              >
                {fieldErrors.password}
              </span>
            ) : null}
          </div>


          <button
            type="submit"
            className="button button-primary"
            disabled={
              isSubmitting
            }
          >
            {isSubmitting
              ? "Signing in..."
              : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}


export default LoginPage;