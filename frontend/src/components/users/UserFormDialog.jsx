import {
  useEffect,
  useState,
} from "react";


const EMPTY_FORM = {
  username: "",
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  role: "",
  is_active: true,
};


function UserFormDialog({
  isOpen,
  mode = "create",
  user = null,
  roles = [],
  isSubmitting = false,
  error = null,
  onSubmit,
  onCancel,
}) {
  const [
    form,
    setForm,
  ] = useState(
    EMPTY_FORM,
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (
      mode === "edit" &&
      user
    ) {
      setForm({
        username:
          user.username ?? "",

        first_name:
          user.first_name ?? "",

        last_name:
          user.last_name ?? "",

        email:
          user.email ?? "",

        password: "",

        role:
          user.role ?? "",

        is_active:
          user.is_active !== false,
      });

      return;
    }

    setForm({
      ...EMPTY_FORM,

      role:
        roles[0]?.value ?? "",
    });
  }, [
    isOpen,
    mode,
    user,
    roles,
  ]);

  if (!isOpen) {
    return null;
  }

  const isCreate =
    mode === "create";

  const canSubmit =
    Boolean(
      form.username.trim() &&
      form.role &&
      (
        !isCreate ||
        form.password.trim()
      ) &&
      !isSubmitting
    );

  function updateField(
    field,
    value,
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );
  }

  function handleSubmit(
    event,
  ) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    const payload = {
      username:
        form.username.trim(),

      first_name:
        form.first_name.trim(),

      last_name:
        form.last_name.trim(),

      email:
        form.email.trim(),

      role:
        form.role,

      is_active:
        form.is_active,
    };

    if (
      form.password.trim()
    ) {
      payload.password =
        form.password;
    }

    onSubmit(
      payload,
    );
  }

  return (
    <div
      className="user-dialog-backdrop"
      role="presentation"
    >
      <section
        className="user-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-dialog-title"
      >
        <header className="user-dialog-header">
          <div>
            <h2 id="user-dialog-title">
              {isCreate
                ? "Create User"
                : "Edit User"}
            </h2>

            <p>
              {isCreate
                ? "Create an account and assign its application role."
                : "Update account details, role, status, or password."}
            </p>
          </div>
        </header>

        <form
          onSubmit={
            handleSubmit
          }
        >
          <div className="user-dialog-body">
            {error ? (
              <div
                className="user-form-error"
                role="alert"
              >
                {error}
              </div>
            ) : null}

            <div className="user-form-grid">
              <label className="user-form-field">
                <span>
                  Username *
                </span>

                <input
                  type="text"
                  value={
                    form.username
                  }
                  required
                  autoComplete="off"
                  disabled={
                    isSubmitting
                  }
                  onChange={
                    (event) =>
                      updateField(
                        "username",
                        event.target.value,
                      )
                  }
                />
              </label>

              <label className="user-form-field">
                <span>
                  Role *
                </span>

                <select
                  value={
                    form.role
                  }
                  required
                  disabled={
                    isSubmitting
                  }
                  onChange={
                    (event) =>
                      updateField(
                        "role",
                        event.target.value,
                      )
                  }
                >
                  <option value="">
                    Select role
                  </option>

                  {roles.map(
                    (role) => (
                      <option
                        key={
                          role.value
                        }
                        value={
                          role.value
                        }
                      >
                        {role.label}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="user-form-field">
                <span>
                  First name
                </span>

                <input
                  type="text"
                  value={
                    form.first_name
                  }
                  disabled={
                    isSubmitting
                  }
                  onChange={
                    (event) =>
                      updateField(
                        "first_name",
                        event.target.value,
                      )
                  }
                />
              </label>

              <label className="user-form-field">
                <span>
                  Last name
                </span>

                <input
                  type="text"
                  value={
                    form.last_name
                  }
                  disabled={
                    isSubmitting
                  }
                  onChange={
                    (event) =>
                      updateField(
                        "last_name",
                        event.target.value,
                      )
                  }
                />
              </label>

              <label className="user-form-field user-form-field-full">
                <span>
                  Email
                </span>

                <input
                  type="email"
                  value={
                    form.email
                  }
                  disabled={
                    isSubmitting
                  }
                  onChange={
                    (event) =>
                      updateField(
                        "email",
                        event.target.value,
                      )
                  }
                />
              </label>

              <label className="user-form-field user-form-field-full">
                <span>
                  {isCreate
                    ? "Password *"
                    : "New password"}
                </span>

                <input
                  type="password"
                  value={
                    form.password
                  }
                  required={
                    isCreate
                  }
                  autoComplete="new-password"
                  disabled={
                    isSubmitting
                  }
                  placeholder={
                    isCreate
                      ? ""
                      : "Leave blank to keep current password"
                  }
                  onChange={
                    (event) =>
                      updateField(
                        "password",
                        event.target.value,
                      )
                  }
                />
              </label>

              <label className="user-active-field">
                <input
                  type="checkbox"
                  checked={
                    form.is_active
                  }
                  disabled={
                    isSubmitting
                  }
                  onChange={
                    (event) =>
                      updateField(
                        "is_active",
                        event.target.checked,
                      )
                  }
                />

                <span>
                  Active user
                </span>
              </label>
            </div>
          </div>

          <footer className="user-dialog-footer">
            <button
              type="button"
              className="button button-secondary"
              disabled={
                isSubmitting
              }
              onClick={
                onCancel
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="button button-primary"
              disabled={
                !canSubmit
              }
            >
              {isSubmitting
                ? "Saving..."
                : isCreate
                  ? "Create User"
                  : "Save Changes"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}


export default UserFormDialog;