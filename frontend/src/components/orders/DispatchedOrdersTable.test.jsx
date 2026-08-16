import {
  render,
  screen,
} from "@testing-library/react";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import DispatchedOrdersTable from "./DispatchedOrdersTable.jsx";


describe(
  "DispatchedOrdersTable",
  () => {
    it(
      "does not render the employee column",
      () => {
        render(
          <DispatchedOrdersTable
            orders={[
              {
                id: 1,

                order_number:
                  "ORD-TEST",

                employee_name:
                  "Hidden Employee",

                customer_name:
                  "Customer",

                customer_address:
                  "",

                items: [],

                total_items:
                  1,

                total_amount:
                  "22000.00",

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

                dispatched_at:
                  "2026-08-01T11:00:00Z",
              },
            ]}
            isAdmin={false}
            canRequestDeletion={
              false
            }
            isProcessing={
              false
            }
            processingOrderId={
              null
            }
            onRequestDeletion={
              vi.fn()
            }
            onDeleteOrder={
              vi.fn()
            }
          />,
        );

        expect(
          screen.queryByText(
            "Employee",
          ),
        ).not.toBeInTheDocument();

        expect(
          screen.queryByText(
            "Hidden Employee",
          ),
        ).not.toBeInTheDocument();

        expect(
          screen.getByText(
            "ORD-TEST",
          ),
        ).toBeInTheDocument();
      },
    );
  },
);