import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  exportLaptops,
  getLaptops,
} from "../api/laptopApi.js";

import {
  createOrder,
} from "../api/orderApi.js";

import {
  useAuth,
} from "../auth/AuthContext.jsx";

import AlertMessage from "../components/common/AlertMessage.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import Pagination from "../components/common/Pagination.jsx";

import InventoryActions from "../components/laptops/InventoryActions.jsx";
import LaptopListToolbar from "../components/laptops/LaptopListToolbar.jsx";
import LaptopTable from "../components/laptops/LaptopTable.jsx";

import PriceModeDialog from "../components/orders/PriceModeDialog.jsx";
import SelectedProductsDialog from "../components/orders/SelectedProductsDialog.jsx";

import {
  parseApiError,
  parseBlobApiError,
} from "../services/apiError.js";

import {
  downloadBlobFile,
  getFileNameFromContentDisposition,
} from "../services/fileDownload.js";

import {
  buildLaptopExportFileName,
} from "../services/laptopExport.js";


const DEFAULT_PAGE_SIZE =
  25;

const DEFAULT_ORDERING =
  "-created_at";


function LaptopListPage() {
  const location =
    useLocation();

  const navigate =
    useNavigate();

  const {
    user,
    hasPermission,
  } = useAuth();


  const isAdmin =
    Boolean(
      user?.is_staff ||
      user?.is_superuser ||
      user?.role ===
        "admin",
    );

  const canSeeTotalProducts =
    isAdmin;


  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const [
    isSaleDraftOpen,
    setIsSaleDraftOpen,
  ] = useState(false);

  const [
    isCreatingSale,
    setIsCreatingSale,
  ] = useState(false);

  const [
    saleError,
    setSaleError,
  ] = useState(null);

  const [
    isPriceModeDialogOpen,
    setIsPriceModeDialogOpen,
  ] = useState(false);

  const [
    priceMode,
    setPriceMode,
  ] = useState(null);

  const [
    selectedLaptops,
    setSelectedLaptops,
  ] = useState(
    () =>
      new Map(),
  );

  const [
    laptops,
    setLaptops,
  ] = useState([]);

  const [
    totalProducts,
    setTotalProducts,
  ] = useState(0);

  const [
    hasNextPage,
    setHasNextPage,
  ] = useState(false);

  const [
    hasPreviousPage,
    setHasPreviousPage,
  ] = useState(false);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
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
    successTitle,
  ] = useState(
    () =>
      location.state
        ?.successTitle ??
      "Operation completed",
  );

  const [
    successMessage,
  ] = useState(
    () =>
      location.state
        ?.successMessage ??
      null,
  );


  const canAddLaptop =
    hasPermission(
      "inventory.add_laptop",
    );

  const isSales =
    user?.role ===
    "sales";

  const canExportLaptops =
    isAdmin ||
    isSales;

  const canCreateOrder =
    hasPermission(
      "inventory.add_order",
    );


  const page =
    parsePositiveInteger(
      searchParams.get(
        "page",
      ),
      1,
    );

  const ordering =
    searchParams.get(
      "ordering",
    ) ||
    DEFAULT_ORDERING;

  const searchParamsKey =
    searchParams.toString();

  const searchTerms =
    useMemo(
      () =>
        getUniqueSearchTerms(
          searchParams.getAll(
            "filter",
          ),
        ),
      [
        searchParamsKey,
      ],
    );


  const currentInventoryLocation =
    `${location.pathname}${location.search}`;

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalProducts /
          DEFAULT_PAGE_SIZE,
      ),
    );


  const loadLaptops =
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
            await getLaptops({
              page,

              pageSize:
                DEFAULT_PAGE_SIZE,

              searchTerms,

              ordering,
            });

          setLaptops(
            Array.isArray(
              data.results,
            )
              ? data.results
              : [],
          );

          setTotalProducts(
            Number(
              data.count,
            ) || 0,
          );

          setHasNextPage(
            Boolean(
              data.next,
            ),
          );

          setHasPreviousPage(
            Boolean(
              data.previous,
            ),
          );
        } catch (error) {
          setLoadError(
            parseApiError(
              error,
            ),
          );

          setLaptops(
            [],
          );

          setTotalProducts(
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
        page,
        ordering,
        searchTerms,
      ],
    );


  useEffect(() => {
    if (
      !location.state
        ?.successMessage
    ) {
      return;
    }

    navigate(
      (
        `${location.pathname}` +
        `${location.search}`
      ),
      {
        replace: true,
        state: null,
      },
    );
  }, [
    location.pathname,
    location.search,
    location.state,
    navigate,
  ]);


  useEffect(() => {
    loadLaptops();
  }, [
    loadLaptops,
  ]);


  useEffect(() => {
    if (
      !isLoading &&
      !loadError &&
      page > totalPages
    ) {
      updateUrlState({
        page:
          totalPages,

        searchTerms,

        ordering,

        setSearchParams,
      });
    }
  }, [
    isLoading,
    loadError,
    ordering,
    page,
    searchTerms,
    setSearchParams,
    totalPages,
  ]);


  useEffect(() => {
    if (
      isSaleDraftOpen &&
      selectedLaptops.size ===
        0
    ) {
      setIsSaleDraftOpen(
        false,
      );
    }
  }, [
    isSaleDraftOpen,
    selectedLaptops,
  ]);


  function handleRemoveSelectedLaptop(
    laptopId,
  ) {
    const normalizedId =
      Number(
        laptopId,
      );

    setSelectedLaptops(
      (
        currentSelection,
      ) => {
        const nextSelection =
          new Map(
            currentSelection,
          );

        nextSelection.delete(
          normalizedId,
        );

        return nextSelection;
      },
    );
  }


  function handleOpenSelectionMode() {
    if (
      !canCreateOrder ||
      isSelectionMode
    ) {
      return;
    }

    setIsPriceModeDialogOpen(
      true,
    );
  }


  function handleClosePriceModeDialog() {
    setIsPriceModeDialogOpen(
      false,
    );
  }


  function handleConfirmPriceMode(
    nextPriceMode,
  ) {
    if (
      nextPriceMode !==
        "retail" &&
      nextPriceMode !==
        "wholesale"
    ) {
      return;
    }

    setPriceMode(
      nextPriceMode,
    );

    setSelectedLaptops(
      new Map(),
    );

    setIsPriceModeDialogOpen(
      false,
    );
  }


  function handleCancelSelection() {
    setSelectedLaptops(
      new Map(),
    );

    setPriceMode(
      null,
    );

    setIsPriceModeDialogOpen(
      false,
    );

    setIsSaleDraftOpen(
      false,
    );

    setSaleError(
      null,
    );
  }


  function handleToggleLaptop(
    laptop,
  ) {
    const laptopId =
      Number(
        laptop.id,
      );

    if (
      !Number.isInteger(
        laptopId,
      )
    ) {
      return;
    }

    if (
      !isLaptopSaleable(
        laptop,
      )
    ) {
      return;
    }

    setSelectedLaptops(
      (
        currentSelection,
      ) => {
        const nextSelection =
          new Map(
            currentSelection,
          );

        if (
          nextSelection.has(
            laptopId,
          )
        ) {
          nextSelection.delete(
            laptopId,
          );
        } else {
          nextSelection.set(
            laptopId,
            laptop,
          );
        }

        return nextSelection;
      },
    );
  }


  function handleAddSearchTerm(
    newTerm,
  ) {
    setExportError(
      null,
    );

    const normalizedTerm =
      newTerm.trim();

    if (!normalizedTerm) {
      return false;
    }

    const alreadyExists =
      searchTerms.some(
        (term) =>
          term.toLowerCase() ===
          normalizedTerm.toLowerCase(),
      );

    if (
      alreadyExists
    ) {
      return false;
    }

    updateUrlState({
      page: 1,

      searchTerms: [
        ...searchTerms,
        normalizedTerm,
      ],

      ordering,

      setSearchParams,
    });

    return true;
  }


  function handleRemoveSearchTerm(
    termToRemove,
  ) {
    setExportError(
      null,
    );

    const remainingTerms =
      searchTerms.filter(
        (term) =>
          term.toLowerCase() !==
          termToRemove.toLowerCase(),
      );

    updateUrlState({
      page: 1,

      searchTerms:
        remainingTerms,

      ordering,

      setSearchParams,
    });
  }


  function handleClearSearchTerms() {
    setExportError(
      null,
    );

    updateUrlState({
      page: 1,

      searchTerms: [],

      ordering,

      setSearchParams,
    });
  }


  function handleOrderingChange(
    nextOrdering,
  ) {
    setExportError(
      null,
    );

    updateUrlState({
      page: 1,

      searchTerms,

      ordering:
        nextOrdering,

      setSearchParams,
    });
  }


  function handlePageChange(
    nextPage,
  ) {
    setExportError(
      null,
    );

    if (
      nextPage < 1 ||
      nextPage >
        totalPages ||
      nextPage === page
    ) {
      return;
    }

    updateUrlState({
      page:
        nextPage,

      searchTerms,

      ordering,

      setSearchParams,
    });

    window.scrollTo({
      top: 0,
      behavior:
        "smooth",
    });
  }


  function buildExportQueryParameters() {
    const queryParameters =
      {};

    const normalizedSearch =
      searchTerms
        .map(
          (term) =>
            term.trim(),
        )
        .filter(Boolean)
        .join(" ");

    if (
      normalizedSearch
    ) {
      queryParameters.search =
        normalizedSearch;
    }

    if (
      ordering
    ) {
      queryParameters.ordering =
        ordering;
    }

    return queryParameters;
  }


  async function handleExportLaptops() {
    if (
      isExporting ||
      !canExportLaptops
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
      const exportResult =
        await exportLaptops(
          buildExportQueryParameters(),
        );

      const hasUsableBlob =
        exportResult.blob
          instanceof Blob &&
        exportResult.blob.size >
          0;

      const isSupportedContentType =
        !exportResult.contentType ||
        exportResult.contentType.includes(
          (
            "application/vnd." +
            "openxmlformats-officedocument." +
            "spreadsheetml.sheet"
          ),
        ) ||
        exportResult.contentType.includes(
          "application/vnd.ms-excel",
        ) ||
        exportResult.contentType.includes(
          "application/octet-stream",
        );

      if (
        !hasUsableBlob ||
        !isSupportedContentType
      ) {
        throw new Error(
          (
            "The server did not return " +
            "a valid Excel workbook."
          ),
        );
      }

      const responseFileName =
        getFileNameFromContentDisposition(
          exportResult
            .contentDisposition,
        );

      const fallbackFileName =
        buildLaptopExportFileName(
          searchTerms,
        );

      downloadBlobFile({
        blob:
          exportResult.blob,

        fileName:
          responseFileName ??
          fallbackFileName,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        !error.response
      ) {
        setExportError(
          error.message,
        );

        return;
      }

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


  async function handleCreateSale({
    customerName,
    customerAddress,
    via,
    viaOther,
    customItems,
  }) {
    if (
      isCreatingSale ||
      !priceMode ||
      selectedLaptops.size ===
        0
    ) {
      return;
    }

    setIsCreatingSale(
      true,
    );

    setSaleError(
      null,
    );

    try {
      const laptopItems =
        Array.from(
          selectedLaptops
            .values(),
        ).map(
          (laptop) => ({
            laptop_id:
              Number(
                laptop.id,
              ),

            quantity: 1,
          }),
        );

      const order =
        await createOrder({
          customer_name:
            customerName,

          customer_address:
            customerAddress,

          price_mode:
            priceMode,

          via,

          via_other:
            viaOther,

          laptop_items:
            laptopItems,

          custom_items:
            customItems,
        });

      setIsSaleDraftOpen(
        false,
      );

      setSelectedLaptops(
        new Map(),
      );

      setPriceMode(
        null,
      );

      await loadLaptops();

      navigate(
        "/orders/pending",
        {
          state: {
            successTitle:
              "Sale created",

            successMessage:
              (
                `Order ` +
                `${order.order_number} ` +
                `was created successfully.`
              ),
          },
        },
      );
    } catch (error) {
      const parsedError =
        parseApiError(
          error,
        );

      setSaleError(
        parsedError.message,
      );
    } finally {
      setIsCreatingSale(
        false,
      );
    }
  }


  const hasActiveSearch =
    searchTerms.length >
    0;

  const isSelectionMode =
    priceMode !==
    null;

  const selectedLaptopIds =
    useMemo(
      () =>
        new Set(
          selectedLaptops
            .keys(),
        ),
      [
        selectedLaptops,
      ],
    );

  const selectedCount =
    selectedLaptops.size;

  const selectedPriceModeLabel =
    priceMode ===
      "retail"
      ? "Retail"
      : priceMode ===
          "wholesale"
        ? "Wholesale"
        : null;


  return (
    <section className="inventory-page">
      <div className="inventory-page-header">
        <div>
          <p className="application-eyebrow">
            Inventory Management
          </p>

          <h2>
            Laptop Inventory
          </h2>
        </div>

        <div className="inventory-header-actions">
          <InventoryActions
            inventoryLocation={
              currentInventoryLocation
            }
            canAddLaptop={
              canAddLaptop
            }
            canExportLaptops={
              canExportLaptops
            }
            isExporting={
              isExporting
            }
            onExport={
              handleExportLaptops
            }
          />

          {canCreateOrder ? (
            isSelectionMode ? (
              <button
                type="button"
                className="button button-secondary"
                onClick={
                  handleCancelSelection
                }
              >
                Cancel selection
              </button>
            ) : (
              <button
                type="button"
                className="button button-primary"
                onClick={
                  handleOpenSelectionMode
                }
              >
                Select
              </button>
            )
          ) : null}
        </div>
      </div>


      <div className="inventory-statistics">
        {canSeeTotalProducts ? (
          <article className="statistic-card">
            <span className="statistic-label">
              Total product
            </span>

            <strong className="statistic-value">
              {totalProducts}
            </strong>
          </article>
        ) : null}


        {canCreateOrder &&
        isSelectionMode ? (
          <button
            type="button"
            className={
              (
                "statistic-card " +
                "statistic-card-selected " +
                "selected-products-button"
              )
            }
            disabled={
              selectedCount ===
              0
            }
            onClick={() => {
              setSaleError(
                null,
              );

              setIsSaleDraftOpen(
                true,
              );
            }}
          >
            <span className="statistic-label">
              Selected
            </span>

            <strong className="statistic-value">
              {selectedCount}
            </strong>
          </button>
        ) : null}


        {canCreateOrder &&
        isSelectionMode ? (
          <article className="statistic-card">
            <span className="statistic-label">
              Price mode
            </span>

            <strong
              className={
                (
                  "statistic-value " +
                  "statistic-value-text"
                )
              }
            >
              {
                selectedPriceModeLabel
              }
            </strong>
          </article>
        ) : null}
      </div>


      <div className="inventory-list-controls">
        <LaptopListToolbar
          searchTerms={
            searchTerms
          }
          ordering={
            ordering
          }
          onAddSearchTerm={
            handleAddSearchTerm
          }
          onRemoveSearchTerm={
            handleRemoveSearchTerm
          }
          onClearSearchTerms={
            handleClearSearchTerms
          }
          onOrderingChange={
            handleOrderingChange
          }
          isDisabled={
            isLoading
          }
        />
      </div>


      {successMessage ? (
        <AlertMessage
          variant="success"
          title={
            successTitle
          }
          message={
            successMessage
          }
        />
      ) : null}


      {exportError ? (
        <AlertMessage
          variant="error"
          title="Excel export failed"
          message={
            exportError
          }
        />
      ) : null}


      {loadError ? (
        <AlertMessage
          variant="error"
          title="Unable to load laptops"
          message={
            loadError.message
          }
        >
          <button
            type="button"
            className="button button-secondary"
            onClick={
              loadLaptops
            }
          >
            Try again
          </button>
        </AlertMessage>
      ) : null}


      {isLoading ? (
        <LoadingState
          title="Loading laptops"
          message={
            (
              "Retrieving inventory records " +
              "from the Django API."
            )
          }
          size="large"
        />
      ) : null}


      {!isLoading &&
      !loadError &&
      laptops.length ===
        0 ? (
        <EmptyState
          title={
            hasActiveSearch
              ? "No matching laptops"
              : "No laptops found"
          }
          message={
            hasActiveSearch
              ? (
                  "Remove one or more search " +
                  "filters to broaden the results."
                )
              : (
                  "The inventory does not contain " +
                  "any laptop records."
                )
          }
          action={
            hasActiveSearch ? (
              <button
                type="button"
                className="button button-secondary"
                onClick={
                  handleClearSearchTerms
                }
              >
                Clear search filters
              </button>
            ) : null
          }
        />
      ) : null}


      {!isLoading &&
      !loadError &&
      laptops.length >
        0 ? (
        <div className="inventory-table-section">
          <LaptopTable
            laptops={
              laptops
            }
            isSelectionMode={
              canCreateOrder &&
              isSelectionMode
            }
            selectedLaptopIds={
              selectedLaptopIds
            }
            onToggleLaptop={
              handleToggleLaptop
            }
          />

          <Pagination
            currentPage={
              page
            }
            totalPages={
              totalPages
            }
            totalItems={
              totalProducts
            }
            pageSize={
              DEFAULT_PAGE_SIZE
            }
            hasNextPage={
              hasNextPage
            }
            hasPreviousPage={
              hasPreviousPage
            }
            onPageChange={
              handlePageChange
            }
            isDisabled={
              isLoading
            }
          />
        </div>
      ) : null}


      {canCreateOrder ? (
        <>
          <SelectedProductsDialog
            isOpen={
              isSaleDraftOpen
            }
            selectedLaptops={
              selectedLaptops
            }
            priceMode={
              priceMode
            }
            isSubmitting={
              isCreatingSale
            }
            errorMessage={
              saleError
            }
            onClose={() => {
              if (
                !isCreatingSale
              ) {
                setSaleError(
                  null,
                );

                setIsSaleDraftOpen(
                  false,
                );
              }
            }}
            onRemoveLaptop={
              handleRemoveSelectedLaptop
            }
            onSubmit={
              handleCreateSale
            }
          />

          <PriceModeDialog
            isOpen={
              isPriceModeDialogOpen
            }
            onClose={
              handleClosePriceModeDialog
            }
            onConfirm={
              handleConfirmPriceMode
            }
          />
        </>
      ) : null}
    </section>
  );
}


function updateUrlState({
  page,
  searchTerms,
  ordering,
  setSearchParams,
}) {
  const nextParams =
    new URLSearchParams();

  if (
    page > 1
  ) {
    nextParams.set(
      "page",
      String(
        page,
      ),
    );
  }

  searchTerms.forEach(
    (term) => {
      nextParams.append(
        "filter",
        term,
      );
    },
  );

  if (
    ordering &&
    ordering !==
      DEFAULT_ORDERING
  ) {
    nextParams.set(
      "ordering",
      ordering,
    );
  }

  setSearchParams(
    nextParams,
  );
}


function getUniqueSearchTerms(
  terms,
) {
  const seenTerms =
    new Set();

  return terms
    .map(
      (term) =>
        term.trim(),
    )
    .filter(Boolean)
    .filter(
      (term) => {
        const normalizedTerm =
          term.toLowerCase();

        if (
          seenTerms.has(
            normalizedTerm,
          )
        ) {
          return false;
        }

        seenTerms.add(
          normalizedTerm,
        );

        return true;
      },
    );
}


function parsePositiveInteger(
  value,
  fallback,
) {
  const parsedValue =
    Number.parseInt(
      value,
      10,
    );

  if (
    !Number.isInteger(
      parsedValue,
    ) ||
    parsedValue < 1
  ) {
    return fallback;
  }

  return parsedValue;
}


function isLaptopSaleable(
  laptop,
) {
  const quantity =
    Number(
      laptop.quantity,
    );

  const saleableStatus =
    laptop.inventory_status ===
      "in_stock" ||
    laptop.inventory_status ===
      "in_stock_g";

  return (
    saleableStatus &&
    quantity === 1
  );
}


export default LaptopListPage;