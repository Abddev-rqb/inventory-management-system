import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  approveOrderDeletionRequest,
  deleteDispatchedOrder,
  exportDispatchedOrders,
  getDispatchedOrders,
  getOrderDeletionRequests,
  rejectOrderDeletionRequest,
  requestOrderDeletion,
} from "../../api/orderApi.js";

import {
  useAuth,
} from "../../auth/AuthContext.jsx";

import DeletionRequestDialog from "../../components/orders/DeletionRequestDialog.jsx";
import DeletionRequestsTable from "../../components/orders/DeletionRequestsTable.jsx";
import DispatchedOrdersTable from "../../components/orders/DispatchedOrdersTable.jsx";

import {
  parseApiError,
  parseBlobApiError,
} from "../../services/apiError.js";

import {
  downloadBlobFile,
  getFileNameFromContentDisposition,
} from "../../services/fileDownload.js";


function DispatchedOrdersPage() {
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
    actionError,
    setActionError,
  ] = useState(null);


  const [
    startDateInput,
    setStartDateInput,
  ] = useState("");

  const [
    endDateInput,
    setEndDateInput,
  ] = useState("");

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [
    appliedSearch,
    setAppliedSearch,
  ] = useState("");

  const [
    appliedStartDate,
    setAppliedStartDate,
  ] = useState("");

  const [
    appliedEndDate,
    setAppliedEndDate,
  ] = useState("");

  const [
    filterError,
    setFilterError,
  ] = useState(null);

  const [
    isExporting,
    setIsExporting,
  ] = useState(false);


  const [
    selectedOrder,
    setSelectedOrder,
  ] = useState(null);

  const [
    isDeletionDialogOpen,
    setIsDeletionDialogOpen,
  ] = useState(false);

  const [
    isProcessing,
    setIsProcessing,
  ] = useState(false);

  const [
    processingOrderId,
    setProcessingOrderId,
  ] = useState(null);


  const [
    deletionRequests,
    setDeletionRequests,
  ] = useState([]);

  const [
    deletionRequestCount,
    setDeletionRequestCount,
  ] = useState(0);

  const [
    deletionRequestsError,
    setDeletionRequestsError,
  ] = useState(null);

  const [
    processingRequestId,
    setProcessingRequestId,
  ] = useState(null);


  const role =
    user?.role;

  const isInventoryViewer =
    role ===
    "inventory_viewer";

  const canViewTotalAmount =
    !isInventoryViewer;

  const isAdmin =
    Boolean(
      user?.is_staff ||
      user?.is_superuser ||
      role === "admin",
    );

  const isSales =
    role ===
    "sales";

  const canExport =
    isAdmin ||
    isSales;

  const canRequestDeletion =
    hasPermission(
      "inventory.add_orderdeletionrequest",
    );


  const appliedFilters =
    useMemo(
      () => {
        const params = {};

        if (
          appliedStartDate
        ) {
          params.start_date =
            appliedStartDate;
        }

        if (
          appliedEndDate
        ) {
          params.end_date =
            appliedEndDate;
        }

        if (
          appliedSearch
        ) {
          params.search =
            appliedSearch;
        }

        return params;
      },
      [
        appliedStartDate,
        appliedEndDate,
        appliedSearch,
      ],
    );


  const loadDispatchedOrders =
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
            await getDispatchedOrders(
              appliedFilters,
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
      [
        appliedFilters,
      ],
    );


  const loadDeletionRequests =
    useCallback(
      async () => {
        if (
          !isAdmin
        ) {
          return;
        }

        setDeletionRequestsError(
          null,
        );

        try {
          const data =
            await getOrderDeletionRequests();

          if (
            Array.isArray(
              data,
            )
          ) {
            setDeletionRequests(
              data,
            );

            setDeletionRequestCount(
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

          setDeletionRequests(
            results,
          );

          setDeletionRequestCount(
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

          setDeletionRequestsError(
            parsedError.message,
          );

          setDeletionRequests(
            [],
          );

          setDeletionRequestCount(
            0,
          );
        }
      },
      [
        isAdmin,
      ],
    );


  useEffect(() => {
    loadDispatchedOrders();
  }, [
    loadDispatchedOrders,
  ]);


  useEffect(() => {
    loadDeletionRequests();
  }, [
    loadDeletionRequests,
  ]);


  function handleApplyFilter(
    event,
  ) {
    event.preventDefault();

    setFilterError(
      null,
    );

    setActionError(
      null,
    );

    setSuccessMessage(
      null,
    );

    if (
      startDateInput &&
      endDateInput &&
      startDateInput >
        endDateInput
    ) {
      setFilterError(
        (
          "To date cannot be before " +
          "From date."
        ),
      );

      return;
    }

    setAppliedStartDate(
      startDateInput,
    );

    setAppliedEndDate(
      endDateInput,
    );

    setAppliedSearch(
      searchInput.trim(),
    );
  }


  function handleClearFilter() {
    setSearchInput(
      "",
    );

    setStartDateInput(
      "",
    );

    setEndDateInput(
      "",
    );
    
    setAppliedSearch(
      "",
    );

    setAppliedStartDate(
      "",
    );

    setAppliedEndDate(
      "",
    );

    setFilterError(
      null,
    );

    setActionError(
      null,
    );

    setSuccessMessage(
      null,
    );

  }


  async function handleExport() {
    if (
      !canExport ||
      isExporting
    ) {
      return;
    }

    setIsExporting(
      true,
    );

    setActionError(
      null,
    );

    setSuccessMessage(
      null,
    );

    try {
      const result =
        await exportDispatchedOrders(
          appliedFilters,
        );

      const fileName =
        getFileNameFromContentDisposition(
          result.headers?.[
            "content-disposition"
          ],
        ) ||
        "dispatched-orders.xlsx";

      downloadBlobFile({
        blob:
          result.blob,

        fileName,
      });

      setSuccessMessage(
        (
          "Dispatched orders Excel " +
          "export downloaded."
        ),
      );
    } catch (error) {
      const parsedError =
        await parseBlobApiError(
          error,
        );

      setActionError(
        parsedError.message,
      );
    } finally {
      setIsExporting(
        false,
      );
    }
  }


  function handleOpenDeletionRequest(
    order,
  ) {
    setActionError(
      null,
    );

    setSuccessMessage(
      null,
    );

    setSelectedOrder(
      order,
    );

    setIsDeletionDialogOpen(
      true,
    );
  }


  async function handleSubmitDeletionRequest(
    reason,
  ) {
    if (
      !selectedOrder ||
      isProcessing
    ) {
      return;
    }

    const orderId =
      Number(
        selectedOrder.id,
      );

    setIsProcessing(
      true,
    );

    setProcessingOrderId(
      orderId,
    );

    setActionError(
      null,
    );

    try {
      await requestOrderDeletion(
        orderId,
        reason,
      );

      setIsDeletionDialogOpen(
        false,
      );

      setSelectedOrder(
        null,
      );

      setSuccessMessage(
        (
          "Deletion request submitted " +
          "for administrator review."
        ),
      );
    } catch (error) {
      const parsedError =
        parseApiError(
          error,
        );

      setActionError(
        parsedError.message,
      );
    } finally {
      setIsProcessing(
        false,
      );

      setProcessingOrderId(
        null,
      );
    }
  }


  async function handleDeleteOrder(
    order,
  ) {
    if (
      !isAdmin ||
      isProcessing
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        (
          `Delete ${order.order_number}? ` +
          "This action is restricted " +
          "to administrators."
        ),
      );

    if (
      !confirmed
    ) {
      return;
    }

    const orderId =
      Number(
        order.id,
      );

    setIsProcessing(
      true,
    );

    setProcessingOrderId(
      orderId,
    );

    setActionError(
      null,
    );

    setSuccessMessage(
      null,
    );

    try {
      await deleteDispatchedOrder(
        orderId,
      );

      setSuccessMessage(
        (
          `${order.order_number} ` +
          "was deleted."
        ),
      );

      await loadDispatchedOrders();
      await loadDeletionRequests();
    } catch (error) {
      const parsedError =
        parseApiError(
          error,
        );

      setActionError(
        parsedError.message,
      );
    } finally {
      setIsProcessing(
        false,
      );

      setProcessingOrderId(
        null,
      );
    }
  }


  async function handleApproveRequest(
    deletionRequest,
  ) {
    if (
      !isAdmin ||
      isProcessing
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        (
          "Approve deletion of " +
          `${deletionRequest.order_number}?`
        ),
      );

    if (
      !confirmed
    ) {
      return;
    }

    const requestId =
      Number(
        deletionRequest.id,
      );

    setIsProcessing(
      true,
    );

    setProcessingRequestId(
      requestId,
    );

    setActionError(
      null,
    );

    setSuccessMessage(
      null,
    );

    try {
      await approveOrderDeletionRequest(
        requestId,
      );

      setSuccessMessage(
        (
          `${deletionRequest.order_number} ` +
          "deletion request was approved."
        ),
      );

      await loadDispatchedOrders();
      await loadDeletionRequests();
    } catch (error) {
      const parsedError =
        parseApiError(
          error,
        );

      setActionError(
        parsedError.message,
      );
    } finally {
      setIsProcessing(
        false,
      );

      setProcessingRequestId(
        null,
      );
    }
  }


  async function handleRejectRequest(
    deletionRequest,
  ) {
    if (
      !isAdmin ||
      isProcessing
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        (
          "Reject deletion request for " +
          `${deletionRequest.order_number}?`
        ),
      );

    if (
      !confirmed
    ) {
      return;
    }

    const requestId =
      Number(
        deletionRequest.id,
      );

    setIsProcessing(
      true,
    );

    setProcessingRequestId(
      requestId,
    );

    setActionError(
      null,
    );

    setSuccessMessage(
      null,
    );

    try {
      await rejectOrderDeletionRequest(
        requestId,
      );

      setSuccessMessage(
        (
          `${deletionRequest.order_number} ` +
          "deletion request was rejected."
        ),
      );

      await loadDeletionRequests();
    } catch (error) {
      const parsedError =
        parseApiError(
          error,
        );

      setActionError(
        parsedError.message,
      );
    } finally {
      setIsProcessing(
        false,
      );

      setProcessingRequestId(
        null,
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
            Dispatched
          </h1>

          <p className="orders-page-description">
            Review orders that have already
            been dispatched.
          </p>
        </div>
      </header>


      <div className="dispatched-toolbar">
        <form
          className="dispatched-date-filter"
          onSubmit={
            handleApplyFilter
          }
        >
          <label className="dispatched-search-field">
            <span>
              Search
            </span>

            <input
              type="search"
              placeholder={
                (
                  "Order, customer, employee, " +
                  "item or serial number"
                )
              }
              value={
                searchInput
              }
              onChange={
                (event) =>
                  setSearchInput(
                    event.target.value,
                  )
              }
            />
          </label>

          <label className="dispatched-date-field">
            <span>
              From date
            </span>

            <input
              type="date"
              value={
                startDateInput
              }
              onChange={
                (event) =>
                  setStartDateInput(
                    event.target.value,
                  )
              }
            />
          </label>


          <label className="dispatched-date-field">
            <span>
              To date
            </span>

            <input
              type="date"
              value={
                endDateInput
              }
              min={
                startDateInput ||
                undefined
              }
              onChange={
                (event) =>
                  setEndDateInput(
                    event.target.value,
                  )
              }
            />
          </label>


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
              isLoading ||
              (
                !searchInput &&
                !startDateInput &&
                !endDateInput &&
                !appliedSearch &&
                !appliedStartDate &&
                !appliedEndDate
              )
            }
            onClick={
              handleClearFilter
            }
          >
            Clear
          </button>
        </form>


        {canExport ? (
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
        ) : null}
      </div>


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
            Dispatched orders
          </span>

          <strong className="statistic-value">
            {totalOrders}
          </strong>
        </article>


        {isAdmin ? (
          <article className="statistic-card">
            <span className="statistic-label">
              Deletion requests
            </span>

            <strong className="statistic-value">
              {deletionRequestCount}
            </strong>
          </article>
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


      {actionError &&
      !isDeletionDialogOpen ? (
        <div
          className="sale-draft-error"
          role="alert"
        >
          {actionError}
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
                loadDispatchedOrders
              }
            >
              Retry
            </button>
          </div>
        </div>
      ) : null}


      {isLoading ? (
        <div className="orders-loading-state">
          Loading dispatched orders...
        </div>
      ) : null}


      {!isLoading &&
      !loadError &&
      orders.length === 0 ? (
        <div className="orders-empty-state">
          <h2>
            No dispatched orders
          </h2>

          <p>
            {appliedStartDate ||
            appliedEndDate
              ? (
                  "No dispatched orders match " +
                  "the selected date range."
                )
              : (
                  "Orders moved from Pending " +
                  "will appear here."
                )}
          </p>
        </div>
      ) : null}


      {!isLoading &&
      !loadError &&
      orders.length > 0 ? (
        <DispatchedOrdersTable
          orders={
            orders
          }
          isAdmin={
            isAdmin
          }
          canRequestDeletion={
            canRequestDeletion
          }
          canViewTotalAmount={
            canViewTotalAmount
          }
          isProcessing={
            isProcessing
          }
          processingOrderId={
            processingOrderId
          }
          onRequestDeletion={
            handleOpenDeletionRequest
          }
          onDeleteOrder={
            handleDeleteOrder
          }
        />
      ) : null}


      {isAdmin ? (
        <section className="deletion-review-section">
          <header className="deletion-review-header">
            <div>
              <h2>
                Deletion Requests
              </h2>

              <p>
                Review employee requests for
                dispatched-order deletion.
              </p>
            </div>
          </header>


          {deletionRequestsError ? (
            <div
              className="sale-draft-error"
              role="alert"
            >
              {deletionRequestsError}
            </div>
          ) : null}


          {!deletionRequestsError &&
          deletionRequests.length === 0 ? (
            <div className="orders-empty-state">
              <h3>
                No deletion requests
              </h3>

              <p>
                Employee deletion requests
                will appear here.
              </p>
            </div>
          ) : null}


          {!deletionRequestsError &&
          deletionRequests.length > 0 ? (
            <DeletionRequestsTable
              requests={
                deletionRequests
              }
              isProcessing={
                isProcessing
              }
              processingRequestId={
                processingRequestId
              }
              onApprove={
                handleApproveRequest
              }
              onReject={
                handleRejectRequest
              }
            />
          ) : null}
        </section>
      ) : null}


      <DeletionRequestDialog
        isOpen={
          isDeletionDialogOpen
        }
        order={
          selectedOrder
        }
        isSubmitting={
          isProcessing
        }
        errorMessage={
          isDeletionDialogOpen
            ? actionError
            : null
        }
        onClose={() => {
          if (
            !isProcessing
          ) {
            setIsDeletionDialogOpen(
              false,
            );

            setSelectedOrder(
              null,
            );

            setActionError(
              null,
            );
          }
        }}
        onSubmit={
          handleSubmitDeletionRequest
        }
      />
    </section>
  );
}


export default DispatchedOrdersPage;