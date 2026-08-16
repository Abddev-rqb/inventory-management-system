import { useAuth } from "../auth/AuthContext.jsx";

function AccessDeniedPage() {
  const { user } = useAuth();

  return (
    <section className="content-card">
      <p className="application-eyebrow">
        Access Restricted
      </p>

      <h2>
        You do not have inventory access
      </h2>

      <p>
        The account{" "}
        <strong>
          {user?.username ?? "Unknown user"}
        </strong>{" "}
        does not have permission to view laptop
        records.
      </p>

      <p>
        Contact an administrator if this account
        requires additional access.
      </p>
    </section>
  );
}

export default AccessDeniedPage;