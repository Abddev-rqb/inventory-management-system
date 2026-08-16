import {
  useEffect,
  useRef,
  useState,
} from "react";


function createInitialForm(
  returnRecord,
) {
  return {
    company:
      returnRecord?.company
      || "",

    display_type:
      returnRecord?.display_type
      || "non_touch",

    model_number:
      returnRecord?.model_number
      || "",

    processor:
      returnRecord?.processor
      || "",

    processor_generation:
      returnRecord
        ?.processor_generation
      || "",

    ram_gb:
      returnRecord?.ram_gb
      ?? "",

    storage_gb:
      returnRecord?.storage_gb
      ?? "",

    storage_type:
      returnRecord?.storage_type
      || "ssd",

    serial_number:
      returnRecord?.serial_number
      || "",

    wholesale_price: "",

    retail_price: "",

    qc_status:
      "done",

    inventory_status:
      "in_stock",

    warranty_days:
      "0",

    area: "",

    comments:
      (
        "Stocked in from return"
      ),
  };
}


function ReturnStockInDialog({
  isOpen,
  returnRecord,
  errorMessage,
  onClose,
  onContinue,
}) {
  const dialogRef =
    useRef(null);

  const [
    form,
    setForm,
  ] = useState(
    createInitialForm(
      null,
    ),
  );


  useEffect(() => {
    const dialog =
      dialogRef.current;

    if (!dialog) {
      return;
    }

    if (
      isOpen
      &&
      !dialog.open
    ) {
      setForm(
        createInitialForm(
          returnRecord,
        ),
      );

      dialog.showModal();

      return;
    }

    if (
      !isOpen
      &&
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
      (
        currentForm,
      ) => ({
        ...currentForm,

        [name]:
          value,
      }),
    );
  }


  function handleSubmit(
    event,
  ) {
    event.preventDefault();

    const wholesalePrice =
      Number(
        form.wholesale_price,
      );

    const retailPrice =
      Number(
        form.retail_price,
      );

    if (
      Number.isNaN(
        wholesalePrice,
      )
      ||
      Number.isNaN(
        retailPrice,
      )
    ) {
      return;
    }

    onContinue({
      ...form,

      ram_gb:
        Number(
          form.ram_gb,
        ),

      storage_gb:
        Number(
          form.storage_gb,
        ),

      wholesale_price:
        form.wholesale_price,

      retail_price:
        form.retail_price,

      warranty_days:
        Number(
          form.warranty_days,
        ),
    });
  }


  return (
    <dialog
      ref={dialogRef}
      className="return-stock-in-dialog"
      onCancel={
        (event) => {
          event.preventDefault();

          onClose();
        }
      }
    >
      <form
        className="return-stock-in-card"
        onSubmit={
          handleSubmit
        }
      >
        <header className="return-stock-in-header">
          <div>
            <p className="application-eyebrow">
              Returns
            </p>

            <h2>
              Stock In Returned Laptop
            </h2>
          </div>

          <button
            type="button"
            className="dialog-close-button"
            onClick={
              onClose
            }
          >
            ×
          </button>
        </header>


        <div className="return-stock-in-scroll">
          <div className="return-workflow-summary">
            <strong>
              {
                returnRecord
                  ?.customer_name
              }
            </strong>

            <span>
              Return ID:{" "}
              {
                returnRecord?.id
              }
            </span>

            <span>
              Status:{" "}
              {
                returnRecord
                  ?.status_label
                ||
                returnRecord
                  ?.status
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


          <StockInSection
            title="Laptop Details"
          >
            <StockInField
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
            </StockInField>


            <StockInField
              label="Display Type"
            >
              <select
                name="display_type"
                value={
                  form.display_type
                }
                onChange={
                  handleChange
                }
                required
              >
                <option value="non_touch">
                  Non-Touch
                </option>

                <option value="touch">
                  Touch
                </option>
              </select>
            </StockInField>


            <StockInField
              label="Model Number"
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
            </StockInField>


            <StockInField
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
            </StockInField>


            <StockInField
              label="Processor Generation"
            >
              <input
                name="processor_generation"
                value={
                  form
                    .processor_generation
                }
                onChange={
                  handleChange
                }
              />
            </StockInField>


            <StockInField
              label="RAM GB"
            >
              <input
                type="number"
                min="1"
                step="1"
                name="ram_gb"
                value={
                  form.ram_gb
                }
                onChange={
                  handleChange
                }
                required
              />
            </StockInField>


            <StockInField
              label="Storage GB"
            >
              <input
                type="number"
                min="1"
                step="1"
                name="storage_gb"
                value={
                  form.storage_gb
                }
                onChange={
                  handleChange
                }
                required
              />
            </StockInField>


            <StockInField
              label="Storage Type"
            >
              <select
                name="storage_type"
                value={
                  form.storage_type
                }
                onChange={
                  handleChange
                }
                required
              >
                <option value="ssd">
                  SSD
                </option>

                <option value="hdd">
                  HDD
                </option>
              </select>
            </StockInField>


            <StockInField
              label="Serial Number"
              fullWidth
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
            </StockInField>
          </StockInSection>


          <StockInSection
            title="Pricing"
          >
            <StockInField
              label="Wholesale Price"
            >
              <input
                type="number"
                min="0"
                step="0.01"
                name="wholesale_price"
                value={
                  form.wholesale_price
                }
                onChange={
                  handleChange
                }
                required
              />
            </StockInField>


            <StockInField
              label="Retail Price"
            >
              <input
                type="number"
                min="0"
                step="0.01"
                name="retail_price"
                value={
                  form.retail_price
                }
                onChange={
                  handleChange
                }
                required
              />
            </StockInField>
          </StockInSection>


          <StockInSection
            title="Inventory"
          >
            <StockInField
              label="QC Status"
            >
              <select
                name="qc_status"
                value={
                  form.qc_status
                }
                onChange={
                  handleChange
                }
                required
              >
                <option value="done">
                  Done
                </option>

                <option value="pending">
                  Pending
                </option>
              </select>
            </StockInField>


            <StockInField
              label="Inventory Status"
            >
              <select
                name="inventory_status"
                value={
                  form
                    .inventory_status
                }
                onChange={
                  handleChange
                }
                required
              >
                <option value="in_stock">
                  In Stock
                </option>

                <option value="in_stock_g">
                  In Stock G
                </option>

                <option value="in_service">
                  In Service
                </option>
              </select>
            </StockInField>


            <StockInField
              label="Warranty Days"
            >
              <select
                name="warranty_days"
                value={
                  form.warranty_days
                }
                onChange={
                  handleChange
                }
                required
              >
                <option value="0">
                  0
                </option>

                <option value="7">
                  7
                </option>

                <option value="15">
                  15
                </option>

                <option value="30">
                  30
                </option>
              </select>
            </StockInField>


            <StockInField
              label="Area"
            >
              <input
                name="area"
                value={
                  form.area
                }
                onChange={
                  handleChange
                }
                required
              />
            </StockInField>


            <StockInField
              label="Comments"
              fullWidth
            >
              <textarea
                rows="4"
                name="comments"
                value={
                  form.comments
                }
                onChange={
                  handleChange
                }
              />
            </StockInField>
          </StockInSection>
        </div>


        <footer className="return-stock-in-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={
              onClose
            }
          >
            Cancel
          </button>

          <button
            type="submit"
            className="button button-primary"
          >
            Continue
          </button>
        </footer>
      </form>
    </dialog>
  );
}


function StockInSection({
  title,
  children,
}) {
  return (
    <section className="return-stock-in-section">
      <h3>
        {title}
      </h3>

      <div className="return-stock-in-grid">
        {children}
      </div>
    </section>
  );
}


function StockInField({
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


export default ReturnStockInDialog;