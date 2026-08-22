function ReturnsTable({
  returns,
  selectedReturnId,
  canSelectPriority,
  canAssignTechnician,
  canUpdateStatus,
  canStockIn,
  canEdit,
  canAddExpense,
  canCompleteReturn,
  completingReturnId,
  onSelectReturn,
  onAssignTechnician,
  onUpdateStatus,
  onStockIn,
  onEdit,
  onExpense,
  onDone,
}) {
  return (
    <div className="returns-table-section">
      <div className="table-scroll-container">
        <table className="data-table returns-table">
          <thead>
            <tr>
              {canSelectPriority ? (
                <th>
                  Select
                </th>
              ) : null}

              <th>
                Customer Name
              </th>

              <th>
                Address
              </th>

              <th>
                Laptop Details
              </th>

              <th>
                Technician
              </th>

              <th>
                Issue
              </th>

              <th>
                Priority
              </th>

              <th>
                Status
              </th>

              <th>
                Service Rack
              </th>

              <th>
                Received Date
              </th>

              <th>
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {returns.map(
              (
                returnRecord,
              ) => (
                <tr
                  key={
                    returnRecord.id
                  }
                  className={
                    selectedReturnId
                    === returnRecord.id
                      ? "return-row-selected"
                      : ""
                  }
                >
                  {canSelectPriority ? (
                    <td>
                      <input
                        type="radio"
                        name="selected-return"
                        checked={
                          selectedReturnId
                          === returnRecord.id
                        }
                        aria-label={
                          (
                            "Select return "
                            + returnRecord.id
                          )
                        }
                        onChange={() =>
                          onSelectReturn(
                            returnRecord,
                          )
                        }
                      />
                    </td>
                  ) : null}


                  <td>
                    {
                      returnRecord
                        .customer_name
                    }
                  </td>


                  <td className="returns-address-cell">
                    {
                      returnRecord
                        .customer_address
                      || "—"
                    }
                  </td>


                  <td>
                    <LaptopDetails
                      returnRecord={
                        returnRecord
                      }
                    />
                  </td>


                  <td>
                    {
                      returnRecord
                        .technician_name
                      || "Unassigned"
                    }
                  </td>


                  <td className="returns-issue-cell">
                    {
                      returnRecord
                        .issue
                    }
                  </td>


                  <td>
                    <PriorityBadge
                      priority={
                        returnRecord
                          .priority
                      }
                      label={
                        returnRecord
                          .priority_label
                      }
                    />
                  </td>


                  <td>
                    <StatusBadge
                      status={
                        returnRecord
                          .status
                      }
                      label={
                        returnRecord
                          .status_label
                      }
                    />
                  </td>


                  <td>
                    {
                      returnRecord
                        .service_rack
                    }
                  </td>


                  <td>
                    {formatDateTime(
                      returnRecord
                        .created_at,
                    )}
                  </td>

                  <td>
                    <div className="return-row-actions">
                      {canEdit ? (
                        <button
                          type="button"
                          className="table-action-button"
                          onClick={() =>
                            onEdit(
                              returnRecord,
                            )
                          }
                        >
                          Edit
                        </button>
                      ) : null}

                      {canAddExpense ? (
                        <button
                          type="button"
                          className="table-action-button"
                          onClick={() =>
                            onExpense(
                              returnRecord,
                            )
                          }
                        >
                          Expense
                        </button>
                      ) : null}
                      
                      {canCompleteReturn ? (
                        <button
                          type="button"
                          className="table-action-button"
                          disabled={
                            returnRecord.status
                              !== "repair_completed"
                            || completingReturnId
                              !== null
                          }
                          title={
                            returnRecord.status
                              === "repair_completed"
                              ? "Move to Pending Orders"
                              : (
                                  "Done becomes available "
                                  + "after Repair Completed."
                                )
                          }
                          onClick={() =>
                            onDone(
                              returnRecord,
                            )
                          }
                        >
                          {completingReturnId
                            === returnRecord.id
                            ? "Moving..."
                            : "Done"}
                        </button>
                      ) : null}

                      {canAssignTechnician ? (
                        <button
                          type="button"
                          className="table-action-button"
                          onClick={() =>
                            onAssignTechnician(
                              returnRecord,
                            )
                          }
                        >
                          Technician
                        </button>
                      ) : null}


                      {canUpdateStatus(
                        returnRecord,
                      ) ? (
                        <button
                          type="button"
                          className="table-action-button"
                          onClick={() =>
                            onUpdateStatus(
                              returnRecord,
                            )
                          }
                        >
                          Status
                        </button>
                      ) : null}


                      {!canAssignTechnician
                        &&
                        !canUpdateStatus(
                          returnRecord,
                        )
                        &&
                        !canStockIn(
                          returnRecord,
                        ) ? (
                        <span className="returns-actions-placeholder">
                          —
                        </span>
                      ) : null}

                      {canStockIn(
                        returnRecord,
                      ) ? (
                        <button
                          type="button"
                          className={
                            "table-action-button "
                            + "return-stock-in-button"
                          }
                          onClick={() =>
                            onStockIn(
                              returnRecord,
                            )
                          }
                        >
                          Stock In
                        </button>
                      ) : null}

                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function LaptopDetails({
  returnRecord,
}) {
  return (
    <div className="return-laptop-details">
      <strong>
        {
          returnRecord.company
        }
        {" "}
        {
          returnRecord.model_number
        }
      </strong>

      <span>
        {
          returnRecord.processor
        }
        {" "}
        {
          returnRecord
            .processor_generation
        }
      </span>

      <span>
        {
          returnRecord.ram_gb
        }
        GB RAM ·{" "}
        {
          returnRecord.storage_gb
        }
        GB{" "}
        {
          returnRecord
            .storage_type_label
          ||
          returnRecord
            .storage_type
        }
      </span>

      <span>
        Serial:{" "}
        {
          returnRecord.serial_number
        }
      </span>
    </div>
  );
}


function PriorityBadge({
  priority,
  label,
}) {
  return (
    <span
      className={
        `return-badge return-priority-${priority}`
      }
    >
      {label || priority}
    </span>
  );
}


function StatusBadge({
  status,
  label,
}) {
  return (
    <span
      className={
        `return-badge return-status-${status}`
      }
    >
      {label || status}
    </span>
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


export default ReturnsTable;