import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";


const STATUS_LABELS = {
  received:
    "Received",

  in_service:
    "In Service",

  repair_completed:
    "Repair Completed",

  swap_requested:
    "Swap Requested",

  ready_for_dispatch:
    "Ready For Dispatch",

  stocked_in:
    "Stocked In",

  dispatched:
    "Dispatched",
};


const STATUS_TRANSITIONS = {
  received: [
    "in_service",
  ],

  in_service: [
    "received",
    "repair_completed",
    "swap_requested",
  ],

  repair_completed: [
    "in_service",
    "ready_for_dispatch",
  ],

  swap_requested: [
    "in_service",
  ],

  ready_for_dispatch: [
    "repair_completed",
  ],

  stocked_in: [],

  dispatched: [],
};


function ReturnStatusDialog({
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
    nextStatus,
    setNextStatus,
  ] = useState("");

  const [
    repairNotes,
    setRepairNotes,
  ] = useState("");


  const availableStatuses =
    useMemo(
      () => {
        if (!returnRecord) {
          return [];
        }

        return [
          returnRecord.status,
          ...(
            STATUS_TRANSITIONS[
              returnRecord.status
            ] || []
          ),
        ];
      },
      [
        returnRecord,
      ],
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
      setNextStatus(
        returnRecord?.status
        || "",
      );

      setRepairNotes(
        returnRecord
          ?.repair_notes
        || "",
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

    onSubmit({
      status:
        nextStatus,

      repair_notes:
        repairNotes.trim(),
    });
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
              Update Service Status
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
              Technician:{" "}
              {
                returnRecord
                  ?.technician_name
                || "Unassigned"
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
              Status
            </span>

            <select
              value={
                nextStatus
              }
              onChange={
                (event) =>
                  setNextStatus(
                    event.target.value,
                  )
              }
              required
            >
              {availableStatuses.map(
                (
                  statusValue,
                ) => (
                  <option
                    key={
                      statusValue
                    }
                    value={
                      statusValue
                    }
                  >
                    {
                      STATUS_LABELS[
                        statusValue
                      ]
                      || statusValue
                    }
                  </option>
                ),
              )}
            </select>
          </label>


          <label className="return-field">
            <span>
              Repair notes
            </span>

            <textarea
              rows="5"
              value={
                repairNotes
              }
              placeholder={
                "Enter inspection, repair "
                + "or service notes."
              }
              onChange={
                (event) =>
                  setRepairNotes(
                    event.target.value,
                  )
              }
            />
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
              ||
              !nextStatus
            }
          >
            {isSubmitting
              ? "Saving..."
              : "Update Status"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}


export default ReturnStatusDialog;