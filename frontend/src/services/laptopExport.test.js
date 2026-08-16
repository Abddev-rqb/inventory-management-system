import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";

import {
  buildLaptopExportFileName,
} from "./laptopExport.js";

describe(
  "buildLaptopExportFileName",
  () => {
    beforeEach(() => {
      vi.useFakeTimers();

      vi.setSystemTime(
        new Date(
          "2026-08-03T12:00:00",
        ),
      );
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test(
      "builds an unfiltered filename",
      () => {
        expect(
          buildLaptopExportFileName(
            [],
          ),
        ).toBe(
          "laptop-inventory-2026-08-03.xlsx",
        );
      },
    );

    test(
      "includes normalized filters",
      () => {
        expect(
          buildLaptopExportFileName([
            "Dell",
            "Core i5",
          ]),
        ).toBe(
          "laptop-inventory-dell-core-i5-2026-08-03.xlsx",
        );
      },
    );

    test(
      "limits filename filter parts",
      () => {
        const filename =
          buildLaptopExportFileName([
            "Dell",
            "i5",
            "8th",
            "256 SSD",
          ]);

        expect(
          filename,
        ).not.toContain(
          "256-ssd",
        );
      },
    );
  },
);