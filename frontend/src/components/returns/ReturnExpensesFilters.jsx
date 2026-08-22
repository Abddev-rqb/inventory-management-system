function ReturnExpensesFilters({
  filters,
  disabled,
  onChange,
  onApply,
  onClear,
}) {
  return (
    <form className="returns-filter-panel" onSubmit={onApply}>
      <div className="returns-filter-grid">
        <label className="return-filter-field">
          <span>Search</span>
          <input
            value={filters.search}
            onChange={(event) => onChange("search", event.target.value)}
            placeholder="Customer, laptop, serial or item"
            disabled={disabled}
          />
        </label>

        <label className="return-filter-field">
          <span>Start Date</span>
          <input
            type="date"
            value={filters.start_date}
            onChange={(event) => onChange("start_date", event.target.value)}
            disabled={disabled}
          />
        </label>

        <label className="return-filter-field">
          <span>End Date</span>
          <input
            type="date"
            value={filters.end_date}
            onChange={(event) => onChange("end_date", event.target.value)}
            disabled={disabled}
          />
        </label>
      </div>

      <div className="returns-filter-actions">
        <button type="button" className="button button-secondary" onClick={onClear} disabled={disabled}>
          Clear
        </button>
        <button type="submit" className="button button-primary" disabled={disabled}>
          Apply
        </button>
      </div>
    </form>
  );
}

export default ReturnExpensesFilters;
