import {
  render,
  screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  describe,
  expect,
  test,
  vi,
} from "vitest";

import ConfirmDialog from "./ConfirmDialog.jsx";

describe(
  "ConfirmDialog",
  () => {
    test(
      "opens and displays the supplied content",
      () => {
        render(
          <ConfirmDialog
            isOpen
            title="Delete laptop"
            message="Delete this laptop?"
            confirmLabel="Delete"
            onConfirm={vi.fn()}
            onCancel={vi.fn()}
          />,
        );

        expect(
          screen.getByRole(
            "heading",
            {
              name:
                "Delete laptop",
            },
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "Delete this laptop?",
          ),
        ).toBeInTheDocument();
      },
    );

    test(
      "calls onConfirm when the confirmation button is clicked",
      async () => {
        const user =
          userEvent.setup();

        const onConfirm =
          vi.fn();

        render(
          <ConfirmDialog
            isOpen
            title="Confirm import"
            message="Import records?"
            confirmLabel="Import laptops"
            onConfirm={onConfirm}
            onCancel={vi.fn()}
          />,
        );

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Import laptops",
            },
          ),
        );

        expect(
          onConfirm,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    test(
      "calls onCancel when Cancel is clicked",
      async () => {
        const user =
          userEvent.setup();

        const onCancel =
          vi.fn();

        render(
          <ConfirmDialog
            isOpen
            title="Delete laptop"
            message="Delete record?"
            onConfirm={vi.fn()}
            onCancel={onCancel}
          />,
        );

        await user.click(
          screen.getByRole(
            "button",
            {
              name: "Cancel",
            },
          ),
        );

        expect(
          onCancel,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    test(
      "disables both actions while processing",
      () => {
        render(
          <ConfirmDialog
            isOpen
            title="Confirm import"
            message="Import records?"
            confirmLabel="Import laptops"
            processingLabel="Importing..."
            isProcessing
            onConfirm={vi.fn()}
            onCancel={vi.fn()}
          />,
        );

        expect(
          screen.getByRole(
            "button",
            {
              name: "Cancel",
            },
          ),
        ).toBeDisabled();

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Importing...",
            },
          ),
        ).toBeDisabled();
      },
    );
  },
);