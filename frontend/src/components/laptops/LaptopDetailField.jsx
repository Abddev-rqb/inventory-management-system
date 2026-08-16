function LaptopDetailField({
  label,
  value,
  fullWidth = false,
  children,
}) {
  return (
    <div
      className={
        fullWidth
          ? "laptop-detail-field laptop-detail-field-full"
          : "laptop-detail-field"
      }
    >
      <dt>{label}</dt>

      <dd>
        {children ?? displayValue(value)}
      </dd>
    </div>
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

export default LaptopDetailField;