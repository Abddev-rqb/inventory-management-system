import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  bulkDispatchOrders,
  deletePendingOrder,
  dispatchOrder,
  getPendingOrders,
} from "../../api/orderApi.js";

import {
  useAuth,
} from "../../auth/AuthContext.jsx";

import ConfirmDialog from "../../components/common/ConfirmDialog.jsx";
import PendingOrdersTable from "../../components/orders/PendingOrdersTable.jsx";
import SelectedPendingOrdersDialog from "../../components/orders/SelectedPendingOrdersDialog.jsx";

import {
  parseApiError,
} from "../../services/apiError.js";


function PendingOrdersPage() {
  const {
    user,
    hasPermission,
  } = useAuth();

  const [
    orders,
    setOrders,
  ] = useState([]);

  const [
    totalOrders,
    setTotalOrders,
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
    successMessage,
    setSuccessMessage,
  ] = useState(null);

  const [
    isSelectionMode,
    setIsSelectionMode,
  ] = useState(false);

  const [
    selectedOrders,
    setSelectedOrders,
  ] = useState(
    () =>
      new Map(),
  );

  const [
    isSelectedDialogOpen,
    setIsSelectedDialogOpen,
  ] = useState(false);

  const [
    isDispatching,
    setIsDispatching,
  ] = useState(false);

  const [
    processingOrderId,
    setProcessingOrderId,
  ] = useState(null);

  const [
    dispatchError,
    setDispatchError,
  ] = useState(null);


  const [
    orderToDelete,
    setOrderToDelete,
  ] = useState(null);

  const [
    deletingOrderId,
    setDeletingOrderId,
  ] = useState(null);

  const [
    deleteError,
    setDeleteError,
  ] = useState(null);


  const [
    searchText,
    setSearchText,
  ] = useState("");

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
    search: "",
    start_date: "",
    end_date: "",
  });

  const [
    filterError,
    setFilterError,
  ] = useState(null);


  const queryParams =
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
          appliedFilters.start_date
        ) {
          params.start_date =
            appliedFilters.start_date;
        }

        if (
          appliedFilters.end_date
        ) {
          params.end_date =
            appliedFilters.end_date;
        }

        return params;
      },
      [appliedFilters],
    );


  const role =
    user?.role;

  const isAdmin =
    Boolean(
      user?.is_staff ||
      user?.is_superuser ||
      role === "admin",
    );

  const isSales =
    role ===
    "sales";


  const canDispatchOrders =
    hasPermission(
      "inventory.change_order",
    );

  const canDeletePendingOrders =
    isAdmin ||
    isSales;


  const isProcessing =
    isDispatching ||
    deletingOrderId !==
      null;

  const isInventoryViewer =
    user?.role ===
    "inventory_viewer";

  const canViewTotalAmount =
    !isInventoryViewer;


  const loadPendingOrders =
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
            await getPendingOrders(
              queryParams,
            );

          if (
            Array.isArray(
              data,
            )
          ) {
            setOrders(
              data,
            );

            setTotalOrders(
              data.length,
            );

            return;
          }

          const results =
            Array.isArray(
              data?.results,
            )
              ? data.results
              : [];

          setOrders(
            results,
          );

          setTotalOrders(
            Number(
              data?.count ??
                0,
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

          setOrders(
            [],
          );

          setTotalOrders(
            0,
          );
        } finally {
          setIsLoading(
            false,
          );
        }
      },
      [queryParams],
    );


  useEffect(() => {
    loadPendingOrders();
  }, [
    loadPendingOrders,
  ]);


  const selectedOrderIds =
    useMemo(
      () =>
        new Set(
          selectedOrders.keys(),
        ),
      [
        selectedOrders,
      ],
    );


  const selectedOrderList =
    useMemo(
      () =>
        Array.from(
          selectedOrders.values(),
        ),
      [
        selectedOrders,
      ],
    );


  function handleApplyFilters(
    event,
  ) {
    event.preventDefault();

    setFilterError(null);

    if (
      startDate
      && endDate
      && startDate > endDate
    ) {
      setFilterError(
        "End date cannot be before start date.",
      );
      return;
    }

    setAppliedFilters({
      search:
        String(searchText).trim(),
      start_date:
        startDate,
      end_date:
        endDate,
    });
  }


  function handleClearFilters() {
    setSearchText("");
    setStartDate("");
    setEndDate("");
    setFilterError(null);
    setAppliedFilters({
      search: "",
      start_date: "",
      end_date: "",
    });
  }


  function handleStartSelection() {
    if (
      !canDispatchOrders
    ) {
      return;
    }

    setSuccessMessage(
      null,
    );

    setDispatchError(
      null,
    );

    setDeleteError(
      null,
    );

    setSelectedOrders(
      new Map(),
    );

    setIsSelectionMode(
      true,
    );
  }


  function handleCancelSelection() {
    if (
      isProcessing
    ) {
      return;
    }

    setSelectedOrders(
      new Map(),
    );

    setIsSelectionMode(
      false,
    );

    setIsSelectedDialogOpen(
      false,
    );

    setDispatchError(
      null,
    );
  }


  function handleToggleOrder(
    order,
  ) {
    if (
      !canDispatchOrders ||
      isProcessing
    ) {
      return;
    }

    const orderId =
      Number(
        order.id,
      );

    if (
      !Number.isInteger(
        orderId,
      )
    ) {
      return;
    }

    setSelectedOrders(
      (
        currentSelection,
      ) => {
        const nextSelection =
          new Map(
            currentSelection,
          );

        if (
          nextSelection.has(
            orderId,
          )
        ) {
          nextSelection.delete(
            orderId,
          );
        } else {
          nextSelection.set(
            orderId,
            order,
          );
        }

        return nextSelection;
      },
    );
  }


  function handleToggleAllOrders() {
    if (
      !canDispatchOrders ||
      isProcessing
    ) {
      return;
    }

    setSelectedOrders(
      (
        currentSelection,
      ) => {
        const nextSelection =
          new Map(
            currentSelection,
          );

        const visibleOrderIds =
          orders
            .map(
              (order) =>
                Number(
                  order.id,
                ),
            )
            .filter(
              (orderId) =>
                Number.isInteger(
                  orderId,
                ),
            );

        const allVisibleSelected =
          visibleOrderIds.length >
            0 &&
          visibleOrderIds.every(
            (orderId) =>
              nextSelection.has(
                orderId,
              ),
          );

        if (
          allVisibleSelected
        ) {
          visibleOrderIds.forEach(
            (orderId) => {
              nextSelection.delete(
                orderId,
              );
            },
          );

          return nextSelection;
        }

        orders.forEach(
          (order) => {
            const orderId =
              Number(
                order.id,
              );

            if (
              Number.isInteger(
                orderId,
              )
            ) {
              nextSelection.set(
                orderId,
                order,
              );
            }
          },
        );

        return nextSelection;
      },
    );
  }


  async function handleSingleDispatch(
    order,
  ) {
    if (
      !canDispatchOrders ||
      isProcessing
    ) {
      return;
    }

    const orderId =
      Number(
        order.id,
      );

    if (
      !Number.isInteger(
        orderId,
      )
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        (
          `Move ${order.order_number} ` +
          "to Dispatched?"
        ),
      );

    if (
      !confirmed
    ) {
      return;
    }

    setIsDispatching(
      true,
    );

    setProcessingOrderId(
      orderId,
    );

    setDispatchError(
      null,
    );

    setDeleteError(
      null,
    );

    setSuccessMessage(
      null,
    );

    try {
      await dispatchOrder(
        orderId,
      );

      setSuccessMessage(
        (
          `${order.order_number} ` +
          "was moved to Dispatched."
        ),
      );

      await loadPendingOrders();
    } catch (error) {
      const parsedError =
        parseApiError(
          error,
        );

      setDispatchError(
        parsedError.message,
      );
    } finally {
      setIsDispatching(
        false,
      );

      setProcessingOrderId(
        null,
      );
    }
  }


  function handleOpenDeleteDialog(
    order,
  ) {
    if (
      !canDeletePendingOrders ||
      isProcessing
    ) {
      return;
    }

    setDeleteError(
      null,
    );

    setSuccessMessage(
      null,
    );

    setOrderToDelete(
      order,
    );
  }


  function handleCloseDeleteDialog() {
    if (
      deletingOrderId !==
      null
    ) {
      return;
    }

    setOrderToDelete(
      null,
    );
  }


  async function handleConfirmDelete() {
    if (
      !orderToDelete ||
      !canDeletePendingOrders ||
      isProcessing
    ) {
      return;
    }

    const orderId =
      Number(
        orderToDelete.id,
      );

    if (
      !Number.isInteger(
        orderId,
      )
    ) {
      return;
    }

    setDeletingOrderId(
      orderId,
    );

    setDeleteError(
      null,
    );

    setDispatchError(
      null,
    );

    setSuccessMessage(
      null,
    );

    try {
      const result =
        await deletePendingOrder(
          orderId,
        );

      const orderNumber =
        result
          ?.order_number ||
        orderToDelete
          .order_number;

      setOrderToDelete(
        null,
      );

      setSelectedOrders(
        (
          currentSelection,
        ) => {
          const nextSelection =
            new Map(
              currentSelection,
            );

          nextSelection.delete(
            orderId,
          );

          return nextSelection;
        },
      );

      setSuccessMessage(
        result?.restored_return
          ? (
              `${orderNumber} was deleted. `
              + "The repaired return was restored "
              + "to Active Returns."
            )
          : (
              `${orderNumber} was deleted. `
              + `${Number(
                  result?.restored_laptops ?? 0,
                )} laptop(s) were restored `
              + "to inventory."
            ),
      );

      await loadPendingOrders();
    } catch (error) {
      const parsedError =
        parseApiError(
          error,
        );

      setDeleteError(
        parsedError.message,
      );
    } finally {
      setDeletingOrderId(
        null,
      );
    }
  }


  async function handleDispatchSelected() {
    if (
      !canDispatchOrders ||
      isProcessing ||
      selectedOrders.size ===
        0
    ) {
      return;
    }

    const selectedCount =
      selectedOrders.size;

    setIsDispatching(
      true,
    );

    setDispatchError(
      null,
    );

    setDeleteError(
      null,
    );

    setSuccessMessage(
      null,
    );

    try {
      await bulkDispatchOrders(
        Array.from(
          selectedOrders.keys(),
        ),
      );

      setIsSelectedDialogOpen(
        false,
      );

      setSelectedOrders(
        new Map(),
      );

      setIsSelectionMode(
        false,
      );

      setSuccessMessage(
        (
          `${selectedCount} ` +
          (
            selectedCount ===
              1
              ? "order was"
              : "orders were"
          ) +
          " moved to Dispatched."
        ),
      );

      await loadPendingOrders();
    } catch (error) {
      const parsedError =
        parseApiError(
          error,
        );

      setDispatchError(
        parsedError.message,
      );
    } finally {
      setIsDispatching(
        false,
      );
    }
  }


  return (
    <section className="orders-page">
      <header className="orders-page-header">
        <div>
          <p className="application-eyebrow">
            Orders
          </p>

          <h1>
            Pending Orders
          </h1>

          <p className="orders-page-description">
            Review sales waiting to be dispatched.
          </p>
        </div>


        {canDispatchOrders ? (
          <div className="pending-orders-actions">
            {isSelectionMode ? (
              <button
                type="button"
                className="button button-secondary"
                disabled={
                  isProcessing
                }
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
                disabled={
                  totalOrders ===
                    0 ||
                  isLoading ||
                  isProcessing
                }
                onClick={
                  handleStartSelection
                }
              >
                Select
              </button>
            )}
          </div>
        ) : null}
      </header>


      <form
        className="pending-orders-filter-panel"
        onSubmit={handleApplyFilters}
      >
        <div className="pending-orders-filter-fields">
          <label className="sale-field pending-orders-search-field">
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

          <label className="sale-field pending-orders-date-field">
            <span>From</span>
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) =>
                setStartDate(
                  event.target.value,
                )
              }
            />
          </label>

          <label className="sale-field pending-orders-date-field">
            <span>To</span>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) =>
                setEndDate(
                  event.target.value,
                )
              }
            />
          </label>
        </div>

        <div className="pending-orders-filter-actions">
          <button
            type="submit"
            className="button button-primary"
            disabled={isLoading || isProcessing}
          >
            Apply
          </button>

          <button
            type="button"
            className="button button-secondary"
            disabled={isLoading || isProcessing}
            onClick={handleClearFilters}
          >
            Clear
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


      <div className="inventory-statistics">
        <article className="statistic-card">
          <span className="statistic-label">
            Pending orders
          </span>

          <strong className="statistic-value">
            {totalOrders}
          </strong>
        </article>


        {isSelectionMode ? (
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
              selectedOrders.size ===
                0 ||
              isProcessing
            }
            onClick={() => {
              setDispatchError(
                null,
              );

              setIsSelectedDialogOpen(
                true,
              );
            }}
          >
            <span className="statistic-label">
              Selected
            </span>

            <strong className="statistic-value">
              {
                selectedOrders.size
              }
            </strong>
          </button>
        ) : null}
      </div>


      {successMessage ? (
        <div
          className="orders-success-message"
          role="status"
        >
          {successMessage}
        </div>
      ) : null}


      {deleteError ? (
        <div
          className="sale-draft-error"
          role="alert"
        >
          {deleteError}
        </div>
      ) : null}


      {dispatchError &&
      !isSelectedDialogOpen ? (
        <div
          className="sale-draft-error"
          role="alert"
        >
          {dispatchError}
        </div>
      ) : null}


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
                loadPendingOrders
              }
            >
              Retry
            </button>
          </div>
        </div>
      ) : null}


      {isLoading ? (
        <div className="orders-loading-state">
          Loading pending orders...
        </div>
      ) : null}


      {!isLoading &&
      !loadError &&
      orders.length ===
        0 ? (
        <div className="orders-empty-state">
          <h2>
            No pending orders
          </h2>

          <p>
            New sales will appear here until
            they are dispatched.
          </p>
        </div>
      ) : null}


      {!isLoading &&
      !loadError &&
      orders.length >
        0 ? (
        <PendingOrdersTable
          orders={
            orders
          }
          canViewTotalAmount={
            canViewTotalAmount
          }
          isSelectionMode={
            isSelectionMode
          }
          selectedOrderIds={
            selectedOrderIds
          }
          isProcessing={
            isProcessing
          }
          processingOrderId={
            processingOrderId
          }
          deletingOrderId={
            deletingOrderId
          }
          canDeleteOrders={
            canDeletePendingOrders
          }
          onToggleOrder={
            handleToggleOrder
          }
          onToggleAllOrders={
            handleToggleAllOrders
          }
          onDispatchOrder={
            handleSingleDispatch
          }
          onDeleteOrder={
            handleOpenDeleteDialog
          }
        />
      ) : null}


      <SelectedPendingOrdersDialog
        isOpen={
          isSelectedDialogOpen
        }
        orders={
          selectedOrderList
        }
        isProcessing={
          isDispatching
        }
        errorMessage={
          dispatchError
        }
        onClose={() => {
          if (
            !isDispatching
          ) {
            setDispatchError(
              null,
            );

            setIsSelectedDialogOpen(
              false,
            );
          }
        }}
        onDispatch={
          handleDispatchSelected
        }
      />


      <ConfirmDialog
        isOpen={
          Boolean(
            orderToDelete,
          )
        }
        title="Delete pending order?"
        message={
          orderToDelete
            ? (
                orderToDelete.source_return
                  ? (
                      `Delete ${orderToDelete.order_number}? `
                      + "The pending order will be removed "
                      + "and the laptop will return to "
                      + "Active Returns at Repair Completed."
                    )
                  : (
                      `Delete ${orderToDelete.order_number}? `
                      + "The order will be permanently removed "
                      + "and its laptops will be returned to inventory."
                    )
              )
            : ""
        }
        confirmLabel="Delete order"
        cancelLabel="Keep order"
        variant="danger"
        isProcessing={
          deletingOrderId !==
          null
        }
        onConfirm={
          handleConfirmDelete
        }
        onCancel={
          handleCloseDeleteDialog
        }
      />
    </section>
  );
}


export default PendingOrdersPage;
