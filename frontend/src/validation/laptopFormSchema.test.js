import {
  describe,
  expect,
  test,
} from "vitest";

import {
  laptopFormSchema,
} from "./laptopFormSchema.js";

const validLaptop = {
  company: "Dell",
  display_type:
    "non_touch",
  model_number:
    "Latitude 5420",
  processor: "i5",
  processor_generation:
    "11th",
  ram_gb: 8,
  storage_gb: 256,
  storage_type: "ssd",
  serial_number:
    "TEST-SERIAL-001",
  wholesale_price:
    18500,
  retail_price:
    22500,
  qc_status: "pending",
  inventory_status:
    "in_stock",
  quantity: 1,
  warranty_days: 30,
  area: "Rack A1",
  comments:
    "Validation test",
};

describe(
  "laptopFormSchema",
  () => {
    test(
      "accepts a valid laptop",
      () => {
        const result =
          laptopFormSchema.safeParse(
            validLaptop,
          );

        expect(
          result.success,
        ).toBe(true);
      },
    );

    test(
      "rejects an empty company",
      () => {
        const result =
          laptopFormSchema.safeParse({
            ...validLaptop,
            company: "   ",
          });

        expect(
          result.success,
        ).toBe(false);

        expect(
          result.error.flatten()
            .fieldErrors.company,
        ).toContain(
          "Company is required.",
        );
      },
    );

    test(
      "rejects an unsupported display type",
      () => {
        const result =
          laptopFormSchema.safeParse({
            ...validLaptop,
            display_type:
              "foldable",
          });

        expect(
          result.success,
        ).toBe(false);
      },
    );

    test(
      "rejects retail price below wholesale price",
      () => {
        const result =
          laptopFormSchema.safeParse({
            ...validLaptop,
            wholesale_price:
              25000,
            retail_price:
              22000,
          });

        expect(
          result.success,
        ).toBe(false);

        expect(
          result.error.flatten()
            .fieldErrors
            .retail_price,
        ).toContain(
          "Retail price must be greater than or equal to the wholesale price.",
        );
      },
    );

    test.each([
      0,
      7,
      15,
      30,
    ])(
      "accepts warranty value %s",
      (warrantyDays) => {
        const result =
          laptopFormSchema.safeParse({
            ...validLaptop,
            warranty_days:
              warrantyDays,
          });

        expect(
          result.success,
        ).toBe(true);
      },
    );

    test.each([
      -1,
      1,
      14,
      60,
      90,
    ])(
      "rejects warranty value %s",
      (warrantyDays) => {
        const result =
          laptopFormSchema.safeParse({
            ...validLaptop,
            warranty_days:
              warrantyDays,
          });

        expect(
          result.success,
        ).toBe(false);
      },
    );

    test(
      "rejects zero quantity",
      () => {
        const result =
          laptopFormSchema.safeParse({
            ...validLaptop,
            quantity: 0,
          });

        expect(
          result.success,
        ).toBe(false);
      },
    );

    test(
      "trims text values",
      () => {
        const result =
          laptopFormSchema.parse({
            ...validLaptop,
            company:
              "  Dell  ",
            area:
              "  Rack A1  ",
          });

        expect(
          result.company,
        ).toBe("Dell");

        expect(
          result.area,
        ).toBe("Rack A1");
      },
    );

    test(
      "accepts the In Stock G inventory status",
      () => {
        const result =
          laptopFormSchema.safeParse({
            ...validLaptop,
            inventory_status:
              "in_stock_g",
          });

        expect(
          result.success,
        ).toBe(true);
      },
    );

    test(
      "rejects an unsupported inventory status",
      () => {
        const result =
          laptopFormSchema.safeParse({
            ...validLaptop,
            inventory_status:
              "warehouse",
          });

        expect(
          result.success,
        ).toBe(false);
      },
    );
  },
);