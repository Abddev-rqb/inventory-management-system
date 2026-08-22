import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  exportSalesReport,
  getSalesReport,
} from "../../api/orderApi.js";

import {
  getManagedUsers,
} from "../../api/userApi.js";

import TotalSalesTable from "../../components/orders/TotalSalesTable.jsx";

import {
  parseApiError,
  parseBlobApiError,
} from "../../services/apiError.js";

import {
  validateDateRange,
} from "../../utils/orderValidation.js";


const EMPTY_SUMMARY = {
  total_sales_amount:
    "0.00",

  total_expenses:
    "0.00",

  total_orders:
    0,

  total_items:
    0,

  retail_sales:
    "0.00",

  wholesale_sales:
    "0.00",
};


function TotalSalesPage() {
  const [
    searchText,
    setSearchText,
  ] = useState("");

  const [
    selectedEmployeeId,
    setSelectedEmployeeId,
  ] = useState("");

  const [
    employees,
    setEmployees,
  ] = useState([]);

  const [
    startDate,
    setStartDate,
  ] = useState("");

  const [
    endDate,
    setEndDate,
  ] = useState("");

  const [
    appliedFilters,
    setAppliedFilters,
  ] = useState({
    search:
      "",

    start_date:
      "",

    end_date:
      "",

    employee_id:
      "",
  });

  const [
    sales,
    setSales,
  ] = useState([]);

  const [
    summary,
    setSummary,
  ] = useState(
    EMPTY_SUMMARY,
  );

  const [
    totalResults,
    setTotalResults,
  ] = useState(0);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState(null);

  const [
    filterError,
    setFilterError,
  ] = useState(null);

  const [
    isExporting,
    setIsExporting,
  ] = useState(false);

  const [
    exportError,
    setExportError,
  ] = useState(null);

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    hasNextPage,
    setHasNextPage,
  ] = useState(false);

  const [
    hasPreviousPage,
    setHasPreviousPage,
  ] = useState(false);


  const queryParams =
    useMemo(
      () => {
        const params = {
          page,
        };

        if (
          appliedFilters.search
        ) {
          params.search =
            appliedFilters.search;
        }

        if (
          appliedFilters
            .start_date
        ) {
          params.start_date =
            appliedFilters
              .start_date;
        }

        if (
          appliedFilters
            .end_date
        ) {
          params.end_date =
            appliedFilters
              .end_date;
        }

        if (
          appliedFilters
            .employee_id
        ) {
          params.employee_id =
            appliedFilters
              .employee_id;
        }

        return params;
      },
      [
        appliedFilters,
        page,
      ],
    );


  const exportParams =
    useMemo(
      () => {
        const params = {};

        if (
          appliedFilters.search
        ) {
          params.search =
            appliedFilters.search;
        }

        if (
          appliedFilters
            .start_date
        ) {
          params.start_date =
            appliedFilters
              .start_date;
        }

        if (
          appliedFilters
            .end_date
        ) {
          params.end_date =
            appliedFilters
              .end_date;
        }

        if (
          appliedFilters
            .employee_id
        ) {
          params.employee_id =
            appliedFilters
              .employee_id;
        }

        return params;
      },
      [
        appliedFilters,
      ],
    );


  const loadSales =
    useCallback(
      async () => {
        setIsLoading(
          true,
        );

        setLoadError(
          null,
        );

        try {
          const data =
            await getSalesReport(
              queryParams,
            );

          if (
            Array.isArray(
              data,
            )
          ) {
            setSales(
              data,
            );

            setTotalResults(
              data.length,
            );

            setSummary(
              EMPTY_SUMMARY,
            );

            setHasNextPage(
              false,
            );

            setHasPreviousPage(
              false,
            );

            return;
          }

          const results =
            Array.isArray(
              data?.results,
            )
              ? data.results
              : [];

          setSales(
            results,
          );

          setSummary({
            ...EMPTY_SUMMARY,
            ...(
              data?.summary ||
              {}
            ),
          });

          setTotalResults(
            Number(
              data?.count ??
                results.length,
            ),
          );

          setHasNextPage(
            Boolean(
              data?.next,
            ),
          );

          setHasPreviousPage(
            Boolean(
              data?.previous,
            ),
          );
        } catch (error) {
          const parsedError =
            parseApiError(
              error,
            );

          setLoadError(
            parsedError.message,
          );

          setSales(
            [],
          );

          setSummary(
            EMPTY_SUMMARY,
          );

          setTotalResults(
            0,
          );

          setHasNextPage(
            false,
          );

          setHasPreviousPage(
            false,
          );
        } finally {
          setIsLoading(
            false,
          );
        }
      },
      [
        queryParams,
      ],
    );


  const loadEmployees =
    useCallback(
      async () => {
        try {
          const data =
            await getManagedUsers();

          const results =
            Array.isArray(
              data,
            )
              ? data
              : Array.isArray(
                  data?.results,
                )
                ? data.results
                : [];

          /*
           * Include users who can actually
           * create sales.
           *
           * Sales users are the main
           * performance-filter options.
           */
          const salesUsers =
            results.filter(
              (managedUser) =>
                managedUser.role ===
                "sales",
            );

          setEmployees(
            salesUsers,
          );
        } catch {
          setEmployees(
            [],
          );
        }
      },
      [],
    );


  useEffect(() => {
    loadEmployees();
  }, [
    loadEmployees,
  ]);


  useEffect(() => {
    loadSales();
  }, [
    loadSales,
  ]);


  function handleApplyFilters(
    event,
  ) {
    event.preventDefault();

    setFilterError(
      null,
    );

    setExportError(
      null,
    );

    const validation =
      validateDateRange({
        startDate,
        endDate,
      });

    if (
      !validation.isValid
    ) {
      setFilterError(
        validation.message,
      );

      return;
    }

    setPage(
      1,
    );

    setAppliedFilters({
      search:
        String(searchText).trim(),

      start_date:
        startDate,

      end_date:
        endDate,

      employee_id:
        selectedEmployeeId,
    });
  }


  function handleClearFilters() {
    setSearchText(
      "",
    );

    setStartDate(
      "",
    );

    setEndDate(
      "",
    );

    setSelectedEmployeeId(
      "",
    );

    setFilterError(
      null,
    );

    setExportError(
      null,
    );

    setPage(
      1,
    );

    setAppliedFilters({
      search:
        "",

      start_date:
        "",

      end_date:
        "",

      employee_id:
        "",
    });
  }


  async function handleExport() {
    if (
      isExporting
    ) {
      return;
    }

    setIsExporting(
      true,
    );

    setExportError(
      null,
    );

    try {
      const {
        blob,
        headers,
      } =
        await exportSalesReport(
          exportParams,
        );

      downloadBlob({
        blob,

        headers,

        fallbackFilename:
          buildExportFilename(
            appliedFilters,
          ),
      });
    } catch (error) {
      const parsedError =
        await parseBlobApiError(
          error,
        );

      setExportError(
        parsedError.message,
      );
    } finally {
      setIsExporting(
        false,
      );
    }
  }


  const selectedEmployee =
    employees.find(
      (employee) =>
        String(
          employee.id,
        ) ===
        String(
          appliedFilters
            .employee_id,
        ),
    ) ??
    null;


  return (
    <section className="orders-page total-sales-page">
      <header className="orders-page-header">
        <div>
          <p className="application-eyebrow">
            Orders
          </p>

          <h1>
            Total Sales
          </h1>

          <p className="orders-page-description">
            Review dispatched sales,
            compare employee performance
            and export filtered reports.
          </p>
        </div>
      </header>


      <form
        className="sales-filter-panel"
        onSubmit={
          handleApplyFilters
        }
      >
        <div className="sales-filter-fields">
          <label className="sale-field sales-search-field">
            <span>Search</span>

            <input
              type="search"
              value={searchText}
              placeholder="Order, customer, serial, item..."
              onChange={(event) =>
                setSearchText(
                  event.target.value,
                )
              }
            />
          </label>


          <label className="sale-field sales-date-field">
            <span>
              From
            </span>

            <input
              type="date"
              value={
                startDate
              }
              max={
                endDate ||
                undefined
              }
              onChange={
                (event) =>
                  setStartDate(
                    event
                      .target
                      .value,
                  )
              }
            />
          </label>


          <label className="sale-field sales-date-field">
            <span>
              To
            </span>

            <input
              type="date"
              value={
                endDate
              }
              min={
                startDate ||
                undefined
              }
              onChange={
                (event) =>
                  setEndDate(
                    event
                      .target
                      .value,
                  )
              }
            />
          </label>

          <label className="sale-field sales-employee-field">
              <span>
                Sales employee
              </span>

              <select
                value={
                  selectedEmployeeId
                }
                onChange={
                  (event) =>
                    setSelectedEmployeeId(
                      event
                        .target
                        .value,
                    )
                }
              >
                <option value="">
                  All sales users
                </option>

                {employees.map(
                  (employee) => (
                    <option
                      key={
                        employee.id
                      }
                      value={
                        employee.id
                      }
                    >
                      {buildEmployeeLabel(
                        employee,
                      )}
                    </option>
                  ),
                )}
              </select>
            </label>
        </div>


        <div className="sales-filter-actions">
          <button
            type="submit"
            className="button button-primary"
            disabled={
              isLoading
            }
          >
            Apply
          </button>

          <button
            type="button"
            className="button button-secondary"
            disabled={
              isLoading
            }
            onClick={
              handleClearFilters
            }
          >
            Clear
          </button>

          <button
            type="button"
            className="button button-secondary"
            disabled={
              isExporting ||
              isLoading
            }
            onClick={
              handleExport
            }
          >
            {isExporting
              ? "Exporting..."
              : "Export Excel"}
          </button>
        </div>
      </form>


      {filterError ? (
        <div
          className="sale-draft-error"
          role="alert"
        >
          {filterError}
        </div>
      ) : null}


      {exportError ? (
        <div
          className="sale-draft-error"
          role="alert"
        >
          {exportError}
        </div>
      ) : null}


      {selectedEmployee ? (
        <div className="sales-filter-status">
          Showing sales for{" "}
          <strong>
            {buildEmployeeLabel(
              selectedEmployee,
            )}
          </strong>
        </div>
      ) : null}


      <div className="sales-summary-grid">
        <SalesSummaryCard
          label="Total sales amount"
          value={
            formatMoney(
              summary
                .total_sales_amount,
            )
          }
        />

        <SalesSummaryCard
          label="Total expenses"
          value={
            formatMoney(
              summary
                .total_expenses,
            )
          }
        />

        <SalesSummaryCard
          label="Total orders"
          value={
            formatInteger(
              summary
                .total_orders,
            )
          }
        />

        <SalesSummaryCard
          label="Total items sold"
          value={
            formatInteger(
              summary
                .total_items,
            )
          }
        />

        <SalesSummaryCard
          label="Retail sales"
          value={
            formatMoney(
              summary
                .retail_sales,
            )
          }
        />

        <SalesSummaryCard
          label="Wholesale sales"
          value={
            formatMoney(
              summary
                .wholesale_sales,
            )
          }
        />
      </div>


      <div className="sales-results-header">
        <div>
          <h2>
            Sales
          </h2>

          <p>
            {totalResults}

            {" "}

            {totalResults === 1
              ? "order"
              : "orders"}
          </p>
        </div>


        {hasActiveFilters(
          appliedFilters,
        ) ? (
          <span className="sales-filter-status">
            {buildFilterLabel(
              appliedFilters,
              selectedEmployee,
            )}
          </span>
        ) : null}
      </div>


      {loadError ? (
        <div
          className="sale-draft-error"
          role="alert"
        >
          {loadError}

          <div className="pending-orders-retry">
            <button
              type="button"
              className="button button-secondary"
              onClick={
                loadSales
              }
            >
              Retry
            </button>
          </div>
        </div>
      ) : null}


      {isLoading ? (
        <div className="orders-loading-state">
          Loading sales...
        </div>
      ) : null}


      {!isLoading &&
      !loadError &&
      sales.length === 0 ? (
        <div className="orders-empty-state">
          <h2>
            No sales found
          </h2>

          <p>
            No dispatched sales match
            the selected filters.
          </p>
        </div>
      ) : null}


      {!isLoading &&
      !loadError &&
      sales.length > 0 ? (
        <>
          <TotalSalesTable
            sales={
              sales
            }
          />

          <div className="sales-pagination">
            <button
              type="button"
              className="button button-secondary"
              disabled={
                !hasPreviousPage ||
                isLoading
              }
              onClick={() =>
                setPage(
                  (
                    currentPage,
                  ) =>
                    Math.max(
                      1,
                      currentPage -
                        1,
                    ),
                )
              }
            >
              Previous
            </button>

            <span>
              Page {page}
            </span>

            <button
              type="button"
              className="button button-secondary"
              disabled={
                !hasNextPage ||
                isLoading
              }
              onClick={() =>
                setPage(
                  (
                    currentPage,
                  ) =>
                    currentPage +
                    1,
                )
              }
            >
              Next
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}


function buildEmployeeLabel(
  employee,
) {
  const fullName = [
    employee.first_name,
    employee.last_name,
  ]
    .filter(
      Boolean,
    )
    .join(
      " ",
    )
    .trim();

  if (
    fullName
  ) {
    return (
      `${fullName} ` +
      `(${employee.username})`
    );
  }

  return (
    employee.username
  );
}


function SalesSummaryCard({
  label,
  value,
}) {
  return (
    <article className="sales-summary-card">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </article>
  );
}


function hasActiveFilters(
  filters,
) {
  return Boolean(
    filters.search ||
    filters.start_date ||
    filters.end_date ||
    filters.employee_id,
  );
}


function buildFilterLabel(
  filters,
  employee,
) {
  const parts = [];

  if (filters.search) {
    parts.push(
      `Search: ${filters.search}`,
    );
  }

  if (
    filters.start_date &&
    filters.end_date
  ) {
    parts.push(
      (
        `${formatDateOnly(
          filters.start_date,
        )} – ` +
        `${formatDateOnly(
          filters.end_date,
        )}`
      ),
    );
  } else if (
    filters.start_date
  ) {
    parts.push(
      (
        `From ${formatDateOnly(
          filters.start_date,
        )}`
      ),
    );
  } else if (
    filters.end_date
  ) {
    parts.push(
      (
        `Up to ${formatDateOnly(
          filters.end_date,
        )}`
      ),
    );
  }

  if (
    employee
  ) {
    parts.push(
      buildEmployeeLabel(
        employee,
      ),
    );
  }

  return parts.join(
    " · ",
  );
}


function formatDateOnly(
  value,
) {
  if (
    !value
  ) {
    return "";
  }

  const [
    year,
    month,
    day,
  ] =
    value.split(
      "-",
    );

  if (
    !year ||
    !month ||
    !day
  ) {
    return value;
  }

  return (
    `${day}/${month}/${year}`
  );
}


function formatMoney(
  value,
) {
  const amount =
    Number(
      value,
    );

  if (
    !Number.isFinite(
      amount,
    )
  ) {
    return (
      "₹0.00"
    );
  }

  return (
    new Intl.NumberFormat(
      "en-IN",
      {
        style:
          "currency",

        currency:
          "INR",

        minimumFractionDigits:
          2,

        maximumFractionDigits:
          2,
      },
    )
    .format(
      amount,
    )
  );
}


function formatInteger(
  value,
) {
  const number =
    Number(
      value,
    );

  if (
    !Number.isFinite(
      number,
    )
  ) {
    return "0";
  }

  return (
    new Intl.NumberFormat(
      "en-IN",
      {
        maximumFractionDigits:
          0,
      },
    )
    .format(
      number,
    )
  );
}


function buildExportFilename(
  filters,
) {
  const pieces = [
    "total-sales",
  ];

  if (filters.search) {
    const safeSearch = String(
      filters.search,
    )
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 30);

    if (safeSearch) {
      pieces.push(
        `search-${safeSearch}`,
      );
    }
  }

  if (
    filters.employee_id
  ) {
    pieces.push(
      `employee-${filters.employee_id}`,
    );
  }

  if (
    filters.start_date
  ) {
    pieces.push(
      `from-${filters.start_date}`,
    );
  }

  if (
    filters.end_date
  ) {
    pieces.push(
      `to-${filters.end_date}`,
    );
  }

  return (
    `${pieces.join("-")}.xlsx`
  );
}


function getFilenameFromHeaders(
  headers,
) {
  const disposition =
    headers?.[
      "content-disposition"
    ];

  if (
    !disposition
  ) {
    return null;
  }

  const utfMatch =
    disposition.match(
      /filename\*=UTF-8''([^;]+)/i,
    );

  if (
    utfMatch?.[1]
  ) {
    try {
      return decodeURIComponent(
        utfMatch[
          1
        ].replace(
          /["']/g,
          "",
        ),
      );
    } catch {
      return (
        utfMatch[1]
      );
    }
  }

  const normalMatch =
    disposition.match(
      /filename="?([^";]+)"?/i,
    );

  return (
    normalMatch?.[1] ||
    null
  );
}


function downloadBlob({
  blob,
  headers,
  fallbackFilename,
}) {
  if (
    !(blob instanceof Blob)
  ) {
    throw new Error(
      (
        "The export response " +
        "was not a valid file."
      ),
    );
  }

  const filename =
    getFilenameFromHeaders(
      headers,
    ) ||
    fallbackFilename;

  const objectUrl =
    URL.createObjectURL(
      blob,
    );

  const anchor =
    document.createElement(
      "a",
    );

  anchor.href =
    objectUrl;

  anchor.download =
    filename;

  document.body.appendChild(
    anchor,
  );

  anchor.click();

  anchor.remove();

  URL.revokeObjectURL(
    objectUrl,
  );
}


export default TotalSalesPage;