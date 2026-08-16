import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  isValidCustomItem,
  normalizeCustomItems,
} from "../../utils/orderValidation.js";


function SelectedProductsDialog({
  isOpen,
  selectedLaptops,
  priceMode,
  isSubmitting,
  errorMessage,
  onClose,
  onRemoveLaptop,
  onSubmit,
}) {
  const dialogRef =
    useRef(null);

  const [
    customerName,
    setCustomerName,
  ] = useState("");

  const [
    customerAddress,
    setCustomerAddress,
  ] = useState("");

  const [
    viaValue,
    setViaValue,
  ] = useState("");

  const [
    customItems,
    setCustomItems,
  ] = useState([]);

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

  const products =
    useMemo(
      () =>
        Array.from(
          selectedLaptops.values(),
        ),
      [
        selectedLaptops,
      ],
    );

  const laptopEstimatedTotal =
    useMemo(
      () =>
        products.reduce(
          (
            runningTotal,
            laptop,
          ) => {
            const rawPrice =
              priceMode ===
              "wholesale"
                ? laptop.wholesale_price
                : laptop.retail_price;

            const price =
              Number(rawPrice);

            if (
              !Number.isFinite(
                price,
              )
            ) {
              return runningTotal;
            }

            return (
              runningTotal +
              price
            );
          },
          0,
        ),
      [
        priceMode,
        products,
      ],
    );

  const customItemsTotal =
    useMemo(
      () =>
        customItems.reduce(
          (
            runningTotal,
            item,
          ) => {
            const quantity =
              Number(
                item.quantity,
              );

            const unitPrice =
              Number(
                item.unitPrice,
              );

            if (
              !Number.isFinite(
                quantity,
              ) ||
              !Number.isFinite(
                unitPrice,
              )
            ) {
              return runningTotal;
            }

            return (
              runningTotal +
              (
                quantity *
                unitPrice
              )
            );
          },
          0,
        ),
      [
        customItems,
      ],
    );

  const estimatedTotal =
    (
      laptopEstimatedTotal +
      customItemsTotal
    );

  const hasSelectedLaptops =
  products.length > 0;

const hasCustomItems =
  customItems.length > 0;

const hasAnyItems =
  hasSelectedLaptops ||
  hasCustomItems;

const hasValidCustomItems =
  !hasCustomItems ||
  customItems.every(
    isValidCustomItem,
  );

const hasCustomerName =
  customerName.trim().length >
  0;

const hasVia =
  viaValue.trim().length >
  0;

const canSubmit =
  hasCustomerName &&
  hasVia &&
  hasAnyItems &&
  hasValidCustomItems &&
  !isSubmitting;

  function handleSubmit(
    event,
  ) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    onSubmit({
      customerName:
        customerName.trim(),

      customerAddress:
        customerAddress.trim(),

      via: "other",

      viaOther:
        viaValue.trim(),

      customItems:
        normalizeCustomItems(
          customItems,
        ),
    });
  }

  function handleCancel(
    event,
  ) {
    event.preventDefault();

    if (!isSubmitting) {
      onClose();
    }
  }

  function handleAddCustomItem() {
    setCustomItems(
      (currentItems) => [
        ...currentItems,
        {
          id: createTemporaryId(),
          itemName: "",
          quantity: 1,
          unitPrice: "",
        },
      ],
    );
  }

  function handleCustomItemChange(
    itemId,
    field,
    value,
  ) {
    setCustomItems(
      (currentItems) =>
        currentItems.map(
          (item) =>
            item.id === itemId
              ? {
                  ...item,
                  [field]: value,
                }
              : item,
        ),
    );
  }

  function handleIncreaseQuantity(
    itemId,
  ) {
    setCustomItems(
      (currentItems) =>
        currentItems.map(
          (item) => {
            if (
              item.id !== itemId
            ) {
              return item;
            }

            const quantity =
              Number(
                item.quantity,
              );

            return {
              ...item,
              quantity:
                Number.isInteger(
                  quantity,
                ) &&
                quantity >= 1
                  ? quantity + 1
                  : 1,
            };
          },
        ),
    );
  }

  function handleDecreaseQuantity(
    itemId,
  ) {
    setCustomItems(
      (currentItems) =>
        currentItems.map(
          (item) => {
            if (
              item.id !== itemId
            ) {
              return item;
            }

            const quantity =
              Number(
                item.quantity,
              );

            return {
              ...item,
              quantity:
                Number.isInteger(
                  quantity,
                ) &&
                quantity > 1
                  ? quantity - 1
                  : 1,
            };
          },
        ),
    );
  }

  function handleRemoveCustomItem(
    itemId,
  ) {
    setCustomItems(
      (currentItems) =>
        currentItems.filter(
          (item) =>
            item.id !==
            itemId,
        ),
    );
  }

  return (
    <dialog
      ref={dialogRef}
      className="sale-draft-dialog"
      aria-labelledby="sale-draft-title"
      onCancel={
        handleCancel
      }
    >
      <form
        className="sale-draft-card"
        onSubmit={
          handleSubmit
        }
      >
        <header className="sale-draft-header">
          <div>
            <p className="application-eyebrow">
              New sale
            </p>

            <h2
              id="sale-draft-title"
            >
              Selected Products
            </h2>

            <p className="sale-draft-description">
              {
                products.length
              } selected laptop
              {
                products.length === 1
                  ? ""
                  : "s"
              }
              {" · "}
              {
                priceMode ===
                "wholesale"
                  ? "Wholesale"
                  : "Retail"
              }
            </p>
          </div>

          <button
            type="button"
            className="dialog-close-button"
            aria-label="Close sale draft"
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
            className="sale-draft-error"
            role="alert"
          >
            {errorMessage}
          </div>
        ) : null}

        <div className="sale-draft-scroll-area">

            {products.length > 0 ? (
            <section className="sale-draft-section">
                <div className="sale-draft-section-header">
                <div>
                    <h3>
                    Selected laptops
                    </h3>

                    <p>
                    Laptop prices shown here are
                    estimates from the current
                    inventory response.
                    </p>
                </div>
                </div>

                <div className="sale-draft-table-container">
                <table className="sale-draft-table">
                    <thead>
                    <tr>
                        <th>
                        ID
                        </th>

                        <th>
                        Product
                        </th>

                        <th>
                        Serial
                        </th>

                        <th>
                        Qty
                        </th>

                        <th>
                        Price
                        </th>

                        <th>
                        Total
                        </th>

                        <th>
                        Action
                        </th>
                    </tr>
                    </thead>

                    <tbody>
                    {products.map(
                        (laptop) => {
                        const price =
                            priceMode ===
                            "wholesale"
                            ? laptop.wholesale_price
                            : laptop.retail_price;

                        return (
                            <tr
                            key={
                                laptop.id
                            }
                            >
                            <td>
                                {
                                laptop.id
                                }
                            </td>

                            <td>
                                {buildProductName(
                                laptop,
                                )}
                            </td>

                            <td>
                                {
                                laptop.serial_number
                                }
                            </td>

                            <td>
                                1
                            </td>

                            <td>
                                {formatMoney(
                                price,
                                )}
                            </td>

                            <td>
                                {formatMoney(
                                price,
                                )}
                            </td>

                            <td>
                                <button
                                type="button"
                                className="button-link-danger"
                                disabled={
                                    isSubmitting
                                }
                                onClick={() =>
                                    onRemoveLaptop(
                                    laptop.id,
                                    )
                                }
                                >
                                Remove
                                </button>
                            </td>
                            </tr>
                        );
                        },
                    )}
                    </tbody>
                </table>
                </div>
            </section>
            ) : null}

            <section className="sale-draft-section">
            <div className="sale-draft-section-header">
                <div>
                <h3>
                    Additional items
                </h3>

                <p>
                    Add accessories or other
                    non-laptop items to this sale.
                </p>
                </div>

                <button
                type="button"
                className="button button-secondary"
                disabled={
                    isSubmitting
                }
                onClick={
                    handleAddCustomItem
                }
                >
                Add +
                </button>
            </div>

            {customItems.length === 0 ? (
                <div className="custom-items-empty">
                No additional items added.
                </div>
            ) : (
                <div className="sale-draft-table-container">
                <table className="sale-draft-table custom-items-table">
                    <thead>
                    <tr>
                        <th>
                        Item
                        </th>

                        <th>
                        Quantity
                        </th>

                        <th>
                        Unit price
                        </th>

                        <th>
                        Total
                        </th>

                        <th>
                        Action
                        </th>
                    </tr>
                    </thead>

                    <tbody>
                    {customItems.map(
                        (item) => (
                        <CustomItemRow
                            key={
                            item.id
                            }
                            item={
                            item
                            }
                            disabled={
                            isSubmitting
                            }
                            onChange={
                            handleCustomItemChange
                            }
                            onIncrease={
                            handleIncreaseQuantity
                            }
                            onDecrease={
                            handleDecreaseQuantity
                            }
                            onRemove={
                            handleRemoveCustomItem
                            }
                        />
                        ),
                    )}
                    </tbody>
                </table>
                </div>
            )}
            </section>

            <div className="sale-draft-summary">
            <span>
                Laptop subtotal
            </span>

            <strong>
                {formatMoney(
                laptopEstimatedTotal,
                )}
            </strong>

            <span>
                Additional items
            </span>

            <strong>
                {formatMoney(
                customItemsTotal,
                )}
            </strong>

            <span className="sale-draft-grand-total-label">
                Estimated total
            </span>

            <strong className="sale-draft-grand-total">
                {formatMoney(
                estimatedTotal,
                )}
            </strong>

            <small>
                Django recalculates laptop
                pricing and final order totals
                when the sale is created.
            </small>
            </div>

            <section className="sale-customer-section">
            <h3>
                Customer details
            </h3>

            <div className="sale-form-grid">
                <label className="sale-field">
                <span>
                    Customer name *
                </span>

                <input
                    type="text"
                    value={
                    customerName
                    }
                    maxLength={150}
                    required
                    disabled={
                    isSubmitting
                    }
                    onChange={
                    (event) =>
                        setCustomerName(
                        event
                            .target
                            .value,
                        )
                    }
                />
                </label>

                <label className="sale-field sale-field-full">
                <span>
                    Customer address
                </span>

                <textarea
                    value={
                    customerAddress
                    }
                    rows={3}
                    disabled={
                    isSubmitting
                    }
                    onChange={
                    (event) =>
                        setCustomerAddress(
                        event
                            .target
                            .value,
                        )
                    }
                />
                </label>

                <label className="sale-field">
                  <span>
                    Via *
                  </span>

                  <input
                    type="text"
                    value={
                      viaValue
                    }
                    maxLength={150}
                    required
                    disabled={
                      isSubmitting
                    }
                    placeholder="e.g. A1 Courier, ST Courier, Customer"
                    onChange={
                      (event) =>
                        setViaValue(
                          event
                            .target
                            .value,
                        )
                    }
                  />
                </label>
            </div>
            </section>

        </div>

        <footer className="sale-draft-actions">
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
            Continue selecting
          </button>

          <button
            type="submit"
            className="button button-primary"
            disabled={
              !canSubmit
            }
          >
            {isSubmitting
              ? "Creating sale..."
              : "Sale"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}


function CustomItemRow({
  item,
  disabled,
  onChange,
  onIncrease,
  onDecrease,
  onRemove,
}) {
  const quantity =
    Number(
      item.quantity,
    );

  const unitPrice =
    Number(
      item.unitPrice,
    );

  const lineTotal =
    (
      Number.isFinite(
        quantity,
      ) &&
      Number.isFinite(
        unitPrice,
      )
    )
      ? quantity *
        unitPrice
      : 0;

  return (
    <tr>
      <td className="custom-item-name-cell">
        <input
          type="text"
          className="custom-item-input"
          value={
            item.itemName
          }
          placeholder="e.g. Adapter"
          maxLength={255}
          disabled={
            disabled
          }
          onChange={
            (event) =>
              onChange(
                item.id,
                "itemName",
                event.target.value,
              )
          }
        />
      </td>

      <td>
        <div className="quantity-control">
          <button
            type="button"
            className="quantity-control-button"
            aria-label={
              `Decrease ${item.itemName || "item"} quantity`
            }
            disabled={
              disabled ||
              quantity <= 1
            }
            onClick={() =>
              onDecrease(
                item.id,
              )
            }
          >
            −
          </button>

          <input
            type="number"
            className="quantity-control-input"
            min="1"
            step="1"
            value={
              item.quantity
            }
            disabled={
              disabled
            }
            onChange={
              (event) =>
                onChange(
                  item.id,
                  "quantity",
                  event.target.value,
                )
            }
          />

          <button
            type="button"
            className="quantity-control-button"
            aria-label={
              `Increase ${item.itemName || "item"} quantity`
            }
            disabled={
              disabled
            }
            onClick={() =>
              onIncrease(
                item.id,
              )
            }
          >
            +
          </button>
        </div>
      </td>

      <td>
        <input
          type="number"
          className="custom-item-input custom-item-price-input"
          min="0"
          step="0.01"
          value={
            item.unitPrice
          }
          placeholder="0.00"
          disabled={
            disabled
          }
          onChange={
            (event) =>
              onChange(
                item.id,
                "unitPrice",
                event.target.value,
              )
          }
        />
      </td>

      <td>
        {formatMoney(
          lineTotal,
        )}
      </td>

      <td>
        <button
          type="button"
          className="button-link-danger"
          disabled={
            disabled
          }
          onClick={() =>
            onRemove(
              item.id,
            )
          }
        >
          Remove
        </button>
      </td>
    </tr>
  );
}


function createTemporaryId() {
  if (
    typeof crypto !==
      "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return (
      crypto.randomUUID()
    );
  }

  return (
    `custom-${Date.now()}-${Math.random()}`
  );
}


function buildProductName(
  laptop,
) {
  return [
    laptop.model_number,
    laptop.processor,
    laptop.processor_generation,
    `${laptop.ram_gb}/${laptop.storage_gb}`,
  ]
    .filter(Boolean)
    .join(" ");
}


function formatMoney(
  value,
) {
  const amount =
    Number(value);

  if (
    !Number.isFinite(
      amount,
    )
  ) {
    return "—";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    },
  ).format(
    amount,
  );
}


export default SelectedProductsDialog;