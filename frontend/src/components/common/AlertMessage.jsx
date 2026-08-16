const VALID_VARIANTS = [
  "success",
  "error",
  "warning",
  "info",
];

function AlertMessage({
  variant = "info",
  title,
  message,
  children,
  onClose,
}) {
  const safeVariant = VALID_VARIANTS.includes(
    variant,
  )
    ? variant
    : "info";

  const alertRole =
    safeVariant === "error"
      ? "alert"
      : "status";

  return (
    <div
      className={`alert-message alert-message-${safeVariant}`}
      role={alertRole}
    >
      <div className="alert-message-content">
        {title ? (
          <strong className="alert-message-title">
            {title}
          </strong>
        ) : null}

        {message ? (
          <p className="alert-message-text">
            {message}
          </p>
        ) : null}

        {children ? (
          <div className="alert-message-details">
            {children}
          </div>
        ) : null}
      </div>

      {onClose ? (
        <button
          type="button"
          className="alert-message-close"
          onClick={onClose}
          aria-label="Dismiss message"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}

export default AlertMessage;