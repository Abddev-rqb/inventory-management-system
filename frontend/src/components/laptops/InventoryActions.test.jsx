import {
  render,
  screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MemoryRouter,
} from "react-router-dom";
import {
  describe,
  expect,
  test,
  vi,
} from "vitest";

import InventoryActions from "./InventoryActions.jsx";

function renderActions(
  props = {},
) {
  const defaultProps = {
    inventoryLocation:
      "/laptops?filter=Dell",
    canAddLaptop: true,
    canExportLaptops: true,
    isExporting: false,
    onExport: vi.fn(),
  };

  return render(
    <MemoryRouter>
      <InventoryActions
        {...defaultProps}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe(
  "InventoryActions",
  () => {
    test(
      "shows Add and Import/Export actions",
      () => {
        renderActions();

        expect(
          screen.getByRole(
            "link",
            {
              name: "Add +",
            },
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Import / Export",
            },
          ),
        ).toBeInTheDocument();
      },
    );

    test(
      "opens the menu and triggers export",
      async () => {
        const user =
          userEvent.setup();

        const onExport =
          vi.fn();

        renderActions({
          onExport,
        });

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Import / Export",
            },
          ),
        );

        expect(
          screen.getByRole(
            "menu",
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "menuitem",
            {
              name:
                "Import Excel",
            },
          ),
        ).toBeInTheDocument();

        await user.click(
          screen.getByRole(
            "menuitem",
            {
              name:
                "Export Excel",
            },
          ),
        );

        expect(
          onExport,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    test(
      "hides Add and Import without add permission",
      async () => {
        const user =
          userEvent.setup();

        renderActions({
          canAddLaptop: false,
        });

        expect(
          screen.queryByRole(
            "link",
            {
              name: "Add +",
            },
          ),
        ).not.toBeInTheDocument();

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Import / Export",
            },
          ),
        );

        expect(
          screen.queryByRole(
            "menuitem",
            {
              name:
                "Import Excel",
            },
          ),
        ).not.toBeInTheDocument();

        expect(
          screen.getByRole(
            "menuitem",
            {
              name:
                "Export Excel",
            },
          ),
        ).toBeInTheDocument();
      },
    );

    test(
      "hides Export without export permission",
      async () => {
        const user =
          userEvent.setup();

        renderActions({
          canExportLaptops:
            false,
        });

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Import / Export",
            },
          ),
        );

        expect(
          screen.getByRole(
            "menuitem",
            {
              name:
                "Import Excel",
            },
          ),
        ).toBeInTheDocument();

        expect(
          screen.queryByRole(
            "menuitem",
            {
              name:
                "Export Excel",
            },
          ),
        ).not.toBeInTheDocument();
      },
    );

    test(
      "shows no available actions when both permissions are absent",
      async () => {
        const user =
          userEvent.setup();

        renderActions({
          canAddLaptop: false,
          canExportLaptops:
            false,
        });

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Import / Export",
            },
          ),
        );

        expect(
          screen.getByText(
            "No actions available",
          ),
        ).toBeInTheDocument();

        expect(
          screen.queryByRole(
            "menuitem",
          ),
        ).not.toBeInTheDocument();
      },
    );

    test(
      "shows Exporting while export is running",
      async () => {
        const user =
          userEvent.setup();

        renderActions({
          isExporting: true,
        });

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Import / Export",
            },
          ),
        );

        expect(
          screen.getByRole(
            "menuitem",
            {
              name:
                "Exporting...",
            },
          ),
        ).toBeDisabled();
      },
    );

    test(
      "does not trigger export while already exporting",
      async () => {
        const user =
          userEvent.setup();

        const onExport =
          vi.fn();

        renderActions({
          isExporting: true,
          onExport,
        });

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Import / Export",
            },
          ),
        );

        const exportMenuItem =
          screen.getByRole(
            "menuitem",
            {
              name:
                "Exporting...",
            },
          );

        expect(
          exportMenuItem,
        ).toBeDisabled();

        await user.click(
          exportMenuItem,
        );

        expect(
          onExport,
        ).not.toHaveBeenCalled();
      },
    );

    test(
      "closes the menu with Escape",
      async () => {
        const user =
          userEvent.setup();

        renderActions();

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Import / Export",
            },
          ),
        );

        expect(
          screen.getByRole(
            "menu",
          ),
        ).toBeInTheDocument();

        await user.keyboard(
          "{Escape}",
        );

        expect(
          screen.queryByRole(
            "menu",
          ),
        ).not.toBeInTheDocument();
      },
    );
  },
);
