const PREVIEW_COLUMNS = [
  {
    key: "company",
    label: "Company",
  },
  {
    key: "display_type",
    label: "Display type",
  },
  {
    key: "model_number",
    label: "Model number",
  },
  {
    key: "processor",
    label: "Processor",
  },
  {
    key: "processor_generation",
    label:
      "Processor generation",
  },
  {
    key: "ram_gb",
    label: "RAM",
  },
  {
    key: "storage_gb",
    label: "Storage",
  },
  {
    key: "storage_type",
    label: "Storage type",
  },
  {
    key: "serial_number",
    label: "Serial number",
  },
  {
    key: "wholesale_price",
    label: "Wholesale price",
  },
  {
    key: "retail_price",
    label: "Retail price",
  },
  {
    key: "qc_status",
    label: "QC status",
  },
  {
    key: "inventory_status",
    label: "Inventory status",
  },
  {
    key: "quantity",
    label: "Quantity",
  },
  {
    key: "warranty_days",
    label: "Warranty days",
  },
  {
    key: "area",
    label: "Area",
  },
  {
    key: "comments",
    label: "Comments",
  },
];

function LaptopImportPreviewTable({
  rows,
}) {
  return (
    <section className="import-preview-table-section">
      <div className="import-preview-section-heading">
        <div>
          <p className="application-eyebrow">
            Spreadsheet rows
          </p>

          <h3>Preview records</h3>
        </div>
      </div>

      <div className="table-scroll-container">
        <table className="data-table import-preview-table">
          <thead>
            <tr>
              <th scope="col">
                Excel row
              </th>

              <th scope="col">
                Validation
              </th>

              {PREVIEW_COLUMNS.map(
                (column) => (
                  <th
                    key={column.key}
                    scope="col"
                  >
                    {column.label}
                  </th>
                ),
              )}

              <th scope="col">
                Errors
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map(
              (row, index) => (
                <PreviewRow
                  key={`${row.rowNumber}-${index}`}
                  row={row}
                />
              ),
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PreviewRow({
  row,
}) {
  return (
    <tr
      className={
        row.isValid
          ? "import-preview-row-valid"
          : "import-preview-row-invalid"
      }
    >
      <td>
        <strong>
          {displayValue(
            row.rowNumber,
          )}
        </strong>
      </td>

      <td>
        <span
          className={
            row.isValid
              ? "preview-validation-badge preview-validation-valid"
              : "preview-validation-badge preview-validation-invalid"
          }
        >
          {row.isValid
            ? "Valid"
            : "Invalid"}
        </span>
      </td>

      {PREVIEW_COLUMNS.map(
        (column) => (
          <td key={column.key}>
            {formatPreviewValue(
              column.key,
              row.data[
                column.key
              ],
            )}
          </td>
        ),
      )}

      <td className="import-error-cell">
        {row.errors.length > 0 ? (
          <ul className="import-row-errors">
            {row.errors.map(
              (error, index) => (
                <li
                  key={`${error.field ?? "row"}-${index}`}
                >
                  {error.field ? (
                    <strong>
                      {error.field}:{" "}
                    </strong>
                  ) : null}

                  {error.message}
                </li>
              ),
            )}
          </ul>
        ) : (
          <span className="import-no-errors">
            No validation errors
          </span>
        )}
      </td>
    </tr>
  );
}

function formatPreviewValue(
  fieldName,
  value,
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  if (
    fieldName ===
      "wholesale_price" ||
    fieldName ===
      "retail_price"
  ) {
    return formatCurrency(value);
  }

  if (
    fieldName === "ram_gb" ||
    fieldName === "storage_gb"
  ) {
    return `${value} GB`;
  }

  if (
    fieldName ===
      "display_type" ||
    fieldName ===
      "storage_type" ||
    fieldName ===
      "qc_status" ||
    fieldName ===
      "inventory_status"
  ) {
    return formatChoiceLabel(
      value,
    );
  }

  return String(value);
}

function formatChoiceLabel(value) {
  return String(value)
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

function formatCurrency(value) {
  const numericValue =
    Number(value);

  if (
    !Number.isFinite(
      numericValue,
    )
  ) {
    return String(value);
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(numericValue);
}

function displayValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return String(value);
}

export default LaptopImportPreviewTable;