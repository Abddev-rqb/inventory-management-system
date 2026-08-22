import { useEffect, useRef, useState } from "react";

const EMPTY_FORM = {
  item_name: "",
  unit_price: "",
  quantity: "1",
};

function ReturnExpenseDialog({
  isOpen,
  returnRecord,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}) {
  const dialogRef = useRef(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      setForm(EMPTY_FORM);
      dialog.showModal();
      return;
    }

    if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen, returnRecord]);

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
      item_name: form.item_name.trim(),
      unit_price: form.unit_price,
      quantity: Number(form.quantity),
    });
  }

  return (
    <dialog
      ref={dialogRef}
      className="return-form-dialog"
      onCancel={(event) => {
        event.preventDefault();
        if (!isSubmitting) onClose();
      }}
    >
      <form className="return-form-card return-expense-form" onSubmit={handleSubmit}>
        <header className="return-form-header">
          <div>
            <p className="application-eyebrow">Returns</p>
            <h2>Add Expense</h2>
            {returnRecord ? (
              <p className="return-expense-laptop-caption">
                {returnRecord.company} {returnRecord.model_number} · {returnRecord.serial_number}
              </p>
            ) : null}
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
            <div className="form-level-error" role="alert">
              {errorMessage}
            </div>
          ) : null}

          <div className="return-form-grid">
            <label className="return-field return-field-full">
              <span>Item Name</span>
              <input
                name="item_name"
                value={form.item_name}
                onChange={handleChange}
                required
              />
            </label>

            <label className="return-field">
              <span>Price</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                name="unit_price"
                value={form.unit_price}
                onChange={handleChange}
                required
              />
            </label>

            <label className="return-field">
              <span>Quantity</span>
              <input
                type="number"
                min="1"
                step="1"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                required
              />
            </label>
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
            {isSubmitting ? "Saving..." : "Submit"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}

export default ReturnExpenseDialog;
