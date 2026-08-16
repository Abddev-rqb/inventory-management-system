function DispatchedOrdersTable({
  orders,
  isAdmin,
  canRequestDeletion,
  canViewTotalAmount = true,
  isProcessing,
  processingOrderId,
  onRequestDeletion,
  onDeleteOrder,
}) {
  return (
    <div className="table-scroll-container">
      <table className="dispatched-orders-table">
        <thead>
          <tr>
            <th>
              Order number
            </th>

            <th>
              Customer
            </th>

            <th>
              Customer address
            </th>

            <th>
              Items
            </th>

            <th>
              Serial numbers
            </th>

            <th>
              Total items
            </th>

            {canViewTotalAmount ? (
              <th>
                Total amount
              </th>
            ) : null}

            <th>
              Price mode
            </th>

            <th>
              Via
            </th>

            <th>
              Created
            </th>

            <th>
              Dispatched
            </th>

            <th>
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {orders.map(
            (order) => {
              const orderId =
                Number(
                  order.id,
                );

              const processing =
                processingOrderId ===
                  orderId &&
                isProcessing;

              const deletionEligibility =
                getDeletionEligibility(
                  order.dispatched_at,
                );

              return (
                <tr
                  key={
                    order.id
                  }
                >
                  <td>
                    <strong>
                      {order.order_number}
                    </strong>
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
                    <OrderItems
                      items={
                        order.items
                      }
                    />
                  </td>

                  <td>
                    <SerialNumbers
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
                    {order.price_mode_label ||
                      formatChoice(
                        order.price_mode,
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

                  <td>
                    {formatDateTime(
                      order.dispatched_at,
                    )}
                  </td>

                  <td>
                    {isAdmin ? (
                      <button
                        type="button"
                        className="button-link-danger"
                        disabled={
                          isProcessing
                        }
                        onClick={() =>
                          onDeleteOrder(
                            order,
                          )
                        }
                      >
                        {processing
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    ) : canRequestDeletion ? (
                      <div className="dispatched-delete-action">
                        <button
                          type="button"
                          className="button button-secondary"
                          disabled={
                            isProcessing ||
                            !deletionEligibility.eligible
                          }
                          onClick={() =>
                            onRequestDeletion(
                              order,
                            )
                          }
                        >
                          Request deletion
                        </button>

                        {!deletionEligibility.eligible ? (
                          <small>
                            {
                              deletionEligibility.message
                            }
                          </small>
                        ) : null}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            },
          )}
        </tbody>
      </table>
    </div>
  );
}


function OrderItems({
  items,
}) {
  if (
    !Array.isArray(items) ||
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
            {item.item_name}
            {" — "}
            {item.quantity}
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

function SerialNumbers({
  items,
}) {
  if (
    !Array.isArray(
      items,
    )
  ) {
    return "—";
  }

  const serialNumbers =
    items
      .filter(
        (item) =>
          !item.is_custom_item &&
          item.serial_number_snapshot,
      )
      .map(
        (item) =>
          item.serial_number_snapshot,
      );

  if (
    serialNumbers.length ===
    0
  ) {
    return "—";
  }

  return (
    <div className="pending-order-items">
      {serialNumbers.map(
        (
          serialNumber,
          index,
        ) => (
          <span
            key={
              `${serialNumber}-${index}`
            }
          >
            {serialNumber}
          </span>
        ),
      )}
    </div>
  );
}


function getDeletionEligibility(
  dispatchedAt,
) {
  if (!dispatchedAt) {
    return {
      eligible: false,
      message:
        "Dispatch date unavailable.",
    };
  }

  const dispatchedDate =
    new Date(
      dispatchedAt,
    );

  if (
    Number.isNaN(
      dispatchedDate.getTime(),
    )
  ) {
    return {
      eligible: false,
      message:
        "Dispatch date unavailable.",
    };
  }

  const eligibleAt =
    new Date(
      dispatchedDate.getTime() +
        7 *
          24 *
          60 *
          60 *
          1000,
    );

  const now =
    new Date();

  if (
    now >= eligibleAt
  ) {
    return {
      eligible: true,
      message: "",
    };
  }

  const millisecondsLeft =
    eligibleAt.getTime() -
    now.getTime();

  const daysLeft =
    Math.ceil(
      millisecondsLeft /
        (
          24 *
          60 *
          60 *
          1000
        ),
    );

  return {
    eligible: false,
    message:
      daysLeft === 1
        ? "Available in 1 day."
        : `Available in ${daysLeft} days.`,
  };
}


function getViaLabel(
  order,
) {
  if (
    order.via === "other" &&
    order.via_other
  ) {
    return order.via_other;
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

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(
    date,
  );
}


export default DispatchedOrdersTable;