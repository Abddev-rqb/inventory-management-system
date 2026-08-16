function ReturnFilters({
  filters,
  technicians,
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
              "Customer, company, "
              + "model, serial or issue"
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
            Technician
          </span>

          <select
            value={
              filters.technician
            }
            disabled={
              disabled
            }
            onChange={
              (event) =>
                onChange(
                  "technician",
                  event.target.value,
                )
            }
          >
            <option value="">
              All technicians
            </option>

            {technicians.map(
              (
                technician,
              ) => (
                <option
                  key={
                    technician.id
                  }
                  value={
                    technician.id
                  }
                >
                  {
                    technician.name
                  }
                </option>
              ),
            )}
          </select>
        </label>


        <label className="return-filter-field">
          <span>
            Status
          </span>

          <select
            value={
              filters.status
            }
            disabled={
              disabled
            }
            onChange={
              (event) =>
                onChange(
                  "status",
                  event.target.value,
                )
            }
          >
            <option value="">
              All statuses
            </option>

            <option value="received">
              Received
            </option>

            <option value="in_service">
              In Service
            </option>

            <option value="repair_completed">
              Repair Completed
            </option>

            <option value="swap_requested">
              Swap Requested
            </option>

            <option value="ready_for_dispatch">
              Ready For Dispatch
            </option>

            <option value="stocked_in">
              Stocked In
            </option>

            <option value="dispatched">
              Dispatched
            </option>
          </select>
        </label>


        <label className="return-filter-field">
          <span>
            Priority
          </span>

          <select
            value={
              filters.priority
            }
            disabled={
              disabled
            }
            onChange={
              (event) =>
                onChange(
                  "priority",
                  event.target.value,
                )
            }
          >
            <option value="">
              All priorities
            </option>

            <option value="low">
              Low
            </option>

            <option value="normal">
              Normal
            </option>

            <option value="high">
              High
            </option>

            <option value="urgent">
              Urgent
            </option>
          </select>
        </label>


        <label className="return-filter-field">
          <span>
            Service rack
          </span>

          <input
            type="text"
            value={filters.service_rack}
            placeholder="Enter rack"
            disabled={disabled}
            onChange={(event) =>
              onChange(
                "service_rack",
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
              filters.end_date ||
              undefined
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
              filters.start_date ||
              undefined
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


export default ReturnFilters;