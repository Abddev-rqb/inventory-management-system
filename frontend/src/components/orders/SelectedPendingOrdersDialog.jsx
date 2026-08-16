import {
  useEffect,
  useMemo,
  useRef,
} from "react";


function SelectedPendingOrdersDialog({
  isOpen,
  orders,
  isProcessing,
  errorMessage,
  onClose,
  onDispatch,
}) {
  const dialogRef =
    useRef(null);

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

  const totalItems =
    useMemo(
      () =>
        orders.reduce(
          (
            total,
            order,
          ) =>
            total +
            (
              Number(
                order.total_items,
              ) ||
              0
            ),
          0,
        ),
      [
        orders,
      ],
    );

  const totalAmount =
    useMemo(
      () =>
        orders.reduce(
          (
            total,
            order,
          ) =>
            total +
            (
              Number(
                order.total_amount,
              ) ||
              0
            ),
          0,
        ),
      [
        orders,
      ],
    );

  function handleCancel(
    event,
  ) {
    event.preventDefault();

    if (
      !isProcessing
    ) {
      onClose();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="pending-dispatch-dialog"
      aria-labelledby="pending-dispatch-title"
      onCancel={
        handleCancel
      }
    >
      <div className="pending-dispatch-card">
        <header className="pending-dispatch-header">
          <div>
            <p className="application-eyebrow">
              Dispatch
            </p>

            <h2
              id="pending-dispatch-title"
            >
              Move selected orders?
            </h2>

            <p>
              These orders will move from
              Pending Orders to Dispatched.
            </p>
          </div>

          <button
            type="button"
            className="dialog-close-button"
            aria-label="Close dispatch confirmation"
            disabled={
              isProcessing
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

        <div className="pending-dispatch-summary">
          <article>
            <span>
              Orders
            </span>

            <strong>
              {
                orders.length
              }
            </strong>
          </article>

          <article>
            <span>
              Items
            </span>

            <strong>
              {
                totalItems
              }
            </strong>
          </article>

          <article>
            <span>
              Amount
            </span>

            <strong>
              {formatMoney(
                totalAmount,
              )}
            </strong>
          </article>
        </div>

        <div className="pending-dispatch-scroll-area">
          <table className="pending-dispatch-table">
            <thead>
              <tr>
                <th>
                  Order
                </th>

                <th>
                  Customer
                </th>

                <th>
                  Items
                </th>

                <th>
                  Amount
                </th>

                <th>
                  Via
                </th>
              </tr>
            </thead>

            <tbody>
              {orders.map(
                (order) => (
                  <tr
                    key={
                      order.id
                    }
                  >
                    <td>
                      <strong>
                        {
                          order.order_number
                        }
                      </strong>
                    </td>

                    <td>
                      {
                        order.customer_name ||
                        "—"
                      }
                    </td>

                    <td>
                      {
                        order.total_items
                      }
                    </td>

                    <td>
                      {formatMoney(
                        order.total_amount,
                      )}
                    </td>

                    <td>
                      {
                        order.via ===
                          "other" &&
                        order.via_other
                          ? order.via_other
                          : (
                              order.via_label ||
                              formatChoice(
                                order.via,
                              )
                            )
                      }
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>

        <footer className="pending-dispatch-actions">
          <button
            type="button"
            className="button button-secondary"
            disabled={
              isProcessing
            }
            onClick={
              onClose
            }
          >
            Cancel
          </button>

          <button
            type="button"
            className="button button-primary"
            disabled={
              isProcessing ||
              orders.length ===
                0
            }
            onClick={
              onDispatch
            }
          >
            {isProcessing
              ? "Moving to dispatched..."
              : "Move to dispatched"}
          </button>
        </footer>
      </div>
    </dialog>
  );
}


function formatChoice(
  value,
) {
  if (!value) {
    return "—";
  }

  return String(
    value,
  )
    .replaceAll(
      "_",
      " ",
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}


function formatMoney(
  value,
) {
  const amount =
    Number(
      value,
    );

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


export default SelectedPendingOrdersDialog;