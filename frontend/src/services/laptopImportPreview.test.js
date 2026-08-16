import {
  describe,
  expect,
  test,
} from "vitest";

import {
  normalizeImportPreview,
} from "./laptopImportPreview.js";

describe(
  "normalizeImportPreview",
  () => {
    test(
      "normalizes valid and invalid backend rows",
      () => {
        const responseData = {
          file_name:
            "laptops.xlsx",

          sheet_name:
            "Laptop Import",

          summary: {
            total_rows: 3,
            valid_rows: 2,
            invalid_rows: 1,
          },

          ignored_columns: [],

          valid_data: [
            {
              row_number: 2,
              data: {
                company:
                  "Dell",
                serial_number:
                  "SERIAL-001",
              },
            },
            {
              row_number: 4,
              data: {
                company:
                  "Lenovo",
                serial_number:
                  "SERIAL-003",
              },
            },
          ],

          errors: [
            {
              row_number: 3,
              serial_number:
                "SERIAL-002",
              errors: {
                warranty_days: [
                  "Warranty must be No, 0, 7, 15 or 30 days.",
                ],
              },
            },
          ],
        };

        const preview =
          normalizeImportPreview(
            responseData,
          );

        expect(
          preview.fileName,
        ).toBe(
          "laptops.xlsx",
        );

        expect(
          preview.sheetName,
        ).toBe(
          "Laptop Import",
        );

        expect(
          preview.summary,
        ).toEqual({
          totalRows: 3,
          validRows: 2,
          invalidRows: 1,
        });

        expect(
          preview.rows,
        ).toHaveLength(3);

        expect(
          preview.rows.map(
            (row) =>
              row.rowNumber,
          ),
        ).toEqual([
          2,
          3,
          4,
        ]);
      },
    );

    test(
      "preserves valid_data for confirmation",
      () => {
        const validData = [
          {
            row_number: 2,
            data: {
              company: "Dell",
              serial_number:
                "SERIAL-001",
            },
          },
        ];

        const preview =
          normalizeImportPreview({
            summary: {
              total_rows: 1,
              valid_rows: 1,
              invalid_rows: 0,
            },
            valid_data:
              validData,
            errors: [],
          });

        expect(
          preview
            .confirmationRows,
        ).toEqual(validData);
      },
    );

    test(
      "converts backend field errors into display errors",
      () => {
        const preview =
          normalizeImportPreview({
            summary: {
              total_rows: 1,
              valid_rows: 0,
              invalid_rows: 1,
            },

            valid_data: [],

            errors: [
              {
                row_number: 2,
                serial_number:
                  "SERIAL-001",

                errors: {
                  warranty_days: [
                    "Invalid warranty.",
                  ],
                },
              },
            ],
          });

        const invalidRow =
          preview.rows[0];

        expect(
          invalidRow.isValid,
        ).toBe(false);

        expect(
          invalidRow.errors,
        ).toEqual([
          {
            field:
              "Warranty Days",
            message:
              "Invalid warranty.",
          },
        ]);
      },
    );
  },
);