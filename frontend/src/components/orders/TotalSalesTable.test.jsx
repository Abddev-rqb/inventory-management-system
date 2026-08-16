import {
  render,
  screen,
} from "@testing-library/react";

import {
  describe,
  expect,
  it,
} from "vitest";

import TotalSalesTable from "./TotalSalesTable.jsx";


describe(
  "TotalSalesTable",
  () => {
    it(
      "renders dispatched sales",
      () => {
        render(
          <TotalSalesTable
            sales={[
              {
                id: 10,

                order_number:
                  "ORD-SALE",

                customer_name:
                  "Customer",

                customer_address:
                  "Chennai",

                items_text: [
                  "Dell 5420 - 1 pcs",
                ],

                total_items:
                  1,

                total_amount:
                  "22500.00",

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
          />,
        );

        expect(
          screen.getByText(
            "ORD-SALE",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "Dell 5420 - 1 pcs",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "Chennai",
          ),
        ).toBeInTheDocument();
      },
    );
  },
);