import {
  useRef,
  useState,
} from "react";

const MAX_FILE_SIZE_BYTES =
  10 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [
  ".xlsx",
];

function LaptopImportFileForm({
  onPreview,
  isSubmitting = false,
}) {
  const fileInputRef =
    useRef(null);

  const [
    selectedFile,
    setSelectedFile,
  ] = useState(null);

  const [
    selectionError,
    setSelectionError,
  ] = useState(null);

  function handleFileChange(
    event,
  ) {
    const nextFile =
      event.target.files?.[0] ??
      null;

    setSelectionError(null);

    if (!nextFile) {
      setSelectedFile(null);
      return;
    }

    const validationError =
      validateExcelFile(nextFile);

    if (validationError) {
      setSelectedFile(null);
      setSelectionError(
        validationError,
      );

      event.target.value = "";
      return;
    }

    setSelectedFile(nextFile);
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (
      !selectedFile ||
      isSubmitting
    ) {
      return;
    }

    onPreview(selectedFile);
  }

  function clearSelectedFile() {
    if (isSubmitting) {
      return;
    }

    setSelectedFile(null);
    setSelectionError(null);

    if (fileInputRef.current) {
      fileInputRef.current.value =
        "";
    }
  }

  return (
    <form
      className="import-file-form"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="import-file-field">
        <label htmlFor="laptop-import-file">
          Excel file
          <span
            className="required-marker"
            aria-hidden="true"
          >
            *
          </span>
        </label>

        <input
          ref={fileInputRef}
          id="laptop-import-file"
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={handleFileChange}
          disabled={isSubmitting}
          aria-invalid={
            Boolean(selectionError)
          }
        />

        <p className="form-field-hint">
          Select an .xlsx file with a
          maximum size of 10 MB.
        </p>

        {selectionError ? (
          <p
            className="form-field-error"
            role="alert"
          >
            {selectionError}
          </p>
        ) : null}
      </div>

      {selectedFile ? (
        <div className="selected-import-file">
          <div>
            <span className="selected-file-label">
              Selected file
            </span>

            <strong>
              {selectedFile.name}
            </strong>

            <span>
              {formatFileSize(
                selectedFile.size,
              )}
            </span>
          </div>

          <button
            type="button"
            className="button button-secondary"
            onClick={
              clearSelectedFile
            }
            disabled={isSubmitting}
          >
            Remove
          </button>
        </div>
      ) : null}

      <div className="import-file-actions">
        <button
          type="submit"
          className="button button-primary"
          disabled={
            !selectedFile ||
            isSubmitting
          }
        >
          {isSubmitting
            ? "Generating preview..."
            : "Preview import"}
        </button>
      </div>
    </form>
  );
}

function validateExcelFile(file) {
  const normalizedName =
    file.name.toLowerCase();

  const hasAllowedExtension =
    ALLOWED_EXTENSIONS.some(
      (extension) =>
        normalizedName.endsWith(
          extension,
        ),
    );

  if (!hasAllowedExtension) {
    return "Select a Microsoft Excel .xlsx file.";
  }

  if (
    file.size >
    MAX_FILE_SIZE_BYTES
  ) {
    return "The selected file exceeds the 10 MB limit.";
  }

  if (file.size === 0) {
    return "The selected file is empty.";
  }

  return null;
}

function formatFileSize(bytes) {
  if (
    !Number.isFinite(bytes) ||
    bytes < 0
  ) {
    return "Unknown size";
  }

  if (bytes < 1024) {
    return `${bytes} bytes`;
  }

  const kilobytes =
    bytes / 1024;

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(
      1,
    )} KB`;
  }

  const megabytes =
    kilobytes / 1024;

  return `${megabytes.toFixed(
    1,
  )} MB`;
}

export default LaptopImportFileForm;