import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import PendingOrdersTable from "./PendingOrdersTable.jsx";


const ORDERS = [
  {
    id: 1,
    order_number:
      "ORD-001",
    employee_name:
      "Employee",
    customer_name:
      "Customer One",
    customer_address:
      "",
    items: [],
    total_items: 1,
    total_amount:
      "10000.00",
    price_mode:
      "retail",
    price_mode_label:
      "Retail",
    via:
      "customer",
    via_label:
      "Customer",
    created_at:
      "2026-08-01T10:00:00Z",
  },

  {
    id: 2,
    order_number:
      "ORD-002",
    employee_name:
      "Employee",
    customer_name:
      "Customer Two",
    customer_address:
      "",
    items: [],
    total_items: 1,
    total_amount:
      "12000.00",
    price_mode:
      "retail",
    price_mode_label:
      "Retail",
    via:
      "customer",
    via_label:
      "Customer",
    created_at:
      "2026-08-01T10:00:00Z",
  },
];


describe(
  "PendingOrdersTable",
  () => {
    it(
      "shows checkboxes in selection mode",
      () => {
        render(
          <PendingOrdersTable
            orders={ORDERS}
            isSelectionMode
            selectedOrderIds={
              new Set()
            }
            isProcessing={
              false
            }
            processingOrderId={
              null
            }
            onToggleOrder={
              vi.fn()
            }
            onToggleAllOrders={
              vi.fn()
            }
            onDispatchOrder={
              vi.fn()
            }
          />,
        );

        expect(
          screen.getByRole(
            "checkbox",
            {
              name:
                "Select all pending orders on this page",
            },
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "checkbox",
            {
              name:
                "Select order ORD-001",
            },
          ),
        ).toBeInTheDocument();
      },
    );

    it(
      "calls the row selection handler",
      () => {
        const onToggleOrder =
          vi.fn();

        render(
          <PendingOrdersTable
            orders={ORDERS}
            isSelectionMode
            selectedOrderIds={
              new Set()
            }
            isProcessing={
              false
            }
            processingOrderId={
              null
            }
            onToggleOrder={
              onToggleOrder
            }
            onToggleAllOrders={
              vi.fn()
            }
            onDispatchOrder={
              vi.fn()
            }
          />,
        );

        fireEvent.click(
          screen.getByRole(
            "checkbox",
            {
              name:
                "Select order ORD-001",
            },
          ),
        );

        expect(
          onToggleOrder,
        ).toHaveBeenCalledWith(
          ORDERS[0],
        );
      },
    );
  },
);