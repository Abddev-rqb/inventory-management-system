import {
  useEffect,
  useId,
  useRef,
} from "react";

function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  processingLabel = "Processing...",
  variant = "danger",
  isProcessing = false,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const cancelButtonRef = useRef(null);

  const titleId = useId();
  const messageId = useId();

  const safeVariant = [
    "danger",
    "warning",
    "primary",
  ].includes(variant)
    ? variant
    : "danger";

  useEffect(() => {
    const dialogElement =
      dialogRef.current;

    if (!dialogElement) {
      return;
    }

    if (
      isOpen &&
      !dialogElement.open
    ) {
      dialogElement.showModal();

      window.requestAnimationFrame(
        () => {
          cancelButtonRef.current
            ?.focus();
        },
      );
    }

    if (
      !isOpen &&
      dialogElement.open
    ) {
      dialogElement.close();
    }
  }, [isOpen]);

  function handleNativeCancel(
    event,
  ) {
    event.preventDefault();

    if (!isProcessing) {
      onCancel?.();
    }
  }

  function handleDialogClick(
    event,
  ) {
    if (
      event.target ===
        dialogRef.current &&
      !isProcessing
    ) {
      onCancel?.();
    }
  }

  function handleCancelClick() {
    if (!isProcessing) {
      onCancel?.();
    }
  }

  function handleConfirmClick() {
    if (!isProcessing) {
      onConfirm?.();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onCancel={handleNativeCancel}
      onClick={handleDialogClick}
    >
      <div
        className="confirm-dialog-panel"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div
          className={`confirm-dialog-indicator confirm-dialog-indicator-${safeVariant}`}
          aria-hidden="true"
        >
          !
        </div>

        <div className="confirm-dialog-content">
          <h2
            id={titleId}
            className="confirm-dialog-title"
          >
            {title}
          </h2>

          <p
            id={messageId}
            className="confirm-dialog-message"
          >
            {message}
          </p>
        </div>

        <div className="confirm-dialog-actions">
          <button
            ref={cancelButtonRef}
            type="button"
            className="button button-secondary"
            onClick={
              handleCancelClick
            }
            disabled={isProcessing}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            className={`button confirm-button confirm-button-${safeVariant}`}
            onClick={
              handleConfirmClick
            }
            disabled={isProcessing}
          >
            {isProcessing
              ? processingLabel
              : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default ConfirmDialog;