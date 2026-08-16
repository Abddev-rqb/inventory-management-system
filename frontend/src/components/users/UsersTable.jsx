function UsersTable({
  users,
  canDeleteUser,
  deletingUserId = null,
  onEdit,
  onDelete,
}) {
  return (
    <div className="table-scroll-container">
      <table className="users-table">
        <thead>
          <tr>
            <th>
              ID
            </th>

            <th>
              Username
            </th>

            <th>
              Name
            </th>

            <th>
              Email
            </th>

            <th>
              Role
            </th>

            <th>
              Status
            </th>

            <th>
              Actions
            </th>
          </tr>
        </thead>


        <tbody>
          {users.map(
            (user) => {
              const canDelete =
                canDeleteUser(
                  user,
                );

              const isDeleting =
                deletingUserId ===
                Number(
                  user.id,
                );

              return (
                <tr
                  key={
                    user.id
                  }
                >
                  <td>
                    {user.id}
                  </td>


                  <td>
                    <strong>
                      {user.username}
                    </strong>
                  </td>


                  <td>
                    {formatName(
                      user,
                    )}
                  </td>


                  <td>
                    {user.email ||
                      "—"}
                  </td>


                  <td>
                    <span className="user-role-badge">
                      {formatRole(
                        user.role,
                      )}
                    </span>
                  </td>


                  <td>
                    <span
                      className={
                        user.is_active
                          ? (
                              "user-status " +
                              "user-status-active"
                            )
                          : (
                              "user-status " +
                              "user-status-inactive"
                            )
                      }
                    >
                      {user.is_active
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </td>


                  <td>
                    <div className="user-row-actions">
                      <button
                        type="button"
                        className={
                          (
                            "button " +
                            "button-secondary"
                          )
                        }
                        disabled={
                          isDeleting
                        }
                        onClick={() =>
                          onEdit(
                            user,
                          )
                        }
                      >
                        Edit
                      </button>


                      {canDelete ? (
                        <button
                          type="button"
                          className={
                            (
                              "button " +
                              "button-danger"
                            )
                          }
                          disabled={
                            isDeleting
                          }
                          onClick={() =>
                            onDelete(
                              user,
                            )
                          }
                        >
                          {isDeleting
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            },
          )}
        </tbody>
      </table>
    </div>
  );
}


function formatName(
  user,
) {
  const name = [
    user.first_name,
    user.last_name,
  ]
    .filter(
      Boolean,
    )
    .join(
      " ",
    )
    .trim();

  return (
    name ||
    "—"
  );
}


function formatRole(
  role,
) {
  if (
    !role
  ) {
    return (
      "Unassigned"
    );
  }

  return String(
    role,
  )
    .replaceAll(
      "_",
      " ",
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}


export default UsersTable;