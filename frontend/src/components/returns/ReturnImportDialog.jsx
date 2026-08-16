import {
  useEffect,
  useRef,
  useState,
} from "react";


function ReturnImportDialog({
  isOpen,
  preview,
  isPreviewing,
  isConfirming,
  errorMessage,
  onClose,
  onPreview,
  onConfirm,
}) {
  const dialogRef =
    useRef(null);

  const [
    file,
    setFile,
  ] = useState(null);


  useEffect(() => {
    const dialog =
      dialogRef.current;

    if (!dialog) {
      return;
    }

    if (
      isOpen
      &&
      !dialog.open
    ) {
      setFile(null);
      dialog.showModal();
      return;
    }

    if (
      !isOpen
      &&
      dialog.open
    ) {
      dialog.close();
    }
  }, [
    isOpen,
  ]);


  function handlePreview(
    event,
  ) {
    event.preventDefault();

    if (!file) {
      return;
    }

    onPreview(file);
  }


  const validRows =
    preview?.valid_data
    ?? [];

  const invalidRows =
    preview?.invalid_data
    ?? [];

  const canConfirm =
    Boolean(
      preview
      &&
      preview.valid_rows > 0
      &&
      preview.invalid_rows === 0
      &&
      validRows.length > 0,
    );


  return (
    <dialog
      ref={dialogRef}
      className="return-import-dialog"
      onCancel={
        (event) => {
          event.preventDefault();

          if (
            !isPreviewing
            &&
            !isConfirming
          ) {
            onClose();
          }
        }
      }
    >
      <div className="return-import-card">
        <header className="return-import-header">
          <div>
            <p className="application-eyebrow">
              Returns
            </p>

            <h2>
              Import Returns
            </h2>
          </div>

          <button
            type="button"
            className="dialog-close-button"
            disabled={
              isPreviewing
              ||
              isConfirming
            }
            onClick={
              onClose
            }
          >
            ×
          </button>
        </header>


        <div className="return-import-scroll">
          <form
            className="return-import-file-form"
            onSubmit={
              handlePreview
            }
          >
            <label className="return-field">
              <span>
                Excel File
              </span>

              <input
                type="file"
                accept=".xlsx"
                disabled={
                  isPreviewing
                  ||
                  isConfirming
                }
                onChange={
                  (event) =>
                    setFile(
                      event.target
                        .files?.[0]
                      ?? null,
                    )
                }
              />
            </label>

            <button
              type="submit"
              className="button button-primary"
              disabled={
                !file
                ||
                isPreviewing
                ||
                isConfirming
              }
            >
              {isPreviewing
                ? "Previewing..."
                : "Preview"}
            </button>
          </form>


          {errorMessage ? (
            <div
              className="form-level-error"
              role="alert"
            >
              {errorMessage}
            </div>
          ) : null}


          {preview ? (
            <>
              <div className="return-import-summary">
                <SummaryItem
                  label="Total Rows"
                  value={
                    preview.total_rows
                  }
                />

                <SummaryItem
                  label="Valid"
                  value={
                    preview.valid_rows
                  }
                />

                <SummaryItem
                  label="Invalid"
                  value={
                    preview.invalid_rows
                  }
                />
              </div>


              {validRows.length > 0 ? (
                <PreviewTable
                  title="Valid Rows"
                  rows={
                    validRows
                  }
                  invalid={false}
                />
              ) : null}


              {invalidRows.length > 0 ? (
                <PreviewTable
                  title="Invalid Rows"
                  rows={
                    invalidRows
                  }
                  invalid
                />
              ) : null}
            </>
          ) : null}
        </div>


        <footer className="return-import-actions">
          <button
            type="button"
            className="button button-secondary"
            disabled={
              isPreviewing
              ||
              isConfirming
            }
            onClick={
              onClose
            }
          >
            Cancel
          </button>

          <button
            type="button"
            className="button button-primary"
            disabled={
              !canConfirm
              ||
              isConfirming
            }
            onClick={() =>
              onConfirm(
                validRows,
              )
            }
          >
            {isConfirming
              ? "Importing..."
              : "Confirm Import"}
          </button>
        </footer>
      </div>
    </dialog>
  );
}


function SummaryItem({
  label,
  value,
}) {
  return (
    <div className="return-import-summary-item">
      <span>
        {label}
      </span>

      <strong>
        {value ?? 0}
      </strong>
    </div>
  );
}


function PreviewTable({
  title,
  rows,
  invalid,
}) {
  return (
    <section className="return-import-preview-section">
      <h3>
        {title}
      </h3>

      <div className="table-scroll-container">
        <table className="data-table return-import-preview-table">
          <thead>
            <tr>
              <th>
                Row
              </th>

              <th>
                Customer
              </th>

              <th>
                Laptop
              </th>

              <th>
                Serial
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
                Rack
              </th>

              {invalid ? (
                <th>
                  Errors
                </th>
              ) : null}
            </tr>
          </thead>

          <tbody>
            {rows.map(
              (
                row,
              ) => {
                const data =
                  row.data
                  ?? {};

                return (
                  <tr
                    key={
                      row.row_number
                    }
                  >
                    <td>
                      {
                        row.row_number
                      }
                    </td>

                    <td>
                      {
                        data.customer_name
                        || "—"
                      }
                    </td>

                    <td>
                      {
                        [
                          data.company,
                          data.model_number,
                        ]
                        .filter(Boolean)
                        .join(" ")
                        || "—"
                      }
                    </td>

                    <td>
                      {
                        data.serial_number
                        || "—"
                      }
                    </td>

                    <td>
                      {
                        data
                          .technician_username
                        || "Unassigned"
                      }
                    </td>

                    <td>
                      {
                        data.issue
                        || "—"
                      }
                    </td>

                    <td>
                      {
                        data.priority
                        || "—"
                      }
                    </td>

                    <td>
                      {
                        data.status
                        || "—"
                      }
                    </td>

                    <td>
                      {
                        data.service_rack
                        || "—"
                      }
                    </td>

                    {invalid ? (
                      <td>
                        <ul className="return-import-errors">
                          {(
                            row.errors
                            ?? []
                          ).map(
                            (
                              error,
                              index,
                            ) => (
                              <li
                                key={
                                  `${row.row_number}-${index}`
                                }
                              >
                                <strong>
                                  {
                                    error.field
                                  }
                                  :
                                </strong>
                                {" "}
                                {
                                  error.message
                                }
                              </li>
                            ),
                          )}
                        </ul>
                      </td>
                    ) : null}
                  </tr>
                );
              },
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}


export default ReturnImportDialog;