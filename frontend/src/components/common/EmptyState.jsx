function EmptyState({
  title = "No data available",
  message = "There is currently nothing to display.",
  action = null,
}) {
  return (
    <div className="empty-state">
      <div
        className="empty-state-icon"
        aria-hidden="true"
      >
        <span />
        <span />
        <span />
      </div>

      <div className="empty-state-content">
        <h3 className="empty-state-title">
          {title}
        </h3>

        {message ? (
          <p className="empty-state-message">
            {message}
          </p>
        ) : null}

        {action ? (
          <div className="empty-state-action">
            {action}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default EmptyState;