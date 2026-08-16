import {
  useEffect,
  useRef,
  useState,
} from "react";


function PriceModeDialog({
  isOpen,
  onClose,
  onConfirm,
}) {
  const dialogRef = useRef(null);

  const [
    selectedMode,
    setSelectedMode,
  ] = useState("retail");

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
      setSelectedMode(
        "retail",
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

  function handleDialogCancel(
    event,
  ) {
    event.preventDefault();
    onClose();
  }

  function handleBackdropClick(
    event,
  ) {
    if (
      event.target ===
      dialogRef.current
    ) {
      onClose();
    }
  }

  function handleSubmit(
    event,
  ) {
    event.preventDefault();

    onConfirm(
      selectedMode,
    );
  }

  return (
    <dialog
      ref={dialogRef}
      className="price-mode-dialog"
      aria-labelledby="price-mode-dialog-title"
      onCancel={
        handleDialogCancel
      }
      onClick={
        handleBackdropClick
      }
    >
      <form
        className="price-mode-dialog-card"
        onSubmit={
          handleSubmit
        }
      >
        <div className="price-mode-dialog-header">
          <div>
            <p className="application-eyebrow">
              Create sale
            </p>

            <h2
              id="price-mode-dialog-title"
            >
              Choose selling price
            </h2>

            <p className="price-mode-dialog-description">
              Select which database
              price should be used for
              the laptops in this sale.
            </p>
          </div>

          <button
            type="button"
            className="dialog-close-button"
            aria-label="Close price selection"
            onClick={
              onClose
            }
          >
            ×
          </button>
        </div>

        <fieldset className="price-mode-options">
          <legend className="sr-only">
            Selling price
          </legend>

          <label className="price-mode-option">
            <input
              type="radio"
              name="priceMode"
              value="retail"
              checked={
                selectedMode ===
                "retail"
              }
              onChange={() => {
                setSelectedMode(
                  "retail",
                );
              }}
            />

            <span>
              <strong>
                Retail price
              </strong>

              <small>
                Use each laptop's
                retail price from
                Django inventory.
              </small>
            </span>
          </label>

          <label className="price-mode-option">
            <input
              type="radio"
              name="priceMode"
              value="wholesale"
              checked={
                selectedMode ===
                "wholesale"
              }
              onChange={() => {
                setSelectedMode(
                  "wholesale",
                );
              }}
            />

            <span>
              <strong>
                Wholesale price
              </strong>

              <small>
                Use each laptop's
                wholesale price from
                Django inventory.
              </small>
            </span>
          </label>
        </fieldset>

        <div className="price-mode-dialog-actions">
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
            Start selection
          </button>
        </div>
      </form>
    </dialog>
  );
}


export default PriceModeDialog;