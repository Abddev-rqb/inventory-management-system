import {
  useEffect,
  useRef,
  useState,
} from "react";


function ReturnTechnicianDialog({
  isOpen,
  returnRecord,
  technicians,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}) {
  const dialogRef =
    useRef(null);

  const [
    technician,
    setTechnician,
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
      setTechnician(
        returnRecord?.technician
          ? String(
              returnRecord.technician,
            )
          : "",
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
      technician
        ? Number(
            technician,
          )
        : null,
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
              Assign Technician
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
          <div className="return-workflow-summary">
            <strong>
              {
                returnRecord
                  ?.customer_name
              }
            </strong>

            <span>
              {
                returnRecord
                  ?.company
              }
              {" "}
              {
                returnRecord
                  ?.model_number
              }
            </span>

            <span>
              Serial:{" "}
              {
                returnRecord
                  ?.serial_number
              }
            </span>
          </div>


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
              Technician
            </span>

            <select
              value={
                technician
              }
              onChange={
                (event) =>
                  setTechnician(
                    event.target.value,
                  )
              }
            >
              <option value="">
                Unassigned
              </option>

              {technicians.map(
                (
                  technicianOption,
                ) => (
                  <option
                    key={
                      technicianOption.id
                    }
                    value={
                      technicianOption.id
                    }
                  >
                    {
                      technicianOption.name
                    }
                  </option>
                ),
              )}
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
              : "Save Technician"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}


export default ReturnTechnicianDialog;