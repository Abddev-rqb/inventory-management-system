function StockedInFilters({
  filters,
  disabled,
  onChange,
  onApply,
  onClear,
}) {
  return (
    <form
      className="returns-filter-panel"
      onSubmit={
        onApply
      }
    >
      <div className="returns-filter-grid">
        <label className="return-filter-field">
          <span>
            Search
          </span>

          <input
            type="search"
            value={
              filters.search
            }
            placeholder={
              "Customer, company, model, "
              + "serial or stocked-in user"
            }
            disabled={
              disabled
            }
            onChange={
              (event) =>
                onChange(
                  "search",
                  event.target.value,
                )
            }
          />
        </label>


        <label className="return-filter-field">
          <span>
            From
          </span>

          <input
            type="date"
            value={
              filters.start_date
            }
            max={
              filters.end_date
              || undefined
            }
            disabled={
              disabled
            }
            onChange={
              (event) =>
                onChange(
                  "start_date",
                  event.target.value,
                )
            }
          />
        </label>


        <label className="return-filter-field">
          <span>
            To
          </span>

          <input
            type="date"
            value={
              filters.end_date
            }
            min={
              filters.start_date
              || undefined
            }
            disabled={
              disabled
            }
            onChange={
              (event) =>
                onChange(
                  "end_date",
                  event.target.value,
                )
            }
          />
        </label>
      </div>


      <div className="returns-filter-actions">
        <button
          type="submit"
          className="button button-primary"
          disabled={
            disabled
          }
        >
          Apply
        </button>

        <button
          type="button"
          className="button button-secondary"
          disabled={
            disabled
          }
          onClick={
            onClear
          }
        >
          Clear
        </button>
      </div>
    </form>
  );
}


export default StockedInFilters;