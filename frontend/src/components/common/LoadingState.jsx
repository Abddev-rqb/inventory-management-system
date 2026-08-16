function LoadingState({
  title = "Loading",
  message = "Please wait while the requested data is prepared.",
  size = "medium",
}) {
  const safeSize = [
    "small",
    "medium",
    "large",
  ].includes(size)
    ? size
    : "medium";

  return (
    <div
      className="loading-state"
      role="status"
      aria-live="polite"
    >
      <div
        className={`loading-spinner loading-spinner-${safeSize}`}
        aria-hidden="true"
      />

      <div className="loading-state-content">
        <strong className="loading-state-title">
          {title}
        </strong>

        {message ? (
          <p className="loading-state-message">
            {message}
          </p>
        ) : null}
      </div>

      <span className="screen-reader-only">
        {title}. {message}
      </span>
    </div>
  );
}

export default LoadingState;