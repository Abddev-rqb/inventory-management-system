function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
  isDisabled = false,
}) {
  if (totalItems === 0) {
    return null;
  }

  const firstItem =
    (currentPage - 1) * pageSize + 1;

  const lastItem = Math.min(
    currentPage * pageSize,
    totalItems,
  );

  function goToPreviousPage() {
    if (
      hasPreviousPage &&
      !isDisabled
    ) {
      onPageChange(currentPage - 1);
    }
  }

  function goToNextPage() {
    if (
      hasNextPage &&
      !isDisabled
    ) {
      onPageChange(currentPage + 1);
    }
  }

  return (
    <div className="pagination">
      <p className="pagination-summary">
        Showing{" "}
        <strong>
          {firstItem}–{lastItem}
        </strong>{" "}
        of{" "}
        <strong>{totalItems}</strong>{" "}
        products
      </p>

      <div className="pagination-controls">
        <button
          type="button"
          className="button button-secondary"
          onClick={goToPreviousPage}
          disabled={
            !hasPreviousPage ||
            isDisabled
          }
        >
          Previous
        </button>

        <span className="pagination-page">
          Page{" "}
          <strong>{currentPage}</strong>{" "}
          of{" "}
          <strong>{totalPages}</strong>
        </span>

        <button
          type="button"
          className="button button-secondary"
          onClick={goToNextPage}
          disabled={
            !hasNextPage ||
            isDisabled
          }
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Pagination;