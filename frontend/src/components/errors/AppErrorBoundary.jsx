import {
  Component,
} from "react";
import {
  Link,
} from "react-router-dom";

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
    };

    this.handleRetry =
      this.handleRetry.bind(this);
  }

  static getDerivedStateFromError(
    error,
  ) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(
    error,
    errorInfo,
  ) {
    if (import.meta.env.DEV) {
      console.error(
        "Unhandled React rendering error:",
        error,
        errorInfo,
      );
    }
  }

  handleRetry() {
    this.setState({
      hasError: false,
      error: null,
    });

    window.location.reload();
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="application-error-page">
        <section
          className="application-error-card"
          role="alert"
          aria-live="assertive"
        >
          <p className="application-eyebrow">
            Application error
          </p>

          <h1>
            Something went wrong
          </h1>

          <p className="application-error-message">
            The application encountered
            an unexpected error. Your
            inventory data has not been
            changed by this screen.
          </p>

          {import.meta.env.DEV &&
          this.state.error?.message ? (
            <details className="application-error-details">
              <summary>
                Development error details
              </summary>

              <pre>
                {
                  this.state.error
                    .message
                }
              </pre>
            </details>
          ) : null}

          <div className="application-error-actions">
            <button
              type="button"
              className="button button-primary"
              onClick={
                this.handleRetry
              }
            >
              Try again
            </button>

            <Link
              to="/laptops"
              className="button button-secondary"
              onClick={() => {
                this.setState({
                  hasError: false,
                  error: null,
                });
              }}
            >
              Return to inventory
            </Link>
          </div>
        </section>
      </main>
    );
  }
}

export default AppErrorBoundary;