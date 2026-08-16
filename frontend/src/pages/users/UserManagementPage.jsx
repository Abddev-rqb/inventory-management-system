import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  createManagedUser,
  deleteManagedUser,
  getAssignableRoles,
  getManagedUsers,
  updateManagedUser,
} from "../../api/userApi.js";

import {
  useAuth,
} from "../../auth/AuthContext.jsx";

import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import UserFormDialog from "../../components/users/UserFormDialog.jsx";
import UsersTable from "../../components/users/UsersTable.jsx";

import {
  parseApiError,
} from "../../services/apiError.js";


function UserManagementPage() {
  const {
    user: currentUser,
  } = useAuth();


  const [
    users,
    setUsers,
  ] = useState([]);

  const [
    roles,
    setRoles,
  ] = useState([]);

  const [
    totalUsers,
    setTotalUsers,
  ] = useState(0);

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    hasNextPage,
    setHasNextPage,
  ] = useState(false);

  const [
    hasPreviousPage,
    setHasPreviousPage,
  ] = useState(false);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState(null);

  const [
    dialogMode,
    setDialogMode,
  ] = useState(null);

  const [
    selectedUser,
    setSelectedUser,
  ] = useState(null);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    formError,
    setFormError,
  ] = useState(null);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState(null);


  const [
    userToDelete,
    setUserToDelete,
  ] = useState(null);

  const [
    deletingUserId,
    setDeletingUserId,
  ] = useState(null);

  const [
    deleteError,
    setDeleteError,
  ] = useState(null);


  const currentRole =
    currentUser?.role;

  const isAdmin =
    Boolean(
      currentUser?.is_superuser ||
      currentUser?.is_staff ||
      currentRole ===
        "admin",
    );

  const isSales =
    currentRole ===
    "sales";

  const canManageDeletion =
    isAdmin ||
    isSales;


  const loadUsers =
    useCallback(
      async () => {
        setIsLoading(
          true,
        );

        setLoadError(
          null,
        );

        try {
          const data =
            await getManagedUsers({
              page,
            });

          if (
            Array.isArray(
              data,
            )
          ) {
            setUsers(
              data,
            );

            setTotalUsers(
              data.length,
            );

            setHasNextPage(
              false,
            );

            setHasPreviousPage(
              false,
            );

            return;
          }

          const results =
            Array.isArray(
              data?.results,
            )
              ? data.results
              : [];

          setUsers(
            results,
          );

          setTotalUsers(
            Number(
              data?.count ??
                results.length,
            ),
          );

          setHasNextPage(
            Boolean(
              data?.next,
            ),
          );

          setHasPreviousPage(
            Boolean(
              data?.previous,
            ),
          );
        } catch (error) {
          const parsed =
            parseApiError(
              error,
            );

          setLoadError(
            parsed.message,
          );

          setUsers(
            [],
          );

          setTotalUsers(
            0,
          );
        } finally {
          setIsLoading(
            false,
          );
        }
      },
      [
        page,
      ],
    );


  const loadRoles =
    useCallback(
      async () => {
        try {
          const data =
            await getAssignableRoles();

          setRoles(
            Array.isArray(
              data,
            )
              ? data
              : [],
          );
        } catch (error) {
          const parsed =
            parseApiError(
              error,
            );

          setLoadError(
            parsed.message,
          );
        }
      },
      [],
    );


  useEffect(() => {
    loadUsers();
  }, [
    loadUsers,
  ]);


  useEffect(() => {
    loadRoles();
  }, [
    loadRoles,
  ]);


  function openCreateDialog() {
    setSelectedUser(
      null,
    );

    setFormError(
      null,
    );

    setDeleteError(
      null,
    );

    setSuccessMessage(
      null,
    );

    setDialogMode(
      "create",
    );
  }


  function openEditDialog(
    user,
  ) {
    setSelectedUser(
      user,
    );

    setFormError(
      null,
    );

    setDeleteError(
      null,
    );

    setSuccessMessage(
      null,
    );

    setDialogMode(
      "edit",
    );
  }


  function closeDialog() {
    if (
      isSubmitting
    ) {
      return;
    }

    setDialogMode(
      null,
    );

    setSelectedUser(
      null,
    );

    setFormError(
      null,
    );
  }


  function canDeleteUser(
    targetUser,
  ) {
    if (
      !canManageDeletion
    ) {
      return false;
    }

    if (
      Number(
        targetUser.id,
      ) ===
      Number(
        currentUser?.id,
      )
    ) {
      return false;
    }

    if (
      targetUser.role ===
      "admin"
    ) {
      return false;
    }

    return true;
  }


  function openDeleteDialog(
    targetUser,
  ) {
    if (
      !canDeleteUser(
        targetUser,
      )
    ) {
      return;
    }

    setDeleteError(
      null,
    );

    setSuccessMessage(
      null,
    );

    setUserToDelete(
      targetUser,
    );
  }


  function closeDeleteDialog() {
    if (
      deletingUserId !==
      null
    ) {
      return;
    }

    setUserToDelete(
      null,
    );

    setDeleteError(
      null,
    );
  }


  async function handleDeleteUser() {
    if (
      !userToDelete ||
      deletingUserId !==
        null
    ) {
      return;
    }

    const userId =
      Number(
        userToDelete.id,
      );

    if (
      !Number.isInteger(
        userId,
      ) ||
      userId < 1
    ) {
      return;
    }

    setDeletingUserId(
      userId,
    );

    setDeleteError(
      null,
    );

    setSuccessMessage(
      null,
    );

    try {
      const result =
        await deleteManagedUser(
          userId,
        );

      const deletedUsername =
        result?.username ||
        userToDelete.username;

      setUserToDelete(
        null,
      );

      setSuccessMessage(
        (
          `User ${deletedUsername} ` +
          "was deleted."
        ),
      );

      /*
       * If the last user on a later
       * pagination page is removed,
       * return to the previous page.
       */
      if (
        users.length ===
          1 &&
        page > 1
      ) {
        setPage(
          (currentPage) =>
            Math.max(
              1,
              currentPage - 1,
            ),
        );
      } else {
        await loadUsers();
      }
    } catch (error) {
      const parsed =
        parseApiError(
          error,
        );

      setDeleteError(
        parsed.message,
      );
    } finally {
      setDeletingUserId(
        null,
      );
    }
  }


  async function handleSubmit(
    payload,
  ) {
    setIsSubmitting(
      true,
    );

    setFormError(
      null,
    );

    setDeleteError(
      null,
    );

    try {
      if (
        dialogMode ===
        "create"
      ) {
        const created =
          await createManagedUser(
            payload,
          );

        setSuccessMessage(
          (
            `User ${created.username} ` +
            "was created."
          ),
        );
      } else {
        const updated =
          await updateManagedUser(
            selectedUser.id,
            payload,
          );

        setSuccessMessage(
          (
            `User ${updated.username} ` +
            "was updated."
          ),
        );
      }

      setDialogMode(
        null,
      );

      setSelectedUser(
        null,
      );

      await loadUsers();
    } catch (error) {
      const parsed =
        parseApiError(
          error,
        );

      setFormError(
        parsed.message,
      );
    } finally {
      setIsSubmitting(
        false,
      );
    }
  }


  return (
    <section className="users-page">
      <header className="users-page-header">
        <div>
          <p className="application-eyebrow">
            Access Control
          </p>

          <h1>
            Users
          </h1>

          <p>
            Create users and assign
            application roles.
          </p>
        </div>


        <button
          type="button"
          className="button button-primary"
          onClick={
            openCreateDialog
          }
        >
          + Create User
        </button>
      </header>


      {successMessage ? (
        <div
          className="user-success-message"
          role="status"
        >
          {successMessage}
        </div>
      ) : null}


      {deleteError ? (
        <div
          className="user-form-error"
          role="alert"
        >
          {deleteError}
        </div>
      ) : null}


      {loadError ? (
        <div
          className="user-form-error"
          role="alert"
        >
          {loadError}

          <div>
            <button
              type="button"
              className={
                (
                  "button " +
                  "button-secondary"
                )
              }
              onClick={
                loadUsers
              }
            >
              Retry
            </button>
          </div>
        </div>
      ) : null}


      <div className="users-results-header">
        <div>
          <h2>
            User accounts
          </h2>

          <p>
            {totalUsers}

            {" "}

            {totalUsers === 1
              ? "user"
              : "users"}
          </p>
        </div>
      </div>


      {isLoading ? (
        <div className="orders-loading-state">
          Loading users...
        </div>
      ) : null}


      {!isLoading &&
      !loadError &&
      users.length ===
        0 ? (
        <div className="orders-empty-state">
          <h2>
            No users found
          </h2>

          <p>
            Create the first managed
            user account.
          </p>
        </div>
      ) : null}


      {!isLoading &&
      !loadError &&
      users.length >
        0 ? (
        <>
          <UsersTable
            users={
              users
            }
            canDeleteUser={
              canDeleteUser
            }
            deletingUserId={
              deletingUserId
            }
            onEdit={
              openEditDialog
            }
            onDelete={
              openDeleteDialog
            }
          />


          <div className="sales-pagination">
            <button
              type="button"
              className={
                (
                  "button " +
                  "button-secondary"
                )
              }
              disabled={
                !hasPreviousPage
              }
              onClick={() =>
                setPage(
                  (current) =>
                    Math.max(
                      1,
                      current - 1,
                    ),
                )
              }
            >
              Previous
            </button>

            <span>
              Page {page}
            </span>

            <button
              type="button"
              className={
                (
                  "button " +
                  "button-secondary"
                )
              }
              disabled={
                !hasNextPage
              }
              onClick={() =>
                setPage(
                  (current) =>
                    current + 1,
                )
              }
            >
              Next
            </button>
          </div>
        </>
      ) : null}


      <UserFormDialog
        isOpen={
          Boolean(
            dialogMode,
          )
        }
        mode={
          dialogMode ||
          "create"
        }
        user={
          selectedUser
        }
        roles={
          roles
        }
        isSubmitting={
          isSubmitting
        }
        error={
          formError
        }
        onSubmit={
          handleSubmit
        }
        onCancel={
          closeDialog
        }
      />


      <ConfirmDialog
        isOpen={
          Boolean(
            userToDelete,
          )
        }
        title="Delete user?"
        message={
          userToDelete
            ? (
                `Delete user ${userToDelete.username}? ` +
                "This action permanently removes " +
                "the user account."
              )
            : ""
        }
        confirmLabel="Delete user"
        cancelLabel="Keep user"
        variant="danger"
        isProcessing={
          deletingUserId !==
          null
        }
        onConfirm={
          handleDeleteUser
        }
        onCancel={
          closeDeleteDialog
        }
      />
    </section>
  );
}


export default UserManagementPage;