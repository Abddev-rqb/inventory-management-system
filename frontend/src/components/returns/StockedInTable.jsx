function StockedInTable({
  records,
}) {
  return (
    <div className="returns-table-section">
      <div className="table-scroll-container">
        <table className="data-table stocked-in-table">
          <thead>
            <tr>
              <th>
                Customer Name
              </th>

              <th>
                Laptop Details
              </th>

              <th>
                Serial Number
              </th>

              <th>
                Wholesale Price
              </th>

              <th>
                Retail Price
              </th>

              <th>
                Inventory Status
              </th>

              <th>
                Area
              </th>

              <th>
                Stocked In By
              </th>

              <th>
                Stocked In Date
              </th>
            </tr>
          </thead>

          <tbody>
            {records.map(
              (
                record,
              ) => {
                const laptop =
                  record.laptop;

                return (
                  <tr
                    key={
                      record.id
                    }
                  >
                    <td>
                      {
                        record.customer_name
                      }
                    </td>


                    <td>
                      <LaptopDetails
                        laptop={
                          laptop
                        }
                      />
                    </td>


                    <td>
                      {
                        laptop
                          ?.serial_number
                        ||
                        record
                          .serial_number
                        ||
                        "—"
                      }
                    </td>


                    <td>
                      {formatPrice(
                        laptop
                          ?.wholesale_price,
                      )}
                    </td>


                    <td>
                      {formatPrice(
                        laptop
                          ?.retail_price,
                      )}
                    </td>


                    <td>
                      <InventoryBadge
                        status={
                          laptop
                            ?.inventory_status
                        }
                      />
                    </td>


                    <td>
                      {
                        laptop?.area
                        || "—"
                      }
                    </td>


                    <td>
                      {
                        record
                          .stocked_in_by_name
                        || "—"
                      }
                    </td>


                    <td>
                      {formatDateTime(
                        record
                          .stocked_in_at,
                      )}
                    </td>
                  </tr>
                );
              },
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function LaptopDetails({
  laptop,
}) {
  if (!laptop) {
    return "—";
  }

  return (
    <div className="return-laptop-details">
      <strong>
        {laptop.company}
        {" "}
        {laptop.model_number}
      </strong>

      <span>
        {laptop.processor}
        {" "}
        {
          laptop
            .processor_generation
        }
      </span>

      <span>
        {laptop.ram_gb}
        GB RAM ·{" "}
        {laptop.storage_gb}
        GB{" "}
        {
          laptop.storage_type_label
          ||
          laptop.storage_type
        }
      </span>

      <span>
        {
          laptop.display_type_label
          ||
          laptop.display_type
        }
      </span>
    </div>
  );
}


function InventoryBadge({
  status,
}) {
  if (!status) {
    return "—";
  }

  const labels = {
    in_stock:
      "In Stock",

    in_stock_g:
      "In Stock G",

    in_service:
      "In Service",

    sold:
      "Sold",
  };

  return (
    <span
      className={
        `return-badge return-inventory-${status}`
      }
    >
      {
        labels[
          status
        ]
        || status
      }
    </span>
  );
}


function formatPrice(
  value,
) {
  if (
    value === null
    ||
    value === undefined
    ||
    value === ""
  ) {
    return "—";
  }

  const amount =
    Number(value);

  if (
    Number.isNaN(
      amount,
    )
  ) {
    return value;
  }

  return (
    new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
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
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    "en-IN",
  );
}


export default StockedInTable;