import {
  describe,
  expect,
  it,
} from "vitest";

import {
  isValidCustomItem,
  isValidMoney,
  isValidPositiveInteger,
  normalizeCustomItems,
  normalizeOrderLaptopItems,
  validateDateRange,
} from "./orderValidation.js";


describe(
  "orderValidation",
  () => {
    describe(
      "isValidPositiveInteger",
      () => {
        it(
          "accepts positive integers",
          () => {
            expect(
              isValidPositiveInteger(
                1,
              ),
            ).toBe(true);

            expect(
              isValidPositiveInteger(
                "4",
              ),
            ).toBe(true);
          },
        );

        it(
          "rejects invalid quantities",
          () => {
            expect(
              isValidPositiveInteger(
                0,
              ),
            ).toBe(false);

            expect(
              isValidPositiveInteger(
                -1,
              ),
            ).toBe(false);

            expect(
              isValidPositiveInteger(
                1.5,
              ),
            ).toBe(false);

            expect(
              isValidPositiveInteger(
                "abc",
              ),
            ).toBe(false);
          },
        );
      },
    );

    describe(
      "isValidMoney",
      () => {
        it(
          "accepts zero and positive money",
          () => {
            expect(
              isValidMoney(
                0,
              ),
            ).toBe(true);

            expect(
              isValidMoney(
                "500.00",
              ),
            ).toBe(true);
          },
        );

        it(
          "rejects invalid money",
          () => {
            expect(
              isValidMoney(
                "",
              ),
            ).toBe(false);

            expect(
              isValidMoney(
                -1,
              ),
            ).toBe(false);

            expect(
              isValidMoney(
                "invalid",
              ),
            ).toBe(false);
          },
        );
      },
    );

    describe(
      "isValidCustomItem",
      () => {
        it(
          "accepts a valid custom item",
          () => {
            expect(
              isValidCustomItem({
                itemName:
                  "Adapter",

                quantity: 2,

                unitPrice:
                  "500.00",
              }),
            ).toBe(true);
          },
        );

        it(
          "rejects blank item names",
          () => {
            expect(
              isValidCustomItem({
                itemName: "   ",
                quantity: 1,
                unitPrice: 500,
              }),
            ).toBe(false);
          },
        );
      },
    );

    describe(
      "validateDateRange",
      () => {
        it(
          "accepts a valid range",
          () => {
            expect(
              validateDateRange({
                startDate:
                  "2026-08-01",

                endDate:
                  "2026-08-09",
              }),
            ).toEqual({
              isValid: true,
              message: "",
            });
          },
        );

        it(
          "rejects reversed dates",
          () => {
            expect(
              validateDateRange({
                startDate:
                  "2026-08-09",

                endDate:
                  "2026-08-01",
              }),
            ).toEqual({
              isValid: false,

              message:
                "From date cannot be later than To date.",
            });
          },
        );

        it(
          "allows one-sided filters",
          () => {
            expect(
              validateDateRange({
                startDate:
                  "2026-08-01",

                endDate: "",
              }).isValid,
            ).toBe(true);
          },
        );
      },
    );

    describe(
      "normalizeOrderLaptopItems",
      () => {
        it(
          "creates backend laptop payloads",
          () => {
            const selected =
              new Map([
                [
                  12,
                  {
                    id: 12,
                    retail_price:
                      "20000.00",
                  },
                ],
                [
                  15,
                  {
                    id: 15,
                    retail_price:
                      "25000.00",
                  },
                ],
              ]);

            expect(
              normalizeOrderLaptopItems(
                selected,
              ),
            ).toEqual([
              {
                laptop_id: 12,
                quantity: 1,
              },
              {
                laptop_id: 15,
                quantity: 1,
              },
            ]);
          },
        );

        it(
          "does not send frontend prices",
          () => {
            const selected =
              new Map([
                [
                  12,
                  {
                    id: 12,

                    retail_price:
                      "20000.00",

                    wholesale_price:
                      "18000.00",
                  },
                ],
              ]);

            const result =
              normalizeOrderLaptopItems(
                selected,
              );

            expect(
              result[0],
            ).not.toHaveProperty(
              "retail_price",
            );

            expect(
              result[0],
            ).not.toHaveProperty(
              "wholesale_price",
            );

            expect(
              result[0],
            ).not.toHaveProperty(
              "unit_price",
            );
          },
        );
      },
    );

    describe(
      "normalizeCustomItems",
      () => {
        it(
          "normalizes valid items",
          () => {
            expect(
              normalizeCustomItems([
                {
                  itemName:
                    " Adapter ",

                  quantity: "2",

                  unitPrice:
                    "500",
                },
              ]),
            ).toEqual([
              {
                item_name:
                  "Adapter",

                quantity: 2,

                unit_price:
                  "500.00",
              },
            ]);
          },
        );
      },
    );
  },
);