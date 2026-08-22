import {
  useEffect,
  useRef,
  useState,
} from "react";


const EMPTY_FORM = {
  customer_name: "",
  customer_address: "",
  company: "",
  display_type: "non_touch",
  model_number: "",
  processor: "",
  processor_generation: "",
  ram_gb: "",
  storage_gb: "",
  storage_type: "ssd",
  serial_number: "",
  issue: "",
  service_rack: "",
  technician: "",
};


function ReturnFormDialog({
  isOpen,
  technicians = [],
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}) {
  const dialogRef = useRef(null);

  const [form, setForm] = useState(
    EMPTY_FORM,
  );


  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (isOpen && !dialog.open) {
      setForm(EMPTY_FORM);
      dialog.showModal();
      return;
    }

    if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);


  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }


  function handleSubmit(event) {
    event.preventDefault();

    onSubmit({
      ...form,
      customer_name:
        form.customer_name.trim(),
      customer_address:
        form.customer_address.trim(),
      company:
        form.company.trim(),
      model_number:
        form.model_number.trim(),
      processor:
        form.processor.trim(),
      processor_generation:
        form.processor_generation.trim(),
      serial_number:
        form.serial_number.trim(),
      issue:
        form.issue.trim(),
      service_rack:
        form.service_rack.trim(),
      ram_gb:
        Number(form.ram_gb),
      storage_gb:
        Number(form.storage_gb),
      technician:
        form.technician
          ? Number(form.technician)
          : null,
    });
  }


  return (
    <dialog
      ref={dialogRef}
      className="return-form-dialog"
      onCancel={(event) => {
        event.preventDefault();

        if (!isSubmitting) {
          onClose();
        }
      }}
    >
      <form
        className="return-form-card"
        onSubmit={handleSubmit}
      >
        <header className="return-form-header">
          <div>
            <p className="application-eyebrow">
              Returns
            </p>

            <h2>Add Return</h2>
          </div>

          <button
            type="button"
            className="dialog-close-button"
            disabled={isSubmitting}
            onClick={onClose}
          >
            ×
          </button>
        </header>


        <div className="return-form-scroll">
          {errorMessage ? (
            <div
              className="form-level-error"
              role="alert"
            >
              {errorMessage}
            </div>
          ) : null}


          <div className="return-form-grid">
            <Field label="Customer Name">
              <input
                name="customer_name"
                value={form.customer_name}
                onChange={handleChange}
                required
              />
            </Field>

            <Field
              label="Customer Address"
              fullWidth
            >
              <textarea
                rows="3"
                name="customer_address"
                value={form.customer_address}
                onChange={handleChange}
                required
              />
            </Field>

            <Field label="Company">
              <input
                name="company"
                value={form.company}
                onChange={handleChange}
                required
              />
            </Field>

            <Field label="Display Type">
              <select
                name="display_type"
                value={form.display_type}
                onChange={handleChange}
              >
                <option value="non_touch">
                  Non-Touch
                </option>
                <option value="touch">
                  Touch
                </option>
              </select>
            </Field>

            <Field label="Model Number">
              <input
                name="model_number"
                value={form.model_number}
                onChange={handleChange}
                required
              />
            </Field>

            <Field label="Processor">
              <input
                name="processor"
                value={form.processor}
                onChange={handleChange}
                required
              />
            </Field>

            <Field label="Processor Generation">
              <input
                name="processor_generation"
                value={form.processor_generation}
                onChange={handleChange}
              />
            </Field>

            <Field label="RAM GB">
              <input
                type="number"
                min="1"
                name="ram_gb"
                value={form.ram_gb}
                onChange={handleChange}
                required
              />
            </Field>

            <Field label="Storage GB">
              <input
                type="number"
                min="1"
                name="storage_gb"
                value={form.storage_gb}
                onChange={handleChange}
                required
              />
            </Field>

            <Field label="Storage Type">
              <select
                name="storage_type"
                value={form.storage_type}
                onChange={handleChange}
              >
                <option value="ssd">SSD</option>
                <option value="hdd">HDD</option>
              </select>
            </Field>

            <Field label="Serial Number">
              <input
                name="serial_number"
                value={form.serial_number}
                onChange={handleChange}
                required
              />
            </Field>

            <Field label="Service Rack">
              <input
                name="service_rack"
                value={form.service_rack}
                onChange={handleChange}
                required
              />
            </Field>

            <Field label="Technician">
              <select
                name="technician"
                value={form.technician}
                onChange={handleChange}
              >
                <option value="">
                  Unassigned
                </option>

                {technicians.map(
                  (technician) => (
                    <option
                      key={technician.id}
                      value={technician.id}
                    >
                      {technician.name
                        || technician.username}
                    </option>
                  ),
                )}
              </select>
            </Field>

            <Field
              label="Issue"
              fullWidth
            >
              <textarea
                rows="4"
                name="issue"
                value={form.issue}
                onChange={handleChange}
                required
              />
            </Field>
          </div>
        </div>


        <footer className="return-form-actions">
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
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Adding..."
              : "Add Return"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}


function Field({
  label,
  children,
  fullWidth = false,
}) {
  return (
    <label
      className={
        fullWidth
          ? "return-field return-field-full"
          : "return-field"
      }
    >
      <span>{label}</span>
      {children}
    </label>
  );
}


export default ReturnFormDialog;
