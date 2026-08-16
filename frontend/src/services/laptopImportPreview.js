export function normalizeImportPreview(
  responseData,
) {
  const source =
    responseData &&
    typeof responseData === "object"
      ? responseData
      : {};

  const summarySource =
    source.summary &&
    typeof source.summary === "object"
      ? source.summary
      : {};

  const validRows =
    Array.isArray(
      source.valid_data,
    )
      ? source.valid_data.map(
          normalizeValidRow,
        )
      : [];

  const invalidRows =
    Array.isArray(source.errors)
      ? source.errors.map(
          normalizeInvalidRow,
        )
      : [];

  const rows = [
    ...validRows,
    ...invalidRows,
  ].sort(
    (firstRow, secondRow) =>
      firstRow.rowNumber -
      secondRow.rowNumber,
  );

  return {
    rawResponse: source,

    fileName:
      source.file_name ?? null,

    sheetName:
      source.sheet_name ?? null,

    ignoredColumns:
      Array.isArray(
        source.ignored_columns,
      )
        ? source.ignored_columns
        : [],

    confirmationRows:
        Array.isArray(source.valid_data)
            ? source.valid_data
            : [],

    validData: validRows.map(
    (row) => row.data,
    ),

    summary: {
      totalRows:
        toNonNegativeInteger(
          summarySource.total_rows,
          rows.length,
        ),

      validRows:
        toNonNegativeInteger(
          summarySource.valid_rows,
          validRows.length,
        ),

      invalidRows:
        toNonNegativeInteger(
          summarySource.invalid_rows,
          invalidRows.length,
        ),
    },

    rows,
  };
}

function normalizeValidRow(row) {
  const source =
    row &&
    typeof row === "object"
      ? row
      : {};

  return {
    rowNumber:
      toPositiveInteger(
        source.row_number,
        0,
      ),

    isValid: true,

    data:
      source.data &&
      typeof source.data === "object"
        ? source.data
        : {},

    errors: [],
  };
}

function normalizeInvalidRow(row) {
  const source =
    row &&
    typeof row === "object"
      ? row
      : {};

  return {
    rowNumber:
      toPositiveInteger(
        source.row_number,
        0,
      ),

    isValid: false,

    data: {
      serial_number:
        source.serial_number ?? "",
    },

    errors: normalizeFieldErrors(
      source.errors,
    ),
  };
}

function normalizeFieldErrors(
  fieldErrors,
) {
  if (
    !fieldErrors ||
    typeof fieldErrors !== "object"
  ) {
    return [];
  }

  return Object.entries(
    fieldErrors,
  ).flatMap(
    ([
      fieldName,
      messages,
    ]) => {
      const normalizedMessages =
        Array.isArray(messages)
          ? messages
          : [messages];

      return normalizedMessages
        .filter(Boolean)
        .map((message) => ({
          field:
            formatFieldName(
              fieldName,
            ),

          message: String(message),
        }));
    },
  );
}

function formatFieldName(value) {
  return String(value)
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
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

function toPositiveInteger(
  value,
  fallback,
) {
  const numericValue =
    Number(value);

  if (
    !Number.isInteger(
      numericValue,
    ) ||
    numericValue < 1
  ) {
    return fallback;
  }

  return numericValue;
}