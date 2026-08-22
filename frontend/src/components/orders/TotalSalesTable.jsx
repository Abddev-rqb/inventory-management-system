function TotalSalesTable({
  sales,
}) {
  return (
    <div className="table-scroll-container">
      <table className="total-sales-table">
        <thead>
          <tr>
            <th scope="col">
              Employee
            </th>

            <th scope="col">
              Order number
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
              Serial numbers
            </th>

            <th scope="col">
              Total items
            </th>

            <th scope="col">
              Total amount
            </th>

            <th scope="col">
              Price mode
            </th>

            <th scope="col">
              Via
            </th>

            <th scope="col">
              Created
            </th>

            <th scope="col">
              Dispatched
            </th>
          </tr>
        </thead>

        <tbody>
          {sales.map(
            (sale) => (
              <tr
                key={sale.id}
              >
                <td>
                  {displayValue(
                    sale.employee_name,
                  )}
                </td>

                <td>
                  <strong>
                    {displayValue(
                      sale.order_number,
                    )}
                  </strong>
                </td>

                <td>
                  {displayValue(
                    sale.customer_name,
                  )}
                </td>

                <td>
                  {displayValue(
                    sale.customer_address,
                  )}
                </td>

                <td>
                  <ItemsCell
                    items={
                      sale.items_text
                    }
                  />
                </td>

                <td>
                  <SerialNumbersCell
                    serialNumbers={
                      sale.serial_numbers
                    }
                  />
                </td>

                <td>
                  {displayValue(
                    sale.total_items,
                  )}
                </td>

                <td>
                  {formatMoney(
                    sale.total_amount,
                  )}
                </td>

                <td>
                  {sale.price_mode_label ||
                    formatChoice(
                      sale.price_mode,
                    )}
                </td>

                <td>
                  {sale.via_label ||
                    formatChoice(
                      sale.via,
                    )}
                </td>

                <td>
                  {formatDateTime(
                    sale.created_at,
                  )}
                </td>

                <td>
                  {formatDateTime(
                    sale.dispatched_at,
                  )}
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}


function ItemsCell({
  items,
}) {
  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return "—";
  }

  return (
    <div className="total-sales-items">
      {items.map(
        (
          item,
          index,
        ) => (
          <span
            key={
              `${item}-${index}`
            }
          >
            {item}
          </span>
        ),
      )}
    </div>
  );
}


function SerialNumbersCell({
  serialNumbers,
}) {
  if (
    !Array.isArray(
      serialNumbers,
    ) ||
    serialNumbers.length === 0
  ) {
    return "—";
  }

  return (
    <div className="total-sales-serial-numbers">
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
      minimumFractionDigits: 2,
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


export default TotalSalesTable;
