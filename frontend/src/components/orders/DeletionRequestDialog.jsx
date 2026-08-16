import {
  useEffect,
  useRef,
  useState,
} from "react";


function DeletionRequestDialog({
  isOpen,
  order,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}) {
  const dialogRef =
    useRef(null);

  const [
    reason,
    setReason,
  ] = useState("");

  useEffect(() => {
    const dialog =
      dialogRef.current;

    if (!dialog) {
      return;
    }

    if (
      isOpen &&
      !dialog.open
    ) {
      setReason("");
      dialog.showModal();

      return;
    }

    if (
      !isOpen &&
      dialog.open
    ) {
      dialog.close();
    }
  }, [
    isOpen,
  ]);

  function handleCancel(
    event,
  ) {
    event.preventDefault();

    if (!isSubmitting) {
      onClose();
    }
  }

  function handleSubmit(
    event,
  ) {
    event.preventDefault();

    const cleanReason =
      reason.trim();

    if (!cleanReason) {
      return;
    }

    onSubmit(
      cleanReason,
    );
  }

  return (
    <dialog
      ref={dialogRef}
      className="deletion-request-dialog"
      aria-labelledby="deletion-request-title"
      onCancel={
        handleCancel
      }
    >
      <form
        className="deletion-request-card"
        onSubmit={
          handleSubmit
        }
      >
        <header className="deletion-request-header">
          <div>
            <p className="application-eyebrow">
              Dispatched Order
            </p>

            <h2
              id="deletion-request-title"
            >
              Request deletion
            </h2>

            <p>
              {order?.order_number}
            </p>
          </div>

          <button
            type="button"
            className="dialog-close-button"
            aria-label="Close deletion request"
            disabled={
              isSubmitting
            }
            onClick={
              onClose
            }
          >
            ×
          </button>
        </header>

        {errorMessage ? (
          <div
            className="sale-draft-error"
            role="alert"
          >
            {errorMessage}
          </div>
        ) : null}

        <div className="deletion-request-body">
          <label className="sale-field">
            <span>
              Reason *
            </span>

            <textarea
              rows={5}
              required
              value={
                reason
              }
              disabled={
                isSubmitting
              }
              placeholder="Explain why this dispatched order should be deleted."
              onChange={
                (event) =>
                  setReason(
                    event
                      .target
                      .value,
                  )
              }
            />
          </label>
        </div>

        <footer className="deletion-request-actions">
          <button
            type="button"
            className="button button-secondary"
            disabled={
              isSubmitting
            }
            onClick={
              onClose
            }
          >
            Cancel
          </button>

          <button
            type="submit"
            className="button button-primary"
            disabled={
              isSubmitting ||
              !reason.trim()
            }
          >
            {isSubmitting
              ? "Submitting..."
              : "Submit request"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}


export default DeletionRequestDialog;