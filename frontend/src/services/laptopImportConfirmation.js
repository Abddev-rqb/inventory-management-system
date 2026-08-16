export function normalizeImportConfirmation(
  responseData,
) {
  const source =
    responseData &&
    typeof responseData === "object"
      ? responseData
      : {};

  const importedRows =
    toNonNegativeInteger(
      source.imported_rows ??
        source.imported_count ??
        source.created_rows ??
        source.created_count ??
        source.summary
          ?.imported_rows ??
        source.summary
          ?.created_rows,
      0,
    );

  return {
    importedRows,

    message:
      source.message ??
      source.detail ??
      buildDefaultMessage(
        importedRows,
      ),
  };
}

function buildDefaultMessage(
  importedRows,
) {
  if (importedRows === 1) {
    return "1 laptop record was imported successfully.";
  }

  return `${importedRows} laptop records were imported successfully.`;
}

function toNonNegativeInteger(
  value,
  fallback,
) {
  const numericValue =
    Number(value);

  if (
    !Number.isInteger(
      numericValue,
    ) ||
    numericValue < 0
  ) {
    return fallback;
  }

  return numericValue;
}