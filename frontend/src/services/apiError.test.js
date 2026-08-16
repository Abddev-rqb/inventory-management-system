import {
  describe,
  expect,
  test,
} from "vitest";

import {
  parseBlobApiError,
} from "./apiError.js";

describe(
  "parseBlobApiError",
  () => {
    test(
      "parses a JSON error returned as a Blob",
      async () => {
        const errorBlob =
          new Blob(
            [
              JSON.stringify({
                detail:
                  "You do not have permission to export laptops.",
              }),
            ],
            {
              type:
                "application/json",
            },
          );

        const result =
          await parseBlobApiError({
            response: {
              status: 403,
              data: errorBlob,
            },
          });

        expect(
          result.status,
        ).toBe(403);

        expect(
          result.message,
        ).toBe(
          "You do not have permission to export laptops.",
        );
      },
    );

    test(
      "returns an export fallback for invalid Blob content",
      async () => {
        const errorBlob =
          new Blob(
            [
              "not-json",
            ],
          );

        const result =
          await parseBlobApiError({
            response: {
              status: 500,
              data: errorBlob,
            },
          });

        expect(
          result.message,
        ).toBe(
          "The Excel export could not be completed.",
        );
      },
    );
  },
);