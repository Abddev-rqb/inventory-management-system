import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  assignReturnPriority,
  assignReturnTechnician,
  confirmReturnImport,
  completeReturnRepair,
  createReturn,
  createReturnExpense,
  exportReturns,
  exportStockedInReturns,
  getReturns,
  getReturnExpenses,
  getReturnTechnicians,
  getStockedInReturns,
  previewReturnImport,
  stockInReturnedLaptop,
  updateReturnStatus,
  updateReturn,
} from "../../api/returnApi.js";


import ReturnPriorityDialog
  from "../../components/returns/ReturnPriorityDialog.jsx";

import ReturnStatusDialog
  from "../../components/returns/ReturnStatusDialog.jsx";

import ReturnTechnicianDialog
  from "../../components/returns/ReturnTechnicianDialog.jsx";

import {
  useAuth,
} from "../../auth/AuthContext.jsx";

import AlertMessage
  from "../../components/common/AlertMessage.jsx";

import EmptyState
  from "../../components/common/EmptyState.jsx";

import LoadingState
  from "../../components/common/LoadingState.jsx";

import Pagination
  from "../../components/common/Pagination.jsx";

import ReturnFilters
  from "../../components/returns/ReturnFilters.jsx";

import ReturnFormDialog
  from "../../components/returns/ReturnFormDialog.jsx";

import ReturnsTable
  from "../../components/returns/ReturnsTable.jsx";

import {
  parseApiError,
} from "../../services/apiError.js";

import ConfirmDialog
  from "../../components/common/ConfirmDialog.jsx";

import ReturnStockInDialog
  from "../../components/returns/ReturnStockInDialog.jsx";

import StockedInFilters
  from "../../components/returns/StockedInFilters.jsx";

import StockedInTable
  from "../../components/returns/StockedInTable.jsx";

import ReturnImportDialog
  from "../../components/returns/ReturnImportDialog.jsx";

import ReturnImportExportMenu
  from "../../components/returns/ReturnImportExportMenu.jsx";

import ReturnEditDialog
  from "../../components/returns/ReturnEditDialog.jsx";

import ReturnExpenseDialog
  from "../../components/returns/ReturnExpenseDialog.jsx";

import ReturnExpensesFilters
  from "../../components/returns/ReturnExpensesFilters.jsx";

import ReturnExpensesTable
  from "../../components/returns/ReturnExpensesTable.jsx";

const EMPTY_FILTERS = {
  search: "",
  technician: "",
  status: "",
  priority: "",
  service_rack: "",
  start_date: "",
  end_date: "",
};


const EMPTY_STOCKED_IN_FILTERS = {
  search: "",
  start_date: "",
  end_date: "",
};


const EMPTY_EXPENSE_FILTERS = {
  search: "",
  start_date: "",
  end_date: "",
};


const PAGE_SIZE = 25;

function getReturnImportErrorMessage(
  error,
) {
  const data =
    error?.response?.data;

  const rowErrors =
    Array.isArray(
      data?.errors,
    )
      ? data.errors
      : [];

  if (rowErrors.length > 0) {
    const firstRow =
      rowErrors[0];

    const firstError =
      Array.isArray(
        firstRow?.errors,
      )
        ? firstRow.errors[0]
        : null;

    if (
      firstError?.message
    ) {
      const field =
        firstError.field
          ? (
              ` (${firstError.field})`
            )
          : "";

      const remaining =
        rowErrors.length - 1;

      return (
        `Row ${firstRow.row_number}`
        + `${field}: `
        + firstError.message
        + (
          remaining > 0
            ? (
                ` + ${remaining} more `
                + "invalid row"
                + (
                  remaining === 1
                    ? ""
                    : "s"
                )
                + "."
              )
            : ""
        )
      );
    }
  }

  return (
    data?.detail
    ||
    data?.message
    ||
    "Return import failed."
  );
}

function ReturnsPage() {
  const {
    user,
    hasPermission,
  } = useAuth();

  const [
    activeTab,
    setActiveTab,
  ] = useState(
    "active",
  );

  const [
    filters,
    setFilters,
  ] = useState(
    EMPTY_FILTERS,
  );

  const [
    appliedFilters,
    setAppliedFilters,
  ] = useState(
    EMPTY_FILTERS,
  );

  const [
    returns,
    setReturns,
  ] = useState([]);

  const [
    technicians,
    setTechnicians,
  ] = useState([]);

  const [
    totalResults,
    setTotalResults,
  ] = useState(0);

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
    isAddDialogOpen,
    setIsAddDialogOpen,
  ] = useState(false);

  const [
    isCreating,
    setIsCreating,
  ] = useState(false);

  const [
    createError,
    setCreateError,
  ] = useState(null);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState(null);

  const [
    stockInReturn,
    setStockInReturn,
  ] = useState(null);

  const [
    stockInPayload,
    setStockInPayload,
  ] = useState(null);

  const [
    isStockInConfirmOpen,
    setIsStockInConfirmOpen,
  ] = useState(false);

  const [
    stockInError,
    setStockInError,
  ] = useState(null);

  const [
    isStockingIn,
    setIsStockingIn,
  ] = useState(false);

  const [
    stockedInFilters,
    setStockedInFilters,
  ] = useState(
    EMPTY_STOCKED_IN_FILTERS,
  );


  const [
    appliedStockedInFilters,
    setAppliedStockedInFilters,
  ] = useState(
    EMPTY_STOCKED_IN_FILTERS,
  );


  const [
    stockedInRecords,
    setStockedInRecords,
  ] = useState([]);


  const [
    stockedInCount,
    setStockedInCount,
  ] = useState(0);


  const [
    stockedInPage,
    setStockedInPage,
  ] = useState(1);


  const [
    stockedInHasNext,
    setStockedInHasNext,
  ] = useState(false);


  const [
    stockedInHasPrevious,
    setStockedInHasPrevious,
  ] = useState(false);


  const [
    stockedInLoading,
    setStockedInLoading,
  ] = useState(false);


  const [
    stockedInError,
    setStockedInError,
  ] = useState(null);


  const [
    stockedInFilterError,
    setStockedInFilterError,
  ] = useState(null);

  const [
    isImportOpen,
    setIsImportOpen,
  ] = useState(false);

  const [
    importPreview,
    setImportPreview,
  ] = useState(null);

  const [
    importError,
    setImportError,
  ] = useState(null);

  const [
    isImportPreviewing,
    setIsImportPreviewing,
  ] = useState(false);

  const [
    isImportConfirming,
    setIsImportConfirming,
  ] = useState(false);

  const [
    isExporting,
    setIsExporting,
  ] = useState(false);

  const [
    isStockedInExporting,
    setIsStockedInExporting,
  ] = useState(false);

  const [
    editReturn,
    setEditReturn,
  ] = useState(null);

  const [
    editError,
    setEditError,
  ] = useState(null);

  const [
    isEditing,
    setIsEditing,
  ] = useState(false);

  const [
    completingReturnId,
    setCompletingReturnId,
  ] = useState(null);

  const [
    doneError,
    setDoneError,
  ] = useState(null);


  const [
    expenseReturn,
    setExpenseReturn,
  ] = useState(null);

  const [
    expenseError,
    setExpenseError,
  ] = useState(null);

  const [
    isAddingExpense,
    setIsAddingExpense,
  ] = useState(false);

  const [
    expenseFilters,
    setExpenseFilters,
  ] = useState(
    EMPTY_EXPENSE_FILTERS,
  );

  const [
    appliedExpenseFilters,
    setAppliedExpenseFilters,
  ] = useState(
    EMPTY_EXPENSE_FILTERS,
  );

  const [
    expenses,
    setExpenses,
  ] = useState([]);

  const [
    expenseCount,
    setExpenseCount,
  ] = useState(0);

  const [
    expenseTotal,
    setExpenseTotal,
  ] = useState("0.00");

  const [
    expensePage,
    setExpensePage,
  ] = useState(1);

  const [
    expenseHasNext,
    setExpenseHasNext,
  ] = useState(false);

  const [
    expenseHasPrevious,
    setExpenseHasPrevious,
  ] = useState(false);

  const [
    expensesLoading,
    setExpensesLoading,
  ] = useState(false);

  const [
    expensesError,
    setExpensesError,
  ] = useState(null);

  const [
    expenseFilterError,
    setExpenseFilterError,
  ] = useState(null);
  
  const role =
    String(
      user?.role ?? "",
    )
      .trim()
      .toLowerCase();


  const isAdmin =
    Boolean(
      user?.is_superuser
      ||
      user?.is_staff
      ||
      role === "admin"
    );


  const isSales =
    role === "sales";


  const isTechnician =
    role === "technician";


  const isInventoryViewer =
    role ===
    "inventory_viewer";


  const canAddReturn =
    hasPermission(
      "inventory.add_return",
    );

  const showAssignPriority =
    !isInventoryViewer;

  const canActuallyAssignPriority =
    isAdmin
    ||
    isSales;

  const canAssignTechnician =
    isAdmin
    ||
    isSales;

  const canImportReturns =
    canAddReturn;

  const canEditReturn =
    isAdmin
    ||
    isSales;


  const canAddExpense =
    isAdmin
    ||
    isSales;


  const canCompleteReturn =
    isAdmin
    ||
    isSales;


  const canExportReturns =
    hasPermission(
      "inventory.export_return",
    );


  const canPerformStockIn =
    isAdmin
    ||
    isSales;

  const stockedInQueryParams =
    useMemo(
      () => {
        const params = {
          page:
            stockedInPage,
        };

        Object.entries(
          appliedStockedInFilters,
        ).forEach(
          ([
            key,
            value,
          ]) => {
            if (value) {
              params[
                key
              ] = value;
            }
          },
        );

        return params;
      },
      [
        appliedStockedInFilters,
        stockedInPage,
      ],
    );

  const loadStockedInReturns =
    useCallback(
      async () => {
        setStockedInLoading(
          true,
        );

        setStockedInError(
          null,
        );

        try {
          const data =
            await getStockedInReturns(
              stockedInQueryParams,
            );

          if (
            Array.isArray(
              data,
            )
          ) {
            setStockedInRecords(
              data,
            );

            setStockedInCount(
              data.length,
            );

            setStockedInHasNext(
              false,
            );

            setStockedInHasPrevious(
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

          setStockedInRecords(
            results,
          );

          setStockedInCount(
            Number(
              data?.count
              ?? results.length,
            ),
          );

          setStockedInHasNext(
            Boolean(
              data?.next,
            ),
          );

          setStockedInHasPrevious(
            Boolean(
              data?.previous,
            ),
          );

        } catch (error) {
          const parsed =
            parseApiError(
              error,
            );

          setStockedInError(
            parsed.message,
          );

          setStockedInRecords([]);
          setStockedInCount(0);
          setStockedInHasNext(false);
          setStockedInHasPrevious(false);

        } finally {
          setStockedInLoading(
            false,
          );
        }
      },
      [
        stockedInQueryParams,
      ],
    );

    useEffect(() => {
      if (
        activeTab
        !== "stocked_in"
      ) {
        return;
      }

      loadStockedInReturns();
    }, [
      activeTab,
      loadStockedInReturns,
    ]);


  const stockedInTotalPages =
    Math.max(
      1,
      Math.ceil(
        stockedInCount /
        PAGE_SIZE,
      ),
    );


  const expenseQueryParams =
    useMemo(
      () => {
        const params = {
          page:
            expensePage,
        };

        const search =
          String(
            appliedExpenseFilters
              .search ?? "",
          )
            .trim();

        if (search) {
          params.search =
            search;
        }

        if (
          appliedExpenseFilters
            .start_date
        ) {
          params.start_date =
            appliedExpenseFilters
              .start_date;
        }

        if (
          appliedExpenseFilters
            .end_date
        ) {
          params.end_date =
            appliedExpenseFilters
              .end_date;
        }

        return params;
      },
      [
        appliedExpenseFilters,
        expensePage,
      ],
    );

  const loadExpenses =
    useCallback(
      async () => {
        setExpensesLoading(true);
        setExpensesError(null);

        try {
          const data =
            await getReturnExpenses(
              expenseQueryParams,
            );

          const results =
            Array.isArray(data)
              ? data
              : (
                  Array.isArray(
                    data?.results,
                  )
                    ? data.results
                    : []
                );

          setExpenses(results);
          setExpenseCount(
            Number(
              data?.count
              ?? results.length,
            ),
          );
          setExpenseTotal(
            String(
              data?.summary
                ?.total_expenses
              ?? "0.00",
            ),
          );
          setExpenseHasNext(
            Boolean(data?.next),
          );
          setExpenseHasPrevious(
            Boolean(data?.previous),
          );
        } catch (error) {
          const parsed =
            parseApiError(error);

          setExpensesError(
            parsed.message,
          );
          setExpenses([]);
          setExpenseCount(0);
          setExpenseTotal("0.00");
          setExpenseHasNext(false);
          setExpenseHasPrevious(false);
        } finally {
          setExpensesLoading(false);
        }
      },
      [expenseQueryParams],
    );

  useEffect(() => {
    if (activeTab !== "expenses") {
      return;
    }

    loadExpenses();
  }, [activeTab, loadExpenses]);

  const expenseTotalPages =
    Math.max(
      1,
      Math.ceil(
        expenseCount / PAGE_SIZE,
      ),
    );

  const [
    selectedReturn,
    setSelectedReturn,
  ] = useState(null);


  const [
    priorityReturn,
    setPriorityReturn,
  ] = useState(null);


  const [
    technicianReturn,
    setTechnicianReturn,
  ] = useState(null);


  const [
    statusReturn,
    setStatusReturn,
  ] = useState(null);


  const [
    workflowError,
    setWorkflowError,
  ] = useState(null);


  const [
    isWorkflowSubmitting,
    setIsWorkflowSubmitting,
  ] = useState(false);


  const queryParams =
    useMemo(
      () => {
        const params = {
          page,
        };

        Object.entries(
          appliedFilters,
        ).forEach(
          ([
            key,
            value,
          ]) => {
            if (value) {
              params[
                key
              ] = value;
            }
          },
        );

        return params;
      },
      [
        appliedFilters,
        page,
      ],
    );


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalResults /
        PAGE_SIZE,
      ),
    );


  const loadReturns =
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
            await getReturns(
              queryParams,
            );

          if (
            Array.isArray(
              data,
            )
          ) {
            setReturns(
              data,
            );

            setTotalResults(
              data.length,
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

          setReturns(
            results,
          );

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
          const parsed =
            parseApiError(
              error,
            );

          setLoadError(
            parsed.message,
          );

          setReturns([]);
          setTotalResults(0);
          setHasNextPage(false);
          setHasPreviousPage(false);

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


  const loadTechnicians =
    useCallback(
      async () => {
        if (
          !canAddReturn
        ) {
          return;
        }

        try {
          const data =
            await getReturnTechnicians();

          setTechnicians(
            Array.isArray(
              data,
            )
              ? data
              : [],
          );

        } catch {
          setTechnicians([]);
        }
      },
      [
        canAddReturn,
      ],
    );

  useEffect(() => {
    loadReturns();
  }, [
    loadReturns,
  ]);


  useEffect(() => {
    loadTechnicians();
  }, [
    loadTechnicians,
  ]);


  function handleFilterChange(
    field,
    value,
  ) {
    setFilters(
      (
        currentFilters,
      ) => ({
        ...currentFilters,
        [field]: value,
      }),
    );
  }


  function handleApplyFilters(
    event,
  ) {
    event.preventDefault();

    setFilterError(
      null,
    );

    if (
      filters.start_date
      &&
      filters.end_date
      &&
      filters.start_date
      > filters.end_date
    ) {
      setFilterError(
        (
          "End date cannot be "
          + "before start date."
        ),
      );

      return;
    }

    setPage(1);

    setAppliedFilters({
      ...filters,
    });
  }


  function handleClearFilters() {
    setFilterError(
      null,
    );

    setFilters(
      EMPTY_FILTERS,
    );

    setPage(1);

    setAppliedFilters(
      EMPTY_FILTERS,
    );
  }


  async function handleCreateReturn(
    payload,
  ) {
    if (
      isCreating
    ) {
      return;
    }

    setIsCreating(
      true,
    );

    setCreateError(
      null,
    );

    setSuccessMessage(
      null,
    );

    try {
      await createReturn(
        payload,
      );

      setIsAddDialogOpen(
        false,
      );

      setSuccessMessage(
        (
          "Return added "
          + "successfully."
        ),
      );

      setPage(1);

      await loadReturns();

    } catch (error) {
      const parsed =
        parseApiError(
          error,
        );

      setCreateError(
        parsed.message,
      );

    } finally {
      setIsCreating(
        false,
      );
    }
  }


  function handlePageChange(
    nextPage,
  ) {
    if (
      nextPage < 1
      ||
      nextPage > totalPages
      ||
      nextPage === page
    ) {
      return;
    }

    setPage(
      nextPage,
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function canUpdateReturnStatus(
    returnRecord,
  ) {
    if (
      isAdmin
      ||
      isSales
    ) {
      return true;
    }

    if (
      isTechnician
    ) {
      return (
        Number(
          returnRecord
            .technician,
        )
        === Number(
          user?.id,
        )
      );
    }

    return false;
  }


  function handleSelectReturn(
    returnRecord,
  ) {
    setSelectedReturn(
      returnRecord,
    );

    setWorkflowError(
      null,
    );
  }


  function handleOpenPriority() {
    if (
      !canActuallyAssignPriority
      ||
      !selectedReturn
    ) {
      return;
    }

    setWorkflowError(
      null,
    );

    setPriorityReturn(
      selectedReturn,
    );
  }


  async function handlePrioritySubmit(
    priority,
  ) {
    if (
      !priorityReturn
      ||
      isWorkflowSubmitting
    ) {
      return;
    }

    setIsWorkflowSubmitting(
      true,
    );

    setWorkflowError(
      null,
    );

    try {
      const updatedReturn =
        await assignReturnPriority(
          priorityReturn.id,
          priority,
        );

      setPriorityReturn(
        null,
      );

      setSelectedReturn(
        updatedReturn,
      );

      setSuccessMessage(
        "Return priority updated successfully.",
      );

      await loadReturns();

    } catch (error) {
      const parsed =
        parseApiError(
          error,
        );

      setWorkflowError(
        parsed.message,
      );

    } finally {
      setIsWorkflowSubmitting(
        false,
      );
    }
  }


  async function handleDoneReturn(
    returnRecord,
  ) {
    if (
      !canCompleteReturn
      || returnRecord.status
        !== "repair_completed"
      || completingReturnId
        !== null
    ) {
      return;
    }

    setCompletingReturnId(
      returnRecord.id,
    );
    setDoneError(null);
    setSuccessMessage(null);

    try {
      const result =
        await completeReturnRepair(
          returnRecord.id,
        );

      if (
        selectedReturn?.id
        === returnRecord.id
      ) {
        setSelectedReturn(null);
      }

      setSuccessMessage(
        result?.order_number
          ? (
              `${result.order_number} created. `
              + "Return moved to Pending Orders."
            )
          : (
              result?.message
              || (
                "Serviced inventory laptop "
                + "returned to stock."
              )
            ),
      );

      await loadReturns();
    } catch (error) {
      const parsed =
        parseApiError(error);

      setDoneError(
        parsed.message,
      );
    } finally {
      setCompletingReturnId(null);
    }
  }

  function handleOpenTechnician(
    returnRecord,
  ) {
    setWorkflowError(
      null,
    );

    setTechnicianReturn(
      returnRecord,
    );
  }


  async function handleTechnicianSubmit(
    technician,
  ) {
    if (
      !technicianReturn
      ||
      isWorkflowSubmitting
    ) {
      return;
    }

    setIsWorkflowSubmitting(
      true,
    );

    setWorkflowError(
      null,
    );

    try {
      await assignReturnTechnician(
        technicianReturn.id,
        technician,
      );

      setTechnicianReturn(
        null,
      );

      setSuccessMessage(
        "Technician assignment updated successfully.",
      );

      await loadReturns();

    } catch (error) {
      const parsed =
        parseApiError(
          error,
        );

      setWorkflowError(
        parsed.message,
      );

    } finally {
      setIsWorkflowSubmitting(
        false,
      );
    }
  }


  function handleOpenStatus(
    returnRecord,
  ) {
    setWorkflowError(
      null,
    );

    setStatusReturn(
      returnRecord,
    );
  }


  async function handleStatusSubmit(
    payload,
  ) {
    if (
      !statusReturn
      ||
      isWorkflowSubmitting
    ) {
      return;
    }

    setIsWorkflowSubmitting(
      true,
    );

    setWorkflowError(
      null,
    );

    try {
      await updateReturnStatus(
        statusReturn.id,
        payload,
      );

      setStatusReturn(
        null,
      );

      setSuccessMessage(
        "Return status updated successfully.",
      );

      await loadReturns();

    } catch (error) {
      const parsed =
        parseApiError(
          error,
        );

      setWorkflowError(
        parsed.message,
      );

    } finally {
      setIsWorkflowSubmitting(
        false,
      );
    }
  }
  
  function canStockInReturn(
    returnRecord,
  ) {
    return (
      canPerformStockIn
      &&
      returnRecord.status
        === "swap_requested"
      &&
      !returnRecord
        .stocked_in_laptop
    );
  }


  function handleOpenStockIn(
    returnRecord,
  ) {
    setStockInError(
      null,
    );

    setStockInPayload(
      null,
    );

    setStockInReturn(
      returnRecord,
    );
  }


  function handleStockInContinue(
    payload,
  ) {
    if (
      !stockInReturn
    ) {
      return;
    }

    const wholesalePrice =
      Number(
        payload
          .wholesale_price,
      );

    const retailPrice =
      Number(
        payload
          .retail_price,
      );

    if (
      retailPrice
      < wholesalePrice
    ) {
      setStockInError(
        (
          "Retail price cannot "
          + "be lower than "
          + "wholesale price."
        ),
      );

      return;
    }

    setStockInError(
      null,
    );

    setStockInPayload(
      payload,
    );

    setIsStockInConfirmOpen(
      true,
    );
  }


  function handleCancelStockInConfirmation() {
    if (
      isStockingIn
    ) {
      return;
    }

    setIsStockInConfirmOpen(
      false,
    );

    setStockInPayload(
      null,
    );
  }


  async function handleConfirmStockIn() {
    if (
      !stockInReturn
      ||
      !stockInPayload
      ||
      isStockingIn
    ) {
      return;
    }

    setIsStockingIn(
      true,
    );

    setStockInError(
      null,
    );

    try {
      await stockInReturnedLaptop(
        stockInReturn.id,
        stockInPayload,
      );

      setIsStockInConfirmOpen(
        false,
      );

      setStockInPayload(
        null,
      );

      setStockInReturn(
        null,
      );

      setSuccessMessage(
        (
          "Returned laptop stocked "
          + "into inventory successfully."
        ),
      );

      await loadReturns();

    } catch (error) {
      const parsed =
        parseApiError(
          error,
        );

      setIsStockInConfirmOpen(
        false,
      );

      setStockInPayload(
        null,
      );

      setStockInError(
        parsed.message,
      );

    } finally {
      setIsStockingIn(
        false,
      );
    }
  }

  function handleStockedInFilterChange(
    field,
    value,
  ) {
    setStockedInFilters(
      (
        currentFilters,
      ) => ({
        ...currentFilters,

        [field]:
          value,
      }),
    );
  }


  function handleApplyStockedInFilters(
    event,
  ) {
    event.preventDefault();

    setStockedInFilterError(
      null,
    );

    if (
      stockedInFilters.start_date
      &&
      stockedInFilters.end_date
      &&
      stockedInFilters.start_date
        > stockedInFilters.end_date
    ) {
      setStockedInFilterError(
        (
          "End date cannot be "
          + "before start date."
        ),
      );

      return;
    }

    setStockedInPage(
      1,
    );

    setAppliedStockedInFilters({
      ...stockedInFilters,
    });
  }


  function handleClearStockedInFilters() {
    setStockedInFilterError(
      null,
    );

    setStockedInFilters(
      EMPTY_STOCKED_IN_FILTERS,
    );

    setStockedInPage(
      1,
    );

    setAppliedStockedInFilters(
      EMPTY_STOCKED_IN_FILTERS,
    );
  }


  function handleStockedInPageChange(
    nextPage,
  ) {
    if (
      nextPage < 1
      ||
      nextPage
        > stockedInTotalPages
      ||
      nextPage
        === stockedInPage
    ) {
      return;
    }

    setStockedInPage(
      nextPage,
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleOpenExpense(
    returnRecord,
  ) {
    setExpenseError(null);
    setExpenseReturn(
      returnRecord,
    );
  }


  async function handleExpenseSubmit(
    payload,
  ) {
    if (
      !expenseReturn
      || isAddingExpense
    ) {
      return;
    }

    setIsAddingExpense(true);
    setExpenseError(null);

    try {
      await createReturnExpense(
        expenseReturn.id,
        payload,
      );

      setExpenseReturn(null);
      setSuccessMessage(
        "Expense added successfully.",
      );

      if (activeTab === "expenses") {
        await loadExpenses();
      }
    } catch (error) {
      const parsed =
        parseApiError(error);

      setExpenseError(
        parsed.message,
      );
    } finally {
      setIsAddingExpense(false);
    }
  }


  function handleExpenseFilterChange(
    field,
    value,
  ) {
    setExpenseFilters(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );
  }


  function handleApplyExpenseFilters(
    event,
  ) {
    event.preventDefault();

    setExpenseFilterError(
      null,
    );

    const normalizedFilters = {
      search:
        String(
          expenseFilters.search
            ?? "",
        )
          .trim(),

      start_date:
        expenseFilters
          .start_date
        || "",

      end_date:
        expenseFilters
          .end_date
        || "",
    };

    if (
      normalizedFilters
        .start_date
      &&
      normalizedFilters
        .end_date
      &&
      normalizedFilters
        .start_date
        >
        normalizedFilters
          .end_date
    ) {
      setExpenseFilterError(
        (
          "End date cannot be "
          + "before start date."
        ),
      );

      return;
    }

    setExpensePage(
      1,
    );

    setAppliedExpenseFilters(
      normalizedFilters,
    );
  }


  function handleClearExpenseFilters() {
    setExpenseFilterError(null);
    setExpenseFilters(
      EMPTY_EXPENSE_FILTERS,
    );
    setExpensePage(1);
    setAppliedExpenseFilters(
      EMPTY_EXPENSE_FILTERS,
    );
  }


  function handleExpensePageChange(
    nextPage,
  ) {
    if (
      nextPage < 1
      || nextPage > expenseTotalPages
      || nextPage === expensePage
    ) {
      return;
    }

    setExpensePage(nextPage);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  function handleOpenImport() {
    setImportPreview(null);
    setImportError(null);
    setIsImportOpen(true);
  }


  async function handlePreviewImport(
    file,
  ) {
    setIsImportPreviewing(true);
    setImportError(null);
    setImportPreview(null);

    try {
      const result =
        await previewReturnImport(
          file,
        );

      setImportPreview(
        result,
      );

    } catch (error) {
      setImportError(
        getReturnImportErrorMessage(
          error,
        ),
      );

    } finally {
      setIsImportPreviewing(
        false,
      );
    }
  }


  async function handleConfirmImport(
    validRows,
  ) {
    if (
      !validRows.length
      ||
      isImportConfirming
    ) {
      return;
    }

    setIsImportConfirming(
      true,
    );

    setImportError(null);

    try {
      await confirmReturnImport(
        validRows.map(
          (row) => ({
            row_number:
              row.row_number,

            data:
              row.data,
          }),
        ),
      );

      setIsImportOpen(false);
      setImportPreview(null);

      setSuccessMessage(
        "Returns imported successfully.",
      );

      setPage(1);

      await loadReturns();

    } catch (error) {
      setImportError(
        getReturnImportErrorMessage(
          error,
        ),
      );

    } finally {
      setIsImportConfirming(
        false,
      );
    }
  }


  function buildExportParams(
    source,
  ) {
    const params = {};

    Object.entries(
      source,
    ).forEach(
      ([
        key,
        value,
      ]) => {
        if (value) {
          params[key] =
            value;
        }
      },
    );

    return params;
  }


  function downloadExcelResponse(
    response,
    fallbackName,
  ) {
    const blob =
      response.data;

    const contentDisposition =
      response.headers?.[
        "content-disposition"
      ];

    let filename =
      fallbackName;

    if (contentDisposition) {
      const match =
        contentDisposition.match(
          /filename="?([^"]+)"?/i,
        );

      if (
        match?.[1]
      ) {
        filename =
          match[1];
      }
    }

    const url =
      window.URL.createObjectURL(
        blob,
      );

    const link =
      document.createElement(
        "a",
      );

    link.href = url;
    link.download = filename;

    document.body.appendChild(
      link,
    );

    link.click();
    link.remove();

    window.URL.revokeObjectURL(
      url,
    );
  }


  async function handleExportReturns() {
    if (isExporting) {
      return;
    }

    setIsExporting(true);
    setLoadError(null);

    try {
      const response =
        await exportReturns(
          buildExportParams(
            appliedFilters,
          ),
        );

      downloadExcelResponse(
        response,
        "returns.xlsx",
      );

    } catch (error) {
      const parsed =
        parseApiError(
          error,
        );

      setLoadError(
        parsed.message,
      );

    } finally {
      setIsExporting(false);
    }
  }


  async function handleExportStockedIn() {
    if (
      isStockedInExporting
    ) {
      return;
    }

    setIsStockedInExporting(
      true,
    );

    setStockedInError(null);

    try {
      const response =
        await exportStockedInReturns(
          buildExportParams(
            appliedStockedInFilters,
          ),
        );

      downloadExcelResponse(
        response,
        "stocked-in-returns.xlsx",
      );

    } catch (error) {
      const parsed =
        parseApiError(
          error,
        );

      setStockedInError(
        parsed.message,
      );

    } finally {
      setIsStockedInExporting(
        false,
      );
    }
  }

  function handleOpenEdit(
    returnRecord,
  ) {
    setEditError(null);
    setEditReturn(returnRecord);
  }


  async function handleEditSubmit(
    payload,
  ) {
    if (
      !editReturn
      ||
      isEditing
    ) {
      return;
    }

    setIsEditing(true);
    setEditError(null);

    try {
      await updateReturn(
        editReturn.id,
        payload,
      );

      setEditReturn(null);

      setSuccessMessage(
        "Return updated successfully.",
      );

      await loadReturns();

    } catch (error) {
      const parsed =
        parseApiError(
          error,
        );

      setEditError(
        parsed.message,
      );

    } finally {
      setIsEditing(false);
    }
  }



  return (
    <section className="returns-page">
      <header className="returns-page-header">
        <div>
          <p className="application-eyebrow">
            Service Management
          </p>

          <h1>
            Returns
          </h1>

          <p className="returns-page-description">
            Manage returned laptops,
            technicians and service
            workflow.
          </p>
        </div>
      </header>

      <ReturnImportDialog
        isOpen={
          isImportOpen
        }
        preview={
          importPreview
        }
        isPreviewing={
          isImportPreviewing
        }
        isConfirming={
          isImportConfirming
        }
        errorMessage={
          importError
        }
        onClose={() => {
          if (
            !isImportPreviewing
            &&
            !isImportConfirming
          ) {
            setIsImportOpen(false);
            setImportPreview(null);
            setImportError(null);
          }
        }}
        onPreview={
          handlePreviewImport
        }
        onConfirm={
          handleConfirmImport
        }
      />


      <div
        className="returns-tabs"
        role="tablist"
      >
        <button
          type="button"
          role="tab"
          aria-selected={
            activeTab ===
            "active"
          }
          className={
            activeTab ===
            "active"
              ? (
                  "returns-tab "
                  + "returns-tab-active"
                )
              : "returns-tab"
          }
          onClick={() =>
            setActiveTab(
              "active",
            )
          }
        >
          Active Returns
        </button>


        <button
          type="button"
          role="tab"
          aria-selected={
            activeTab ===
            "stocked_in"
          }
          className={
            activeTab ===
            "stocked_in"
              ? (
                  "returns-tab "
                  + "returns-tab-active"
                )
              : "returns-tab"
          }
          onClick={() =>
            setActiveTab(
              "stocked_in",
            )
          }
        >
          Stocked In
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={
            activeTab ===
            "expenses"
          }
          className={
            activeTab ===
            "expenses"
              ? (
                  "returns-tab "
                  + "returns-tab-active"
                )
              : "returns-tab"
          }
          onClick={() =>
            setActiveTab(
              "expenses",
            )
          }
        >
          Expenses
        </button>
      </div>


      {activeTab ===
      "active" ? (
        <>
          <div className="returns-action-row">
            <div>
              <h2>
                Active Returns
              </h2>

              <p>
                {totalResults}
                {" "}
                return record
                {
                  totalResults === 1
                    ? ""
                    : "s"
                }
              </p>
            </div>


            <div className="returns-actions">
              {canAddReturn ? (
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => {
                    setCreateError(
                      null,
                    );

                    setIsAddDialogOpen(
                      true,
                    );
                  }}
                >
                  Add +
                </button>
              ) : null}


              {showAssignPriority ? (
                <button
                  type="button"
                  className="button button-secondary"
                  disabled={
                    !canActuallyAssignPriority
                  }
                  title={
                    !canActuallyAssignPriority
                      ? "Only Admin or Sales can assign priority."
                      : (
                          selectedReturn
                            ? "Assign priority"
                            : "Select a return row first."
                        )
                  }
                  onClick={() => {
                    if (!canActuallyAssignPriority) {
                      return;
                    }

                    if (!selectedReturn) {
                      setWorkflowError(
                        "Select a return from the table first.",
                      );

                      return;
                    }

                    handleOpenPriority();
                  }}
                >
                  Assign Priority
                </button>
              ) : null}


              {(
                canImportReturns
                ||
                canExportReturns
              ) ? (
                <ReturnImportExportMenu
                  canImport={
                    canImportReturns
                  }
                  canExport={
                    canExportReturns
                  }
                  isExporting={
                    isExporting
                  }
                  onImport={
                    handleOpenImport
                  }
                  onExport={
                    handleExportReturns
                  }
                />
              ) : null}
            </div>
          </div>


          <ReturnFilters
            filters={
              filters
            }
            technicians={
              technicians
            }
            disabled={
              isLoading
            }
            onChange={
              handleFilterChange
            }
            onApply={
              handleApplyFilters
            }
            onClear={
              handleClearFilters
            }
          />


          {filterError ? (
            <AlertMessage
              variant="error"
              title="Invalid filters"
              message={
                filterError
              }
            />
          ) : null}


          {successMessage ? (
            <AlertMessage
              variant="success"
              title="Return created"
              message={
                successMessage
              }
            />
          ) : null}


          {doneError ? (
            <AlertMessage
              variant="error"
              title="Unable to move return"
              message={
                doneError
              }
            />
          ) : null}


          {loadError ? (
            <AlertMessage
              variant="error"
              title="Unable to load returns"
              message={
                loadError
              }
            >
              <button
                type="button"
                className="button button-secondary"
                onClick={
                  loadReturns
                }
              >
                Try again
              </button>
            </AlertMessage>
          ) : null}


          {isLoading ? (
            <LoadingState
              title="Loading returns"
              message={
                (
                  "Retrieving return "
                  + "records from Django."
                )
              }
              size="large"
            />
          ) : null}


          {!isLoading
          &&
          !loadError
          &&
          returns.length === 0 ? (
            <EmptyState
              title="No returns found"
              message={
                (
                  "No return records "
                  + "match the current "
                  + "filters."
                )
              }
            />
          ) : null}


          {!isLoading
          &&
          !loadError
          &&
          returns.length > 0 ? (
            <>
              <ReturnsTable
                returns={returns}
                selectedReturnId={
                  selectedReturn?.id ?? null
                }
                canSelectPriority={
                  showAssignPriority
                }
                canAssignTechnician={
                  canAssignTechnician
                }
                canUpdateStatus={
                  canUpdateReturnStatus
                }
                canStockIn={
                  canStockInReturn
                }
                canEdit={
                  canEditReturn
                }
                canAddExpense={
                  canAddExpense
                }
                canCompleteReturn={
                  canCompleteReturn
                }
                completingReturnId={
                  completingReturnId
                }
                onSelectReturn={
                  handleSelectReturn
                }
                onAssignTechnician={
                  handleOpenTechnician
                }
                onUpdateStatus={
                  handleOpenStatus
                }
                onStockIn={
                  handleOpenStockIn
                }
                onEdit={
                  handleOpenEdit
                }
                onExpense={
                  handleOpenExpense
                }
                onDone={
                  handleDoneReturn
                }
              />

              <Pagination
                currentPage={
                  page
                }
                totalPages={
                  totalPages
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
              />
            </>
          ) : null}


          <ReturnFormDialog
            isOpen={
              isAddDialogOpen
            }
            technicians={
              technicians
            }
            isSubmitting={
              isCreating
            }
            errorMessage={
              createError
            }
            onClose={() => {
              if (
                !isCreating
              ) {
                setIsAddDialogOpen(
                  false,
                );

                setCreateError(
                  null,
                );
              }
            }}
            onSubmit={
              handleCreateReturn
            }
          />
          <ReturnPriorityDialog
            isOpen={
              Boolean(
                priorityReturn,
              )
            }
            returnRecord={
              priorityReturn
            }
            isSubmitting={
              isWorkflowSubmitting
            }
            errorMessage={
              priorityReturn
                ? workflowError
                : null
            }
            onClose={() => {
              if (
                !isWorkflowSubmitting
              ) {
                setPriorityReturn(
                  null,
                );

                setWorkflowError(
                  null,
                );
              }
            }}
            onSubmit={
              handlePrioritySubmit
            }
          />


          <ReturnTechnicianDialog
            isOpen={
              Boolean(
                technicianReturn,
              )
            }
            returnRecord={
              technicianReturn
            }
            technicians={
              technicians
            }
            isSubmitting={
              isWorkflowSubmitting
            }
            errorMessage={
              technicianReturn
                ? workflowError
                : null
            }
            onClose={() => {
              if (
                !isWorkflowSubmitting
              ) {
                setTechnicianReturn(
                  null,
                );

                setWorkflowError(
                  null,
                );
              }
            }}
            onSubmit={
              handleTechnicianSubmit
            }
          />


          <ReturnStatusDialog
            isOpen={
              Boolean(
                statusReturn,
              )
            }
            returnRecord={
              statusReturn
            }
            isSubmitting={
              isWorkflowSubmitting
            }
            errorMessage={
              statusReturn
                ? workflowError
                : null
            }
            onClose={() => {
              if (
                !isWorkflowSubmitting
              ) {
                setStatusReturn(
                  null,
                );

                setWorkflowError(
                  null,
                );
              }
            }}
            onSubmit={
              handleStatusSubmit
            }
          />

          <ReturnStockInDialog
            isOpen={
              Boolean(
                stockInReturn,
              )
              &&
              !isStockInConfirmOpen
            }
            returnRecord={
              stockInReturn
            }
            errorMessage={
              stockInError
            }
            onClose={() => {
              if (
                !isStockingIn
              ) {
                setStockInReturn(
                  null,
                );

                setStockInPayload(
                  null,
                );

                setStockInError(
                  null,
                );
              }
            }}
            onContinue={
              handleStockInContinue
            }
          />

          <ReturnEditDialog
            isOpen={
              Boolean(
                editReturn,
              )
            }
            returnRecord={
              editReturn
            }
            isSubmitting={
              isEditing
            }
            errorMessage={
              editError
            }
            onClose={() => {
              if (!isEditing) {
                setEditReturn(null);
                setEditError(null);
              }
            }}
            onSubmit={
              handleEditSubmit
            }
          />


          <ReturnExpenseDialog
            isOpen={
              Boolean(
                expenseReturn,
              )
            }
            returnRecord={
              expenseReturn
            }
            isSubmitting={
              isAddingExpense
            }
            errorMessage={
              expenseError
            }
            onClose={() => {
              if (!isAddingExpense) {
                setExpenseReturn(null);
                setExpenseError(null);
              }
            }}
            onSubmit={
              handleExpenseSubmit
            }
          />


          <ConfirmDialog
            isOpen={
              isStockInConfirmOpen
            }
            title="Confirm Stock In"
            message={
              stockInReturn
              && stockInPayload
                ? (
                    "Stock "
                    + stockInReturn.company
                    + " "
                    + stockInReturn.model_number
                    + " with serial number "
                    + stockInPayload.serial_number
                    + " into Laptop Inventory? "
                    + "Wholesale Price: ₹"
                    + stockInPayload.wholesale_price
                    + ", Retail Price: ₹"
                    + stockInPayload.retail_price
                    + "."
                  )
                : ""
            }
            confirmLabel="Confirm Stock In"
            cancelLabel="Back"
            variant="primary"
            isProcessing={
              isStockingIn
            }
            onConfirm={
              handleConfirmStockIn
            }
            onCancel={
              handleCancelStockInConfirmation
            }
          />
        </>
      ) : activeTab ===
      "stocked_in" ? (
        <section className="returns-tab-content">
          <div className="returns-action-row">
            <div>
              <h2>
                Stocked In
              </h2>

              <p>
                {stockedInCount}
                {" "}
                stocked-in record
                {
                  stockedInCount === 1
                    ? ""
                    : "s"
                }
              </p>
            </div>


            {canExportReturns ? (
              <button
                type="button"
                className="button button-secondary"
                disabled={
                  isStockedInExporting
                }
                onClick={
                  handleExportStockedIn
                }
              >
                {isStockedInExporting
                  ? "Exporting..."
                  : "Export Excel"}
              </button>
            ) : null}
          </div>


          <StockedInFilters
            filters={
              stockedInFilters
            }
            disabled={
              stockedInLoading
            }
            onChange={
              handleStockedInFilterChange
            }
            onApply={
              handleApplyStockedInFilters
            }
            onClear={
              handleClearStockedInFilters
            }
          />


          {stockedInFilterError ? (
            <AlertMessage
              variant="error"
              title="Invalid filters"
              message={
                stockedInFilterError
              }
            />
          ) : null}


          {stockedInError ? (
            <AlertMessage
              variant="error"
              title="Unable to load stocked-in history"
              message={
                stockedInError
              }
            >
              <button
                type="button"
                className="button button-secondary"
                onClick={
                  loadStockedInReturns
                }
              >
                Try again
              </button>
            </AlertMessage>
          ) : null}


          {stockedInLoading ? (
            <LoadingState
              title="Loading stocked-in history"
              message={
                (
                  "Retrieving stocked-in "
                  + "return records from Django."
                )
              }
              size="large"
            />
          ) : null}


          {!stockedInLoading
          &&
          !stockedInError
          &&
          stockedInRecords.length === 0 ? (
            <EmptyState
              title="No stocked-in returns"
              message={
                (
                  "No stocked-in records "
                  + "match the current filters."
                )
              }
            />
          ) : null}


          {!stockedInLoading
          &&
          !stockedInError
          &&
          stockedInRecords.length > 0 ? (
            <>
              <StockedInTable
                records={
                  stockedInRecords
                }
              />

              <Pagination
                currentPage={
                  stockedInPage
                }
                totalPages={
                  stockedInTotalPages
                }
                hasNextPage={
                  stockedInHasNext
                }
                hasPreviousPage={
                  stockedInHasPrevious
                }
                onPageChange={
                  handleStockedInPageChange
                }
              />
            </>
          ) : null}
        </section>
      ) : null}

      {activeTab ===
      "expenses" ? (
        <section className="returns-tab-content">
          <div className="returns-action-row">
            <div>
              <h2>Expenses</h2>
              <p>
                {expenseCount}
                {" "}
                expense record
                {expenseCount === 1 ? "" : "s"}
              </p>
            </div>

            <div className="return-expense-total-card">
              <span>Total Expenses</span>
              <strong>
                {new Intl.NumberFormat(
                  "en-IN",
                  {
                    style: "currency",
                    currency: "INR",
                    minimumFractionDigits: 2,
                  },
                ).format(
                  Number(expenseTotal),
                )}
              </strong>
            </div>
          </div>

          <ReturnExpensesFilters
            filters={expenseFilters}
            disabled={expensesLoading}
            onChange={handleExpenseFilterChange}
            onApply={handleApplyExpenseFilters}
            onClear={handleClearExpenseFilters}
          />

          {expenseFilterError ? (
            <AlertMessage
              variant="error"
              title="Invalid filters"
              message={expenseFilterError}
            />
          ) : null}

          {expensesError ? (
            <AlertMessage
              variant="error"
              title="Unable to load expenses"
              message={expensesError}
            >
              <button
                type="button"
                className="button button-secondary"
                onClick={loadExpenses}
              >
                Try again
              </button>
            </AlertMessage>
          ) : null}

          {expensesLoading ? (
            <LoadingState
              title="Loading expenses"
              message="Retrieving return expenses from Django."
              size="large"
            />
          ) : null}

          {!expensesLoading
          && !expensesError
          && expenses.length === 0 ? (
            <EmptyState
              title="No expenses found"
              message="No return expenses match the current filters."
            />
          ) : null}

          {!expensesLoading
          && !expensesError
          && expenses.length > 0 ? (
            <>
              <ReturnExpensesTable
                expenses={expenses}
              />

              <Pagination
                currentPage={expensePage}
                totalPages={expenseTotalPages}
                hasNextPage={expenseHasNext}
                hasPreviousPage={expenseHasPrevious}
                onPageChange={handleExpensePageChange}
              />
            </>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}


export default ReturnsPage;