import {
  useEffect,
  useRef,
  useState,
} from "react";


function getInitialForm(
  returnRecord,
) {
  return {
    customer_name:
      returnRecord?.customer_name || "",

    company:
      returnRecord?.company || "",

    display_type:
      returnRecord?.display_type || "non_touch",

    model_number:
      returnRecord?.model_number || "",

    processor:
      returnRecord?.processor || "",

    processor_generation:
      returnRecord?.processor_generation || "",

    ram_gb:
      returnRecord?.ram_gb ?? "",

    storage_gb:
      returnRecord?.storage_gb ?? "",

    storage_type:
      returnRecord?.storage_type || "ssd",

    serial_number:
      returnRecord?.serial_number || "",

    issue:
      returnRecord?.issue || "",

    service_rack:
      returnRecord?.service_rack || "",

    repair_notes:
      returnRecord?.repair_notes || "",
  };
}


function ReturnEditDialog({
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
    form,
    setForm,
  ] = useState(
    getInitialForm(null),
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
      setForm(
        getInitialForm(
          returnRecord,
        ),
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


  function handleChange(
    event,
  ) {
    const {
      name,
      value,
    } = event.target;

    setForm(
      (current) => ({
        ...current,
        [name]: value,
      }),
    );
  }


  function handleSubmit(
    event,
  ) {
    event.preventDefault();

    onSubmit({
      ...form,

      ram_gb:
        Number(
          form.ram_gb,
        ),

      storage_gb:
        Number(
          form.storage_gb,
        ),
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

            <h2>
              Edit Return
            </h2>
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
                <option value="ssd">
                  SSD
                </option>

                <option value="hdd">
                  HDD
                </option>
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


            <Field
              label="Repair Notes"
              fullWidth
            >
              <textarea
                rows="4"
                name="repair_notes"
                value={form.repair_notes}
                onChange={handleChange}
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
              ? "Saving..."
              : "Save Changes"}
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
      <span>
        {label}
      </span>

      {children}
    </label>
  );
}


export default ReturnEditDialog;