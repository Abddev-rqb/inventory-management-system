import {
  useState,
} from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  confirmLaptopImport,
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

  const inventoryLocation =
    location.state?.inventoryLocation ??
    "/laptops";

  const [
    preview,
    setPreview,
  ] = useState(null);

  const [
    previewFile,
    setPreviewFile,
  ] = useState(null);

  const [
    isPreviewing,
    setIsPreviewing,
  ] = useState(false);

  const [
    previewError,
    setPreviewError,
  ] = useState(null);

  const [
    isConfirmDialogOpen,
    setIsConfirmDialogOpen,
  ] = useState(false);

  const [
    isConfirming,
    setIsConfirming,
  ] = useState(false);

  const [
    confirmationError,
    setConfirmationError,
  ] = useState(null);

  const hasInvalidRows =
    Boolean(
      preview &&
        preview.summary.invalidRows > 0,
    );

  const hasValidRows =
    Boolean(
      preview &&
        preview.summary.validRows > 0,
    );

  const hasConfirmationRows =
    Boolean(
      preview?.confirmationRows?.length,
    );

  const canConfirmImport =
    Boolean(
      preview &&
        hasValidRows &&
        !hasInvalidRows &&
        hasConfirmationRows &&
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
        await previewLaptopImport(
          excelFile,
        );

      const normalizedPreview =
        normalizeImportPreview(
          responseData,
        );

      setPreview(
        normalizedPreview,
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
      !preview?.confirmationRows?.length
    ) {
      return;
    }

    setIsConfirming(true);
    setConfirmationError(null);

    try {
      const responseData =
        await confirmLaptopImport(
          preview.confirmationRows,
        );

      const confirmation =
        normalizeImportConfirmation(
          responseData,
        );

      setIsConfirmDialogOpen(false);

      navigate(
        inventoryLocation,
        {
          replace: true,
          state: {
            successTitle:
              "Excel import completed",
            successMessage:
              confirmation.message,
            importedRows:
              confirmation.importedRows,
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

          <h2>Import Excel</h2>

          <p className="page-description">
            Upload and validate an Excel
            spreadsheet before importing
            laptop records.
          </p>
        </div>
      </div>

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
          isSubmitting={
            isPreviewing
          }
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
          title="Excel import was not completed"
          message={
            confirmationError
          }
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
              Django is reading and
              validating the selected
              Excel file.
            </p>
          </div>
        </div>
      ) : null}

      {!isPreviewing &&
      preview ? (
        <>
          <div className="preview-file-reference">
            <span>
              Preview generated from
            </span>

            <strong>
              {preview.fileName ??
                previewFile?.name ??
                "Selected spreadsheet"}
            </strong>

            {preview.sheetName ? (
              <span>
                Sheet:{" "}
                {preview.sheetName}
              </span>
            ) : null}
          </div>

          <LaptopImportSummary
            summary={preview.summary}
          />

          {preview.rows.length > 0 ? (
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

              <h3>Confirm import</h3>

              {hasInvalidRows ? (
                <p className="import-confirmation-message import-confirmation-blocked">
                  Resolve all invalid
                  spreadsheet rows and
                  generate a new preview
                  before importing.
                </p>
              ) : null}

              {!hasInvalidRows &&
              !hasValidRows ? (
                <p className="import-confirmation-message import-confirmation-blocked">
                  There are no valid laptop
                  rows available to import.
                </p>
              ) : null}

              {!hasInvalidRows &&
              hasValidRows &&
              !hasConfirmationRows ? (
                <p className="import-confirmation-message import-confirmation-blocked">
                  The preview response did
                  not contain confirmation
                  rows.
                </p>
              ) : null}

              {canConfirmImport ? (
                <p className="import-confirmation-message">
                  {
                    preview.summary
                      .validRows
                  }{" "}
                  validated laptop{" "}
                  {preview.summary
                    .validRows === 1
                    ? "record is"
                    : "records are"}{" "}
                  ready to be imported.
                </p>
              ) : null}
            </div>

            <button
              type="button"
              className="button button-primary"
              onClick={
                openConfirmDialog
              }
              disabled={
                !canConfirmImport
              }
            >
              Confirm import
            </button>
          </section>
        </>
      ) : null}

      <ConfirmDialog
        isOpen={
          isConfirmDialogOpen
        }
        title="Confirm Excel import"
        message={
          preview
            ? `Import ${preview.summary.validRows} validated laptop ${
                preview.summary
                  .validRows === 1
                  ? "record"
                  : "records"
              } into inventory?`
            : "Import the validated laptop records?"
        }
        confirmLabel="Import laptops"
        cancelLabel="Cancel"
        processingLabel="Importing..."
        variant="primary"
        isProcessing={
          isConfirming
        }
        onConfirm={
          handleConfirmImport
        }
        onCancel={
          closeConfirmDialog
        }
      />
    </section>
  );
}

export default LaptopImportPage;