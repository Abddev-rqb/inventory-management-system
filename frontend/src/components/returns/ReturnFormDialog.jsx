import {
  useEffect,
  useRef,
  useState,
} from "react";


const INITIAL_FORM = {
  customer_name: "",
  company: "",
  display_type:
    "non_touch",
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
  technicians,
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
    INITIAL_FORM,
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
        INITIAL_FORM,
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
  ]);


  function handleChange(
    event,
  ) {
    const {
      name,
      value,
    } = event.target;

    setForm(
      (
        currentForm,
      ) => ({
        ...currentForm,
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

      technician:
        form.technician
          ? Number(
              form.technician,
            )
          : null,
    });
  }


  return (
    <dialog
      ref={dialogRef}
      className="return-form-dialog"
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
        className="return-form-card"
        onSubmit={
          handleSubmit
        }
      >
        <header className="return-form-header">
          <div>
            <p className="application-eyebrow">
              Returns
            </p>

            <h2>
              Add Return
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


        {errorMessage ? (
          <div
            className="form-level-error"
            role="alert"
          >
            {errorMessage}
          </div>
        ) : null}


        <div className="return-form-scroll">
          <ReturnFormSection
            title="Customer"
          >
            <ReturnField
              label="Customer name"
            >
              <input
                name="customer_name"
                value={
                  form.customer_name
                }
                onChange={
                  handleChange
                }
                required
              />
            </ReturnField>
          </ReturnFormSection>


          <ReturnFormSection
            title="Laptop details"
          >
            <ReturnField
              label="Company"
            >
              <input
                name="company"
                value={
                  form.company
                }
                onChange={
                  handleChange
                }
                required
              />
            </ReturnField>


            <ReturnField
              label="Display type"
            >
              <select
                name="display_type"
                value={
                  form.display_type
                }
                onChange={
                  handleChange
                }
              >
                <option value="non_touch">
                  Non-Touch
                </option>

                <option value="touch">
                  Touch
                </option>
              </select>
            </ReturnField>


            <ReturnField
              label="Model number"
            >
              <input
                name="model_number"
                value={
                  form.model_number
                }
                onChange={
                  handleChange
                }
                required
              />
            </ReturnField>


            <ReturnField
              label="Processor"
            >
              <input
                name="processor"
                value={
                  form.processor
                }
                onChange={
                  handleChange
                }
                required
              />
            </ReturnField>


            <ReturnField
              label="Processor generation"
            >
              <input
                name="processor_generation"
                value={
                  form.processor_generation
                }
                onChange={
                  handleChange
                }
              />
            </ReturnField>


            <ReturnField
              label="RAM GB"
            >
              <input
                type="number"
                name="ram_gb"
                min="1"
                step="1"
                value={
                  form.ram_gb
                }
                onChange={
                  handleChange
                }
                required
              />
            </ReturnField>


            <ReturnField
              label="Storage GB"
            >
              <input
                type="number"
                name="storage_gb"
                min="1"
                step="1"
                value={
                  form.storage_gb
                }
                onChange={
                  handleChange
                }
                required
              />
            </ReturnField>


            <ReturnField
              label="Storage type"
            >
              <select
                name="storage_type"
                value={
                  form.storage_type
                }
                onChange={
                  handleChange
                }
              >
                <option value="ssd">
                  SSD
                </option>

                <option value="hdd">
                  HDD
                </option>
              </select>
            </ReturnField>


            <ReturnField
              label="Serial number"
            >
              <input
                name="serial_number"
                value={
                  form.serial_number
                }
                onChange={
                  handleChange
                }
                required
              />
            </ReturnField>
          </ReturnFormSection>


          <ReturnFormSection
            title="Service"
          >
            <ReturnField
              label="Issue"
              fullWidth
            >
              <textarea
                name="issue"
                rows="4"
                value={
                  form.issue
                }
                onChange={
                  handleChange
                }
                required
              />
            </ReturnField>


            <ReturnField
              label="Service rack"
            >
              <input
                name="service_rack"
                value={form.service_rack}
                placeholder="Enter service rack"
                onChange={handleChange}
                required
              />
            </ReturnField>


            <ReturnField
              label="Technician"
            >
              <select
                name="technician"
                value={
                  form.technician
                }
                onChange={
                  handleChange
                }
              >
                <option value="">
                  Unassigned
                </option>

                {technicians.map(
                  (
                    technician,
                  ) => (
                    <option
                      key={
                        technician.id
                      }
                      value={
                        technician.id
                      }
                    >
                      {
                        technician.name
                      }
                    </option>
                  ),
                )}
              </select>
            </ReturnField>
          </ReturnFormSection>
        </div>


        <footer className="return-form-actions">
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
              : "Add Return"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}


function ReturnFormSection({
  title,
  children,
}) {
  return (
    <section className="return-form-section">
      <h3>
        {title}
      </h3>

      <div className="return-form-grid">
        {children}
      </div>
    </section>
  );
}


function ReturnField({
  label,
  children,
  fullWidth = false,
}) {
  return (
    <label
      className={
        fullWidth
          ? (
              "return-field "
              + "return-field-full"
            )
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


export default ReturnFormDialog;