function LaptopImportSummary({
  summary,
}) {
  return (
    <section
      className="import-preview-summary"
      aria-labelledby="import-summary-title"
    >
      <div className="import-preview-section-heading">
        <div>
          <p className="application-eyebrow">
            Validation result
          </p>

          <h3 id="import-summary-title">
            Import preview summary
          </h3>
        </div>
      </div>

      <div className="import-summary-grid">
        <SummaryCard
          label="Total rows"
          value={summary.totalRows}
          variant="neutral"
        />

        <SummaryCard
          label="Valid rows"
          value={summary.validRows}
          variant="success"
        />

        <SummaryCard
          label="Invalid rows"
          value={
            summary.invalidRows
          }
          variant={
            summary.invalidRows > 0
              ? "danger"
              : "success"
          }
        />
      </div>
    </section>
  );
}

function SummaryCard({
  label,
  value,
  variant,
}) {
  return (
    <article
      className={`import-summary-card import-summary-card-${variant}`}
    >
      <span>{label}</span>

      <strong>{value}</strong>
    </article>
  );
}

export default LaptopImportSummary;