export function buildLaptopExportFileName(
  searchTerms = [],
) {
  const dateValue =
    formatLocalDate(
      new Date(),
    );

  const filterPart =
    Array.isArray(searchTerms) &&
    searchTerms.length > 0
      ? `-${searchTerms
          .map(normalizeFilePart)
          .filter(Boolean)
          .slice(0, 3)
          .join("-")}`
      : "";

  return `laptop-inventory${filterPart}-${dateValue}.xlsx`;
}

function normalizeFilePart(
  value,
) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "-",
    )
    .replace(
      /^-+|-+$/g,
      "",
    )
    .slice(0, 30);
}

function formatLocalDate(date) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(2, "0");

  const day =
    String(
      date.getDate(),
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}