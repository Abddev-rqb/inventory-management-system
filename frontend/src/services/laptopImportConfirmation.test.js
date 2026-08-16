import {
  describe,
  expect,
  test,
} from "vitest";

import {
  normalizeImportConfirmation,
} from "./laptopImportConfirmation.js";

describe(
  "normalizeImportConfirmation",
  () => {
    test(
      "reads imported_rows",
      () => {
        const result =
          normalizeImportConfirmation({
            imported_rows: 5,
            message:
              "5 laptops imported.",
          });

        expect(
          result.importedRows,
        ).toBe(5);

        expect(
          result.message,
        ).toBe(
          "5 laptops imported.",
        );
      },
    );

    test(
      "creates a fallback message",
      () => {
        const result =
          normalizeImportConfirmation({
            imported_rows: 1,
          });

        expect(
          result.message,
        ).toBe(
          "1 laptop record was imported successfully.",
        );
      },
    );

    test(
      "does not accept negative imported counts",
      () => {
        const result =
          normalizeImportConfirmation({
            imported_rows: -5,
          });

        expect(
          result.importedRows,
        ).toBe(0);
      },
    );
  },
);