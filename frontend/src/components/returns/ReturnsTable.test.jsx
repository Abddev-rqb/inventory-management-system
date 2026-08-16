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

import ReturnsTable
  from "./ReturnsTable.jsx";


const RETURN_RECORD = {
  id: 1,
  customer_name: "Test Customer",
  company: "Dell",
  model_number: "5420",
  processor: "Intel Core i5",
  processor_generation: "11th",
  ram_gb: 8,
  storage_gb: 256,
  storage_type: "ssd",
  storage_type_label: "SSD",
  serial_number: "RETURN-001",
  technician_name: "Technician",
  issue: "Display issue",
  priority: "normal",
  priority_label: "Normal",
  status: "received",
  status_label: "Received",
  service_rack: "Rack A-20",
  created_at: "2026-08-16T10:00:00Z",
};


function renderTable(
  overrides = {},
) {
  const props = {
    returns: [
      RETURN_RECORD,
    ],

    selectedReturnId: null,

    canSelectPriority: true,

    canAssignTechnician: true,

    canUpdateStatus:
      () => true,

    canStockIn:
      () => false,

    canEdit: true,

    onSelectReturn:
      vi.fn(),

    onAssignTechnician:
      vi.fn(),

    onUpdateStatus:
      vi.fn(),

    onStockIn:
      vi.fn(),

    onEdit:
      vi.fn(),

    ...overrides,
  };

  render(
    <ReturnsTable
      {...props}
    />,
  );

  return props;
}


describe(
  "ReturnsTable",
  () => {
    it(
      "shows Edit for an authorized user",
      () => {
        renderTable();

        expect(
          screen.getByRole(
            "button",
            {
              name: "Edit",
            },
          ),
        ).toBeInTheDocument();
      },
    );


    it(
      "calls edit with the return record",
      () => {
        const props =
          renderTable();

        fireEvent.click(
          screen.getByRole(
            "button",
            {
              name: "Edit",
            },
          ),
        );

        expect(
          props.onEdit,
        ).toHaveBeenCalledWith(
          RETURN_RECORD,
        );
      },
    );


    it(
      "hides Edit when unauthorized",
      () => {
        renderTable({
          canEdit: false,
        });

        expect(
          screen.queryByRole(
            "button",
            {
              name: "Edit",
            },
          ),
        ).not.toBeInTheDocument();
      },
    );


    it(
      "selects a return for priority",
      () => {
        const props =
          renderTable();

        fireEvent.click(
          screen.getByRole(
            "radio",
          ),
        );

        expect(
          props.onSelectReturn,
        ).toHaveBeenCalledWith(
          RETURN_RECORD,
        );
      },
    );
  },
);