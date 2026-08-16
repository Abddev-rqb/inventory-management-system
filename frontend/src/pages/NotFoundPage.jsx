import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <main className="not-found-page">
      <section className="content-card">
        <p className="application-eyebrow">
          404
        </p>

        <h1>Page not found</h1>

        <p>
          The requested frontend route does
          not exist.
        </p>

        <Link
          to="/laptops"
          className="button button-primary link-button"
        >
          Return to laptops
        </Link>
      </section>
    </main>
  );
}

export default NotFoundPage;