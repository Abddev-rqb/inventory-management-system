import {
  useEffect,
  useRef,
  useState,
} from "react";


const INITIAL_FORM = {
  issue: "",
  service_rack: "",
  priority: "normal",
  technician: "",
};


function ToServiceDialog({
  isOpen,
  laptop,
  technicians = [],
  isSubmitting = false,
  errorMessage = null,
  onClose,
  onSubmit,
}) {
  const dialogRef = useRef(null);

  const [form, setForm] = useState(
    INITIAL_FORM,
  );

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (isOpen) {
      setForm(INITIAL_FORM);

      if (!dialog.open) {
        dialog.showModal();
      }
      return;
    }

    if (dialog.open) {
      dialog.close();
    }
  }, [isOpen, laptop?.id]);

  function updateField(
    field,
    value,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    onSubmit({
      issue: form.issue.trim(),
      service_rack:
        form.service_rack.trim(),
      priority: form.priority,
      technician:
        form.technician
          ? Number(form.technician)
          : null,
    });
  }

  return (
    <dialog
      ref={dialogRef}
      className="to-service-dialog"
      onCancel={(event) => {
        event.preventDefault();
        if (!isSubmitting) {
          onClose();
        }
      }}
    >
      <form
        className="to-service-dialog-card"
        onSubmit={handleSubmit}
      >
        <header className="to-service-dialog-header">
          <div>
            <p className="application-eyebrow">
            Inventory Service
          </p>

          <h2>Move laptop to service</h2>

          <p>
            {laptop
              ? `${laptop.company} ${laptop.model_number} — ${laptop.serial_number}`
              : "Selected laptop"}
          </p>
          </div>

          <button
            type="button"
            className="to-service-dialog-close"
            aria-label="Close move to service dialog"
            disabled={isSubmitting}
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="to-service-dialog-body">
        <label className="to-service-field to-service-field-full">
          <span>Issue</span>
          <textarea
            value={form.issue}
            required
            disabled={isSubmitting}
            onChange={(event) =>
              updateField(
                "issue",
                event.target.value,
              )
            }
          />
        </label>

        <label className="to-service-field">
          <span>Service rack</span>
          <input
            type="text"
            value={form.service_rack}
            required
            disabled={isSubmitting}
            onChange={(event) =>
              updateField(
                "service_rack",
                event.target.value,
              )
            }
          />
        </label>

        <label className="to-service-field">
          <span>Priority</span>
          <select
            value={form.priority}
            disabled={isSubmitting}
            onChange={(event) =>
              updateField(
                "priority",
                event.target.value,
              )
            }
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>

        <label className="to-service-field to-service-field-full">
          <span>Technician</span>
          <select
            value={form.technician}
            disabled={isSubmitting}
            onChange={(event) =>
              updateField(
                "technician",
                event.target.value,
              )
            }
          >
            <option value="">Unassigned</option>
            {technicians.map(
              (technician) => (
                <option
                  key={technician.id}
                  value={technician.id}
                >
                  {technician.name || technician.username}
                </option>
              ),
            )}
          </select>
        </label>

        {errorMessage ? (
          <div
            className="sale-draft-error"
            role="alert"
          >
            {errorMessage}
          </div>
        ) : null}

        </div>

        <div className="to-service-dialog-actions">
          <button
            type="button"
            className="button button-secondary"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="button button-primary"
            disabled={
              isSubmitting
              || !form.issue.trim()
              || !form.service_rack.trim()
            }
          >
            {isSubmitting
              ? "Moving..."
              : "Move to Service"}
          </button>
        </div>
      </form>
    </dialog>
  );
}


export default ToServiceDialog;
