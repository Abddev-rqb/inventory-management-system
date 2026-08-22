import {
  Link,
} from "react-router-dom";


function LaptopTable({
  laptops,
  isSelectionMode = false,
  selectedLaptopIds =
    new Set(),
  onToggleLaptop = null,
  canMoveToService = false,
  movingLaptopId = null,
  onMoveToService = null,
}) {
  return (
    <div className="table-scroll-container">
      <table className="inventory-table">
        <thead>
          <tr>
            {isSelectionMode ? (
              <th
                scope="col"
                className="inventory-selection-column"
              >
                <span className="sr-only">
                  Select
                </span>
              </th>
            ) : null}

            <th scope="col">
              ID
            </th>

            <th scope="col">
              Company
            </th>

            <th scope="col">
              Display type
            </th>

            <th scope="col">
              Model number
            </th>

            <th scope="col">
              Processor
            </th>

            <th scope="col">
              Processor generation
            </th>

            <th scope="col">
              RAM
            </th>

            <th scope="col">
              Storage
            </th>

            <th scope="col">
              Storage type
            </th>

            <th scope="col">
              Serial number
            </th>

            <th scope="col">
              Wholesale price
            </th>

            <th scope="col">
              Retail price
            </th>

            <th scope="col">
              QC status
            </th>

            <th scope="col">
              Inventory status
            </th>

            <th scope="col">
              Area
            </th>

            <th scope="col">
              Created at
            </th>

            {!isSelectionMode ? (
              <th scope="col">
                Actions
              </th>
            ) : null}
          </tr>
        </thead>

        <tbody>
          {laptops.map(
            (laptop) => {
              const laptopId =
                Number(
                  laptop.id,
                );

              const isSelected =
                selectedLaptopIds.has(
                  laptopId,
                );

              const isSaleable =
                canSelectLaptop(
                  laptop,
                );

              return (
                <tr
                  key={
                    laptop.id
                  }
                  className={
                    isSelected
                      ? "inventory-row-selected"
                      : undefined
                  }
                >
                  {isSelectionMode ? (
                    <td className="inventory-selection-column">
                      <input
                        type="checkbox"
                        className="inventory-selection-checkbox"
                        aria-label={
                          `Select laptop ${laptop.id}`
                        }
                        checked={
                          isSelected
                        }
                        disabled={
                          !isSaleable
                        }
                        onChange={() => {
                          if (
                            !isSaleable ||
                            !onToggleLaptop
                          ) {
                            return;
                          }

                          onToggleLaptop(
                            laptop,
                          );
                        }}
                      />
                    </td>
                  ) : null}

                  <td>
                    <Link
                      to={
                        `/laptops/${laptop.id}`
                      }
                      className="inventory-table-link"
                    >
                      {laptop.id}
                    </Link>
                  </td>

                  <td>
                    {displayValue(
                      laptop.company,
                    )}
                  </td>

                  <td>
                    {formatChoice(
                      laptop.display_type,
                    )}
                  </td>

                  <td>
                    {displayValue(
                      laptop.model_number,
                    )}
                  </td>

                  <td>
                    {displayValue(
                      laptop.processor,
                    )}
                  </td>

                  <td>
                    {displayValue(
                      laptop.processor_generation,
                    )}
                  </td>

                  <td>
                    {formatNumberWithUnit(
                      laptop.ram_gb,
                      "GB",
                    )}
                  </td>

                  <td>
                    {formatNumberWithUnit(
                      laptop.storage_gb,
                      "GB",
                    )}
                  </td>

                  <td>
                    {formatChoice(
                      laptop.storage_type,
                    )}
                  </td>

                  <td>
                    {displayValue(
                      laptop.serial_number,
                    )}
                  </td>

                  <td>
                    {formatMoney(
                      laptop.wholesale_price,
                    )}
                  </td>

                  <td>
                    {formatMoney(
                      laptop.retail_price,
                    )}
                  </td>

                  <td>
                    <StatusBadge
                      type="qc"
                      value={
                        laptop.qc_status
                      }
                    />
                  </td>

                  <td>
                    <StatusBadge
                      type="inventory"
                      value={
                        laptop.inventory_status
                      }
                    />
                  </td>

                  <td>
                    {displayValue(
                      laptop.area,
                    )}
                  </td>

                  <td>
                    {formatDateTime(
                      laptop.created_at,
                    )}
                  </td>

                  {!isSelectionMode ? (
                    <td>
                      {
                        canMoveToService
                        && canMoveLaptopToService(
                          laptop,
                        )
                        && onMoveToService
                          ? (
                              <button
                                type="button"
                                className="button button-secondary"
                                disabled={
                                  movingLaptopId === laptopId
                                }
                                onClick={() =>
                                  onMoveToService(
                                    laptop,
                                  )
                                }
                              >
                                {
                                  movingLaptopId === laptopId
                                    ? "Moving..."
                                    : "To Service"
                                }
                              </button>
                            )
                          : "—"
                      }
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


function canSelectLaptop(
  laptop,
) {
  const quantity =
    Number(
      laptop.quantity,
    );

  const saleableStatus =
    laptop.inventory_status ===
      "in_stock" ||
    laptop.inventory_status ===
      "in_stock_g";

  return (
    saleableStatus &&
    quantity === 1
  );
}


function StatusBadge({
  type,
  value,
}) {
  const normalizedValue =
    String(
      value ?? "",
    );

  const className = [
    "status-badge",
    getStatusClassName(
      type,
      normalizedValue,
    ),
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={
        className
      }
    >
      {formatChoice(
        normalizedValue,
      )}
    </span>
  );
}


function getStatusClassName(
  type,
  value,
) {
  if (
    type === "qc"
  ) {
    if (
      value === "done"
    ) {
      return (
        "status-badge-success"
      );
    }

    return (
      "status-badge-warning"
    );
  }

  if (
    value === "in_stock" ||
    value === "in_stock_g"
  ) {
    return (
      "status-badge-success"
    );
  }

  return (
    "status-badge-warning"
  );
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


function formatNumberWithUnit(
  value,
  unit,
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return `${value} ${unit}`;
}


function formatChoice(
  value,
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return String(value)
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


function canMoveLaptopToService(
  laptop,
) {
  return (
    Number(laptop.quantity) === 1
    && (
      laptop.inventory_status === "in_stock"
      || laptop.inventory_status === "in_stock_g"
    )
  );
}


function formatDateTime(
  value,
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}


export default LaptopTable;