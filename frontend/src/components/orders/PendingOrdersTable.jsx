function PendingOrdersTable({
  orders,
  isSelectionMode,
  selectedOrderIds,
  isProcessing = false,
  processingOrderId = null,
  deletingOrderId = null,
  canDeleteOrders = false,
  onToggleOrder,
  onToggleAllOrders,
  onDispatchOrder,
  onDeleteOrder,
  canViewTotalAmount = true,
}) {
  const selectableOrderIds =
    orders
      .map(
        (order) =>
          Number(
            order.id,
          ),
      )
      .filter(
        (orderId) =>
          Number.isInteger(
            orderId,
          ),
      );

  const selectedVisibleCount =
    selectableOrderIds.filter(
      (orderId) =>
        selectedOrderIds.has(
          orderId,
        ),
    ).length;

  const allVisibleSelected =
    selectableOrderIds.length >
      0 &&
    selectedVisibleCount ===
      selectableOrderIds.length;

  const someVisibleSelected =
    selectedVisibleCount > 0 &&
    !allVisibleSelected;


  return (
    <div className="table-scroll-container">
      <table className="pending-orders-table">
        <thead>
          <tr>
            {isSelectionMode ? (
              <th
                scope="col"
                className="order-selection-column"
              >
                <input
                  type="checkbox"
                  aria-label={
                    (
                      "Select all pending " +
                      "orders on this page"
                    )
                  }
                  checked={
                    allVisibleSelected
                  }
                  ref={
                    (checkbox) => {
                      if (
                        checkbox
                      ) {
                        checkbox.indeterminate =
                          someVisibleSelected;
                      }
                    }
                  }
                  disabled={
                    isProcessing ||
                    selectableOrderIds
                      .length ===
                      0
                  }
                  onChange={
                    onToggleAllOrders
                  }
                />
              </th>
            ) : null}


            <th scope="col">
              Order number
            </th>

            <th scope="col">
              Employee
            </th>

            <th scope="col">
              Customer
            </th>

            <th scope="col">
              Customer address
            </th>

            <th scope="col">
              Items
            </th>

            <th scope="col">
              Total items
            </th>

            {canViewTotalAmount ? (
              <th scope="col">
                Total amount
              </th>
            ) : null}

            <th scope="col">
              Price mode
            </th>

            <th scope="col">
              Via
            </th>

            <th scope="col">
              Created
            </th>

            {!isSelectionMode ? (
              <th scope="col">
                Actions
              </th>
            ) : null}
          </tr>
        </thead>


        <tbody>
          {orders.map(
            (order) => {
              const orderId =
                Number(
                  order.id,
                );

              const isSelected =
                selectedOrderIds.has(
                  orderId,
                );

              const isThisOrderProcessing =
                processingOrderId ===
                orderId;

              const isThisOrderDeleting =
                deletingOrderId ===
                orderId;


              return (
                <tr
                  key={
                    order.id
                  }
                  className={
                    isSelected
                      ? "pending-order-selected"
                      : undefined
                  }
                >
                  {isSelectionMode ? (
                    <td className="order-selection-column">
                      <input
                        type="checkbox"
                        checked={
                          isSelected
                        }
                        aria-label={
                          (
                            `Select order ` +
                            `${order.order_number}`
                          )
                        }
                        disabled={
                          isProcessing
                        }
                        onChange={() =>
                          onToggleOrder(
                            order,
                          )
                        }
                      />
                    </td>
                  ) : null}


                  <td>
                    <strong>
                      {displayValue(
                        order.order_number,
                      )}
                    </strong>
                  </td>


                  <td>
                    {displayValue(
                      order.employee_name,
                    )}
                  </td>


                  <td>
                    {displayValue(
                      order.customer_name,
                    )}
                  </td>


                  <td>
                    {displayValue(
                      order.customer_address,
                    )}
                  </td>


                  <td>
                    <OrderItemsCell
                      items={
                        order.items
                      }
                    />
                  </td>


                  <td>
                    {displayValue(
                      order.total_items,
                    )}
                  </td>


                  {canViewTotalAmount ? (
                    <td>
                      {formatMoney(
                        order.total_amount,
                      )}
                    </td>
                  ) : null}


                  <td>
                    {displayValue(
                      order
                        .price_mode_label ||
                        formatChoice(
                          order
                            .price_mode,
                        ),
                    )}
                  </td>


                  <td>
                    {getViaLabel(
                      order,
                    )}
                  </td>


                  <td>
                    {formatDateTime(
                      order.created_at,
                    )}
                  </td>


                  {!isSelectionMode ? (
                    <td>
                      <div className="pending-order-row-actions">
                        <button
                          type="button"
                          className={
                            (
                              "button " +
                              "button-secondary " +
                              "pending-order-" +
                              "dispatch-button"
                            )
                          }
                          disabled={
                            isProcessing
                          }
                          onClick={() =>
                            onDispatchOrder(
                              order,
                            )
                          }
                        >
                          {isThisOrderProcessing
                            ? "Dispatching..."
                            : "Dispatch"}
                        </button>


                        {canDeleteOrders ? (
                          <button
                            type="button"
                            className="button button-danger"
                            disabled={
                              isProcessing
                            }
                            onClick={() =>
                              onDeleteOrder(
                                order,
                              )
                            }
                          >
                            {isThisOrderDeleting
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
              );
            },
          )}
        </tbody>
      </table>
    </div>
  );
}


function OrderItemsCell({
  items,
}) {
  if (
    !Array.isArray(
      items,
    ) ||
    items.length === 0
  ) {
    return "—";
  }

  return (
    <div className="pending-order-items">
      {items.map(
        (item) => (
          <span
            key={
              item.id
            }
          >
            {displayValue(
              item.item_name,
            )}

            {" — "}

            {displayValue(
              item.quantity,
            )}

            {" "}

            {
              Number(
                item.quantity,
              ) === 1
                ? "pc"
                : "pcs"
            }
          </span>
        ),
      )}
    </div>
  );
}


function getViaLabel(
  order,
) {
  if (
    order.via ===
      "other" &&
    order.via_other
  ) {
    return (
      order.via_other
    );
  }

  return (
    order.via_label ||
    formatChoice(
      order.via,
    )
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


function displayValue(
  value,
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return value;
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

  return (
    new Intl.NumberFormat(
      "en-IN",
      {
        style:
          "currency",

        currency:
          "INR",

        maximumFractionDigits:
          2,
      },
    )
    .format(
      amount,
    )
  );
}


function formatDateTime(
  value,
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return (
    new Intl.DateTimeFormat(
      "en-IN",
      {
        dateStyle:
          "medium",

        timeStyle:
          "short",
      },
    )
    .format(
      date,
    )
  );
}


export default PendingOrdersTable;