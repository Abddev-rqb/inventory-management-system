import LaptopDetailField from "./LaptopDetailField.jsx";

function LaptopDetails({
  laptop,
}) {
  return (
    <div className="laptop-details">
      <DetailSection title="Identification">
        <LaptopDetailField
          label="ID"
          value={laptop.id}
        />

        <LaptopDetailField
          label="Company"
          value={laptop.company}
        />

        <LaptopDetailField
          label="Display type"
          value={
            laptop.display_type_label ??
            formatChoiceLabel(
              laptop.display_type,
            )
          }
        />

        <LaptopDetailField
          label="Model number"
          value={laptop.model_number}
        />

        <LaptopDetailField
          label="Serial number"
        >
          <code className="serial-number">
            {displayValue(
              laptop.serial_number,
            )}
          </code>
        </LaptopDetailField>

        <LaptopDetailField
          label="Area"
          value={laptop.area}
        />
      </DetailSection>

      <DetailSection title="Hardware">
        <LaptopDetailField
          label="Processor"
          value={laptop.processor}
        />

        <LaptopDetailField
          label="Processor generation"
          value={
            laptop.processor_generation
          }
        />

        <LaptopDetailField
          label="RAM"
          value={formatCapacity(
            laptop.ram_gb,
            "GB",
          )}
        />

        <LaptopDetailField
          label="Storage"
          value={formatCapacity(
            laptop.storage_gb,
            "GB",
          )}
        />

        <LaptopDetailField
          label="Storage type"
          value={formatChoiceLabel(
            laptop.storage_type,
          )}
        />
      </DetailSection>

      <DetailSection title="Pricing and stock">
        <LaptopDetailField
          label="Wholesale price"
          value={formatCurrency(
            laptop.wholesale_price,
          )}
        />

        <LaptopDetailField
          label="Retail price"
          value={formatCurrency(
            laptop.retail_price,
          )}
        />

        <LaptopDetailField
          label="Quantity"
          value={laptop.quantity}
        />

        <LaptopDetailField
          label="Warranty"
          value={formatWarranty(
            laptop.warranty_days,
          )}
        />

        <LaptopDetailField
          label="QC status"
        >
          <StatusBadge
            value={laptop.qc_status}
            label={
              laptop.qc_status_label ??
              formatChoiceLabel(
                laptop.qc_status,
              )
            }
          />
        </LaptopDetailField>

        <LaptopDetailField
          label="Inventory status"
        >
          <StatusBadge
            value={
              laptop.inventory_status
            }
            label={
              laptop.inventory_status_label ??
              formatChoiceLabel(
                laptop.inventory_status,
              )
            }
          />
        </LaptopDetailField>
      </DetailSection>

      <DetailSection title="Additional information">
        <LaptopDetailField
          label="Comments"
          value={laptop.comments}
          fullWidth
        />

        <LaptopDetailField
          label="Created"
          value={formatDateTime(
            laptop.created_at,
          )}
        />

        <LaptopDetailField
          label="Last updated"
          value={formatDateTime(
            laptop.updated_at,
          )}
        />
      </DetailSection>
    </div>
  );
}

function DetailSection({
  title,
  children,
}) {
  return (
    <section className="laptop-detail-section">
      <h3>{title}</h3>

      <dl className="laptop-detail-grid">
        {children}
      </dl>
    </section>
  );
}

function StatusBadge({
  value,
  label,
}) {
  const safeValue = String(
    value ?? "unknown",
  )
    .trim()
    .toLowerCase()
    .replaceAll("_", "-")
    .replaceAll(" ", "-");

  return (
    <span
      className={`status-badge status-badge-${safeValue}`}
    >
      {displayValue(label)}
    </span>
  );
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

function formatCapacity(
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

function formatChoiceLabel(value) {
  if (!value) {
    return "—";
  }

  return String(value)
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

function formatCurrency(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
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
  ).format(numericValue);
}

function formatWarranty(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "—";
  }

  if (numericValue === 0) {
    return "No warranty";
  }

  if (numericValue === 1) {
    return "1 day";
  }

  return `${numericValue} days`;
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const dateValue = new Date(value);

  if (
    Number.isNaN(
      dateValue.getTime(),
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
  ).format(dateValue);
}

export default LaptopDetails;