import {
  useEffect,
  useRef,
  useState,
} from "react";


function ReturnPriorityDialog({
  isOpen,
  returnRecord,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}) {
  const dialogRef =
    useRef(null);

  const [
    priority,
    setPriority,
  ] = useState(
    "normal",
  );


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
      setPriority(
        returnRecord?.priority
        || "normal",
      );

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
    returnRecord,
  ]);


  function handleSubmit(
    event,
  ) {
    event.preventDefault();

    onSubmit(
      priority,
    );
  }


  return (
    <dialog
      ref={dialogRef}
      className="return-workflow-dialog"
      onCancel={
        (event) => {
          event.preventDefault();

          if (!isSubmitting) {
            onClose();
          }
        }
      }
    >
      <form
        className="return-workflow-card"
        onSubmit={
          handleSubmit
        }
      >
        <header className="return-workflow-header">
          <div>
            <p className="application-eyebrow">
              Returns
            </p>

            <h2>
              Assign Priority
            </h2>
          </div>

          <button
            type="button"
            className="dialog-close-button"
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


        <div className="return-workflow-body">
          <ReturnSummary
            returnRecord={
              returnRecord
            }
          />


          {errorMessage ? (
            <div
              className="form-level-error"
              role="alert"
            >
              {errorMessage}
            </div>
          ) : null}


          <label className="return-field">
            <span>
              Priority
            </span>

            <select
              value={
                priority
              }
              onChange={
                (event) =>
                  setPriority(
                    event.target.value,
                  )
              }
            >
              <option value="low">
                Low
              </option>

              <option value="normal">
                Normal
              </option>

              <option value="high">
                High
              </option>

              <option value="urgent">
                Urgent
              </option>
            </select>
          </label>
        </div>


        <footer className="return-workflow-actions">
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
              isSubmitting
            }
          >
            {isSubmitting
              ? "Saving..."
              : "Assign Priority"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}


function ReturnSummary({
  returnRecord,
}) {
  if (!returnRecord) {
    return null;
  }

  return (
    <div className="return-workflow-summary">
      <strong>
        {
          returnRecord.customer_name
        }
      </strong>

      <span>
        {
          returnRecord.company
        }
        {" "}
        {
          returnRecord.model_number
        }
      </span>

      <span>
        Serial:{" "}
        {
          returnRecord.serial_number
        }
      </span>
    </div>
  );
}


export default ReturnPriorityDialog;