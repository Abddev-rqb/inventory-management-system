import {
  useState,
} from "react";

const ORDERING_OPTIONS = [
  {
    value: "-created_at",
    label: "Newest first",
  },
  {
    value: "created_at",
    label: "Oldest first",
  },
  {
    value: "company",
    label: "Company A–Z",
  },
  {
    value: "-company",
    label: "Company Z–A",
  },
  {
    value: "retail_price",
    label: "Retail price: Low to high",
  },
  {
    value: "-retail_price",
    label: "Retail price: High to low",
  },
  {
    value: "wholesale_price",
    label: "Wholesale: Low to high",
  },
  {
    value: "-wholesale_price",
    label: "Wholesale: High to low",
  },
  {
    value: "ram_gb",
    label: "RAM: Low to high",
  },
  {
    value: "-ram_gb",
    label: "RAM: High to low",
  },
  {
    value: "storage_gb",
    label: "Storage: Low to high",
  },
  {
    value: "-storage_gb",
    label: "Storage: High to low",
  },
];

function LaptopListToolbar({
  searchTerms,
  ordering,
  onAddSearchTerm,
  onRemoveSearchTerm,
  onClearSearchTerms,
  onOrderingChange,
  isDisabled = false,
}) {
  const [inputValue, setInputValue] =
    useState("");

  function handleSubmit(event) {
    event.preventDefault();

    const normalizedValue =
      inputValue.trim();

    if (!normalizedValue) {
      return;
    }

    const wasAdded = onAddSearchTerm(
      normalizedValue,
    );

    if (wasAdded) {
      setInputValue("");
    }
  }

  function handleInputChange(event) {
    setInputValue(
      event.target.value,
    );
  }

  return (
    <div className="laptop-list-toolbar">
      <form
        className="search-filter-form"
        onSubmit={handleSubmit}
      >
        <label
          htmlFor="laptop-search-filter"
          className="screen-reader-only"
        >
          Add a laptop search filter
        </label>

        <input
          id="laptop-search-filter"
          type="search"
          className="search-filter-input"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Search laptops"
          autoComplete="off"
          disabled={isDisabled}
        />

        <button
          type="submit"
          className="button search-filter-add"
          aria-label="Add search filter"
          title="Add search filter"
          disabled={
            isDisabled ||
            !inputValue.trim()
          }
        >
          +
        </button>
      </form>

      <div
        className="search-filter-chips"
        aria-label="Active search filters"
      >
        {searchTerms.map((term) => (
          <span
            key={term.toLowerCase()}
            className="search-filter-chip"
          >
            <span>{term}</span>

            <button
              type="button"
              className="search-filter-remove"
              onClick={() =>
                onRemoveSearchTerm(term)
              }
              aria-label={`Remove ${term} filter`}
              title={`Remove ${term}`}
              disabled={isDisabled}
            >
              ×
            </button>
          </span>
        ))}

        {searchTerms.length > 1 ? (
          <button
            type="button"
            className="clear-search-filters"
            onClick={onClearSearchTerms}
            disabled={isDisabled}
          >
            Clear all
          </button>
        ) : null}
      </div>

      <div className="ordering-control">
        <label htmlFor="laptop-ordering">
          Order by
        </label>

        <select
          id="laptop-ordering"
          value={ordering}
          onChange={(event) =>
            onOrderingChange(
              event.target.value,
            )
          }
          disabled={isDisabled}
        >
          {ORDERING_OPTIONS.map(
            (option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ),
          )}
        </select>
      </div>
    </div>
  );
}

export default LaptopListToolbar;