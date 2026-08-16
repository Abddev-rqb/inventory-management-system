import {
  describe,
  expect,
  test,
} from "vitest";

import {
  getFileNameFromContentDisposition,
} from "./fileDownload.js";

describe(
  "getFileNameFromContentDisposition",
  () => {
    test(
      "reads a quoted filename",
      () => {
        const result =
          getFileNameFromContentDisposition(
            'attachment; filename="laptops.xlsx"',
          );

        expect(result).toBe(
          "laptops.xlsx",
        );
      },
    );

    test(
      "reads a UTF-8 filename",
      () => {
        const result =
          getFileNameFromContentDisposition(
            "attachment; filename*=UTF-8''laptop%20inventory.xlsx",
          );

        expect(result).toBe(
          "laptop inventory.xlsx",
        );
      },
    );

    test(
      "returns null when the header is missing",
      () => {
        expect(
          getFileNameFromContentDisposition(
            null,
          ),
        ).toBeNull();
      },
    );
  },
);