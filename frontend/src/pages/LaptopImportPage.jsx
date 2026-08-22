import {
  useState,
} from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  confirmLaptopBulkUpdate,
  confirmLaptopImport,
  previewLaptopBulkUpdate,
  previewLaptopImport,
} from "../api/laptopApi.js";
import AlertMessage from "../components/common/AlertMessage.jsx";
import ConfirmDialog from "../components/common/ConfirmDialog.jsx";
import LaptopImportFileForm from "../components/laptops/LaptopImportFileForm.jsx";
import LaptopImportPreviewTable from "../components/laptops/LaptopImportPreviewTable.jsx";
import LaptopImportSummary from "../components/laptops/LaptopImportSummary.jsx";
import {
  parseApiError,
} from "../services/apiError.js";
import {
  normalizeImportConfirmation,
} from "../services/laptopImportConfirmation.js";
import {
  normalizeImportPreview,
} from "../services/laptopImportPreview.js";

function LaptopImportPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const mode =
    new URLSearchParams(
      location.search,
    ).get("mode") === "update"
      ? "update"
      : "create";

  const isBulkUpdate =
    mode === "update";

  const inventoryLocation =
    location.state?.inventoryLocation ??
    "/laptops";

  const [preview, setPreview] =
    useState(null);
  const [previewFile, setPreviewFile] =
    useState(null);
  const [isPreviewing, setIsPreviewing] =
    useState(false);
  const [previewError, setPreviewError] =
    useState(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] =
    useState(false);
  const [isConfirming, setIsConfirming] =
    useState(false);
  const [confirmationError, setConfirmationError] =
    useState(null);

  const summary =
    isBulkUpdate
      ? normalizeBulkSummary(
          preview?.summary,
        )
      : preview?.summary;

  const hasInvalidRows =
    Boolean(
      summary &&
        summary.invalidRows > 0,
    );

  const hasValidRows =
    Boolean(
      summary &&
        summary.validRows > 0,
    );

  const confirmationRows =
    isBulkUpdate
      ? (
          Array.isArray(
            preview?.valid_data,
          )
            ? preview.valid_data.map(
                (row) => ({
                  row_number:
                    row.row_number,
                  data:
                    row.data,
                }),
              )
            : []
        )
      : (
          preview?.confirmationRows ??
          []
        );

  const canConfirmImport =
    Boolean(
      preview &&
        hasValidRows &&
        !hasInvalidRows &&
        confirmationRows.length > 0 &&
        !isPreviewing &&
        !isConfirming,
    );

  async function handlePreview(
    excelFile,
  ) {
    if (
      !excelFile ||
      isPreviewing
    ) {
      return;
    }

    setIsPreviewing(true);
    setPreviewError(null);
    setConfirmationError(null);
    setIsConfirmDialogOpen(false);
    setPreview(null);
    setPreviewFile(excelFile);

    try {
      const responseData =
        isBulkUpdate
          ? await previewLaptopBulkUpdate(
              excelFile,
            )
          : await previewLaptopImport(
              excelFile,
            );

      setPreview(
        isBulkUpdate
          ? responseData
          : normalizeImportPreview(
              responseData,
            ),
      );
    } catch (error) {
      const parsedError =
        parseApiError(error);

      setPreviewError(
        parsedError.message,
      );
      setPreview(null);
    } finally {
      setIsPreviewing(false);
    }
  }

  function openConfirmDialog() {
    if (!canConfirmImport) {
      return;
    }

    setConfirmationError(null);
    setIsConfirmDialogOpen(true);
  }

  function closeConfirmDialog() {
    if (isConfirming) {
      return;
    }

    setIsConfirmDialogOpen(false);
  }

  async function handleConfirmImport() {
    if (
      !canConfirmImport ||
      confirmationRows.length === 0
    ) {
      return;
    }

    setIsConfirming(true);
    setConfirmationError(null);

    try {
      let message = "";

      if (isBulkUpdate) {
        const responseData =
          await confirmLaptopBulkUpdate(
            confirmationRows,
          );

        message =
          responseData?.message ||
          "Laptop bulk update completed successfully.";
      } else {
        const responseData =
          await confirmLaptopImport(
            confirmationRows,
          );

        const confirmation =
          normalizeImportConfirmation(
            responseData,
          );

        message =
          confirmation.message;
      }

      setIsConfirmDialogOpen(false);

      navigate(
        inventoryLocation,
        {
          replace: true,
          state: {
            successTitle:
              isBulkUpdate
                ? "Bulk update completed"
                : "Excel import completed",
            successMessage:
              message,
          },
        },
      );
    } catch (error) {
      const parsedError =
        parseApiError(error);

      setConfirmationError(
        parsedError.message,
      );
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <section className="laptop-import-page">
      <div className="laptop-form-page-header">
        <div>
          <Link
            to={inventoryLocation}
            className="back-link"
          >
            ← Back to Laptop Inventory
          </Link>

          <p className="application-eyebrow">
            Laptop Inventory
          </p>

          <h2>
            {isBulkUpdate
              ? "Bulk Update Existing Laptops"
              : "Import New Laptops"}
          </h2>

          <p className="page-description">
            {isBulkUpdate
              ? (
                  "Serial Number identifies the existing laptop. " +
                  "Blank cells keep their current database value. " +
                  "Serial Number itself is never changed."
                )
              : (
                  "Upload and validate an Excel spreadsheet before " +
                  "creating new laptop records. Existing serial " +
                  "numbers are rejected."
                )}
          </p>
        </div>
      </div>

      {isBulkUpdate ? (
        <AlertMessage
          variant="info"
          title="Bulk update safety rules"
          message={
            (
              "Only existing In Stock / In Stock G laptops can be updated. " +
              "Sold and In Service laptops are protected. " +
              "Use the To Service button for service movement."
            )
          }
        />
      ) : null}

      <section className="import-upload-section">
        <div className="import-preview-section-heading">
          <div>
            <p className="application-eyebrow">
              Step 1
            </p>

            <h3>Select spreadsheet</h3>
          </div>
        </div>

        <LaptopImportFileForm
          onPreview={handlePreview}
          isSubmitting={isPreviewing}
        />
      </section>

      {previewError ? (
        <AlertMessage
          variant="error"
          title="Preview was not generated"
          message={previewError}
        />
      ) : null}

      {confirmationError ? (
        <AlertMessage
          variant="error"
          title={
            isBulkUpdate
              ? "Bulk update was not completed"
              : "Excel import was not completed"
          }
          message={confirmationError}
        />
      ) : null}

      {isPreviewing ? (
        <div
          className="import-preview-progress"
          role="status"
          aria-live="polite"
        >
          <span
            className="loading-spinner"
            aria-hidden="true"
          />

          <div>
            <strong>
              Validating spreadsheet
            </strong>
            <p>
              Django is reading and validating the selected Excel file.
            </p>
          </div>
        </div>
      ) : null}

      {!isPreviewing &&
      preview ? (
        <>
          <div className="preview-file-reference">
            <span>Preview generated from</span>
            <strong>
              {(
                isBulkUpdate
                  ? preview.file_name
                  : preview.fileName
              ) ?? previewFile?.name ?? "Selected spreadsheet"}
            </strong>
            {(isBulkUpdate
              ? preview.sheet_name
              : preview.sheetName) ? (
              <span>
                Sheet:{" "}
                {isBulkUpdate
                  ? preview.sheet_name
                  : preview.sheetName}
              </span>
            ) : null}
          </div>

          <LaptopImportSummary
            summary={summary}
          />

          {isBulkUpdate ? (
            <BulkUpdatePreview
              preview={preview}
            />
          ) : preview.rows.length > 0 ? (
            <LaptopImportPreviewTable
              rows={preview.rows}
            />
          ) : (
            <AlertMessage
              variant="warning"
              title="No preview rows returned"
              message="The backend generated a summary but returned no row information."
            />
          )}

          <section className="import-confirmation-section">
            <div>
              <p className="application-eyebrow">
                Step 2
              </p>

              <h3>
                {isBulkUpdate
                  ? "Confirm updates"
                  : "Confirm import"}
              </h3>

              {hasInvalidRows ? (
                <p className="import-confirmation-message import-confirmation-blocked">
                  Resolve all invalid spreadsheet rows and generate a new preview before continuing.
                </p>
              ) : null}

              {!hasInvalidRows &&
              !hasValidRows ? (
                <p className="import-confirmation-message import-confirmation-blocked">
                  There are no valid laptop rows available.
                </p>
              ) : null}

              {canConfirmImport ? (
                <p className="import-confirmation-message">
                  {summary.validRows}{" "}
                  validated laptop{summary.validRows === 1 ? "" : "s"}{" "}
                  {isBulkUpdate
                    ? "will be updated."
                    : "will be imported."}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              className="button button-primary"
              onClick={openConfirmDialog}
              disabled={!canConfirmImport}
            >
              {isBulkUpdate
                ? "Confirm updates"
                : "Confirm import"}
            </button>
          </section>
        </>
      ) : null}

      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        title={
          isBulkUpdate
            ? "Confirm bulk update"
            : "Confirm Excel import"
        }
        message={
          summary
            ? (
                isBulkUpdate
                  ? `Update ${summary.validRows} existing laptop record${summary.validRows === 1 ? "" : "s"}?`
                  : `Import ${summary.validRows} validated laptop record${summary.validRows === 1 ? "" : "s"} into inventory?`
              )
            : "Confirm this operation?"
        }
        confirmLabel={
          isBulkUpdate
            ? "Update laptops"
            : "Import laptops"
        }
        cancelLabel="Cancel"
        processingLabel={
          isBulkUpdate
            ? "Updating..."
            : "Importing..."
        }
        isProcessing={isConfirming}
        onConfirm={handleConfirmImport}
        onCancel={closeConfirmDialog}
      />
    </section>
  );
}

function BulkUpdatePreview({
  preview,
}) {
  const validRows =
    Array.isArray(preview?.valid_data)
      ? preview.valid_data
      : [];

  const invalidRows =
    Array.isArray(preview?.errors)
      ? preview.errors
      : [];

  return (
    <div className="bulk-update-preview">
      {validRows.length > 0 ? (
        <div className="table-scroll-container">
          <table className="bulk-update-preview-table">
            <thead>
              <tr>
                <th>Row</th>
                <th>Serial number</th>
                <th>Changes</th>
              </tr>
            </thead>
            <tbody>
              {validRows.map((row) => (
                <tr key={`valid-${row.row_number}`}>
                  <td>{row.row_number}</td>
                  <td>
                    <strong>{row.serial_number}</strong>
                  </td>
                  <td>
                    <div className="bulk-update-change-list">
                      {(row.changes || []).map((change) => (
                        <span key={`${row.row_number}-${change.field}`}>
                          <strong>{change.label}:</strong>{" "}
                          {change.before} → {change.after}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {invalidRows.length > 0 ? (
        <div className="bulk-update-errors">
          <h3>Invalid rows</h3>
          {invalidRows.map((row) => (
            <div
              key={`error-${row.row_number}`}
              className="bulk-update-error-row"
            >
              <strong>
                Row {row.row_number}
                {row.serial_number
                  ? ` — ${row.serial_number}`
                  : ""}
              </strong>
              <ul>
                {flattenErrors(row.errors).map((message, index) => (
                  <li key={`${row.row_number}-${index}`}>
                    {message}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function flattenErrors(errors) {
  if (!errors || typeof errors !== "object") {
    return ["Invalid row."];
  }

  return Object.entries(errors).flatMap(
    ([field, messages]) => {
      const normalized =
        Array.isArray(messages)
          ? messages
          : [messages];

      return normalized.map(
        (message) =>
          `${formatField(field)}: ${String(message)}`,
      );
    },
  );
}

function formatField(value) {
  if (value === "row") {
    return "Row";
  }

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeBulkSummary(summary) {
  return {
    totalRows:
      Number(summary?.total_rows ?? 0),
    validRows:
      Number(summary?.valid_rows ?? 0),
    invalidRows:
      Number(summary?.invalid_rows ?? 0),
  };
}

export default LaptopImportPage;
